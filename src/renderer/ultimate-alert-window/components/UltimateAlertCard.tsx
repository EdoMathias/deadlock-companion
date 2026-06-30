import React from 'react';
import type { UltimateAlert } from '../../../shared/types/ultimateAlerts';
import { UltReadyIcon, UltUnlockedIcon } from '../../components/UltimateGlyphIcons';

interface Props {
  alert: UltimateAlert;
  onDismiss: (id: string) => void;
}

function relationLabel(relation: UltimateAlert['team_relation']): string {
  if (relation === 'self') return 'You';
  if (relation === 'ally') return 'Ally';
  return 'Enemy';
}

const UltimateAlertCard: React.FC<Props> = ({ alert, onDismiss }) => {
  const isReady = alert.kind === 'ready';
  const glyphClass = isReady
    ? 'ultimate-alert-glyph ultimate-alert-glyph--ready'
    : 'ultimate-alert-glyph ultimate-alert-glyph--unlocked';
  const label = isReady ? 'Ult Ready' : 'Ult Unlocked';

  return (
    <div className="ultimate-alert-card" onClick={() => onDismiss(alert.id)}>
      {alert.hero_image && (
        <img
          className="ultimate-alert-hero-img"
          src={alert.hero_image}
          alt={alert.hero_name}
        />
      )}
      <span className="ultimate-alert-hero-name">{alert.hero_name}</span>
      <span className="ultimate-alert-status">
        <span className={glyphClass}>
          {isReady ? <UltReadyIcon size={17} /> : <UltUnlockedIcon size={17} />}
        </span>
        <span className="ultimate-alert-label">{label}</span>
      </span>
      <span className="ultimate-alert-relation">{relationLabel(alert.team_relation)}</span>
    </div>
  );
};

export default UltimateAlertCard;
