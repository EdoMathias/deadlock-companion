import type {
  NotificationPreferences,
  NotificationPreset,
  PresetFilter,
} from '../types/itemAlerts';
import type { ItemMetadata } from '../types/items';
import { createLogger } from '../services/Logger';

const logger = createLogger('NotificationPreferences');

const STORAGE_KEY = 'dl_notification_prefs';

const DEFAULT_PREFS: NotificationPreferences = {
  tracked_item_ids: [],
};

export const BUILT_IN_PRESETS: NotificationPreset[] = [
  {
    id: 'all_items',
    name: 'All Items',
    description: 'Track all shopable items',
    filter: {},
  },
  {
    id: 'all_active',
    name: 'All Active Items',
    description: 'Track all items with an active ability',
    filter: { is_active_item: true },
  },
  {
    id: 'tier4_plus',
    name: 'Tier 4+ Items',
    description: 'Track all tier 4 and tier 5 items',
    filter: { item_tier_min: 4 },
  },
  {
    id: 'weapon_items',
    name: 'Weapon Items',
    description: 'Track all weapon slot items',
    filter: { item_slot_type: 'weapon' },
  },
  {
    id: 'spirit_items',
    name: 'Spirit Items',
    description: 'Track all spirit slot items',
    filter: { item_slot_type: 'spirit' },
  },
  {
    id: 'vitality_items',
    name: 'Vitality Items',
    description: 'Track all vitality slot items',
    filter: { item_slot_type: 'vitality' },
  },
];

function load(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return {
      tracked_item_ids: Array.isArray(parsed.tracked_item_ids)
        ? parsed.tracked_item_ids
        : [],
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function save(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    logger.error('Failed to save notification preferences:', err);
  }
}

export function getNotificationPreferences(): NotificationPreferences {
  return load();
}

export function isItemTracked(itemId: number): boolean {
  const prefs = load();
  return prefs.tracked_item_ids.includes(itemId);
}

export function toggleItemTracked(itemId: number): boolean {
  const prefs = load();
  const idx = prefs.tracked_item_ids.indexOf(itemId);
  if (idx >= 0) {
    prefs.tracked_item_ids.splice(idx, 1);
  } else {
    prefs.tracked_item_ids.push(itemId);
  }
  save(prefs);
  return idx < 0;
}

export function setTrackedItems(itemIds: number[]): void {
  const prefs = load();
  prefs.tracked_item_ids = itemIds;
  save(prefs);
}

export function clearAllTracked(): void {
  const prefs = load();
  prefs.tracked_item_ids = [];
  save(prefs);
}

/**
 * Resolves a preset filter against a full item list to produce a set of item IDs.
 */
export function resolvePresetFilter(
  filter: PresetFilter,
  allItems: ItemMetadata[],
): number[] {
  if (filter.item_ids && filter.item_ids.length > 0) {
    return filter.item_ids;
  }

  return allItems
    .filter((item) => {
      if (filter.item_slot_type && item.item_slot_type !== filter.item_slot_type)
        return false;
      if (filter.is_active_item !== undefined && item.is_active_item !== filter.is_active_item)
        return false;
      if (filter.item_tier_min && item.item_tier < filter.item_tier_min)
        return false;
      if (filter.item_tier_max && item.item_tier > filter.item_tier_max)
        return false;
      return true;
    })
    .map((item) => item.id);
}

/**
 * Applies a preset: resolves its filter against the item list and toggles
 * all matching items on or off (toggle = add if none tracked, remove if all tracked).
 */
export function applyPreset(
  preset: NotificationPreset,
  allItems: ItemMetadata[],
): void {
  const prefs = load();
  const targetIds = resolvePresetFilter(preset.filter, allItems);
  const trackedSet = new Set(prefs.tracked_item_ids);

  const allAlreadyTracked = targetIds.every((id) => trackedSet.has(id));

  if (allAlreadyTracked) {
    for (const id of targetIds) {
      trackedSet.delete(id);
    }
  } else {
    for (const id of targetIds) {
      trackedSet.add(id);
    }
  }

  prefs.tracked_item_ids = Array.from(trackedSet);
  save(prefs);
}
