import { GameStateService } from '../services/game-state.service';
import { HotkeysService } from '../services/hotkeys.service';
import { AppLaunchService } from '../services/app-launch.service';
import {
  MessageChannel,
  MessagePayload,
  MessageType,
} from '../services/MessageChannel';
import { Edge } from '@overwolf/odk-ts/window/enums/edge';
import { kDeadlockClassId, kHotkeys, kWindowNames, LIVE_GAME_MODE_LABELS } from '../../shared/consts';
import { createLogger } from '../../shared/services/Logger';
import { WindowsController } from './windows.controller';
import { TrayIconService } from '../services/tray-icon.service';
import onMenuItemClickedEvent = overwolf.os.tray.onMenuItemClickedEvent;
import AppLaunchTriggeredEvent = overwolf.extensions.AppLaunchTriggeredEvent;
import {
  GameEventPayload,
  GameEventsService,
} from '../services/game-events.service';
import type { GameEventMatchEntry } from '../../shared/types/matchHistoryEvent';
import type {
  LiveRosterEntry,
  LiveRosterUpdatePayload,
  LiveMatchStartPayload,
  GameModeInfo,
  TeamScores,
} from '../../shared/types/liveMatch';
import { HEROES } from '../../shared/data/heroes';
import { submitSaltsToApi } from '../../shared/services/matchMetadataFetcher';

const logger = createLogger('BackgroundController');

/**
 * BackgroundController orchestrates all background services.
 * It implements the Singleton pattern to ensure only one instance exists.
 * Uses dependency injection for services.
 */
export class BackgroundController {
  private static _instance: BackgroundController;

  private _messageChannel: MessageChannel;
  private _windowsController: WindowsController;
  private _gameStateService: GameStateService;
  private _hotkeysService: HotkeysService;
  private _appLaunchService: AppLaunchService;
  private _trayIconService: TrayIconService;
  private _gameEventsService: GameEventsService;

  private _isGameRunning: boolean = false;
  private _companionReadyDismissTimer: ReturnType<typeof setTimeout> | null =
    null;
  private _localPlayerRosterData: Record<string, unknown> | null = null;
  private _currentMatchId: string | null = null;
  private _allRosterData: Map<string, LiveRosterEntry> = new Map();
  private _matchStartTimestamp: number | null = null;
  private _isMatchEnded: boolean = false;
  private _gameMode: GameModeInfo | null = null;
  private _teamScores: TeamScores | null = null;
  private _rosterUpdateCount: number = 0;

  private constructor() {
    // Initialize MessageChannel first (used by other services)
    this._messageChannel = new MessageChannel();

    // Listen for requests for current live match state
    this._messageChannel.onMessage(MessageType.REQUEST_LIVE_MATCH_STATE, () =>
      this.handleLiveMatchStateRequest(),
    );

    this._hotkeysService = new HotkeysService();
    this._appLaunchService = new AppLaunchService(
      (event: AppLaunchTriggeredEvent) => this.handleAppLaunch(event),
    );
    this._trayIconService = new TrayIconService(
      () => this.handleTrayIconClick(),
      (event: onMenuItemClickedEvent) => this.handleTrayMenuItemClick(event),
      () => this.handleTrayIconDoubleClick(),
    );
    this._gameStateService = new GameStateService(
      this._messageChannel,
      (isRunning, gameInfo) => this.handleGameStateChange(isRunning, gameInfo),
    );
    this._windowsController = new WindowsController(this._messageChannel);

    this._gameEventsService = new GameEventsService({
      onGameEvent: (payload) => {
        const eventName = payload.events[0]?.name;
        // Only log important events to reduce noise
        if (eventName === 'match_start' || eventName === 'match_end') {
          logger.log(`Game event [${eventName}]:`, payload.events[0]?.data);
        }
        this.handleGameEvent(payload);
      },
      onInfoUpdate: (info) => {
        // Reduced log verbosity - only log feature name, not full payload
        if (info.feature === 'match_info' || info.feature === 'game_info') {
          logger.log(`Info update [${info.feature}]`);
        }
        this.handleInfoUpdate(info);
      },
    });

    // Set up service callbacks
    this.setupHotkeyHandlers();
    this.setupMessageHandlers();
  }

  public static instance(): BackgroundController {
    if (!BackgroundController._instance) {
      BackgroundController._instance = new BackgroundController();
    }
    return BackgroundController._instance;
  }

  /**
   * Starts the background controller and initializes all services
   */
  public async run(): Promise<void> {
    // Determine which window to show based on game state
    const shouldShowInGame =
      await this._gameStateService.isSupportedGameRunning();
    if (shouldShowInGame) {
      logger.log('Game is Deadlock, showing in-game window');
      await this._windowsController.onGameLaunch();
      this._isGameRunning = true;
      await this._gameEventsService.onGameLaunched(['game_info', 'match_info']);
      // Check if a match is already in progress (app opened mid-match)
      this.checkForActiveMatch();
    } else {
      logger.log('No game running, showing primary desktop window');
      await this._windowsController.showMainDesktopWindow('primary');
      this._isGameRunning = false;
    }
  }

  /**
   * Handles game state changes (game launched/terminated).
   */
  private async handleGameStateChange(
    isDeadlockRunning: boolean,
    gameInfo?: overwolf.games.RunningGameInfo,
  ): Promise<void> {
    if (isDeadlockRunning) {
      await this._windowsController.onGameLaunch();
      this._isGameRunning = true;
      await this.showCompanionReadyNotification();
      await this._gameEventsService.onGameLaunched(['game_info', 'match_info']);
    } else {
      // If the game is Deadlock, show the main desktop window
      if (gameInfo?.classId === kDeadlockClassId) {
        logger.log('Game was Deadlock, showing main desktop window');
        await this._windowsController.onGameExit();
        this._isGameRunning = false;

        // Prompt user to scan httpcache after game exit (throttled to once per day)
        try {
          const dismissed = localStorage.getItem('dl_ingest_prompt_dismissed');
          if (dismissed === 'true') {
            logger.log('Ingest prompt permanently dismissed by user');
            return;
          }

          // Check if we've shown the prompt today
          const lastShown = localStorage.getItem('dl_ingest_prompt_last_shown');
          const today = new Date().toDateString();

          if (lastShown === today) {
            logger.log(
              'Ingest prompt already shown today, skipping (last shown: ' +
                lastShown +
                ')',
            );
            return;
          }

          logger.log('Sending ingest prompt to desktop window');
          await this._messageChannel.sendMessage(
            kWindowNames.mainDesktop,
            MessageType.INGEST_PROMPT,
          );

          // Mark today as shown
          localStorage.setItem('dl_ingest_prompt_last_shown', today);
        } catch (err) {
          logger.warn('Failed to send ingest prompt:', err);
        }
      }
      // If the game is not Deadlock, don't do anything
      else {
        logger.log('Game was not Deadlock, not showing main desktop window');
        return;
      }
    }
  }

  /**
   * Handles GEP info updates — forwards match_history events to renderer windows
   * and tracks match_info roster updates for the local player.
   */
  private handleInfoUpdate(
    info: overwolf.games.events.InfoUpdates2Event,
  ): void {
    // Track match_info updates (roster, match_id) for match_end handling
    if (info.feature === 'match_info') {
      // Overwolf wraps info updates in a category key matching the feature name:
      //   info.info = { match_info: { roster_0: "...", match_id: "..." } }
      // Unwrap the category so handleMatchInfoUpdate sees { roster_0: "...", ... } directly.
      const raw = (info as any).info;
      const matchInfoData = raw?.match_info ?? raw;
      this.handleMatchInfoUpdate(matchInfoData);
      return;
    }

    if (info.feature !== 'game_info') {
      logger.warn('handleInfoUpdate: no game_info key, skipping', info.feature);
      return;
    }

    const rawGameInfo = (info as any).info;
    const gameInfo = rawGameInfo?.game_info ?? rawGameInfo;
    if (!gameInfo) {
      logger.warn(
        'handleInfoUpdate: game_info key present but empty, skipping',
      );
      return;
    }

    // Track game_mode updates
    if (gameInfo.game_mode != null) {
      try {
        const parsed =
          typeof gameInfo.game_mode === 'string'
            ? JSON.parse(gameInfo.game_mode)
            : gameInfo.game_mode;
        if (parsed && typeof parsed === 'object') {
          const rawMode = String(parsed.game_mode ?? '');
          this._gameMode = {
            match_mode: String(parsed.match_mode ?? ''),
            game_mode: LIVE_GAME_MODE_LABELS[rawMode] ?? rawMode,
          };
          logger.log('game_info update: game_mode =', this._gameMode);
          this.broadcastRosterUpdate();
        }
      } catch (err) {
        logger.warn('Failed to parse game_mode:', err);
      }
    }

    // Track team_score updates
    if (gameInfo.team_score != null) {
      try {
        const parsed =
          typeof gameInfo.team_score === 'string'
            ? JSON.parse(gameInfo.team_score)
            : gameInfo.team_score;
        if (parsed && typeof parsed === 'object') {
          this._teamScores = {
            amber: Number(parsed.team2 ?? parsed.amber ?? 0),
            sapphire: Number(parsed.team3 ?? parsed.sapphire ?? 0),
          };
          logger.log('game_info update: team_score =', this._teamScores);
          this.broadcastRosterUpdate();
        }
      } catch (err) {
        logger.warn('Failed to parse team_score:', err);
      }
    }

    // The match_history key contains a JSON array of match entries
    // @ts-ignore
    const matchHistoryRaw = gameInfo.match_history;
    if (matchHistoryRaw == null) {
      logger.warn(
        'handleInfoUpdate: game_info present but no match_history key',
        Object.keys(gameInfo),
      );
      return;
    }

    logger.log(
      'handleInfoUpdate: received match_history raw data, length:',
      String(matchHistoryRaw).length,
    );

    try {
      const parsed =
        typeof matchHistoryRaw === 'string'
          ? JSON.parse(matchHistoryRaw)
          : matchHistoryRaw;

      if (!Array.isArray(parsed)) {
        logger.warn(
          'handleInfoUpdate: match_history parsed but is not an array:',
          typeof parsed,
        );
        return;
      }

      const matchIds = parsed.map((e: any) => e.match_id).filter(Boolean);
      logger.log(
        `handleInfoUpdate: parsed ${parsed.length} entries, match IDs: [${matchIds.join(', ')}]`,
      );

      this._messageChannel.broadcastMessage(
        [kWindowNames.mainDesktop, kWindowNames.mainIngame],
        MessageType.MATCH_HISTORY_UPDATE,
        parsed,
      );
      logger.log(
        'handleInfoUpdate: broadcast MATCH_HISTORY_UPDATE to desktop + ingame windows',
      );
    } catch (err) {
      logger.error(
        'handleInfoUpdate: failed to parse match_history event:',
        err,
      );
    }
  }

  private handleGameEvent(payload: GameEventPayload): void {
    const eventName = payload.events[0]?.name;

    if (eventName === 'match_start') {
      this.handleMatchStart();
    } else if (eventName === 'match_end') {
      this.handleMatchEnd();
    }
  }

  /**
   * On match_start: call getInfo to snapshot current match_info,
   * find the local player's roster entry, and store match_id.
   * Also broadcasts LIVE_MATCH_START to renderer windows.
   */
  private handleMatchStart(): void {
    this._localPlayerRosterData = null;
    this._currentMatchId = null;
    this._allRosterData.clear();
    this._matchStartTimestamp = Date.now();
    this._isMatchEnded = false;
    this._gameMode = null;
    this._teamScores = null;
    this._rosterUpdateCount = 0;

    overwolf.games.events.getInfo((result) => {
      if (!result.success) {
        logger.error('getInfo failed on match_start:', result);
        return;
      }

      const matchInfo = (result.res as any).match_info;
      if (!matchInfo) {
        logger.warn('match_start: no match_info in getInfo result');
      } else {
        if (matchInfo.match_id) {
          this._currentMatchId = String(matchInfo.match_id);
          logger.log('match_start: match_id =', this._currentMatchId);
        }
        this.extractAllRosterEntries(matchInfo);
      }

      // Also snapshot game_info to restore game_mode that was set before match_start
      const gameInfoSnapshot = (result.res as any).game_info;
      if (gameInfoSnapshot) {
        if (gameInfoSnapshot.game_mode != null) {
          try {
            const parsed =
              typeof gameInfoSnapshot.game_mode === 'string'
                ? JSON.parse(gameInfoSnapshot.game_mode)
                : gameInfoSnapshot.game_mode;
            if (parsed && typeof parsed === 'object') {
              const rawMode = String(parsed.game_mode ?? '');
              this._gameMode = {
                match_mode: String(parsed.match_mode ?? ''),
                game_mode: LIVE_GAME_MODE_LABELS[rawMode] ?? rawMode,
              };
              logger.log(
                'match_start: restored game_mode from getInfo =',
                this._gameMode,
              );
            }
          } catch (err) {
            logger.warn(
              'match_start: failed to parse game_mode from getInfo:',
              err,
            );
          }
        }
        this.broadcastRosterUpdate();
      }
    });

    // Broadcast match start so renderer windows can activate the live view
    const startPayload: LiveMatchStartPayload = {
      matchId: this._currentMatchId,
      matchStartTimestamp: this._matchStartTimestamp,
    };
    this._messageChannel.broadcastMessage(
      [kWindowNames.mainDesktop, kWindowNames.mainIngame],
      MessageType.LIVE_MATCH_START,
      startPayload,
    );
    logger.log('match_start: broadcast LIVE_MATCH_START');
  }

  /**
   * Checks if a match is already in progress when the app starts.
   * Called during run() when the game is detected as already running.
   * Snapshots current GEP state and bootstraps live match data if a match is active.
   */
  private checkForActiveMatch(): void {
    // Small delay to let GEP finish initializing features
    setTimeout(() => {
      overwolf.games.events.getInfo((result) => {
        if (!result.success) {
          logger.log('checkForActiveMatch: getInfo failed, no active match');
          return;
        }

        const matchInfo = (result.res as any).match_info;
        if (!matchInfo) {
          logger.log('checkForActiveMatch: no match_info, no active match');
          return;
        }

        // Check if there's a match_id — indicates a match is in progress
        if (!matchInfo.match_id) {
          logger.log('checkForActiveMatch: no match_id, no active match');
          return;
        }

        logger.log(
          'checkForActiveMatch: found active match, bootstrapping state',
        );

        // Bootstrap match state
        this._currentMatchId = String(matchInfo.match_id);
        this._matchStartTimestamp = Date.now(); // Approximate — we don't know exact start
        this._rosterUpdateCount = 0;

        // Extract roster entries
        this.extractAllRosterEntries(matchInfo);

        // Try to restore game_mode from game_info
        const gameInfoSnapshot = (result.res as any).game_info;
        if (gameInfoSnapshot?.game_mode != null) {
          try {
            const parsed =
              typeof gameInfoSnapshot.game_mode === 'string'
                ? JSON.parse(gameInfoSnapshot.game_mode)
                : gameInfoSnapshot.game_mode;
            if (parsed && typeof parsed === 'object') {
              const rawMode = String(parsed.game_mode ?? '');
              this._gameMode = {
                match_mode: String(parsed.match_mode ?? ''),
                game_mode: LIVE_GAME_MODE_LABELS[rawMode] ?? rawMode,
              };
            }
          } catch {
            // Ignore parse errors
          }
        }

        // Broadcast LIVE_MATCH_START so renderers activate the live view
        const startPayload: LiveMatchStartPayload = {
          matchId: this._currentMatchId,
          matchStartTimestamp: this._matchStartTimestamp,
        };
        this._messageChannel.broadcastMessage(
          [kWindowNames.mainDesktop, kWindowNames.mainIngame],
          MessageType.LIVE_MATCH_START,
          startPayload,
        );

        // Follow up with roster data
        this.broadcastRosterUpdate();
        logger.log(
          `checkForActiveMatch: bootstrapped match ${this._currentMatchId} with ${this._allRosterData.size} roster entries`,
        );
      });
    }, 1500);
  }

  /**
   * On match_end: use the last cached local player roster
   * to build a GameEventMatchEntry and broadcast it.
   * Roster data is empty at match_end, so we rely on the last
   * roster update received via match_info info updates.
   * Also broadcasts LIVE_MATCH_END to renderer windows.
   */
  private async handleMatchEnd(): Promise<void> {
    this._isMatchEnded = true;

    // Broadcast LIVE_MATCH_END so the scoreboard shows "Match Ended"
    this._messageChannel.broadcastMessage(
      [kWindowNames.mainDesktop, kWindowNames.mainIngame],
      MessageType.LIVE_MATCH_END,
    );
    logger.log('match_end: broadcast LIVE_MATCH_END');

    // Send roster snapshot to renderer windows via the message channel so
    // they can persist it in their own IndexedDB (cross-window IDB is unreliable).
    if (this._currentMatchId && this._allRosterData.size > 0) {
      const roster = Array.from(this._allRosterData.values());
      this._messageChannel.broadcastMessage(
        [kWindowNames.mainDesktop, kWindowNames.mainIngame],
        MessageType.ROSTER_SNAPSHOT,
        { matchId: this._currentMatchId, roster },
      );
      logger.log(
        `match_end: broadcast ROSTER_SNAPSHOT (${roster.length} players) for match ${this._currentMatchId}`,
      );
    }

    if (!this._localPlayerRosterData) {
      logger.warn('match_end: no local player roster data available');
      // Keep all state for post-match review; only clear on next match_start
      return;
    }

    const roster = this._localPlayerRosterData;
    const heroId = String(roster.hero_id ?? '');
    const heroInfo = HEROES[Number(heroId)];

    const matchEntry: GameEventMatchEntry = {
      match_id: this._currentMatchId ?? '',
      hero_id: heroId,
      kills: Number(roster.kills ?? 0),
      deaths: Number(roster.deaths ?? 0),
      assists: Number(roster.assist ?? 0),
      hero_name: heroInfo?.name ?? String(roster.hero_name ?? 'Unknown'),
    };

    logger.log('match_end: broadcasting match entry:', matchEntry);

    this._messageChannel.broadcastMessage(
      [kWindowNames.mainDesktop, kWindowNames.mainIngame],
      MessageType.MATCH_HISTORY_UPDATE,
      [matchEntry],
    );

    // Keep state for post-match review; will be cleared on next match_start
  }

  /**
   * Iterates over match_info keys looking for roster entries,
   * parses each one, stores all entries, and keeps the local player entry.
   * Broadcasts the full roster to renderer windows.
   */
  private extractAllRosterEntries(matchInfo: Record<string, unknown>): void {
    for (const key of Object.keys(matchInfo)) {
      if (!key.startsWith('roster_')) continue;

      try {
        const raw = matchInfo[key];
        const rosterEntry = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!rosterEntry) continue;

        const entry: LiveRosterEntry = {
          player_name: String(rosterEntry.player_name ?? ''),
          steam_id: Number(rosterEntry.steam_id ?? 0),
          team_name: String(rosterEntry.team_name ?? ''),
          team_id: Number(rosterEntry.team_id ?? 0),
          is_local:
            rosterEntry.is_local === true || rosterEntry.is_local === 'true',
          hero_id: Number(rosterEntry.hero_id ?? 0),
          level: Number(rosterEntry.level ?? 0),
          kills: Number(rosterEntry.kills ?? 0),
          deaths: Number(rosterEntry.deaths ?? 0),
          assist: Number(rosterEntry.assist ?? 0),
          hero_damage: Number(rosterEntry.hero_damage ?? 0),
          object_damage: Number(rosterEntry.object_damage ?? 0),
          hero_healing: Number(rosterEntry.hero_healing ?? 0),
          health: Number(rosterEntry.health ?? 0),
          souls: Number(rosterEntry.souls ?? 0),
          hero_name: String(rosterEntry.hero_name ?? ''),
        };

        // Don't let an empty/reset entry overwrite existing good data.
        const existing = this._allRosterData.get(key);
        if (entry.steam_id === 0 && existing && existing.steam_id !== 0) {
          continue;
        }

        this._allRosterData.set(key, entry);

        if (entry.is_local) {
          this._localPlayerRosterData = rosterEntry;
          logger.log('Found local player roster:', key, entry);
        }
      } catch (err) {
        logger.warn(`Failed to parse roster entry ${key}:`, err);
      }
    }

    this.broadcastRosterUpdate();
  }

  /** Broadcasts the current full roster to renderer windows. */
  private broadcastRosterUpdate(): void {
    const payload: LiveRosterUpdatePayload = {
      roster: Array.from(this._allRosterData.values()),
      matchId: this._currentMatchId,
      matchStartTimestamp: this._matchStartTimestamp,
      isMatchEnded: this._isMatchEnded,
      gameMode: this._gameMode,
      teamScores: this._teamScores,
    };
    this._messageChannel.broadcastMessage(
      [kWindowNames.mainDesktop, kWindowNames.mainIngame],
      MessageType.LIVE_ROSTER_UPDATE,
      payload,
    );
    logger.log(`broadcastRosterUpdate: ${payload.roster.length} players`);
  }

  /**
   * Handles requests for current live match state.
   * Sends the current roster data immediately, useful when view remounts.
   */
  private handleLiveMatchStateRequest(): void {
    logger.log('Live match state requested, broadcasting current state');
    // If we have active match data, broadcast it
    if (this._allRosterData.size > 0 || this._currentMatchId) {
      this.broadcastRosterUpdate();
    }
  }

  /**
   * Handles incremental match_info updates (roster changes, match_id).
   * Keeps _localPlayerRosterData and _allRosterData up-to-date between
   * match_start and match_end. Broadcasts roster updates to renderer windows.
   */
  private handleMatchInfoUpdate(infoData: Record<string, unknown>): void {
    if (!infoData) return;

    if (infoData.match_id) {
      this._currentMatchId = String(infoData.match_id);
      logger.log('match_info update: match_id =', this._currentMatchId);
    }

    // Handle match_outcome event - extract and submit salt
    if (infoData.match_outcome) {
      try {
        const raw = infoData.match_outcome;
        const outcomeData = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const matchId = outcomeData?.match_id;
        const cid = outcomeData?.cid; // cluster_id
        const mid = outcomeData?.mid; // metadata_salt

        logger.log(
          `match_outcome detected: match_id=${matchId}, cid=${cid}, mid=${mid}`,
        );

        if (mid != null) {
          const salt = {
            match_id: parseInt(String(matchId), 10),
            cluster_id: parseInt(String(cid), 10),
            metadata_salt: parseInt(String(mid), 10),
          };

          // Fire-and-forget submission
          submitSaltsToApi([salt])
            .then((success) => {
              if (success) {
                logger.log(
                  `match_outcome: submitted salt for match ${matchId}`,
                );
              } else {
                logger.warn(
                  `match_outcome: failed to submit salt for match ${matchId}`,
                );
              }
            })
            .catch((err) => {
              logger.error(
                `match_outcome: error submitting salt for match ${matchId}:`,
                err,
              );
            });
        } else {
          logger.warn(
            'match_outcome: no mid field present, skipping salt submission',
          );
        }
      } catch (err) {
        logger.error('match_outcome: failed to parse event data:', err);
      }
    }

    let rosterChanged = false;

    for (const key of Object.keys(infoData)) {
      if (!key.startsWith('roster_')) continue;

      try {
        const raw = infoData[key];
        const rosterEntry = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!rosterEntry) continue;

        const entry: LiveRosterEntry = {
          player_name: String(rosterEntry.player_name ?? ''),
          steam_id: Number(rosterEntry.steam_id ?? 0),
          team_name: String(rosterEntry.team_name ?? ''),
          team_id: Number(rosterEntry.team_id ?? 0),
          is_local:
            rosterEntry.is_local === true || rosterEntry.is_local === 'true',
          hero_id: Number(rosterEntry.hero_id ?? 0),
          level: Number(rosterEntry.level ?? 0),
          kills: Number(rosterEntry.kills ?? 0),
          deaths: Number(rosterEntry.deaths ?? 0),
          assist: Number(rosterEntry.assist ?? 0),
          hero_damage: Number(rosterEntry.hero_damage ?? 0),
          object_damage: Number(rosterEntry.object_damage ?? 0),
          hero_healing: Number(rosterEntry.hero_healing ?? 0),
          health: Number(rosterEntry.health ?? 0),
          souls: Number(rosterEntry.souls ?? 0),
          hero_name: String(rosterEntry.hero_name ?? ''),
        };

        // Don't let an empty/reset entry overwrite existing good data.
        // GEP can send zeroed-out roster slots near match_end.
        const existing = this._allRosterData.get(key);
        if (entry.steam_id === 0 && existing && existing.steam_id !== 0) {
          continue;
        }

        this._allRosterData.set(key, entry);
        rosterChanged = true;

        if (entry.is_local) {
          this._localPlayerRosterData = rosterEntry;
          // Throttled logging: only log every 10th roster update
          this._rosterUpdateCount++;
          if (this._rosterUpdateCount % 10 === 1) {
            logger.log(
              `match_info update: local player roster (update #${this._rosterUpdateCount})`,
            );
          }
        }
      } catch (err) {
        logger.warn(`match_info update: failed to parse ${key}:`, err);
      }
    }

    if (rosterChanged) {
      this.broadcastRosterUpdate();
    }
  }

  /**
   * Sets up the hotkey handlers.
   */
  private setupHotkeyHandlers(): void {
    // Show/Hide Desktop Main Window
    this._hotkeysService.on(kHotkeys.toggleMainDesktopWindow, async () => {
      try {
        await this._windowsController.toggleMainDesktopWindow();
      } catch (error) {
        logger.error('Error toggling desktop main window:', error);
      }
    });

    // Show/Hide In-Game Main Window
    this._hotkeysService.on(kHotkeys.toggleMainIngameWindow, async () => {
      try {
        await this._windowsController.toggleMainIngameWindow();
      } catch (error) {
        logger.error('Error toggling in-game main window:', error);
      }
    });

    // Show/Hide In-Game Rotation Window
    // this._hotkeysService.on(kHotkeys.toggleRotationIngameWindow, async () => {
    //   try {
    //     await this._windowsController.toggleRotationIngameWindow();
    //   } catch (error) {
    //     logger.error('Error toggling in-game rotation window:', error);
    //   }
    // });
  }

  /**
   * Handles user-initiated app launches (clicking the app icon).
   */
  private async handleAppLaunch(event: AppLaunchTriggeredEvent): Promise<void> {
    // If the launch event is from the dock
    if (event.origin?.includes('dock')) {
      // If the game is running, show the in-game window
      if (this._isGameRunning) {
        logger.log('showing in-game window from dock');
        await this._windowsController.showMainIngameWindow();
      } else {
        logger.log('showing primary desktop window from dock');
        await this._windowsController.showMainDesktopWindow('primary');
      }
    } else {
      // If the launch event is not from the dock
      if (this._isGameRunning) {
        logger.log('Game is running, showing in-game window');
        await this._windowsController.onGameLaunch();
      } else {
        logger.log('No game running, showing primary desktop window');
        await this._windowsController.showMainDesktopWindow('primary');
      }
    }
  }

  /**
   * Shows the companion app ready notification window anchored to top-center.
   * Auto-dismisses after 10 seconds.
   */
  private async showCompanionReadyNotification(): Promise<void> {
    // Clear any existing dismiss timer
    if (this._companionReadyDismissTimer) {
      clearTimeout(this._companionReadyDismissTimer);
      this._companionReadyDismissTimer = null;
    }

    try {
      await this._windowsController.showCompanionAppReadyWindow(
        'primary',
        Edge.Top,
      );
      logger.log('Companion app ready notification shown');

      // Auto-dismiss after 10 seconds
      this._companionReadyDismissTimer = setTimeout(async () => {
        try {
          await this._windowsController.closeCompanionAppReadyWindow();
          logger.log('Companion app ready notification auto-dismissed');
        } catch (error) {
          logger.error('Error auto-dismissing companion ready window:', error);
        }
        this._companionReadyDismissTimer = null;
      }, 10_000);
    } catch (error) {
      logger.error('Error showing companion ready notification:', error);
    }
  }

  //---------------------------------TRAY ICON HANDLERS-------------------------
  private async handleTrayIconClick(): Promise<void> {
    logger.log('Tray icon clicked, showing primary desktop window');
    await this._windowsController.showMainDesktopWindow('primary');
  }

  private async handleTrayIconDoubleClick(): Promise<void> {
    logger.log('Tray icon double clicked, showing primary desktop window');
    await this._windowsController.showMainDesktopWindow('primary');
  }

  private async handleTrayMenuItemClick(
    event: onMenuItemClickedEvent,
  ): Promise<void> {
    logger.log('Tray menu item clicked:', event);
    switch (event.item) {
      case 'show-window':
        if (this._isGameRunning) {
          await this._windowsController.showMainDesktopWindow('secondary');
          await this._windowsController.showMainIngameWindow();
        } else {
          await this._windowsController.showMainDesktopWindow('primary');
        }
        break;
      case 'close-window':
        await this._windowsController.closeAllWindows();
        break;
      case 'close-app':
        await this._windowsController.closeApp();
        break;
      default:
        logger.error('Unknown tray menu item clicked:', event.item);
        break;
    }
  }

  //---------------------------------TRAY ICON HANDLERS-------------------------

  /**
   * Sets up message handlers for window-related messages
   */
  private setupMessageHandlers(): void {
    overwolf.windows.onMessageReceived.addListener(
      (message: overwolf.windows.MessageReceivedEvent) => {
        logger.log('Message received:', message);
      },
    );
  }
}
