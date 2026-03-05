import { useCallback, useEffect, useState } from 'react';
import { ROTATION_WINDOW_SETTINGS_KEY } from '../consts/rotations.consts';

/**
 * Reads and writes the "show squad index" setting from the same localStorage key
 * used by the in-game rotation window. Stays in sync when the in-game window
 * changes the setting (storage event) and vice versa.
 */
export function useShowSquadIndexSetting(): [boolean, (value: boolean) => void] {
    const [showSquadIndex, setShowSquadIndexState] = useState<boolean>(() => {
        try {
            const raw = localStorage.getItem(ROTATION_WINDOW_SETTINGS_KEY);
            if (!raw) return false;
            const parsed = JSON.parse(raw) as { showSquadIndex?: boolean };
            return typeof parsed.showSquadIndex === 'boolean' ? parsed.showSquadIndex : false;
        } catch {
            return false;
        }
    });

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key !== ROTATION_WINDOW_SETTINGS_KEY) return;
            try {
                const raw = e.newValue;
                if (raw == null) {
                    setShowSquadIndexState(false);
                    return;
                }
                const parsed = JSON.parse(raw) as { showSquadIndex?: boolean };
                setShowSquadIndexState(typeof parsed.showSquadIndex === 'boolean' ? parsed.showSquadIndex : false);
            } catch {
                setShowSquadIndexState(false);
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const setShowSquadIndex = useCallback((value: boolean) => {
        setShowSquadIndexState(value);
        try {
            const raw = localStorage.getItem(ROTATION_WINDOW_SETTINGS_KEY);
            const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
            localStorage.setItem(ROTATION_WINDOW_SETTINGS_KEY, JSON.stringify({ ...current, showSquadIndex: value }));
        } catch (e) {
            console.error('Failed to save showSquadIndex setting', e);
        }
    }, []);

    return [showSquadIndex, setShowSquadIndex];
}
