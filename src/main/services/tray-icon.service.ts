import onMenuItemClickedEvent = overwolf.os.tray.onMenuItemClickedEvent;
import ExtensionTrayMenu = overwolf.os.tray.ExtensionTrayMenu;

import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('TrayIconService');

/**
 * Handles tray icon click events triggered by user actions (e.g., clicking the tray icon).
 */
export class TrayIconService {

    constructor(private onTrayIconClickCallback: () => Promise<void>, private onTrayMenuItemClickCallback: (event: onMenuItemClickedEvent) => Promise<void>, private onTrayIconDoubleClickCallback: () => Promise<void>) {

        // Set the tray menu
        this.createTrayMenu();

        // Callback to be executed when the tray icon is clicked.
        overwolf.os.tray.onTrayIconClicked.addListener(
            () => this.handleTrayIconClick()
        );

        // Callback to be executed when the tray icon is double clicked.
        overwolf.os.tray.onTrayIconDoubleClicked.addListener(
            () => this.handleTrayIconDoubleClick()
        );

        // Callback to be executed when a tray menu item is clicked.
        overwolf.os.tray.onMenuItemClicked.addListener(
            (event: onMenuItemClickedEvent) => this.handleTrayMenuItemClick(event)
        );
    }


    private createTrayMenu(): void {
        const trayMenu: ExtensionTrayMenu = {
            menu_items: [
                {
                    label: 'Show Window',
                    id: 'show-window'
                },
                {
                    label: 'Close window',
                    id: 'close-window'
                },
                {
                    label: '-'
                },
                {
                    label: 'Close App',
                    id: 'close-app'
                }
            ]
        }

        overwolf.os.tray.setMenu(trayMenu, (result) => {
            if (result.success) {
                logger.log('Tray menu set successfully');
            } else {
                logger.error('Error setting tray menu:', result.error);
            }
        });
    }

    /**
     * Handles incoming tray icon click events.
     * 
     */
    private async handleTrayIconClick(): Promise<void> {
        logger.log('Tray icon clicked');

        try {
            await this.onTrayIconClickCallback();
        } catch (error) {
            logger.error('Error handling tray icon click:', error);
        }
    }

    /**
     * Handles incoming tray icon double click events.
     */
    private async handleTrayIconDoubleClick(): Promise<void> {
        logger.log('Tray icon double clicked');

        try {
            await this.onTrayIconDoubleClickCallback();
        } catch (error) {
            logger.error('Error handling tray icon double click:', error);
        }
    }

    /**
     * Handles incoming tray menu item click events.
     * 
     * @param event - The tray menu item click event from Overwolf
     */
    private async handleTrayMenuItemClick(event: onMenuItemClickedEvent): Promise<void> {
        logger.log('Tray menu item clicked:', event);

        try {
            await this.onTrayMenuItemClickCallback(event);
        } catch (error) {
            logger.error('Error handling tray menu item click:', error);
        }
    }
}
