import type { HeroMatchMode } from '../types/heroStats';

/**
 * The mode dropdown shared by Hero Stats and Item Stats.
 *
 * `game_mode` (normal / street_brawl) and `match_mode` (ranked / unranked) are
 * orthogonal dimensions in the deadlock-api, so a single user-facing "mode"
 * maps to a pair of query params:
 *
 * | Option         | game_mode    | match_mode |
 * | -------------- | ------------ | ---------- |
 * | Normal + Ranked| normal       | -          |
 * | Normal         | normal       | unranked   |
 * | Ranked         | normal       | ranked     |
 * | Street Brawl   | street_brawl | -          |
 *
 * Note the API defaults are `game_mode=normal` and `match_mode=ranked,unranked`,
 * so "Normal + Ranked" is what the app has always shown. Street Brawl can't be
 * combined with Normal — `?game_mode=normal,street_brawl` returns a 400.
 */
export type StatsMode = 'normal_ranked' | 'normal' | 'ranked' | 'street_brawl';

export interface StatsModeFilters {
  game_mode?: string;
  match_mode?: HeroMatchMode;
}

export const STATS_MODE_OPTIONS: { value: StatsMode; label: string }[] = [
  { value: 'normal_ranked', label: 'Normal + Ranked' },
  { value: 'normal', label: 'Normal' },
  { value: 'ranked', label: 'Ranked' },
  { value: 'street_brawl', label: 'Street Brawl' },
];

export const DEFAULT_STATS_MODE: StatsMode = 'normal_ranked';

/** Query-param pair for a dropdown selection. */
export function statsModeToFilters(mode: StatsMode): StatsModeFilters {
  switch (mode) {
    case 'normal':
      return { game_mode: 'normal', match_mode: 'unranked' };
    case 'ranked':
      return { game_mode: 'normal', match_mode: 'ranked' };
    case 'street_brawl':
      return { game_mode: 'street_brawl', match_mode: undefined };
    case 'normal_ranked':
    default:
      return { game_mode: 'normal', match_mode: undefined };
  }
}

/**
 * Inverse of `statsModeToFilters`, so the dropdown stays a pure projection of
 * the filter object (which is what gets persisted) rather than a second source
 * of truth.
 */
export function filtersToStatsMode(filters: StatsModeFilters): StatsMode {
  if (filters.game_mode === 'street_brawl') return 'street_brawl';
  if (filters.match_mode === 'ranked') return 'ranked';
  if (filters.match_mode === 'unranked') return 'normal';
  return 'normal_ranked';
}
