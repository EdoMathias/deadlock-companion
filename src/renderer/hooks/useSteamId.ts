import { useState, useCallback, useEffect } from 'react';
import { createLogger } from '../../shared/services/Logger';
import { isValidSteamId64 } from '../../shared/utils/steamUtils';

const logger = createLogger('useSteamId');

export const STEAM_ID_STORAGE_KEY = 'deadlock_companion_steam_id';

export interface UseSteamIdReturn {
  steamId: string | null;
  setSteamId: (id: string) => void;
  clearSteamId: () => void;
}

/**
 * Hook that manages the player's Steam ID64.
 *
 * - Persists to localStorage.
 * - Validates the 17-digit SteamID64 format before saving.
 */
export const useSteamId = (): UseSteamIdReturn => {
  const [steamId, _setSteamId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STEAM_ID_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  // Stay in sync when another window (e.g. the background) updates localStorage
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== STEAM_ID_STORAGE_KEY) return;
      const newValue = e.newValue?.trim() ?? null;
      if (newValue && !isValidSteamId64(newValue)) return;
      _setSteamId(newValue);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setSteamId = useCallback((id: string) => {
    const trimmed = id.trim();
    if (trimmed === '') {
      clearSteamId();
      return;
    }
    if (!isValidSteamId64(trimmed)) {
      logger.error('Invalid Steam ID64 format:', trimmed);
      return;
    }
    try {
      localStorage.setItem(STEAM_ID_STORAGE_KEY, trimmed);
    } catch {
      logger.error('Failed to persist Steam ID');
    }
    _setSteamId(trimmed);
  }, []);

  const clearSteamId = useCallback(() => {
    try {
      localStorage.removeItem(STEAM_ID_STORAGE_KEY);
    } catch {
      // Ignore
    }
    _setSteamId(null);
  }, []);

  return { steamId, setSteamId, clearSteamId };
};
