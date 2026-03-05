import { kWindowNames } from '../../shared/consts';
import { MessageChannel, MessageType } from '../services/MessageChannel';
import { createLogger } from '../../shared/services/Logger';
import { MonitorInfo, MonitorsService } from '../services/windows-odk/monitors.service';
import { WindowsService } from '../services/windows-odk/windows.service';
import { Edge } from '@overwolf/odk-ts/window/enums/edge';

const logger = createLogger('WindowsController');

export class WindowsController {
    private _messageChannel: MessageChannel;
    private _windowsService: WindowsService;
    private _monitorsService: MonitorsService;

    constructor(messageChannel: MessageChannel) {
        this._messageChannel = messageChannel;
        this._monitorsService = new MonitorsService();
        this._windowsService = new WindowsService();
    }

    public async onGameLaunch(): Promise<void> {
        // Ensure the monitors map is ready - fixes a bug where the map was not ready,
        // and users with a second monitor would not see the main desktop window.
        await this._monitorsService.ensureMonitorsMapReady();

        // if has second monitor, show the main desktop window on the second monitor
        if (this._monitorsService.hasSecondMonitor()) {
            await this._windowsService.showMainDesktopWindow('secondary');
            logger.log('Moving main desktop window to secondary monitor');
        }

        // Show the companion app ready window
        await this._windowsService.showCompanionAppReadyWindow('primary', Edge.Top);

        // Create the main in-game window but don't show it yet
        await this._windowsService.createMainIngameWindow();

        // Create the rotation in-game window but don't show it yet
        await this._windowsService.createRotationIngameWindow();
    }

    public async onGameExit(): Promise<void> {
        // Close the main in-game window
        await this._windowsService.closeMainIngameWindow();

        // Close the rotation in-game window
        await this._windowsService.closeRotationIngameWindow();

        // Close the companion app ready window if still visible
        await this._windowsService.closeCompanionAppReadyWindow();

        // Move the main desktop window to the center of the main monitor
        await this._windowsService.showMainDesktopWindow('primary');
    }

    public async showMainDesktopWindow(centerOnMonitor?: 'primary' | 'secondary', dockTo?: Edge): Promise<void> {
        await this._windowsService.showMainDesktopWindow(centerOnMonitor, dockTo);
    }

    public async showMainIngameWindow(centerOnMonitor?: 'primary' | 'secondary', dockTo?: Edge): Promise<void> {
        await this._windowsService.showMainIngameWindow(centerOnMonitor, dockTo);
    }

    public async showRotationIngameWindow(centerOnMonitor?: 'primary' | 'secondary', dockTo?: Edge): Promise<void> {
        await this._windowsService.showRotationIngameWindow(centerOnMonitor, dockTo);
    }

    public async toggleMainDesktopWindow(): Promise<void> {
        await this._windowsService.toggleMainDesktopWindow();
    }

    public async toggleMainIngameWindow(): Promise<void> {
        await this._windowsService.toggleMainIngameWindow();
    }

    public async toggleRotationIngameWindow(): Promise<void> {
        await this._windowsService.toggleRotationIngameWindow();
    }

    public async setRotationIngameWindowSize(width: number, height: number): Promise<void> {
        await this._windowsService.setRotationIngameWindowSize(width, height);
    }

    public async showCompanionAppReadyWindow(centerOnMonitor?: 'primary' | 'secondary', dockTo?: Edge): Promise<void> {
        await this._windowsService.showCompanionAppReadyWindow(centerOnMonitor, dockTo);
    }

    public async closeCompanionAppReadyWindow(): Promise<void> {
        await this._windowsService.closeCompanionAppReadyWindow();
    }

    public async closeAllWindows(): Promise<void> {
        try {
            await this._windowsService.closeMainDesktopWindow();
        } catch (error) {
            logger.error('Error closing main desktop window:', error);
        }
        try {
            await this._windowsService.closeMainIngameWindow();
        } catch (error) {
            logger.error('Error closing main in-game window:', error);
        }
        try {
            await this._windowsService.closeRotationIngameWindow();
        } catch (error) {
            logger.error('Error closing rotation in-game window:', error);
        }
        try {
            await this._windowsService.closeCompanionAppReadyWindow();
        } catch (error) {
            logger.error('Error closing companion app ready window:', error);
        }
    }

    public async closeApp(): Promise<void> {
        await this._windowsService.closeApp();
    }
}

