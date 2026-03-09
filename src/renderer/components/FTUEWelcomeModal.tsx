import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFTUE } from '../contexts/FTUEContext';
import { kHotkeys } from '../../shared/consts';
import { HotkeysAPI } from '../../shared/services/hotkeys';
import Button from '../main-window/views/Settings/components/Button';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('FTUEWelcomeModal');

const DEFAULT_HOTKEYS = {
  toggleMainIngameWindow: 'Ctrl+T',
  toggleMainDesktopWindow: 'Ctrl+Shift+T',
  // toggleRotationIngameWindow: 'Ctrl+R',
};

function displayHotkey(
  binding: string | undefined,
  unassigned: boolean,
): string {
  if (
    unassigned ||
    !binding ||
    binding === 'Unassigned' ||
    binding.trim() === ''
  ) {
    return '';
  }
  return binding;
}

export const FTUEWelcomeModal: React.FC = () => {
  const { shouldShowStep, markStepComplete } = useFTUE();
  const [hotkeys, setHotkeys] = useState<{
    toggleMainIngameWindow: string;
    toggleMainDesktopWindow: string;
    // toggleRotationIngameWindow: string;
  }>(DEFAULT_HOTKEYS);

  const show = shouldShowStep('welcome');

  useEffect(() => {
    if (!show) return;

    const loadHotkeys = async () => {
      try {
        const hotkeysMap = await HotkeysAPI.fetchAll();
        const inGame = hotkeysMap.get(kHotkeys.toggleMainIngameWindow);
        const desktop = hotkeysMap.get(kHotkeys.toggleMainDesktopWindow);
        // const rotation = hotkeysMap.get(kHotkeys.toggleRotationIngameWindow);

        const toggleMainIngameWindow =
          displayHotkey(inGame?.binding, inGame?.IsUnassigned ?? true) ||
          DEFAULT_HOTKEYS.toggleMainIngameWindow;
        const toggleMainDesktopWindow =
          displayHotkey(desktop?.binding, desktop?.IsUnassigned ?? true) ||
          DEFAULT_HOTKEYS.toggleMainDesktopWindow;
        // const toggleRotationIngameWindow =
        //   displayHotkey(rotation?.binding, rotation?.IsUnassigned ?? true) ||
        //   DEFAULT_HOTKEYS.toggleRotationIngameWindow;
        setHotkeys({
          toggleMainIngameWindow,
          toggleMainDesktopWindow,
          // toggleRotationIngameWindow,
        });
      } catch (error) {
        logger.error('Error loading hotkeys:', error);
        setHotkeys(DEFAULT_HOTKEYS);
      }
    };

    loadHotkeys();
  }, [show]);

  if (!show) return null;

  const handleGotIt = () => {
    markStepComplete('welcome');
  };

  const overlayContent = (
    <div className="ftue-overlay">
      <div className="ftue-welcome-modal">
        <div className="ftue-welcome-header">
          <h2>Welcome to Deadlock Companion!</h2>
          <p className="ftue-welcome-subtitle">
            Your companion app for Deadlock.
          </p>
        </div>

        <div className="ftue-welcome-content">
          <div className="ftue-feature">
            <div className="ftue-feature-icon">⚙️</div>
            <div className="ftue-feature-info">
              <h3>Window Management</h3>
              <p>Control your app windows with customizable hotkeys.</p>
              <span>Show/Hide the in-game window with: </span>
              <div className="ftue-hotkey-badge">
                {hotkeys.toggleMainIngameWindow}
              </div>
              <br />
              <span>Show/Hide the desktop window with: </span>
              <div className="ftue-hotkey-badge">
                {hotkeys.toggleMainDesktopWindow}
              </div>
            </div>
          </div>

          <div className="ftue-feature">
            <div className="ftue-feature-icon">🎮</div>
            <div className="ftue-feature-info">
              <h3>Live Match</h3>
              <p>Track real-time stats for your current Deadlock match.</p>
            </div>
          </div>

          <div className="ftue-feature">
            <div className="ftue-feature-icon">📊</div>
            <div className="ftue-feature-info">
              <h3>Match History & Profile</h3>
              <p>
                Review past matches and player statistics powered by
                community-contributed data. Match availability improves as more
                players contribute. Enter your Steam ID in Settings to get
                started.
              </p>
            </div>
          </div>

          <div className="ftue-feature">
            <div className="ftue-feature-icon">🤝</div>
            <div className="ftue-feature-info">
              <h3>Community-Powered Data</h3>
              <p>
                Match data is contributed by players like you. Help grow the
                database by scanning your Steam cache in the Contribute tab —
                the more players help, the better the experience for everyone.
              </p>
            </div>
          </div>

          <div className="ftue-welcome-footer">
            <Button onClick={handleGotIt} variant="primary" size="large">
              Got it!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Portal to document.body so overlay appears above sidenav and all other content
  return createPortal(overlayContent, document.body);
};
