import type { LiveRosterEntry } from '../../shared/types/liveMatch';
import type { UltimateAlert, UltimateTeamRelation } from '../../shared/types/ultimateAlerts';
import { getUltimateNotificationPreferences } from '../../shared/stores/ultimateNotificationPreferences';
import { getHero } from '../../shared/data/heroes';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('UltimateTracker');

export type UltimateAlertCallback = (alert: UltimateAlert) => void;

interface UltState {
  trained: boolean;
  ready: boolean;
}

/**
 * Tracks ultimate ability state transitions across all players using GEP
 * roster info updates. Fires a callback for each qualifying transition:
 *   - ultimate_trained false → true  ("Unlocked")
 *   - ultimate_ready   false → true  ("Ready")
 * Suppresses the "Ready" alert when it coincides with the "Unlocked" alert
 * in the same update (unlock implies ready). Applies per-team filters from
 * the user's ultimate notification preferences.
 */
export class UltimateTracker {
  private _ultState: Map<number, UltState> = new Map();
  private _playerRoster: Map<number, LiveRosterEntry> = new Map();
  private _localTeamId: number | null = null;
  private _onAlert: UltimateAlertCallback | null = null;
  private _alertIdCounter = 0;

  setAlertCallback(cb: UltimateAlertCallback): void {
    this._onAlert = cb;
  }

  /** Call on match_start to clear all tracked state. */
  reset(): void {
    this._ultState.clear();
    this._playerRoster.clear();
    this._localTeamId = null;
    this._alertIdCounter = 0;
    logger.log('Tracker state reset');
  }

  /** Feed a roster update. Diffs ult state and emits alerts for transitions. */
  onRosterUpdate(rosterIndex: number, entry: LiveRosterEntry): void {
    this._playerRoster.set(rosterIndex, entry);
    if (entry.is_local) {
      this._localTeamId = entry.team_id;
    }

    const nextTrained = entry.ultimate_trained ?? false;
    const nextReady = entry.ultimate_ready ?? false;

    const prev = this._ultState.get(rosterIndex);

    // First observation — establish baseline without firing alerts.
    // This prevents a burst of "Ready" cards when the app attaches mid-match.
    if (!prev) {
      this._ultState.set(rosterIndex, { trained: nextTrained, ready: nextReady });
      return;
    }

    const prevTrained = prev.trained;
    const prevReady = prev.ready;

    // Update stored state before emitting so re-entrant calls see the new state.
    this._ultState.set(rosterIndex, { trained: nextTrained, ready: nextReady });

    const relation = this._teamRelation(entry);
    if (!this._passesFilter(relation)) return;

    const heroInfo = getHero(entry.hero_id);
    const heroImage =
      heroInfo?.images.icon_image_small_webp ?? heroInfo?.images.icon_image_small;

    const unlockedFired = !prevTrained && nextTrained;

    if (unlockedFired) {
      logger.log(
        `Ultimate UNLOCKED: ${entry.hero_name} (roster ${rosterIndex}) [${relation}]`,
      );
      this._emit({
        kind: 'unlocked',
        entry,
        heroImage,
        relation,
      });
    }

    // Suppress "ready" when it fires in the same update as "unlocked" (unlock implies ready).
    if (!prevReady && nextReady && !unlockedFired) {
      logger.log(
        `Ultimate READY: ${entry.hero_name} (roster ${rosterIndex}) [${relation}]`,
      );
      this._emit({
        kind: 'ready',
        entry,
        heroImage,
        relation,
      });
    }
  }

  private _teamRelation(entry: LiveRosterEntry): UltimateTeamRelation {
    if (entry.is_local) return 'self';
    if (this._localTeamId !== null && entry.team_id === this._localTeamId)
      return 'ally';
    return 'enemy';
  }

  private _passesFilter(relation: UltimateTeamRelation): boolean {
    const prefs = getUltimateNotificationPreferences();
    if (relation === 'self') return prefs.notify_self;
    if (relation === 'ally') return prefs.notify_allies;
    return prefs.notify_enemies;
  }

  private _emit({
    kind,
    entry,
    heroImage,
    relation,
  }: {
    kind: UltimateAlert['kind'];
    entry: LiveRosterEntry;
    heroImage: string | undefined;
    relation: UltimateTeamRelation;
  }): void {
    if (!this._onAlert) return;

    const alert: UltimateAlert = {
      id: `ult_${this._alertIdCounter++}_${Date.now()}`,
      timestamp: Date.now(),
      kind,
      hero_id: entry.hero_id,
      hero_name: entry.hero_name || 'Unknown',
      hero_image: heroImage,
      player_name: entry.player_name || 'Unknown',
      team_relation: relation,
    };

    this._onAlert(alert);
  }
}
