import { useEffect, useState } from 'react';
import { Character } from '../types/rotations.types';
import { STORAGE_CURRENT_SQUAD } from '../consts/rotations.consts';

/**
 * Reads the current squad from localStorage and stays in sync when another window
 * (e.g. the desktop companion) updates it.
 */
export function useSquadFromStorage(): Character[] {
    const [squad, setSquad] = useState<Character[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_CURRENT_SQUAD);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? (parsed as Character[]) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key !== STORAGE_CURRENT_SQUAD) return;
            try {
                const raw = e.newValue;
                if (raw == null) {
                    setSquad([]);
                    return;
                }
                const parsed = JSON.parse(raw);
                setSquad(Array.isArray(parsed) ? (parsed as Character[]) : []);
            } catch {
                setSquad([]);
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return squad;
}
