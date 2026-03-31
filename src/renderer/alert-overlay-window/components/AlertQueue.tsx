import React from 'react';
import type { ItemPurchaseAlert } from '../../../shared/types/itemAlerts';
import type { OverlayLayoutMode } from '../../../shared/types/overlayLayout';
import AlertCard from './AlertCard';

interface Props {
  alerts: ItemPurchaseAlert[];
  onDismiss: (id: string) => void;
  layoutMode: OverlayLayoutMode;
}

const AlertQueue: React.FC<Props> = ({ alerts, onDismiss, layoutMode }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="alert-queue">
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss}
          layoutMode={layoutMode}
        />
      ))}
    </div>
  );
};

export default AlertQueue;
