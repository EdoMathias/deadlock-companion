import type { ItemSlotType } from './items';

export interface NotificationPreferences {
  tracked_item_ids: number[];
}

export interface NotificationPreset {
  id: string;
  name: string;
  description: string;
  filter: PresetFilter;
}

export interface PresetFilter {
  item_slot_type?: ItemSlotType;
  is_active_item?: boolean;
  item_tier_min?: number;
  item_tier_max?: number;
  item_ids?: number[];
}

export interface GepItemEntry {
  id: number;
  class_name: string;
  name: string;
}

export interface GepItemsUpdate {
  player_name: string;
  steam_id: string;
  items: GepItemEntry[];
}

export interface ItemPurchaseAlert {
  id: string;
  timestamp: number;
  player_name: string;
  steam_id: string;
  hero_id: number;
  hero_name: string;
  hero_image?: string;
  team_name: string;
  item: {
    id: number;
    class_name: string;
    name: string;
    // Extended notification fields — all three must be populated from item
    // metadata (Assets API) for the "expanded" overlay layout to show the
    // item description. If `is_active_item` is false or `description` is
    // missing, the expanded view falls back to the compact card.
    image?: string;
    description?: string;
    is_active_item?: boolean;
  };
}
