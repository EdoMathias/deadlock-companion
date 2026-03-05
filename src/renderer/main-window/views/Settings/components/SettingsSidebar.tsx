import React from 'react';

interface SettingsSidebarProps {
  activeTab: 'general' | 'hotkeys' | 'about';
  onTabChange: (tab: 'general' | 'hotkeys' | 'about') => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="settings-sidebar">
      <button
        type="button"
        className={`settings-sidebar-item ${activeTab === 'general' ? 'active' : ''}`}
        onClick={() => onTabChange('general')}
      >
        General
      </button>
      <button
        type="button"
        className={`settings-sidebar-item ${activeTab === 'hotkeys' ? 'active' : ''}`}
        onClick={() => onTabChange('hotkeys')}
      >
        Hotkeys
      </button>
      <button
        type="button"
        className={`settings-sidebar-item ${activeTab === 'about' ? 'active' : ''}`}
        onClick={() => onTabChange('about')}
      >
        About
      </button>
    </div>
  );
};

export default SettingsSidebar;
