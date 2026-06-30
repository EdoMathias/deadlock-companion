import { Edge } from '@overwolf/odk-ts/window/enums/edge';

export type OverlayLayoutMode = 'compact' | 'expanded' | 'expanded_all';

export interface OverlayWidgetConfig {
  widget_id: string;
  enabled: boolean;
  dock_edge: Edge;
  layout_mode: OverlayLayoutMode;
  /** Auto-dismiss timeout (in seconds). Only used by item_purchase_alert. */
  dismiss_timeout_s?: number;
  /** How often (in seconds) to refresh time-based item filtering. Only used by counter_items. */
  refresh_interval_s?: number;
}

export interface OverlayLayoutConfig {
  widgets: Record<string, OverlayWidgetConfig>;
}

export const DEFAULT_OVERLAY_LAYOUT: OverlayLayoutConfig = {
  widgets: {
    item_purchase_alert: {
      widget_id: 'item_purchase_alert',
      enabled: true,
      dock_edge: Edge.Right,
      layout_mode: 'compact',
      dismiss_timeout_s: 5,
    },
    counter_items: {
      widget_id: 'counter_items',
      enabled: true,
      dock_edge: Edge.Left,
      layout_mode: 'compact',
      refresh_interval_s: 120,
    },
    ultimate_alert: {
      widget_id: 'ultimate_alert',
      enabled: true,
      dock_edge: Edge.TopLeft,
      layout_mode: 'compact',
      dismiss_timeout_s: 5,
    },
  },
};
