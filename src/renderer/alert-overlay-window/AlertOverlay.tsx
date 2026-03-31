import React from 'react';
import { createRoot } from 'react-dom/client';
import AlertQueue from './components/AlertQueue';
import { useAlertMessages } from './hooks/useAlertMessages';
import { getWidgetConfig } from '../../shared/stores/overlayLayoutStore';
import './alert-overlay.css';

const AlertOverlay: React.FC = () => {
  const { alerts, dismissAlert } = useAlertMessages();
  const widgetConfig = getWidgetConfig('item_purchase_alert');
  const layoutMode = widgetConfig?.layout_mode ?? 'compact';

  return (
    <div className="alert-overlay-root">
      <AlertQueue
        alerts={alerts}
        onDismiss={dismissAlert}
        layoutMode={layoutMode}
      />
    </div>
  );
};

const mountApp = () => {
  const container = document.getElementById('root');
  if (!container) {
    console.error('Alert overlay root element not found');
    return;
  }

  const root = createRoot(container);
  root.render(<AlertOverlay />);
};

mountApp();
