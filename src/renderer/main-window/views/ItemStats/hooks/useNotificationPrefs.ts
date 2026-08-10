import { useState, useCallback } from 'react';
import type { NotificationPreferences } from '../../../../../shared/types/itemAlerts';
import {
  getNotificationPreferences,
  toggleItemTracked,
  setTrackedItems,
  clearAllTracked,
  applyPreset,
  BUILT_IN_PRESETS,
} from '../../../../../shared/stores/notificationPreferences';
import type { NotificationPreset } from '../../../../../shared/types/itemAlerts';
import type { ItemMetadata } from '../../../../../shared/types/items';
import { track } from '../../../../../shared/services/analytics';

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    getNotificationPreferences,
  );

  const refresh = useCallback(() => {
    setPrefs(getNotificationPreferences());
  }, []);

  const toggle = useCallback(
    (itemId: number) => {
      const nowTracked = toggleItemTracked(itemId);
      track('item_tracking_toggled', {
        item_id: itemId,
        tracked: nowTracked,
        source: 'table',
      });
      refresh();
    },
    [refresh],
  );

  const setItems = useCallback(
    (ids: number[]) => {
      setTrackedItems(ids);
      refresh();
    },
    [refresh],
  );

  const clearAll = useCallback(() => {
    clearAllTracked();
    // item_id -1 is a sentinel meaning "all tracked items cleared".
    track('item_tracking_toggled', {
      item_id: -1,
      tracked: false,
      source: 'clear_all',
    });
    refresh();
  }, [refresh]);

  const applyPresetAction = useCallback(
    (preset: NotificationPreset, allItems: ItemMetadata[]) => {
      applyPreset(preset, allItems);
      track('item_stats_preset_applied', { preset_name: preset.name });
      refresh();
    },
    [refresh],
  );

  const isTracked = useCallback(
    (itemId: number) => prefs.tracked_item_ids.includes(itemId),
    [prefs.tracked_item_ids],
  );

  return {
    prefs,
    trackedIds: prefs.tracked_item_ids,
    toggle,
    setItems,
    clearAll,
    applyPreset: applyPresetAction,
    isTracked,
    presets: BUILT_IN_PRESETS,
    refresh,
  };
}
