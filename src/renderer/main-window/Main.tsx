import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';

// Components
import { AppHeader, FTUEWelcomeModal, ReleaseNotesModal } from '../components';
import { IngestPromptModal } from '../components/IngestPromptModal';
import { AdContainer } from './components/AdContainer/AdContainer';
import SideNav from './components/SideNav/SideNav';
import { Settings } from './views/Settings';

// Contexts
import { FTUEProvider, useFTUE } from '../contexts/FTUEContext';
import { FTUETooltip } from '../components/FTUETooltip';

// Custom hooks
import { useWindowInfo } from '../hooks/useWindowInfo';
import { useAppVersion } from '../hooks/useAppVersion';
import { useReleaseNotes } from '../hooks/useReleaseNotes';

// Config
import { viewsConfig } from './config/views.config';
import { kHotkeys } from '../../shared/consts';
import { HotkeysAPI } from '../../shared/services/hotkeys';
import { MessageType } from '../../main/services/MessageChannel';

const DEFAULT_HOTKEYS = {
  toggleMainIngameWindow: 'Ctrl+T',
  toggleMainDesktopWindow: 'Ctrl+Shift+T',
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

const defaultViewName =
  viewsConfig.find((view) => view.active)?.name ?? viewsConfig[0].name;
const ACTIVE_VIEW_STORAGE_KEY = 'deadlock_companion_active_view';

/**
 * Inner component that lives inside FTUEProvider so it can consume the FTUE
 * context (e.g. to gate release-notes auto-open on FTUE completion).
 */
const MainInner: React.FC<{ resetTrigger: number }> = ({ resetTrigger }) => {
  const { isIngameWindow } = useWindowInfo();
  const { isFTUEComplete, skipTour } = useFTUE();
  const appVersion = useAppVersion();
  const {
    releaseNote,
    isOpen: isReleaseNotesOpen,
    dismiss: dismissReleaseNotes,
    open: openReleaseNotes,
  } = useReleaseNotes(appVersion, isFTUEComplete);

  const [showSettings, setShowSettings] = React.useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = React.useState<
    'general' | 'hotkeys' | 'about'
  >('general');
  const [toggleHotkeys, setToggleHotkeys] = useState<{
    inGame: string;
    desktop: string;
  }>({
    inGame: DEFAULT_HOTKEYS.toggleMainIngameWindow,
    desktop: DEFAULT_HOTKEYS.toggleMainDesktopWindow,
  });

  const [activeView, setActiveView] = React.useState(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY);
      if (stored && viewsConfig.some((v) => v.name === stored)) {
        return stored;
      }
    } catch {
      // Ignore errors
    }
    return defaultViewName;
  });
  const [navExpanded, setNavExpanded] = React.useState(false);
  const [showIngestPrompt, setShowIngestPrompt] = React.useState(false);

  // Persist active view to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, activeView);
    } catch {
      // Ignore errors
    }
  }, [activeView]);

  // React to FTUE reset (triggered by the parent via resetTrigger)
  useEffect(() => {
    if (resetTrigger > 0) {
      setShowSettings(false);
      setActiveView(defaultViewName);
      setNavExpanded(false);
    }
  }, [resetTrigger]);

  // Prevent drag-and-drop in the in-game window to avoid Overwolf getting stuck
  useEffect(() => {
    if (!isIngameWindow) return;
    const block = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', block, true);
    window.addEventListener('drop', block, true);
    return () => {
      window.removeEventListener('dragover', block, true);
      window.removeEventListener('drop', block, true);
    };
  }, [isIngameWindow]);

  const loadHotkeys = React.useCallback(async () => {
    try {
      const hotkeysMap = await HotkeysAPI.fetchAll();
      const inGame = hotkeysMap.get(kHotkeys.toggleMainIngameWindow);
      const desktop = hotkeysMap.get(kHotkeys.toggleMainDesktopWindow);
      setToggleHotkeys({
        inGame:
          displayHotkey(inGame?.binding, inGame?.IsUnassigned ?? true) ||
          DEFAULT_HOTKEYS.toggleMainIngameWindow,
        desktop:
          displayHotkey(desktop?.binding, desktop?.IsUnassigned ?? true) ||
          DEFAULT_HOTKEYS.toggleMainDesktopWindow,
      });
    } catch {
      setToggleHotkeys({
        inGame: DEFAULT_HOTKEYS.toggleMainIngameWindow,
        desktop: DEFAULT_HOTKEYS.toggleMainDesktopWindow,
      });
    }
  }, []);

  useEffect(() => {
    loadHotkeys();
    const onHotkeysChanged = () => loadHotkeys();
    overwolf.settings.hotkeys.onChanged.addListener(onHotkeysChanged);
    return () => {
      overwolf.settings.hotkeys.onChanged.removeListener(onHotkeysChanged);
    };
  }, [loadHotkeys]);

  // Allow any nested component to trigger sidebar navigation via a custom DOM event
  useEffect(() => {
    const onNavigate = (e: Event) => {
      const viewName = (e as CustomEvent<string>).detail;
      if (viewName && viewsConfig.some((v) => v.name === viewName)) {
        setShowSettings(false);
        setActiveView(viewName);
      }
    };
    window.addEventListener('navigate-view', onNavigate);
    return () => window.removeEventListener('navigate-view', onNavigate);
  }, []);

  // Listen for INGEST_PROMPT messages from background (sent after Deadlock exits)
  useEffect(() => {
    if (isIngameWindow) return;
    const onMessage = (message: overwolf.windows.MessageReceivedEvent) => {
      try {
        const payload =
          typeof message?.content === 'string'
            ? JSON.parse(message.content)
            : message?.content;
        if (payload?.type === MessageType.INGEST_PROMPT) {
          setShowIngestPrompt(true);
        }
      } catch {
        // Ignore parse errors
      }
    };
    overwolf.windows.onMessageReceived.addListener(onMessage);
    return () => {
      overwolf.windows.onMessageReceived.removeListener(onMessage);
    };
  }, [isIngameWindow]);

  // Auto-navigate to Live Match view when a match starts
  useEffect(() => {
    const onMessage = (message: overwolf.windows.MessageReceivedEvent) => {
      try {
        const payload =
          typeof message?.content === 'string'
            ? JSON.parse(message.content)
            : message?.content;
        if (payload?.type === MessageType.LIVE_MATCH_START) {
          setShowSettings(false);
          setActiveView('Live Match');
          setNavExpanded(false);
        }
      } catch {
        // Ignore parse errors
      }
    };
    overwolf.windows.onMessageReceived.addListener(onMessage);
    return () => {
      overwolf.windows.onMessageReceived.removeListener(onMessage);
    };
  }, []);

  const handleIngestGoToScanner = React.useCallback(() => {
    setShowIngestPrompt(false);
    setShowSettings(false);
    setActiveView('Contribute');
  }, []);

  //------------------------HEADER ACTION BUTTONS-----------------------------
  const handleSettingsClick = () => {
    setSettingsInitialTab('general');
    setShowSettings(true);
  };

  const handleSubmissionFormClick = () => {
    console.log('Submission form clicked');
    overwolf.utils.openUrlInDefaultBrowser(
      'https://discord.gg/rUNRBxV9bz',
    );
  };

  const headerActionButtons: Array<{
    icon: string | React.ReactNode;
    title: string;
    onClick: () => void;
  }> = [
    {
      icon: '🆕',
      title: "What's New",
      onClick: openReleaseNotes,
    },
    {
      icon: '📝',
      title: 'Submit Feedback',
      onClick: handleSubmissionFormClick,
    },
    {
      icon: '⚙️',
      title: 'Settings',
      onClick: handleSettingsClick,
    },
  ];
  //------------------------HEADER ACTION BUTTONS-----------------------------

  // Convert views config to format expected by SideNav
  const views = viewsConfig.map((view) => ({
    name: view.name,
    icon: view.icon,
  }));

  // Get the active view component
  const activeViewConfig = viewsConfig.find((view) => view.name === activeView);
  const ActiveViewComponent = activeViewConfig?.component;

  return (
    <div className="app-layout">
      <div className="app-header-wrapper">
        <AppHeader
          title={
            isIngameWindow
              ? 'Deadlock Companion • In-Game'
              : 'Deadlock Companion • Desktop'
          }
          appVersion={appVersion ?? undefined}
          showHotkey={true}
          hotkeyTextInGame={toggleHotkeys.inGame}
          hotkeyTextDesktop={toggleHotkeys.desktop}
          actionButtons={headerActionButtons}
        />
      </div>

      <div className="app-body">
        <SideNav
          views={views}
          activeView={activeView}
          setActiveView={setActiveView}
          navExpanded={navExpanded}
          setNavExpanded={setNavExpanded}
        />

        <main className="main-content">
          <IngestPromptModal
            isOpen={showIngestPrompt}
            onClose={() => setShowIngestPrompt(false)}
            onGoToScanner={handleIngestGoToScanner}
            scope="content"
          />
          {navExpanded && (
            <button
              type="button"
              className="side-nav-overlay"
              onClick={() => setNavExpanded(false)}
              aria-label="Close menu"
            />
          )}
          <div className="main-content-wrapper">
            <FTUEWelcomeModal />
            <FTUETooltip
              step="live_match_header"
              title="Live Match"
              message="Track your match in real-time — kills, deaths, souls, and more update live as you play."
              position="right"
              targetSelector='[data-ftue-target="Live Match"]'
              skipAllLabel="Skip tour"
              onSkipAll={skipTour}
              onDismiss={() =>
                window.dispatchEvent(
                  new CustomEvent('navigate-view', { detail: 'Live Match' }),
                )
              }
            />
            <FTUETooltip
              step="match_history_header"
              title="Match History"
              message="Browse your past matches with detailed stats. Open this tab in-game to load your latest games."
              position="right"
              targetSelector='[data-ftue-target="Match History"]'
              skipAllLabel="Skip tour"
              onSkipAll={skipTour}
              onDismiss={() =>
                window.dispatchEvent(
                  new CustomEvent('navigate-view', { detail: 'Match History' }),
                )
              }
            />
            <FTUETooltip
              step="contribute_header"
              title="Contribute"
              message="Help improve the app by contributing your match data. Your data helps us build better stats for everyone."
              position="right"
              targetSelector='[data-ftue-target="Contribute"]'
              skipAllLabel="Skip tour"
              onSkipAll={skipTour}
              onDismiss={() =>
                window.dispatchEvent(
                  new CustomEvent('navigate-view', { detail: 'Contribute' }),
                )
              }
            />
            <FTUETooltip
              step="profile_header"
              title="Profile"
              message="Check your overall stats and player profile at a glance."
              position="right"
              targetSelector='[data-ftue-target="Profile"]'
              skipAllLabel="Skip tour"
              onSkipAll={skipTour}
              onDismiss={() =>
                window.dispatchEvent(
                  new CustomEvent('navigate-view', { detail: 'Profile' }),
                )
              }
            />
            <ReleaseNotesModal
              isOpen={isReleaseNotesOpen}
              note={releaseNote}
              onClose={dismissReleaseNotes}
              scope="content"
            />
            <div className="main-content-container">
              {showSettings ? (
                <div className="settings-wrapper">
                  <Settings
                    initialTab={settingsInitialTab}
                    onClose={() => setShowSettings(false)}
                  />
                </div>
              ) : (
                ActiveViewComponent && <ActiveViewComponent />
              )}
            </div>
          </div>
        </main>

        <aside className="ad-sidebar">
          <AdContainer width={400} height={60} className="ad-container-small" />
          <AdContainer width={400} height={600} className="ad-container" />
        </aside>
      </div>
    </div>
  );
};

/**
 * Top-level component. Provides the FTUE context so that MainInner can
 * consume it (e.g. to defer the release-notes modal until FTUE finishes).
 */
const Main: React.FC = () => {
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleFTUEReset = React.useCallback(() => {
    setResetTrigger((t) => t + 1);
  }, []);

  return (
    <FTUEProvider onReset={handleFTUEReset}>
      <MainInner resetTrigger={resetTrigger} />
    </FTUEProvider>
  );
};

const mountMain = () => {
  const container = document.getElementById('root');
  if (!container) {
    console.error('Main root element not found');
    return;
  }

  const root = createRoot(container);
  root.render(<Main />);
};

const bootstrap = async () => {
  mountMain();
};

bootstrap().catch((error) => {
  console.error('Failed to bootstrap main window', error);
});
