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
}
