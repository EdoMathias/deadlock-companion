import type {
  HeroStatsFilters,
  HeroComparisonSortKey,
} from '../types/heroStats';
import type { ItemStatsFilters } from '../types/items';
import { createLogger } from '../services/Logger';

const logger = createLogger('StatsFilterPrefs');

const STORAGE_KEY = 'dl_stats_filters';

export type HeroStatsViewMode = 'standard' | 'comparison';

export interface ComparisonSort {
  key: HeroComparisonSortKey;
  direction: 'asc' | 'desc';
}

export interface MatchHistoryFilters {
  /** `StatsMode`-style key for the Match History mode dropdown, or null for All. */
  mode: string | null;
  hero_id: number | string | null;
}

interface StatsFilterPrefs {
  hero_stats: HeroStatsFilters;
  hero_stats_view_mode: HeroStatsViewMode;
  hero_stats_comparison_sort: ComparisonSort;
  item_stats: ItemStatsFilters;
  match_history: MatchHistoryFilters;
}

/**
 * `game_mode: 'normal'` with no `match_mode` is the API's own default
 * (`match_mode=ranked,unranked`), i.e. the "Normal + Ranked" dropdown entry.
 */
export const DEFAULT_HERO_STATS_FILTERS: HeroStatsFilters = {
  game_mode: 'normal',
  sort_by: 'win_rate',
  sort_direction: 'desc',
};

export const DEFAULT_ITEM_STATS_FILTERS: ItemStatsFilters = {
  sort_by: 'win_rate',
  sort_direction: 'desc',
  min_matches: 20,
  game_mode: 'normal',
};

export const DEFAULT_COMPARISON_SORT: ComparisonSort = {
  key: 'win_rate_delta',
  direction: 'desc',
};

export const DEFAULT_MATCH_HISTORY_FILTERS: MatchHistoryFilters = {
  mode: null,
  hero_id: null,
};

function defaults(): StatsFilterPrefs {
  return {
    hero_stats: { ...DEFAULT_HERO_STATS_FILTERS },
    hero_stats_view_mode: 'standard',
    hero_stats_comparison_sort: { ...DEFAULT_COMPARISON_SORT },
    item_stats: { ...DEFAULT_ITEM_STATS_FILTERS },
    match_history: { ...DEFAULT_MATCH_HISTORY_FILTERS },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads the persisted prefs, merging each slice over the current defaults so
 * an object written by an older release can't produce a broken filter set.
 */
function load(): StatsFilterPrefs {
  const base = defaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<StatsFilterPrefs>;
    if (!isObject(parsed)) return base;

    return {
      hero_stats: isObject(parsed.hero_stats)
        ? { ...base.hero_stats, ...parsed.hero_stats }
        : base.hero_stats,
      hero_stats_view_mode:
        parsed.hero_stats_view_mode === 'comparison' ? 'comparison' : 'standard',
      hero_stats_comparison_sort: isObject(parsed.hero_stats_comparison_sort)
        ? { ...base.hero_stats_comparison_sort, ...parsed.hero_stats_comparison_sort }
        : base.hero_stats_comparison_sort,
      item_stats: isObject(parsed.item_stats)
        ? { ...base.item_stats, ...parsed.item_stats }
        : base.item_stats,
      match_history: isObject(parsed.match_history)
        ? { ...base.match_history, ...parsed.match_history }
        : base.match_history,
    };
  } catch {
    return base;
  }
}

function save(prefs: StatsFilterPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    logger.error('Failed to save stats filter prefs:', err);
  }
}

function patch(slice: Partial<StatsFilterPrefs>): void {
  save({ ...load(), ...slice });
}

export function getHeroStatsFilters(): HeroStatsFilters {
  return load().hero_stats;
}

export function setHeroStatsFilters(filters: HeroStatsFilters): void {
  patch({ hero_stats: filters });
}

export function getHeroStatsViewMode(): HeroStatsViewMode {
  return load().hero_stats_view_mode;
}

export function setHeroStatsViewMode(mode: HeroStatsViewMode): void {
  patch({ hero_stats_view_mode: mode });
}

export function getHeroStatsComparisonSort(): ComparisonSort {
  return load().hero_stats_comparison_sort;
}

export function setHeroStatsComparisonSort(sort: ComparisonSort): void {
  patch({ hero_stats_comparison_sort: sort });
}

export function getItemStatsFilters(): ItemStatsFilters {
  return load().item_stats;
}

export function setItemStatsFilters(filters: ItemStatsFilters): void {
  patch({ item_stats: filters });
}

export function getMatchHistoryFilters(): MatchHistoryFilters {
  return load().match_history;
}

export function setMatchHistoryFilters(filters: MatchHistoryFilters): void {
  patch({ match_history: filters });
}
