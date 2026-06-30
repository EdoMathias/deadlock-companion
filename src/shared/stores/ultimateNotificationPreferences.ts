import type { UltimateNotificationPreferences } from '../types/ultimateAlerts';
import { createLogger } from '../services/Logger';

const logger = createLogger('UltimateNotificationPreferences');

const STORAGE_KEY = 'dl_ultimate_notification_prefs';

const DEFAULT_PREFS: UltimateNotificationPreferences = {
  notify_self: true,
  notify_allies: true,
  notify_enemies: true,
};

function load(): UltimateNotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return {
      notify_self: parsed.notify_self !== false,
      notify_allies: parsed.notify_allies !== false,
      notify_enemies: parsed.notify_enemies !== false,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function save(prefs: UltimateNotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    logger.error('Failed to save ultimate notification preferences:', err);
  }
}

export function getUltimateNotificationPreferences(): UltimateNotificationPreferences {
  return load();
}

export function setUltimateNotificationPreferences(
  partial: Partial<UltimateNotificationPreferences>,
): void {
  const prefs = load();
  save({ ...prefs, ...partial });
}
