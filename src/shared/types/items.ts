export type ItemSlotType = 'weapon' | 'spirit' | 'vitality';
export type ItemTier = 1 | 2 | 3 | 4 | 5;

export interface ItemMetadata {
  id: number;
  class_name: string;
  name: string;
  cost: number | null;
  item_tier: ItemTier;
  item_slot_type: ItemSlotType;
  is_active_item: boolean;
  activation: string;
  shopable: boolean;
  image: string | null;
  image_webp: string | null;
  shop_image: string | null;
  shop_image_webp: string | null;
  description: ItemDescription | null;
}

export interface ItemDescription {
  desc: string | null;
  active: string | null;
  passive: string | null;
}

export interface ItemAnalyticsRow {
  item_id: number;
  wins: number;
  losses: number;
  matches: number;
  players: number;
  bucket: number;
  avg_buy_time_s: number;
  avg_buy_time_relative: number;
  avg_sell_time_s: number;
  avg_sell_time_relative: number;
}

export interface ItemAnalyticsComputed extends ItemAnalyticsRow {
  win_rate: number;
  pick_rate: number;
  confidence: number;
}

export interface ItemStatsFilters {
  hero_id?: number;
  min_average_badge?: number;
  max_average_badge?: number;
  game_mode?: string;
  min_unix_timestamp?: number;
  max_unix_timestamp?: number;
  min_matches?: number;
  item_slot_type?: ItemSlotType;
  item_tier?: ItemTier;
  sort_by?: 'win_rate' | 'matches' | 'avg_buy_time_s' | 'confidence';
  sort_direction?: 'asc' | 'desc';
}

/**
 * Combined view model merging item metadata with analytics data for UI display.
 */
export interface ItemStatsRow {
  metadata: ItemMetadata;
  analytics: ItemAnalyticsComputed | null;
  isTracked: boolean;
}
