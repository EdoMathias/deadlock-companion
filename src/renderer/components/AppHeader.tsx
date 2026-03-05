import React, { useCallback } from 'react';
import { Windows } from '@overwolf/odk-ts';
import { kWindowNames } from '../../shared/consts';
import { useWindowInfo } from '../hooks/useWindowInfo';

interface AppHeaderProps {
  title: string;
  appVersion?: string;
  hotkeyText?: string;
  hotkeyTextInGame?: string;
  hotkeyTextDesktop?: string;
  showHotkey?: boolean;
  actionButtons?: Array<{
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
  }>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  appVersion,
  hotkeyText,
  hotkeyTextInGame,
  hotkeyTextDesktop,
  showHotkey = true,
  actionButtons = [],
}) => {
  const { windowName } = useWindowInfo();
  const hasBothHotkeys = hotkeyTextInGame != null && hotkeyTextDesktop != null;
  const hotkeyDisplay = hasBothHotkeys
    ? { inGame: hotkeyTextInGame, desktop: hotkeyTextDesktop }
    : hotkeyText
      ? { single: hotkeyText }
      : null;

  const handleDragStart = useCallback(async () => {
    if (await Windows.Self()) {
      await (await Windows.Self()).move().catch((error) => {
        console.error('Error initiating window drag:', error);
      });
    }
  }, []);

  const handleMinimize = useCallback(async () => {
    if (await Windows.Self()) {
      (await Windows.Self()).minimize().catch((error) => {
        console.error('Error minimizing window:', error);
      });
    }
  }, []);

  const handleRestore = useCallback(async () => {
    if (await Windows.Self()) {
      const windowState = await (await Windows.Self()).getWindowState();
      console.log('windowState', windowState);
      if (windowState === 'maximized') {
        await (await Windows.Self()).restore();
      } else {
        await (await Windows.Self()).maximize();
      }
    }
  }, []);

  const handleClose = useCallback(async () => {
    const self = await Windows.Self();
    if (!self) return;
    try {
      // In-game window: hide (user can show again via hotkey). Desktop: close.
      if (windowName === kWindowNames.mainIngame) {
        await self.hide();
      } else {
        await self.close();
      }
    } catch (error) {
      console.error('Error closing/hiding window:', error);
    }
  }, [windowName]);

  return (
    <header id="header" className="app-header" onMouseDown={handleDragStart}>
      <img
        src="../../img/logo-window.png"
        alt="Header icon"
        draggable={false}
      />
      <h1>
        {title}
        {appVersion && <span className="app-version-tag">v{appVersion}</span>}
      </h1>
      {showHotkey && hotkeyDisplay && (
        <h1 className="hotkey-text">
          {hotkeyDisplay.single != null ? (
            <>
              Show/Hide: <kbd id="hotkey">{hotkeyDisplay.single}</kbd>
            </>
          ) : (
            <>
              Show/Hide: In-Game <kbd>{hotkeyDisplay.inGame}</kbd>
              {' · '}
              Desktop <kbd>{hotkeyDisplay.desktop}</kbd>
            </>
          )}
        </h1>
      )}
      <div className="header-drag-handle"></div>
      {actionButtons.length > 0 && (
        <div
          className="header-actions-group"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {actionButtons.map((button, index) => (
            <button
              key={index}
              className="header-action-button"
              onClick={button.onClick}
              title={button.title}
            >
              {button.icon}
            </button>
          ))}
        </div>
      )}
      <div
        className="window-controls-group"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          id="minimizeButton"
          className="window-control window-control-minimize"
          onClick={handleMinimize}
        />
        <button
          id="maximizeButton"
          className="window-control window-control-maximize"
          onClick={handleRestore}
        />
        <button
          id="closeButton"
          className="window-control window-control-close"
          onClick={handleClose}
        />
      </div>
    </header>
  );
};
