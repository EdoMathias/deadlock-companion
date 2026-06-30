import React from 'react';
import { createRoot } from 'react-dom/client';
import UltimateAlertQueue from './components/UltimateAlertQueue';
import { useUltimateAlerts } from './hooks/useUltimateAlerts';
import './ultimate-alert.css';

const UltimateAlertOverlay: React.FC = () => {
  const { alerts, dismissAlert } = useUltimateAlerts();

  return (
    <div className="ultimate-overlay-root">
      <UltimateAlertQueue alerts={alerts} onDismiss={dismissAlert} />
    </div>
  );
};

const mountApp = () => {
  const container = document.getElementById('root');
  if (!container) {
    console.error('Ultimate alert overlay root element not found');
    return;
  }

  const root = createRoot(container);
  root.render(<UltimateAlertOverlay />);
};

mountApp();
