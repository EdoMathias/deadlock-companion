import type { LiveRosterEntry } from '../../shared/types/liveMatch';
import type {
  GepItemEntry,
  GepItemsUpdate,
  ItemPurchaseAlert,
} from '../../shared/types/itemAlerts';
import type { ItemMetadata } from '../../shared/types/items';
import { getNotificationPreferences } from '../../shared/stores/notificationPreferences';
import { getHero } from '../../shared/data/heroes';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('ItemPurchaseTracker');

/** Converts HTML description text to plain text (replaces <br> with spaces, strips tags). */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export type PurchaseAlertCallback = (alert: ItemPurchaseAlert) => void;

/**
 * Tracks item purchases across all players using GEP items_N info updates.
 * Diffs successive snapshots to detect new purchases, filters to enemy-only
 * and user-tracked items, then fires a callback for each qualifying purchase.
 */
export class ItemPurchaseTracker {
  private _playerItems: Map<number, Set<number>> = new Map();
  private _playerRoster: Map<number, LiveRosterEntry> = new Map();
  private _localTeamId: number | null = null;
  private _onAlert: PurchaseAlertCallback | null = null;
  private _alertIdCounter = 0;
  private _itemMetadata: Map<number, ItemMetadata> = new Map();

  setAlertCallback(cb: PurchaseAlertCallback): void {
    this._onAlert = cb;
  }

  setItemMetadata(items: ItemMetadata[]): void {
    this._itemMetadata.clear();
    for (const item of items) {
      this._itemMetadata.set(item.id, item);
    }
    logger.log(`Item metadata loaded: ${this._itemMetadata.size} items`);
  }

  /**
   * Call on match_start to clear all tracked state.
   */
  reset(): void {
    this._playerItems.clear();
    this._playerRoster.clear();
    this._localTeamId = null;
    this._alertIdCounter = 0;
    logger.log('Tracker state reset');
  }

  /**
   * Feed roster updates. Must be called before items updates for proper
   * team identification.
   */
  onRosterUpdate(rosterIndex: number, entry: LiveRosterEntry): void {
    this._playerRoster.set(rosterIndex, entry);
    if (entry.is_local) {
      this._localTeamId = entry.team_id;
    }
  }

  /**
   * Feed an items_N info update. Diffs against previous snapshot for that
   * player index and emits alerts for new enemy purchases of tracked items.
   */
  onItemsUpdate(rosterIndex: number, data: GepItemsUpdate): void {
    const prev = this._playerItems.get(rosterIndex) ?? new Set();
    const currentIds = new Set(data.items.map((i) => i.id));
    const newItemIds = [...currentIds].filter((id) => !prev.has(id));
    this._playerItems.set(rosterIndex, currentIds);

    if (newItemIds.length === 0) return;

    const roster = this._playerRoster.get(rosterIndex);
    if (!roster) {
      logger.warn(
        `Items update for index ${rosterIndex} but no roster entry yet — skipping`,
      );
      return;
    }

    if (this._localTeamId === null) {
      logger.warn('Local team ID not determined yet — skipping alert');
      return;
    }

    if (roster.team_id === this._localTeamId) return;

    const prefs = getNotificationPreferences();
    const trackedSet = new Set(prefs.tracked_item_ids);

    for (const itemId of newItemIds) {
      if (!trackedSet.has(itemId)) continue;

      const itemInfo = data.items.find((i) => i.id === itemId);
      if (!itemInfo) continue;

      const meta = this._itemMetadata.get(itemInfo.id);
      const desc = meta?.description;
      const rawDesc = desc?.active ?? desc?.passive ?? desc?.desc;
      const descriptionText = rawDesc ? stripHtml(rawDesc) : undefined;
      const heroInfo = getHero(roster.hero_id);

      const alert: ItemPurchaseAlert = {
        id: `purchase_${this._alertIdCounter++}_${Date.now()}`,
        timestamp: Date.now(),
        player_name: roster.player_name || data.player_name || 'Unknown',
        steam_id: String(roster.steam_id || data.steam_id || ''),
        hero_id: roster.hero_id,
        hero_name: roster.hero_name,
        hero_image: heroInfo?.images.icon_image_small_webp ?? heroInfo?.images.icon_image_small,
        team_name: roster.team_name,
        item: {
          id: itemInfo.id,
          class_name: itemInfo.class_name,
          name: meta?.name ?? itemInfo.name,
          image: meta?.shop_image_webp ?? meta?.shop_image ?? undefined,
          description: descriptionText,
          is_active_item: meta?.is_active_item,
        },
      };

      logger.log(
        `Enemy purchase alert: ${alert.hero_name} bought ${alert.item.name}`,
      );
      this._onAlert?.(alert);
    }
  }
}
