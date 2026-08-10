/**
 * Typed analytics event catalog — the single source of truth for event names
 * and their property shapes. `track()` is generic over this map, so event names
 * are autocompleted and property typos are caught at compile time.
 *
 * Conventions:
 * - Event names are `snake_case`, `object_action`, past tense.
 * - Property keys are `snake_case`.
 * - Never include PII: no Steam IDs, player names, or raw search text.
 *   `match_id` is allowed (it is not personal data).
 */

/** The Overwolf window a bundle runs in (sent as a super property on every event). */
export type WindowName =
  | 'background'
  | 'main_desktop'
  | 'main_ingame'
  | 'alert_overlay'
  | 'counter_items'
  | 'companion_app_ready'
  | 'unknown';

/** Sidebar view names — these match the `name` values in views.config.ts. */
export type ScreenName =
  | 'Live Match'
  | 'Match History'
  | 'Hero Stats'
  | 'Item Stats'
  | 'Overlay Editor'
  | 'Contribute'
  | 'Profile'
  | 'Rotations';

export type OverlayType =
  | 'counter_items'
  | 'item_purchase_alert'
  | 'ultimate_alert'
  | 'live_scoreboard';

export type ApiEndpoint =
  | 'hero_stats'
  | 'hero_ban_stats'
  | 'item_stats'
  | 'counter_items'
  | 'match_metadata'
  | 'assets'
  | 'ingest_salts';

/**
 * Phase 1 event catalog. Each key is an event name; the value type is the
 * event's property shape. Extend this map as later phases add events.
 */
export interface AnalyticsEventProperties {
  // --- Lifecycle & session ---
  app_launched: {
    launch_source: 'game_launch' | 'manual' | 'tray' | 'startup' | 'unknown';
    game_running: boolean;
    is_first_launch: boolean;
  };
  game_detected: Record<string, never>;
  game_closed: Record<string, never>;

  // --- Navigation ---
  screen_viewed: {
    screen_name: ScreenName;
    entry_method: 'sidebar' | 'auto_nav' | 'default';
    previous_screen?: ScreenName | null;
    previous_screen_dwell_seconds?: number;
  };

  // --- Match lifecycle ---
  match_started: {
    match_id?: string;
    game_mode?: string;
    hero?: string;
    /** true if the app was already open when the match began (vs. joined mid-match). */
    app_opened_during_match: boolean;
    tracked_items_count: number;
  };
  /** Rich per-match summary, fired once at match end. The engagement backbone. */
  match_tracked: {
    match_id?: string;
    game_mode?: string;
    hero?: string;
    result: 'win' | 'loss' | 'unknown';
    match_duration_seconds?: number;
    duration_tracked_seconds: number;
    time_to_first_overlay_seconds?: number;
    overlays_shown_types: OverlayType[];
    counter_items_shown: number;
    item_alerts_shown: number;
    ultimate_alerts_shown: number;
    tracked_items_count: number;
  };

  // --- Overlays (reach) ---
  overlay_shown: {
    overlay_type: OverlayType;
    match_id?: string;
    trigger: 'auto' | 'hotkey';
  };

  // --- Consent ---
  analytics_opt_in: Record<string, never>;
  analytics_opt_out: Record<string, never>;

  // --- Reliability ---
  api_request_failed: {
    endpoint: ApiEndpoint;
    status_code?: number;
    reason?: string;
  };
  gep_connection_failed: {
    attempt?: number;
    reason?: string;
  };
  gep_connected: {
    time_to_connect_seconds?: number;
  };

  // === Phase 2a: surface engagement depth ===

  // --- Overlay interactions ---
  overlay_interacted: {
    overlay_type: OverlayType;
    interaction:
      | 'hotkey_toggle'
      | 'enemy_selected'
      | 'enemy_deselected'
      | 'alert_dismissed'
      | 'alert_clicked';
    match_id?: string;
  };
  overlay_config_changed: {
    widget: 'item_purchase_alert' | 'counter_items';
    setting:
      | 'enabled'
      | 'docking'
      | 'layout_mode'
      | 'timeout'
      | 'refresh_interval'
      | 'reset';
    value?: string | number | boolean;
  };

  // --- Item Stats ---
  item_tracking_toggled: {
    item_id: number;
    tracked: boolean;
    source: 'table' | 'preset' | 'clear_all';
  };
  item_stats_filtered: {
    filter_type:
      | 'search'
      | 'hero'
      | 'rank_range'
      | 'game_mode'
      | 'slot_type'
      | 'item_tier'
      | 'min_matches';
    has_value?: boolean;
  };
  item_stats_preset_applied: {
    preset_name: string;
  };

  // --- Hero Stats ---
  hero_stats_filtered: {
    filter_type:
      | 'game_mode'
      | 'rank_range'
      | 'date_range'
      | 'min_matches'
      | 'min_matches_all_time';
  };
  stats_sorted: {
    view: 'hero_stats' | 'item_stats';
    column: string;
    direction: 'asc' | 'desc';
  };

  // --- Match History & Profile ---
  match_detail_opened: {
    match_id?: string;
  };
  match_history_refreshed: {
    trigger: 'manual' | 'steam_sync';
  };
  profile_refreshed: Record<string, never>;
}

export type AnalyticsEventName = keyof AnalyticsEventProperties;
