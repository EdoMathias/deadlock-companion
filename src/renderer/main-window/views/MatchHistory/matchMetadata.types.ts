/**
 * Local TypeScript types for the /v1/matches/{match_id}/metadata response.
 * The generated API client types this endpoint as returning `void`, so we cast
 * the response data to these interfaces locally.
 *
 * Based on the response shape from api.deadlock-api.com/v1/matches/{id}/metadata.
 */

/**
 * Per-interval cumulative stats snapshot. The last entry in the array
 * (at time_stamp_s ≈ match duration) holds full-match totals.
 */
export interface PlayerStatEntry {
  time_stamp_s: number;
  player_damage: number;
  player_healing: number;
  self_healing: number;
}

export interface MatchPlayer {
  account_id: number;
  hero_id: number;
  team: number; // 0 or 1
  kills: number;
  deaths: number;
  assists: number;
  net_worth: number;
  last_hits: number;
  level: number;
  player_slot: number;
  stats: PlayerStatEntry[];
}

export interface MatchInfo {
  match_id: number;
  duration_s: number;
  winning_team: number; // 0 or 1
  start_time: number; // Unix timestamp
  players: MatchPlayer[];
}

export interface MatchMetadataResponse {
  match_info: MatchInfo;
}
