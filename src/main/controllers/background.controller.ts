import { GameStateService } from '../services/game-state.service';
import { HotkeysService } from '../services/hotkeys.service';
import { AppLaunchService } from '../services/app-launch.service';
import {
  MessageChannel,
  MessagePayload,
  MessageType,
} from '../services/MessageChannel';
import { Edge } from '@overwolf/odk-ts/window/enums/edge';
import { kDeadlockClassId, kHotkeys, kWindowNames } from '../../shared/consts';
import { createLogger } from '../../shared/services/Logger';
import { WindowsController } from './windows.controller';
import { TrayIconService } from '../services/tray-icon.service';
import onMenuItemClickedEvent = overwolf.os.tray.onMenuItemClickedEvent;
import AppLaunchTriggeredEvent = overwolf.extensions.AppLaunchTriggeredEvent;
import { GameEventsService } from '../services/game-events.service';

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

  private constructor() {
    // Initialize MessageChannel first (used by other services)
    this._messageChannel = new MessageChannel();
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
      // TODO: Move to separate logic later, just logging for now
      onGameEvent: (payload) => {
        payload.events.forEach((e) => logger.warn('Event:', e.name, e.data));
      },
      // TODO: Move to separate logic later, just logging for now
      onInfoUpdate: (info) => {
        logger.warn(`Info [${info.feature}]:`, info.info);
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
      }
      // If the game is not Deadlock, don't do anything
      else {
        logger.log('Game was not Deadlock, not showing main desktop window');
        return;
      }
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
    this._hotkeysService.on(kHotkeys.toggleRotationIngameWindow, async () => {
      try {
        await this._windowsController.toggleRotationIngameWindow();
      } catch (error) {
        logger.error('Error toggling in-game rotation window:', error);
      }
    });
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
