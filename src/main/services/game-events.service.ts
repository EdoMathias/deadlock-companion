import { OWGames, OWGamesEvents } from '@overwolf/overwolf-api-ts';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('GameEventsService');

import RunningGameInfo = overwolf.games.RunningGameInfo;
import InfoUpdates2Event = overwolf.games.events.InfoUpdates2Event;
import { STEAM_ID_STORAGE_KEY } from 'src/renderer/hooks/useSteamId';

export interface GEPEnabledFeatures {
  enabled: string[];
  requested: string[];
}

export interface GameEventPayload {
  events: any[];
}

export interface InfoUpdatePayload {
  feature: string;
  info: { [categoryKey: string]: { [key: string]: any } };
}

/**
 * Handles Overwolf Game Events Protocol (GEP) registration for Deadlock.
 *
 * Pass callbacks for game events and info updates — no subclassing needed.
 *
 * @example
 * const gep = new GameEventsService({
 *   onGameEvent: (payload) => { ... },
 *   onInfoUpdate: (info) => { ... },
 * });
 * await gep.onGameLaunched(['kill', 'death', 'game_info'], gameInfo);
 */
export class GameEventsService {
  private enabledFeatures: GEPEnabledFeatures = {
    enabled: [],
    requested: [],
  };

  private readonly _onGameEvent?: (payload: GameEventPayload) => void;
  private readonly _onInfoUpdate?: (info: InfoUpdatePayload) => void;

  constructor(callbacks?: {
    onGameEvent?: (payload: GameEventPayload) => void;
    onInfoUpdate?: (info: InfoUpdatePayload) => void;
  }) {
    this._onGameEvent = callbacks?.onGameEvent;
    this._onInfoUpdate = callbacks?.onInfoUpdate;
  }

  // ─── Stable listener references (needed for removeListener) ─────────────────

  private readonly _errorListener = (
    error: overwolf.games.events.ErrorEvent,
  ) => {
    logger.error(
      'GEP error:',
      (error as any).error ?? (error as any).reason ?? String(error),
    );
    this.onGEPError(error);
  };

  private readonly _eventsListener = (payload: any) => {
    const events: GameEventPayload = {
      events: payload?.events ?? payload ?? [],
    };
    this.onGameEvent(events);
  };

  private readonly _infoListener = (update: InfoUpdates2Event) => {
    if (!update?.info) return;

    Object.keys(update.info).forEach((featureKey) => {
      const featureData = (update.info as any)[featureKey];
      const infoUpdate: InfoUpdatePayload = {
        feature: featureKey,
        info: featureData ?? {},
      };
      this.onInfoUpdate(infoUpdate);
    });
  };

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  /**
   * Call when a supported game is detected as running.
   * Registers GEP listeners then sets the required features.
   *
   * @param requiredFeatures - Features to register (e.g. ['game_info', 'kill'])
   * @param gameInfo - Optional running game info; resolved automatically if omitted
   * @returns The features that were successfully enabled, or undefined if the
   *   game info could not be resolved
   */
  public async onGameLaunched(
    requiredFeatures: string[],
    gameInfo?: RunningGameInfo,
  ): Promise<GEPEnabledFeatures | undefined> {
    logger.log('Game launched — registering GEP listeners');
    this.startGEPListeners();

    const resolved = await this.resolveRunningGameInfo(gameInfo);
    if (!resolved) {
      logger.warn(
        'Game launch detected but could not resolve running game info',
      );
      return undefined;
    }

    if (requiredFeatures.length === 0) {
      logger.warn(
        'No required features specified — skipping setRequiredFeatures',
      );
      return undefined;
    }

    this.enabledFeatures = await this.setRequiredFeatures(requiredFeatures);
    logger.log('Enabled features:', this.enabledFeatures.enabled);

    // Get initial game-info to extract the user's steam ID
    this.getSteamIdFromGameInfo();

    return this.enabledFeatures;
  }

  /**
   * Call when the game is closed.
   * De-registers all GEP listeners and resets state.
   */
  public onGameClosed(): void {
    logger.log('Game closed — removing GEP listeners');
    this.stopGEPListeners();
    this.enabledFeatures = { enabled: [], requested: [] };
  }

  // ─── Listener registration ────────────────────────────────────────────────────

  /**
   * Attaches all three GEP listeners (errors, game events, info updates).
   */
  public startGEPListeners(): boolean {
    try {
      overwolf.games.events.onError.addListener(this._errorListener);
      overwolf.games.events.onNewEvents.addListener(this._eventsListener);
      overwolf.games.events.onInfoUpdates2.addListener(this._infoListener);
      logger.log('GEP listeners registered');
      return true;
    } catch (err) {
      logger.error('Failed to register GEP listeners:', err);
      return false;
    }
  }

  /**
   * Removes all three GEP listeners.
   */
  public stopGEPListeners(): boolean {
    overwolf.games.events.onError.removeListener(this._errorListener);
    overwolf.games.events.onNewEvents.removeListener(this._eventsListener);
    overwolf.games.events.onInfoUpdates2.removeListener(this._infoListener);
    logger.log('GEP listeners removed');
    return true;
  }

  // ─── Feature registration ─────────────────────────────────────────────────────

  /**
   * Attempts to set required GEP features, retrying up to `maxRetries` times
   * with a 3-second delay between attempts.
   *
   * @throws if all attempts are exhausted
   */
  private async setRequiredFeatures(
    requiredFeatures: string[],
    maxRetries = 30,
  ): Promise<GEPEnabledFeatures> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const enabled = await this.trySetRequiredFeatures(requiredFeatures);
        if (enabled.length > 0) {
          return { enabled, requested: requiredFeatures };
        }
      } catch (err) {
        logger.warn(
          `setRequiredFeatures attempt ${attempt}/${maxRetries} failed:`,
          err,
        );
        if (attempt >= maxRetries) {
          throw new Error(
            `Failed to set required features after ${maxRetries} attempts: ${err}`,
          );
        }
      }

      await this.delay(3000);
    }

    throw new Error(
      `Failed to set required features after ${maxRetries} attempts`,
    );
  }

  /**
   * Single attempt to set required features via the Overwolf API.
   */
  private trySetRequiredFeatures(
    requiredFeatures: string[],
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      overwolf.games.events.setRequiredFeatures(requiredFeatures, (result) => {
        if (!result.success) {
          reject(result.error as string);
        } else {
          resolve(result.supportedFeatures as string[]);
        }
      });
    });
  }

  // ─── Internal event dispatchers ─────────────────────────────────────────────

  private onGEPError(_error: overwolf.games.events.ErrorEvent): void {
    // Error is already logged in _errorListener
  }

  private onGameEvent(payload: GameEventPayload): void {
    logger.warn('Game events received:', payload);
    this._onGameEvent?.(payload);
  }

  private onInfoUpdate(info: InfoUpdatePayload): void {
    logger.warn(`Info update [${info.feature}]:`, info.info);
    logger.log(JSON.stringify(info.info, null, 2));
    this._onInfoUpdate?.(info);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async resolveRunningGameInfo(
    gameInfo?: RunningGameInfo,
  ): Promise<RunningGameInfo | undefined> {
    if (gameInfo?.isRunning) return gameInfo;

    try {
      const info = await OWGames.getRunningGameInfo();
      return info?.isRunning ? info : undefined;
    } catch (err) {
      logger.error('Failed to fetch running game info:', err);
      return undefined;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async getSteamIdFromGameInfo(): Promise<void> {
    try {
      let currentSteamId = localStorage.getItem('deadlock_companion_steam_id');

      // If does not exist in local storage, get and save it from game info
      if (!currentSteamId) {
        logger.log(
          'No Steam ID in local storage, attempting to extract from game info',
        );
        overwolf.games.events.getInfo((result) => {
          if (result.success) {
            currentSteamId = result.res.game_info?.steam_id ?? null;
            if (currentSteamId) {
              logger.log('Extracted Steam ID from game info:', currentSteamId);
              localStorage.setItem(
                'deadlock_companion_steam_id',
                currentSteamId,
              );
            }
          }
        });
      } else {
        logger.log('Steam ID already in local storage:', currentSteamId);
        logger.log('Checking if we need to update it from game info');
        overwolf.games.events.getInfo((result) => {
          if (result.success) {
            const steamIdFromGameInfo = result.res.game_info?.steam_id ?? null;
            if (steamIdFromGameInfo && steamIdFromGameInfo !== currentSteamId) {
              logger.log(
                'Updating Steam ID from game info:',
                steamIdFromGameInfo,
              );
              localStorage.setItem(
                'deadlock_companion_steam_id',
                steamIdFromGameInfo,
              );
            }
            logger.log(
              'Steam ID from game info matches local storage, no update needed',
            );
          }
        });
      }
    } catch (error) {}
  }
}
