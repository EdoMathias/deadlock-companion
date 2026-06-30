export type UltimateAlertKind = 'unlocked' | 'ready';
export type UltimateTeamRelation = 'self' | 'ally' | 'enemy';

export interface UltimateAlert {
  id: string;
  timestamp: number;
  kind: UltimateAlertKind;
  hero_id: number;
  hero_name: string;
  hero_image?: string;
  player_name: string;
  team_relation: UltimateTeamRelation;
}

export interface UltimateNotificationPreferences {
  notify_self: boolean;
  notify_allies: boolean;
  notify_enemies: boolean;
}
