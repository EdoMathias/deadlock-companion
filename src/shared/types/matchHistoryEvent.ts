/**
 * Shape of a single entry from the Overwolf GEP `match_history` info update.
 * Fired under the `game_info` feature when the user opens the match history tab in-game.
 */
export interface GameEventMatchEntry {
  match_id: string;
  hero_id: string;
  kills: number;
  deaths: number;
  assists: number;
  hero_name: string;
  /**
   * Numeric `match_mode` (see `MATCH_MODE_LABELS`), normalized from the GEP
   * `game_info.game_mode` payload at match end. The GEP `match_history` feed
   * carries no mode field, so this is only present on entries the background
   * controller builds itself — it lets a just-played ranked match show its
   * Ranked badge before the deadlock-api has the match.
   */
  match_mode?: number;
  /** Numeric `game_mode` (see `GAME_MODE_LABELS`), same provenance as above. */
  game_mode?: number;
}
