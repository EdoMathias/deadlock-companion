import { Edge } from '@overwolf/odk-ts/window/enums/edge';

export type OverlayLayoutMode = 'compact' | 'expanded' | 'expanded_all';

export interface OverlayWidgetConfig {
  widget_id: string;
  enabled: boolean;
  dock_edge: Edge;
  layout_mode: OverlayLayoutMode;
  dismiss_timeout_s: number;
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
  },
};
