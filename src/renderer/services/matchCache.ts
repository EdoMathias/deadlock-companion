/**
 * Persistent IndexedDB-backed cache for match data.
 *
 * Two isolated databases are used to avoid `onupgradeneeded` race conditions
 * when multiple stores would otherwise share the same DB name and version:
 *
 *  - dl-match-history  : player match history lists, keyed by accountId
 *                        TTL: 30 minutes (new matches may appear)
 *  - dl-match-metadata : full match metadata, keyed by matchId
 *                        No TTL — historical matches are immutable
 *
 * Both stores fall back to returning null on any storage error, so callers
 * always trigger a fresh API fetch in the worst case.
 */

import { PlayerMatchHistoryEntry } from 'deadlock_api_client';
import { createSimpleStore } from '../../shared/utils/indexedDBStorage';

const MATCH_HISTORY_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface HistoryCacheEntry {
  data: PlayerMatchHistoryEntry[];
  expiry: number;
}

const historyStore = createSimpleStore<HistoryCacheEntry>(
  'dl-match-history',
  'history',
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const metadataStore = createSimpleStore<any>('dl-match-metadata', 'metadata');

export const matchCache = {
  async getHistory(
    accountId: number,
  ): Promise<PlayerMatchHistoryEntry[] | null> {
    try {
      const entry = await historyStore.get(String(accountId));
      if (!entry) return null;
      if (Date.now() > entry.expiry) {
        await historyStore.delete(String(accountId));
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },

  async setHistory(
    accountId: number,
    data: PlayerMatchHistoryEntry[],
  ): Promise<void> {
    try {
      await historyStore.set(String(accountId), {
        data,
        expiry: Date.now() + MATCH_HISTORY_TTL_MS,
      });
    } catch {
      // Best-effort — a cache miss on next load is acceptable
    }
  },

  async getMetadata<T>(matchId: number): Promise<T | null> {
    try {
      const result = await metadataStore.get(String(matchId));
      return (result as T) ?? null;
    } catch {
      return null;
    }
  },

  async setMetadata<T extends object>(matchId: number, data: T): Promise<void> {
    try {
      await metadataStore.set(String(matchId), data);
    } catch {
      // Best-effort
    }
  },
};
