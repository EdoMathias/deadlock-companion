import React, { useState, useCallback } from 'react';
import { Edge } from '@overwolf/odk-ts/window/enums/edge';
import type { OverlayLayoutConfig, OverlayLayoutMode } from '../../../../shared/types/overlayLayout';
import {
  getOverlayLayout,
  setWidgetDockEdge,
  setWidgetEnabled,
  setWidgetLayoutMode,
  setWidgetDismissTimeout,
  resetWidgetConfig,
} from '../../../../shared/stores/overlayLayoutStore';
import DockingSelector from './components/DockingSelector';
import WidgetPreview from './components/WidgetPreview';
import '../../../styles/views/overlay-editor.css';

const WIDGET_IDS = ['item_purchase_alert'] as const;

const WIDGET_LABELS: Record<string, string> = {
  item_purchase_alert: 'Enemy Item Purchase Alert',
};

const WIDGET_DESCRIPTIONS: Record<string, string> = {
  item_purchase_alert:
    'Shows an in-game notification when an enemy buys items you track in the Item Stats view.',
};

const OverlayEditorView: React.FC = () => {
  const [layout, setLayout] = useState<OverlayLayoutConfig>(getOverlayLayout);

  const refresh = useCallback(() => {
    setLayout(getOverlayLayout());
  }, []);

  const handleDockChange = useCallback(
    (widgetId: string, edge: Edge) => {
      setWidgetDockEdge(widgetId, edge);
      refresh();
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
