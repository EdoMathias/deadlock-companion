/** Shape of a single roster entry from Overwolf's match_info feature. */
export interface LiveRosterEntry {
  player_name: string;
  steam_id: number;
  team_name: string;
  team_id: number;
  is_local: boolean;
  hero_id: number;
  level: number;
  kills: number;
  deaths: number;
  assist: number;
  hero_damage: number;
  object_damage: number;
  hero_healing: number;
  health: number;
  souls: number;
  hero_name: string;
}

/** Game mode information from game_info events. */
export interface GameModeInfo {
  match_mode: string;
  game_mode: string;
}

/** Team objective scores from game_info team_score events. */
export interface TeamScores {
  amber: number;
  sapphire: number;
}

/** Payload broadcast with LIVE_ROSTER_UPDATE messages. */
export interface LiveRosterUpdatePayload {
  roster: LiveRosterEntry[];
  matchId: string | null;
  matchStartTimestamp: number | null;
  gameMode: GameModeInfo | null;
  teamScores: TeamScores | null;
}

/** Payload broadcast with LIVE_MATCH_START messages. */
export interface LiveMatchStartPayload {
  matchId: string | null;
  matchStartTimestamp: number;
}
