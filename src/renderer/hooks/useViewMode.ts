// This hook is no longer used but kept for potential future use
import { useState } from 'react';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('useViewMode');

export const useViewMode = () => {
  const VIEW_MODE_STORAGE_KEY = 'deadlock_companion_view_mode';
  const VIEW_MODE_TABS: { mode: string; label: string; icon: string }[] = [];

  const [viewMode, setViewMode] = useState<string | undefined>(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (stored && VIEW_MODE_TABS.some((tab) => tab.mode === stored)) {
        return stored;
      }
    } catch (error) {
      logger.error('Error loading view mode:', error);
    }
    return undefined;
  });

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch (error) {
      logger.error('Error saving view mode:', error);
    }
  };
  return { viewMode, handleViewModeChange, VIEW_MODE_TABS };
};

export default useViewMode;
