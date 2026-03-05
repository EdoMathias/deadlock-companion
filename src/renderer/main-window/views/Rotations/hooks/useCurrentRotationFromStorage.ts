import { useEffect, useState } from 'react';
import { Rotation } from '../types/rotations.types';
import { STORAGE_CURRENT_ROTATION } from '../consts/rotations.consts';

/**
 * Reads the current rotation from localStorage and stays in sync when another window
 * (e.g. the desktop companion) updates it. Use this in the in-game window so the
 * overlay shows the latest rotation as the user edits it in the desktop window.
 *
 * The browser/Overwolf `storage` event fires in other windows when localStorage
 * is updated, so no IPC is needed for real-time updates.
 */
export function useCurrentRotationFromStorage(): Rotation | null {
    const [rotation, setRotation] = useState<Rotation | null>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_CURRENT_ROTATION);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' && Array.isArray(parsed.steps)
                ? (parsed as Rotation)
                : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key !== STORAGE_CURRENT_ROTATION) return;
            try {
                const raw = e.newValue;
                if (raw == null) {
                    setRotation(null);
                    return;
                }
                const parsed = JSON.parse(raw);
                setRotation(
                    parsed && typeof parsed === 'object' && Array.isArray(parsed.steps)
                        ? (parsed as Rotation)
                        : null
                );
            } catch {
                setRotation(null);
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return rotation;
}
