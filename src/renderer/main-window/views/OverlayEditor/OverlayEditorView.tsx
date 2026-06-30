import React, { useState, useCallback } from 'react';
import { Edge } from '@overwolf/odk-ts/window/enums/edge';
import { MessageType } from '../../../../main/services/MessageChannel';
import type { OverlayLayoutConfig, OverlayLayoutMode } from '../../../../shared/types/overlayLayout';
import {
  getOverlayLayout,
  setWidgetDockEdge,
  setWidgetEnabled,
  setWidgetLayoutMode,
  setWidgetDismissTimeout,
  setWidgetRefreshInterval,
  setWidgetVisualFlag,
  resetWidgetConfig,
} from '../../../../shared/stores/overlayLayoutStore';
import {
  getUltimateNotificationPreferences,
  setUltimateNotificationPreferences,
} from '../../../../shared/stores/ultimateNotificationPreferences';
import type { UltimateNotificationPreferences } from '../../../../shared/types/ultimateAlerts';
import DockingSelector from './components/DockingSelector';
import WidgetPreview from './components/WidgetPreview';
import '../../../styles/views/overlay-editor.css';

const WIDGET_IDS = ['item_purchase_alert', 'counter_items', 'ultimate_alert'] as const;

const WIDGET_LABELS: Record<string, string> = {
  item_purchase_alert: 'Enemy Item Purchase Alert',
  counter_items: 'Counter Items Advisor',
  ultimate_alert: 'Ultimate Ready Alerts',
};

const WIDGET_DESCRIPTIONS: Record<string, string> = {
  item_purchase_alert:
    'Shows an in-game notification when an enemy buys items you track in the Item Stats view.',
  counter_items:
    'Recommends items to buy based on the enemy team composition during a live match.',
  ultimate_alert:
    'Shows an in-game notification when a hero unlocks or recharges their ultimate ability.',
};

const ALERT_ONLY_WIDGETS = new Set(['item_purchase_alert']);
const REFRESH_INTERVAL_WIDGETS = new Set(['counter_items']);
const ULTIMATE_ALERT_WIDGETS = new Set(['ultimate_alert']);

const OverlayEditorView: React.FC = () => {
  const [layout, setLayout] = useState<OverlayLayoutConfig>(getOverlayLayout);
  const [ultimatePrefs, setUltimatePrefs] = useState<UltimateNotificationPreferences>(
    getUltimateNotificationPreferences,
  );

  const refresh = useCallback(() => {
    setLayout(getOverlayLayout());
  }, []);

  const handleUltimatePrefChange = useCallback(
    (key: keyof UltimateNotificationPreferences, value: boolean) => {
      setUltimateNotificationPreferences({ [key]: value });
      setUltimatePrefs(getUltimateNotificationPreferences());
    },
    [],
  );

  const handleVisualFlagChange = useCallback(
    (
      widgetId: string,
      key: 'relation_border' | 'relation_tint' | 'appear_pulse',
      value: boolean,
    ) => {
      setWidgetVisualFlag(widgetId, key, value);
      refresh();
    },
    [refresh],
  );

  const handleDockChange = useCallback(
    (widgetId: string, edge: Edge) => {
      setWidgetDockEdge(widgetId, edge);
      refresh();
      if (typeof overwolf !== 'undefined') {
        const payload = {
          type: MessageType.WIDGET_DOCK_CHANGED,
          data: { widget_id: widgetId, dock_edge: edge },
          timestamp: Date.now(),
        };
        overwolf.windows.sendMessage(
          'background',
          MessageType.WIDGET_DOCK_CHANGED,
          payload,
          () => {},
        );
      }
    },
    [refresh],
  );

  const handleEnabledChange = useCallback(
    (widgetId: string, enabled: boolean) => {
      setWidgetEnabled(widgetId, enabled);
      refresh();
    },
    [refresh],
  );

  const handleLayoutModeChange = useCallback(
    (widgetId: string, mode: OverlayLayoutMode) => {
      setWidgetLayoutMode(widgetId, mode);
      refresh();
    },
    [refresh],
  );

  const handleDismissTimeoutChange = useCallback(
    (widgetId: string, seconds: number) => {
      setWidgetDismissTimeout(widgetId, seconds);
      refresh();
    },
    [refresh],
  );

  const handleRefreshIntervalChange = useCallback(
    (widgetId: string, seconds: number) => {
      setWidgetRefreshInterval(widgetId, seconds);
      refresh();
    },
    [refresh],
  );

  const handleReset = useCallback(
    (widgetId: string) => {
      resetWidgetConfig(widgetId);
      refresh();
    },
    [refresh],
  );

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 className="view-title">Overlay Editor</h2>
      </div>

      <div className="overlay-editor-body">
        {/* Preview Screen */}
        <div className="overlay-editor-preview">
          <div className="overlay-editor-screen">
            <div className="overlay-editor-screen-label">Game Screen Preview (Previews appear bigger than actual size)</div>
            {WIDGET_IDS.map((id) => {
              const widget = layout.widgets[id];
              return widget ? (
                <WidgetPreview key={id} widget={widget} />
              ) : null;
            })}
          </div>
        </div>

        {/* Widget Settings */}
        <div className="overlay-editor-settings">
          <h3 className="overlay-editor-settings-title">Widgets</h3>
          {WIDGET_IDS.map((widgetId) => {
            const widget = layout.widgets[widgetId];
            if (!widget) return null;

            return (
              <div key={widgetId} className="overlay-widget-card">
                <div className="overlay-widget-header">
                  <label className="overlay-widget-toggle">
                    <input
                      type="checkbox"
                      checked={widget.enabled}
                      onChange={(e) =>
                        handleEnabledChange(widgetId, e.target.checked)
                      }
                    />
                    <span className="overlay-widget-name">
                      {WIDGET_LABELS[widgetId] ?? widgetId}
                    </span>
                  </label>
                  <span className="overlay-widget-desc">
                    {WIDGET_DESCRIPTIONS[widgetId]}
                  </span>
                </div>

                <div className="overlay-widget-controls">
                  <div className="overlay-widget-control-group">
                    <label className="overlay-widget-label">Position</label>
                    <DockingSelector
                      value={widget.dock_edge}
                      onChange={(edge) => handleDockChange(widgetId, edge)}
                    />
                  </div>

                  {ALERT_ONLY_WIDGETS.has(widgetId) && (
                    <>
                      <div className="overlay-widget-control-group">
                        <label className="overlay-widget-label">Layout</label>
                        <select
                          className="overlay-widget-select"
                          value={widget.layout_mode}
                          onChange={(e) =>
                            handleLayoutModeChange(
                              widgetId,
                              e.target.value as OverlayLayoutMode,
                            )
                          }
                        >
                          <option value="compact">Compact</option>
                          <option value="expanded">Expanded (Active)</option>
                          <option value="expanded_all">Expanded (All)</option>
                        </select> 
                      </div>

                      <div className="overlay-widget-control-group">
                        <label className="overlay-widget-label">
                          Dismiss: {widget.dismiss_timeout_s ?? 5}s
                        </label>
                        <input
                          type="range"
                          className="overlay-widget-range"
                          min={5}
                          max={30}
                          step={1}
                          value={widget.dismiss_timeout_s ?? 5}
                          onChange={(e) =>
                            handleDismissTimeoutChange(widgetId, Number(e.target.value))
                          }
                        />
                      </div>
                    </>
                  )}

                  {REFRESH_INTERVAL_WIDGETS.has(widgetId) && (
                    <div className="overlay-widget-control-group">
                      <label className="overlay-widget-label">
                        Refresh: {Math.floor((widget.refresh_interval_s ?? 120) / 60)}m {(widget.refresh_interval_s ?? 120) % 60 > 0 ? `${(widget.refresh_interval_s ?? 120) % 60}s` : ''}
                      </label>
                      <input
                        type="range"
                        className="overlay-widget-range"
                        min={60}
                        max={600}
                        step={60}
                        value={widget.refresh_interval_s ?? 120}
                        onChange={(e) =>
                          handleRefreshIntervalChange(widgetId, Number(e.target.value))
                        }
                      />
                    </div>
                  )}

                  {ULTIMATE_ALERT_WIDGETS.has(widgetId) && (
                    <>
                      <div className="overlay-widget-control-group">
                        <label className="overlay-widget-label">
                          Dismiss: {widget.dismiss_timeout_s ?? 5}s
                        </label>
                        <input
                          type="range"
                          className="overlay-widget-range"
                          min={5}
                          max={30}
                          step={1}
                          value={widget.dismiss_timeout_s ?? 5}
                          onChange={(e) =>
                            handleDismissTimeoutChange(widgetId, Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="overlay-widget-control-group">
                        <label className="overlay-widget-label">Notify for</label>
                        <div className="overlay-widget-checkboxes">
                          <label className="overlay-widget-checkbox-label">
                            <input
                              type="checkbox"
                              checked={ultimatePrefs.notify_enemies}
                              onChange={(e) =>
                                handleUltimatePrefChange('notify_enemies', e.target.checked)
                              }
                            />
                            Enemies
                          </label>
                          <label className="overlay-widget-checkbox-label">
                            <input
                              type="checkbox"
                              checked={ultimatePrefs.notify_allies}
                              onChange={(e) =>
                                handleUltimatePrefChange('notify_allies', e.target.checked)
                              }
                            />
                            Allies
                          </label>
                          <label className="overlay-widget-checkbox-label">
                            <input
                              type="checkbox"
                              checked={ultimatePrefs.notify_self}
                              onChange={(e) =>
                                handleUltimatePrefChange('notify_self', e.target.checked)
                              }
                            />
                            You
                          </label>
                        </div>
                      </div>
                      <div className="overlay-widget-control-group">
                        <label className="overlay-widget-label">Style</label>
                        <div className="overlay-widget-checkboxes">
                          <label className="overlay-widget-checkbox-label">
                            <input
                              type="checkbox"
                              checked={widget.relation_border !== false}
                              onChange={(e) =>
                                handleVisualFlagChange(
                                  widgetId,
                                  'relation_border',
                                  e.target.checked,
                                )
                              }
                            />
                            Relation border
                          </label>
                          <label className="overlay-widget-checkbox-label">
                            <input
                              type="checkbox"
                              checked={widget.relation_tint !== false}
                              onChange={(e) =>
                                handleVisualFlagChange(
                                  widgetId,
                                  'relation_tint',
                                  e.target.checked,
                                )
                              }
                            />
                            Background tint
                          </label>
                          <label className="overlay-widget-checkbox-label">
                            <input
                              type="checkbox"
                              checked={widget.appear_pulse !== false}
                              onChange={(e) =>
                                handleVisualFlagChange(
                                  widgetId,
                                  'appear_pulse',
                                  e.target.checked,
                                )
                              }
                            />
                            Appear pulse
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    className="overlay-widget-reset-btn"
                    onClick={() => handleReset(widgetId)}
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OverlayEditorView;
