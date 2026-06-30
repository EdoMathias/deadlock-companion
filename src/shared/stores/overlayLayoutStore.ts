import { Edge } from '@overwolf/odk-ts/window/enums/edge';
import type {
  OverlayLayoutConfig,
  OverlayWidgetConfig,
  OverlayLayoutMode,
} from '../types/overlayLayout';
import { DEFAULT_OVERLAY_LAYOUT } from '../types/overlayLayout';
import { createLogger } from '../services/Logger';

const logger = createLogger('OverlayLayoutStore');

const STORAGE_KEY = 'dl_overlay_layout';

function load(): OverlayLayoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_OVERLAY_LAYOUT);
    const parsed = JSON.parse(raw) as OverlayLayoutConfig;
    if (!parsed.widgets || typeof parsed.widgets !== 'object') {
      return structuredClone(DEFAULT_OVERLAY_LAYOUT);
    }
    return {
      widgets: {
        ...structuredClone(DEFAULT_OVERLAY_LAYOUT.widgets),
        ...parsed.widgets,
      },
    };
  } catch {
    return structuredClone(DEFAULT_OVERLAY_LAYOUT);
  }
}

function save(config: OverlayLayoutConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    logger.error('Failed to save overlay layout:', err);
  }
}

export function getOverlayLayout(): OverlayLayoutConfig {
  return load();
}

export function getWidgetConfig(widgetId: string): OverlayWidgetConfig | null {
  const layout = load();
  return layout.widgets[widgetId] ?? null;
}

export function setWidgetDockEdge(widgetId: string, edge: Edge): void {
  const layout = load();
  if (!layout.widgets[widgetId]) {
    layout.widgets[widgetId] = {
      widget_id: widgetId,
      enabled: true,
      dock_edge: edge,
      layout_mode: 'compact',
      dismiss_timeout_s: 5,
    };
  } else {
    layout.widgets[widgetId].dock_edge = edge;
  }
  save(layout);
}

export function setWidgetEnabled(widgetId: string, enabled: boolean): void {
  const layout = load();
  if (layout.widgets[widgetId]) {
    layout.widgets[widgetId].enabled = enabled;
  }
  save(layout);
}

export function setWidgetLayoutMode(
  widgetId: string,
  mode: OverlayLayoutMode,
): void {
  const layout = load();
  if (layout.widgets[widgetId]) {
    layout.widgets[widgetId].layout_mode = mode;
  }
  save(layout);
}

export function setWidgetDismissTimeout(
  widgetId: string,
  seconds: number,
): void {
  const layout = load();
  if (layout.widgets[widgetId]) {
    layout.widgets[widgetId].dismiss_timeout_s = Math.max(5, Math.min(30, seconds));
  }
  save(layout);
}

export function setWidgetRefreshInterval(
  widgetId: string,
  seconds: number,
): void {
  const layout = load();
  if (layout.widgets[widgetId]) {
    layout.widgets[widgetId].refresh_interval_s = Math.max(60, Math.min(600, seconds));
  }
  save(layout);
}

export function setWidgetVisualFlag(
  widgetId: string,
  key: 'relation_border' | 'relation_tint' | 'appear_pulse',
  value: boolean,
): void {
  const layout = load();
  if (layout.widgets[widgetId]) {
    layout.widgets[widgetId][key] = value;
  }
  save(layout);
}

export function resetWidgetConfig(widgetId: string): void {
  const layout = load();
  const defaultWidget = DEFAULT_OVERLAY_LAYOUT.widgets[widgetId];
  if (defaultWidget) {
    layout.widgets[widgetId] = structuredClone(defaultWidget);
  }
  save(layout);
}

export function resetAllWidgets(): void {
  save(structuredClone(DEFAULT_OVERLAY_LAYOUT));
}
