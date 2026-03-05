import React from 'react';

interface SettingsInfoProps {
  tab: 'general' | 'hotkeys' | 'about';
}

const SettingsInfo: React.FC<SettingsInfoProps> = ({ tab }) => {
  const renderInfo = () => {
    switch (tab) {
      case 'general':
        return (
          <>
            <h3>General Settings</h3>
            <p>Manage your general application preferences and tutorials.</p>

            <h4>Tutorial</h4>
            <p>
              Resetting the tutorial will re-enable the first-time user experience walkthrough.
              Use this if you want to review the app&apos;s features and how to use them.
            </p>
          </>
        );
      case 'hotkeys':
        return (
          <>
            <h3>Hotkeys</h3>
            <p>Customize your keyboard shortcuts for quick access to features.</p>

            <h4>Instructions</h4>
            <p>
              Click on a hotkey field and press the key combination you want to assign.
            </p>
            <p>
              Press <strong>Escape</strong> to cancel editing.
            </p>
            <p>
              Hotkeys must be unique. If you try to assign a key that is already in use, you will see an error message.
            </p>
          </>
        );
      case 'about':
        return (
          <>
            <h3>About</h3>
            <p>Legal information and credits.</p>

            <h4>Disclaimer</h4>
            <p>
              This application is a community-made fan project and is not affiliated with,
              endorsed, or sponsored by the game developers.
            </p>
          </>
        );
      default:
        return null;
    }
  };

  return <div className="settings-info">{renderInfo()}</div>;
};

export default SettingsInfo;
