import axios from 'axios';
import {
  AnalyticsApi,
  type AnalyticsHeroStats,
  type AnalyticsApiHeroStatsRequest,
} from 'deadlock_api_client';
import { createDeadlockApiConfig } from './deadlockApiClient';
import { DEADLOCK_API_BASE_URL } from '../../consts';
import { apiCache, CACHE_TTL } from '../../utils/apiCache';
import { createLogger } from '../Logger';
import type {
  HeroStatsFilters,
  HeroBanRow,
  HeroMatchMode,
} from '../../types/heroStats';

const logger = createLogger('heroesApiService');

/**
 * Street Brawl does not support rank-based filtering in the analytics
 * endpoints; sending `min/max_average_badge` with `game_mode=street_brawl`
 * returns a 400. Strip them here as a safety net so the caller can keep
 * stale values in state without blowing up the request.
 */
function supportsRankFilter(
  gameMode: HeroStatsFilters['game_mode'],
): boolean {
  return gameMode !== 'street_brawl';
}

function filtersToHash(filters: HeroStatsFilters): string {
  const rankOk = supportsRankFilter(filters.game_mode);
  return JSON.stringify({
    game_mode: filters.game_mode ?? null,
    match_mode: filters.match_mode ?? null,
    min_average_badge: rankOk ? filters.min_average_badge ?? null : null,
    max_average_badge: rankOk ? filters.max_average_badge ?? null : null,
    min_unix_timestamp: filters.min_unix_timestamp ?? null,
    max_unix_timestamp: filters.max_unix_timestamp ?? null,
    min_hero_matches: filters.min_hero_matches ?? null,
    min_hero_matches_total: filters.min_hero_matches_total ?? null,
  });
}

function filtersToApiRequest(
  filters: HeroStatsFilters,
): AnalyticsApiHeroStatsRequest {
  const rankOk = supportsRankFilter(filters.game_mode);
  return {
    gameMode: (filters.game_mode as any) ?? undefined,
    minAverageBadge: rankOk ? filters.min_average_badge ?? null : null,
    maxAverageBadge: rankOk ? filters.max_average_badge ?? null : null,
    minUnixTimestamp: filters.min_unix_timestamp ?? null,
    maxUnixTimestamp: filters.max_unix_timestamp ?? null,
    minHeroMatches: filters.min_hero_matches ?? null,
    minHeroMatchesTotal: filters.min_hero_matches_total ?? null,
  };
}

/**
 * Hero performance stats (`/v1/analytics/hero-stats`). Each row is a
 * `hero_id` with wins/losses/matches totals across the filter set.
 */
export async function fetchHeroStats(
  filters: HeroStatsFilters = {},
): Promise<AnalyticsHeroStats[]> {
  const hash = filtersToHash(filters);
  const cached = apiCache.get<AnalyticsHeroStats[]>('hero_stats', hash);
  if (cached) return cached;

  const api = new AnalyticsApi(createDeadlockApiConfig());
  const request = filtersToApiRequest(filters);
  const response = await api.heroStats(request);
  const data = response.data;

  apiCache.set('hero_stats', hash, data, CACHE_TTL.HERO_ANALYTICS);
  return data;
}

/**
 * Hero performance stats for a single matchmaking queue (`ranked` or
 * `unranked`). The live `/v1/analytics/hero-stats` endpoint accepts a
 * `match_mode` param, but the vendored OpenAPI client predates it, so —
 * like `fetchHeroBanStats` — we call the endpoint directly through axios.
 * Ranked/unranked only exist for the standard game, so callers should pass
 * `game_mode: 'normal'` (rank/badge filters are honoured normally).
 */
export async function fetchHeroStatsByMatchMode(
  filters: HeroStatsFilters,
  matchMode: HeroMatchMode,
): Promise<AnalyticsHeroStats[]> {
  const hash = filtersToHash({ ...filters, match_mode: matchMode });
  const cached = apiCache.get<AnalyticsHeroStats[]>('hero_stats', hash);
  if (cached) return cached;

  const rankOk = supportsRankFilter(filters.game_mode);
  const params: Record<string, string | number> = { match_mode: matchMode };
  if (filters.game_mode) params.game_mode = filters.game_mode;
  if (rankOk && filters.min_average_badge != null)
    params.min_average_badge = filters.min_average_badge;
  if (rankOk && filters.max_average_badge != null)
    params.max_average_badge = filters.max_average_badge;
  if (filters.min_unix_timestamp != null)
    params.min_unix_timestamp = filters.min_unix_timestamp;
  if (filters.max_unix_timestamp != null)
    params.max_unix_timestamp = filters.max_unix_timestamp;
  if (filters.min_hero_matches != null)
    params.min_hero_matches = filters.min_hero_matches;
  if (filters.min_hero_matches_total != null)
    params.min_hero_matches_total = filters.min_hero_matches_total;

  try {
    const response = await axios.get<AnalyticsHeroStats[]>(
      `${DEADLOCK_API_BASE_URL}/v1/analytics/hero-stats`,
      { params },
    );
    const data = Array.isArray(response.data) ? response.data : [];

    apiCache.set('hero_stats', hash, data, CACHE_TTL.HERO_ANALYTICS);
    return data;
  } catch (err) {
    logger.warn(
      `Failed to fetch hero-stats for match_mode=${matchMode}`,
      err,
    );
    return [];
  }
}

/**
 * Hero ban stats (`/v1/analytics/hero-ban-stats`).
 *
 * Not present in the vendored OpenAPI client, so we call it directly
 * through axios using the shared base URL.
 */
export async function fetchHeroBanStats(
  filters: HeroStatsFilters = {},
): Promise<HeroBanRow[]> {
  const hash = filtersToHash(filters);
  const cached = apiCache.get<HeroBanRow[]>('hero_ban_stats', hash);
  if (cached) return cached;

  const rankOk = supportsRankFilter(filters.game_mode);
  const params: Record<string, string | number> = {};
  if (filters.game_mode) params.game_mode = filters.game_mode;
  if (rankOk && filters.min_average_badge != null)
    params.min_average_badge = filters.min_average_badge;
  if (rankOk && filters.max_average_badge != null)
    params.max_average_badge = filters.max_average_badge;
  if (filters.min_unix_timestamp != null)
    params.min_unix_timestamp = filters.min_unix_timestamp;
  if (filters.max_unix_timestamp != null)
    params.max_unix_timestamp = filters.max_unix_timestamp;

  try {
    const response = await axios.get<HeroBanRow[]>(
      `${DEADLOCK_API_BASE_URL}/v1/analytics/hero-ban-stats`,
      { params },
    );
    const data = Array.isArray(response.data) ? response.data : [];

    apiCache.set('hero_ban_stats', hash, data, CACHE_TTL.HERO_ANALYTICS);
    return data;
  } catch (err) {
    logger.warn(
      'Failed to fetch hero-ban-stats, continuing without ban data',
      err,
    );
    return [];
  }
}
