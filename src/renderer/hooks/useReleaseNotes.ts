import { useEffect, useState, useCallback } from 'react';
import { releaseNotesService, ReleaseNoteEntry } from '../services/ReleaseNotesService';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('useReleaseNotes');

interface UseReleaseNotesResult {
  /** The release note entry for the current app version, or null if unavailable / already viewed. */
  releaseNote: ReleaseNoteEntry | null;
  /** Whether the release notes modal should be shown. */
  isOpen: boolean;
  /** Call to open the modal manually (e.g. from a "What's new" button). */
  open: () => void;
  /** Call when the user dismisses the modal – persists the "viewed" state. */
  dismiss: () => void;
}

/**
 * Fetches the release note for the given app version and manages viewed/dismissed state.
 * Automatically opens the modal when there is an unviewed release note **and**
 * `shouldAutoOpen` is `true`.  When `shouldAutoOpen` is `false` (e.g. FTUE is
 * still in progress), the modal open is deferred until `shouldAutoOpen` becomes
 * `true`.
 */
export const useReleaseNotes = (
  appVersion: string | null,
  shouldAutoOpen: boolean = true,
): UseReleaseNotesResult => {
  const [releaseNote, setReleaseNote] = useState<ReleaseNoteEntry | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  /** True when we fetched an unviewed note but auto-open was deferred. */
  const [pendingAutoOpen, setPendingAutoOpen] = useState(false);

  // Fetch release note for the current version
  useEffect(() => {
    if (!appVersion) return;

    let cancelled = false;

    const load = async () => {
      try {
        const entry = await releaseNotesService.getReleaseNoteForVersion(appVersion);

        if (cancelled) return;

        setReleaseNote(entry);

        if (entry && !releaseNotesService.hasViewedReleaseNote(entry)) {
          if (shouldAutoOpen) {
            setIsOpen(true);
          } else {
            setPendingAutoOpen(true);
          }
        }
      } catch (error) {
        logger.error('Failed to load release notes', error);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // shouldAutoOpen is intentionally excluded — transitions are handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appVersion]);

  // When shouldAutoOpen becomes true and we have a pending unviewed note, open it
  useEffect(() => {
    if (shouldAutoOpen && pendingAutoOpen) {
      setIsOpen(true);
      setPendingAutoOpen(false);
    }
  }, [shouldAutoOpen, pendingAutoOpen]);

  const open = useCallback(() => {
    if (releaseNote) {
      setIsOpen(true);
    }
  }, [releaseNote]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    if (releaseNote) {
      releaseNotesService.markReleaseNotesViewed(releaseNote);
    }
  }, [releaseNote]);

  return { releaseNote, isOpen, open, dismiss };
};
