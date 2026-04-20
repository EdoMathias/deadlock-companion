import React from 'react';
import type { ItemPurchaseAlert } from '../../../shared/types/itemAlerts';
import type { OverlayLayoutMode } from '../../../shared/types/overlayLayout';

interface Props {
  alert: ItemPurchaseAlert;
  onDismiss: (id: string) => void;
  layoutMode: OverlayLayoutMode;
}

const AlertCard: React.FC<Props> = ({ alert, onDismiss, layoutMode }) => {
  const showDescription =
    alert.item.description &&
    (layoutMode === 'expanded_all' ||
      (layoutMode === 'expanded' && alert.item.is_active_item));

  return (
    <div className="alert-card" onClick={() => onDismiss(alert.id)}>
      <div className="alert-card-main">
        {alert.hero_image && (
          <img
            className="alert-card-hero-img"
            src={alert.hero_image}
            alt={alert.hero_name}
          />
        )}
        <div className="alert-card-hero">
          <span className="alert-card-hero-name">{alert.hero_name}</span>
        </div>
        <div className="alert-card-text">
          <span className="alert-card-player">{alert.player_name}</span>
          <span className="alert-card-bought"> bought </span>
          <span className="alert-card-item-name">{alert.item.name}</span>
        </div>
        {alert.item.image && (
          <img
            className="alert-card-item-icon"
            src={alert.item.image}
            alt={alert.item.name}
          />
        )}
      </div>
      {showDescription && (
        <div className="alert-card-description">
          {alert.item.description}
        </div>
      )}
    </div>
  );
};

export default AlertCard;
