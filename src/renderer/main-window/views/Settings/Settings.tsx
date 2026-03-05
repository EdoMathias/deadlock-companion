import React, { useState } from 'react';
import Button from './components/Button';
import {
  SettingsSidebar,
  GeneralSettings,
  AboutSettings,
  HotkeysSettings,
  SettingsInfo,
} from './components';

interface SettingsProps {
  onClose: () => void;
  initialTab?: 'general' | 'hotkeys' | 'about';
}

const Settings: React.FC<SettingsProps> = ({
  onClose,
  initialTab = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'hotkeys' | 'about'>(initialTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'hotkeys':
        return <HotkeysSettings />;
      case 'about':
        return <AboutSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <Button
          variant="ghost"
          size="small"
          className="settings-back-button"
          onClick={onClose}
          title="Go Back"
        >
          ← Back
        </Button>
        <h2 className="settings-header-title">Settings</h2>
      </div>
      <div className="settings-container">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="settings-main">
          {renderContent()}
        </div>
        <SettingsInfo tab={activeTab} />
      </div>
    </div>
  );
};

export default Settings;
