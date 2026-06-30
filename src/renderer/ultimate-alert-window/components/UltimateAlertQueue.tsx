import React from 'react';
import { Edge } from '@overwolf/odk-ts/window/enums/edge';
import type { UltimateAlert } from '../../../shared/types/ultimateAlerts';
import { getWidgetConfig } from '../../../shared/stores/overlayLayoutStore';
import UltimateAlertCard from './UltimateAlertCard';

interface Props {
  alerts: UltimateAlert[];
  onDismiss: (id: string) => void;
}

const UltimateAlertQueue: React.FC<Props> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  // The card is a fixed width (narrower than the window), so it must hug the
  // side matching the widget's dock edge. Right is the default for top/bottom/
  // center docks and matches the default TopRight dock.
  const edge = getWidgetConfig('ultimate_alert')?.dock_edge;
  const alignClass =
    edge && Edge.isLeft(edge)
      ? 'ultimate-alert-queue--left'
      : 'ultimate-alert-queue--right';

  return (
    <div className={`ultimate-alert-queue ${alignClass}`}>
      {alerts.map((alert) => (
        <UltimateAlertCard key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default UltimateAlertQueue;
