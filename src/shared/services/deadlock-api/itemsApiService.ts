import {
  AnalyticsApi,
  PatchesApi,
  type AnalyticsApiItemStatsRequest,
  type ItemStats,
  type Patch,
} from 'deadlock_api_client';
import axios from 'axios';
import { createDeadlockApiConfig } from './deadlockApiClient';
import { apiCache, CACHE_TTL } from '../../utils/apiCache';
import { DEADLOCK_API_BASE_URL } from '../../consts';
import type { ItemStatsFilters } from '../../types/items';

function filtersToHash(filters: ItemStatsFilters): string {
  return JSON.stringify(filters);
}

function filtersToApiRequest(
  filters: ItemStatsFilters,
): AnalyticsApiItemStatsRequest {
  return {
    heroId: filters.hero_id ?? null,
    gameMode: (filters.game_mode as any) ?? undefined,
    minAverageBadge: filters.min_average_badge ?? null,
    maxAverageBadge: filters.max_average_badge ?? null,
    minUnixTimestamp: filters.min_unix_timestamp ?? null,
    maxUnixTimestamp: filters.max_unix_timestamp ?? null,
    minMatches: filters.min_matches ?? 20,
  };
}

export async function fetchItemStats(
  filters: ItemStatsFilters = {},
): Promise<ItemStats[]> {
  const hash = filtersToHash(filters);
  const cached = apiCache.get<ItemStats[]>('item_stats', hash);
  if (cached) return cached;

  const api = new AnalyticsApi(createDeadlockApiConfig());
  const request = filtersToApiRequest(filters);
  const response = await api.itemStats(request);
  const data = response.data;

  apiCache.set('item_stats', hash, data, CACHE_TTL.ITEM_ANALYTICS);
  return data;
}

/**
 * Fetches item stats filtered by the player's hero vs specific enemy heroes.
 * Uses a direct axios call because the generated client lacks `enemy_hero_ids`.
 */
export async function fetchCounterItemStats(
  heroId: number,
  enemyHeroIds: number[],
  minAverageBadge?: number,
): Promise<ItemStats[]> {
  const sortedEnemies = [...enemyHeroIds].sort((a, b) => a - b);
  const cacheKey = `${heroId}_vs_${sortedEnemies.join(',')}`;
  const cached = apiCache.get<ItemStats[]>('counter_item_stats', cacheKey);
  if (cached) return cached;

  const response = await axios.get<ItemStats[]>(
    `${DEADLOCK_API_BASE_URL}/v1/analytics/item-stats`,
    {
      params: {
        hero_ids: heroId,
        enemy_hero_ids: sortedEnemies.join(','),
        min_average_badge: minAverageBadge ?? 100,
        min_matches: 20,
      },
    },
  );

  apiCache.set('counter_item_stats', cacheKey, response.data, CACHE_TTL.ITEM_ANALYTICS);
  return response.data;
}

export async function fetchPatches(): Promise<Patch[]> {
  const cached = apiCache.get<Patch[]>('patches', 'list');
  if (cached) return cached;

  const api = new PatchesApi(createDeadlockApiConfig());
  const response = await api.feed();
  const data = response.data;

  apiCache.set('patches', 'list', data, CACHE_TTL.PATCHES);
  return data;
}

/**
 * Returns the curated list of "big" / milestone patch days as raw date
 * strings (typically ISO `YYYY-MM-DDTHH:mm:ssZ`). Used to flag major
 * patches inside the patch dropdown.
 */
export async function fetchBigPatchDays(): Promise<string[]> {
  const cached = apiCache.get<string[]>('patches', 'big_days');
  if (cached) return cached;

  const api = new PatchesApi(createDeadlockApiConfig());
  const response = await api.bigPatchDays();
  const data = response.data as unknown as string[];

  apiCache.set('patches', 'big_days', data, CACHE_TTL.PATCHES);
  return data;
}
