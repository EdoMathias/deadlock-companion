import React, { useState } from 'react';
import Button from './components/Button';
import {
  SettingsSidebar,
  GeneralSettings,
  AboutSettings,
  HotkeysSettings,
  DataSettings,
  SettingsInfo,
} from './components';

type SettingsTab = 'general' | 'hotkeys' | 'data' | 'about';

interface SettingsProps {
  onClose: () => void;
  initialTab?: SettingsTab;
}

const Settings: React.FC<SettingsProps> = ({
  onClose,
  initialTab = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'hotkeys':
        return <HotkeysSettings />;
      case 'data':
        return <DataSettings />;
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
        <div className="settings-main">{renderContent()}</div>
        <SettingsInfo tab={activeTab} />
      </div>
    </div>
  );
};

export default Settings;
