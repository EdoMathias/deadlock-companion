import React, { useEffect, useState } from 'react';

import SideNavButton from './SideNavButton';
import SideNavToggle from './SideNavToggle';
import { useFTUE } from '../../../contexts/FTUEContext';

const DiscordIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="currentColor"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
  </svg>
);

const DISCORD_BADGE_STORAGE_KEY = 'deadlock_companion_discord_badge_clicked';

interface SideNavProps {
  views: Array<{
    name: string;
    icon: React.ComponentType;
  }>;
  activeView: string;
  setActiveView: (view: string) => void;
  navExpanded: boolean;
  setNavExpanded: (expanded: boolean) => void;
}

const SideNav: React.FC<SideNavProps> = ({
  views,
  activeView,
  setActiveView,
  navExpanded,
  setNavExpanded,
}) => {
  const { hasUnseenFTUE } = useFTUE();
  const [showDiscordBadge, setShowDiscordBadge] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISCORD_BADGE_STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!showDiscordBadge) {
      try {
        localStorage.setItem(DISCORD_BADGE_STORAGE_KEY, 'true');
      } catch {
        // Ignore errors
      }
    }
  }, [showDiscordBadge]);

  const handleViewClick = (view: string) => {
    setActiveView(view);
    setNavExpanded(false);
  };

  const openDiscord = () => {
    overwolf.utils.openUrlInDefaultBrowser('https://discord.gg/rUNRBxV9bz');
    if (showDiscordBadge) {
      setShowDiscordBadge(false);
    }
  };

  return (
    <div className="side-nav-wrapper">
      <div className={`side-nav ${navExpanded ? 'side-nav--expanded' : ''}`}>
        {views.map((view) => (
          <SideNavButton
            key={view.name}
            icon={view.icon}
            title={view.name}
            active={view.name === activeView}
            onClick={() => handleViewClick(view.name)}
            showNewBadge={hasUnseenFTUE(view.name)}
          />
        ))}
        <div className="side-nav-footer">
          <SideNavButton
            icon={DiscordIcon}
            title="Join Discord"
            active={false}
            onClick={openDiscord}
            showNewBadge={showDiscordBadge}
          />
          <SideNavToggle
            navExpanded={navExpanded}
            setNavExpanded={setNavExpanded}
          />
        </div>
      </div>
    </div>
  );
};

export default SideNav;
