/**
 * Lightweight localStorage-based TTL cache for small, frequently-read
 * deadlock-api.com responses (e.g. Steam profiles, account stats).
 *
 * Large or immutable match data (match history lists, full match metadata)
 * is stored in IndexedDB via matchCache instead — see
 * src/renderer/services/matchCache.ts.
 *
 * Usage:
 *   const cached = apiCache.get<SteamProfile>('steam_profile', accountId);
 *   if (!cached) {
 *     const data = await fetchFromApi();
 *     apiCache.set('steam_profile', accountId, data, apiCache.TTL.STEAM_PROFILE);
 *   }
 */

const CACHE_PREFIX = 'deadlock_cache_';

interface CacheEntry<T> {
  data: T;
  expiry: number; // Unix timestamp ms
}

/** TTL values in milliseconds for each data type. */
export const CACHE_TTL = {
  /** Steam profile (name/avatar) — rarely changes, cache for 24 h. */
  STEAM_PROFILE: 24 * 60 * 60 * 1000,
  /** Account/hero stats — 30 min. */
  ACCOUNT_STATS: 30 * 60 * 1000,
} as const;

function buildKey(namespace: string, id: string | number): string {
  return `${CACHE_PREFIX}${namespace}_${id}`;
}

/**
 * Returns cached data if it exists and has not expired, otherwise null.
 */
function get<T>(namespace: string, id: string | number): T | null {
  try {
    const raw = localStorage.getItem(buildKey(namespace, id));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiry) {
      // Stale — evict proactively
      localStorage.removeItem(buildKey(namespace, id));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Stores data under a namespaced key with the given TTL.
 */
function set<T>(
  namespace: string,
  id: string | number,
  data: T,
  ttl: number,
): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      expiry: Date.now() + ttl,
    };
    localStorage.setItem(buildKey(namespace, id), JSON.stringify(entry));
  } catch {
    // Silently ignore quota errors — cache is best-effort
  }
}

/**
 * Removes a single cached entry, forcing the next read to re-fetch.
 */
function invalidate(namespace: string, id: string | number): void {
  try {
    localStorage.removeItem(buildKey(namespace, id));
  } catch {
    // Ignore
  }
}

/**
 * Clears all deadlock API cache entries from localStorage.
 */
function invalidateAll(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(CACHE_PREFIX),
    );
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore
  }
}

export const apiCache = {
  get,
  set,
  invalidate,
  invalidateAll,
  TTL: CACHE_TTL,
};
