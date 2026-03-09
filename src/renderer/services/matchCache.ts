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
import type { GameEventMatchEntry } from '../../shared/types/matchHistoryEvent';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('matchCache');

const MATCH_HISTORY_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface HistoryCacheEntry {
  data: PlayerMatchHistoryEntry[];
  expiry: number;
}

/** Serialisable subset of SteamProfile stored per-player within a match. */
export interface CachedSteamProfile {
  account_id: number;
  personaname?: string;
  avatarmedium?: string;
}

const historyStore = createSimpleStore<HistoryCacheEntry>(
  'dl-match-history',
  'history',
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const metadataStore = createSimpleStore<any>('dl-match-metadata', 'metadata');

const steamProfileStore = createSimpleStore<CachedSteamProfile[]>(
  'dl-steam-profiles',
  'profiles',
);

/**
 * Stores match entries discovered via Overwolf game events (match_history).
 * Keyed by match_id string. No TTL — these are the user's own matches.
 */
const gameEventMatchStore = createSimpleStore<GameEventMatchEntry>(
  'dl-game-event-matches',
  'matches',
);

/**
 * Stores the last full roster snapshot at match_end.
 * Keyed by matchId string. Persists across sessions so the Summary tab
 * always has data for matches the user played.
 */
import type { LiveRosterEntry } from '../../shared/types/liveMatch';
const rosterSnapshotStore = createSimpleStore<LiveRosterEntry[]>(
  'dl-roster-snapshots',
  'snapshots',
);

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

  async getSteamProfiles(
    matchId: number,
  ): Promise<CachedSteamProfile[] | null> {
    try {
      return (await steamProfileStore.get(String(matchId))) ?? null;
    } catch {
      return null;
    }
  },

  async setSteamProfiles(
    matchId: number,
    profiles: CachedSteamProfile[],
  ): Promise<void> {
    try {
      await steamProfileStore.set(String(matchId), profiles);
    } catch {
      // Best-effort
    }
  },

  // ---- Roster snapshots (full 12-player state at match_end) ----

  async getRosterSnapshot(
    matchId: number | string,
  ): Promise<LiveRosterEntry[] | null> {
    try {
      return (await rosterSnapshotStore.get(String(matchId))) ?? null;
    } catch {
      return null;
    }
  },

  async setRosterSnapshot(
    matchId: number | string,
    roster: LiveRosterEntry[],
  ): Promise<void> {
    try {
      await rosterSnapshotStore.set(String(matchId), roster);
    } catch {
      // Best-effort
    }
  },

  // ---- Game-event match entries (from Overwolf GEP match_history) ----

  async getGameEventMatches(): Promise<GameEventMatchEntry[]> {
    try {
      const results = await gameEventMatchStore.getAll();
      logger.warn(`getGameEventMatches: returning ${results.length} entries`);
      return results;
    } catch (err) {
      logger.error('getGameEventMatches: IndexedDB read failed:', err);
      return [];
    }
  },

  async mergeGameEventMatches(entries: GameEventMatchEntry[]): Promise<void> {
    try {
      logger.log(
        `mergeGameEventMatches: writing ${entries.length} entries to IndexedDB`,
      );
      for (const entry of entries) {
        logger.warn(
          `  storing match ${entry.match_id} (hero: ${entry.hero_name}, KDA: ${entry.kills}/${entry.deaths}/${entry.assists})`,
        );
        await gameEventMatchStore.set(String(entry.match_id), entry);
      }
      logger.log('mergeGameEventMatches: all entries written successfully');
    } catch (err) {
      logger.error('mergeGameEventMatches: failed to write:', err);
    }
  },
};
