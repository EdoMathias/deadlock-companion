import {
  AnalyticsApi,
  PatchesApi,
  type AnalyticsApiItemStatsRequest,
  type ItemStats,
} from 'deadlock_api_client';
import { createDeadlockApiConfig } from './deadlockApiClient';
import { apiCache, CACHE_TTL } from '../../utils/apiCache';
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

export async function fetchPatches(): Promise<any[]> {
  const cached = apiCache.get<any[]>('patches', 'list');
  if (cached) return cached;

  const api = new PatchesApi(createDeadlockApiConfig());
  const response = await api.feed();
  const data = response.data;

  apiCache.set('patches', 'list', data, CACHE_TTL.PATCHES);
  return data;
}

export async function fetchBigPatchDays(): Promise<string[]> {
  const cached = apiCache.get<string[]>('patches', 'big_days');
  if (cached) return cached;

  const api = new PatchesApi(createDeadlockApiConfig());
  const response = await api.bigPatchDays();
  const data = response.data as unknown as string[];

  apiCache.set('patches', 'big_days', data, CACHE_TTL.PATCHES);
  return data;
}
