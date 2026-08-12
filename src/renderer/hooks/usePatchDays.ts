import { useEffect, useState } from 'react';
import type { Patch } from 'deadlock_api_client';
import {
  fetchBigPatchDays,
  fetchPatches,
} from '../../shared/services/deadlock-api/itemsApiService';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('usePatchDays');

export interface PatchDay {
  /** Raw date string from the API (typically RFC 822 / ISO `pub_date`). */
  iso: string;
  /** Date portion only, e.g. `"2026-04-10"`. */
  date: string;
  /** Unix timestamp (seconds) at the start of the patch day. */
  epochSec: number;
  /**
   * Human-readable label for the dropdown. Uses the patch's forum title
   * when available (e.g. `"04-10-2026 Update"`), otherwise falls back to
   * `"Update (YYYY-MM-DD)"`.
   */
  label: string;
  /**
   * `true` when this patch's date appears in the curated "big patch days"
   * feed — used to flag milestone updates in the UI.
   */
  isBig: boolean;
}

interface UsePatchDaysState {
  days: PatchDay[];
  loading: boolean;
  error: string | null;
}

/**
 * Patch boundaries the deadlock-api forum feed (`/v1/patches`) does not
 * carry — matchmaking-only updates that ship no forum changelog. The
 * deadlock-api website curates these into its own patch selector; we mirror
 * that here so users can filter stats to "since the Matchmaking Update".
 * A feed entry on the same day always wins (see `withSupplementalPatches`).
 */
const SUPPLEMENTAL_PATCHES: PatchDay[] = [
  {
    iso: '2026-07-30T00:00:00Z',
    date: '2026-07-30',
    epochSec: Math.floor(Date.parse('2026-07-30T00:00:00Z') / 1000),
    label: 'Matchmaking Update',
    isBig: true,
  },
];

/** Append supplemental patches whose date isn't already in the feed. */
function withSupplementalPatches(feedDays: PatchDay[]): PatchDay[] {
  const seen = new Set(feedDays.map((d) => d.date));
  const extras = SUPPLEMENTAL_PATCHES.filter((p) => !seen.has(p.date));
  return [...feedDays, ...extras];
}

function toIsoDateOnly(epochSec: number): string {
  const iso = new Date(epochSec * 1000).toISOString();
  return iso.slice(0, 10);
}

function bigDaysToDateSet(raw: unknown): Set<string> {
  if (!Array.isArray(raw)) return new Set();
  const out = new Set<string>();
  for (const entry of raw) {
    if (typeof entry !== 'string' || entry.length === 0) continue;
    const ms = Date.parse(entry);
    if (!Number.isFinite(ms)) continue;
    out.add(toIsoDateOnly(Math.floor(ms / 1000)));
  }
  return out;
}

function patchToPatchDay(patch: Patch, bigDates: Set<string>): PatchDay | null {
  const raw = patch.pub_date;
  if (!raw) return null;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) return null;
  const epochSec = Math.floor(ms / 1000);
  const date = toIsoDateOnly(epochSec);
  const title = patch.title?.trim();
  return {
    iso: raw,
    date,
    epochSec,
    label: title && title.length > 0 ? title : `Update (${date})`,
    isBig: bigDates.has(date),
  };
}

/**
 * Loads the list of patches from the Deadlock API forum changelog feed
 * (sorted newest first) and cross-references the curated "big patch days"
 * feed so each entry knows whether it's a milestone update.
 */
export function usePatchDays(): UsePatchDaysState {
  const [state, setState] = useState<UsePatchDaysState>({
    days: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [rawPatches, rawBigDays] = await Promise.all([
          fetchPatches(),
          fetchBigPatchDays().catch((err) => {
            // Big-days is non-critical — degrade gracefully if it fails.
            logger.warn('Failed to load big patch days', err);
            return [] as string[];
          }),
        ]);
        if (cancelled) return;
        const bigDates = bigDaysToDateSet(rawBigDays);
        const feedDays = (Array.isArray(rawPatches) ? rawPatches : [])
          .map((p) => patchToPatchDay(p, bigDates))
          .filter((d): d is PatchDay => d !== null);
        const days = withSupplementalPatches(feedDays).sort(
          (a, b) => b.epochSec - a.epochSec,
        );
        setState({ days, loading: false, error: null });
      } catch (err) {
        logger.error('Failed to load patches', err);
        if (cancelled) return;
        setState({
          days: [],
          loading: false,
          error: 'Failed to load patches',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export default usePatchDays;
