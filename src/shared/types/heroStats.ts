export type HeroStatsGameMode = 'normal' | 'street_brawl';

export interface HeroStatsFilters {
  game_mode?: HeroStatsGameMode | string;
  min_average_badge?: number;
  max_average_badge?: number;
  min_unix_timestamp?: number;
  max_unix_timestamp?: number;
  /**
   * Only aggregate rows from players who have played this hero at least
   * N times WITHIN the currently-filtered time/rank/mode range. Matches
   * the Deadlock API `min_hero_matches` query parameter.
   */
  min_hero_matches?: number;
  /**
   * Only aggregate rows from players who have played this hero at least
   * N times in their ENTIRE history (across all time/ranks/modes).
   * Matches the Deadlock API `min_hero_matches_total` query parameter.
   */
  min_hero_matches_total?: number;
  sort_by?: HeroStatsSortKey;
  sort_direction?: 'asc' | 'desc';
}

export type HeroStatsSortKey =
  | 'name'
  | 'win_rate'
  | 'pick_rate'
  | 'ban_rate'
  | 'matches';

/** Raw hero performance row from `/v1/analytics/hero-stats`. */
export interface HeroAnalyticsRow {
  hero_id: number;
  wins: number;
  losses: number;
  matches: number;
}

/**
 * Raw hero ban row from `/v1/analytics/hero-ban-stats`. The endpoint
 * returns one row per hero per bucket with only `hero_id`, `bucket`,
 * and `bans` — no total-match denominator, so ban rate is derived
 * from `sum(bans) / BANS_PER_MATCH` (deadlock has 2 bans per match).
 */
export interface HeroBanRow {
  hero_id: number;
  bucket?: number;
  bans: number;
}

/** Number of bans per match in Deadlock (mirrors deadlock-api website). */
export const BANS_PER_MATCH = 2;

/**
 * Pick-rate multiplier = 2 teams × team size. A single match contributes
 * `multiplier` hero picks to the analytics endpoint's per-hero `matches`
 * total, so `matches / sumMatches` needs to be multiplied by this to
 * express "what fraction of matches contained this hero".
 */
export function getPickrateMultiplier(
  gameMode: HeroStatsGameMode | string | undefined,
): number {
  return gameMode === 'street_brawl' ? 8 : 12;
}

export interface HeroStatsComputed {
  hero_id: number;
  matches: number;
  wins: number;
  losses: number;
  bans: number;
  win_rate: number;
  pick_rate: number;
  ban_rate: number;
}
