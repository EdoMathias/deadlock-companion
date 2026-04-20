import React from 'react';
import { Edge } from '@overwolf/odk-ts/window/enums/edge';
import type { OverlayWidgetConfig } from '../../../../../shared/types/overlayLayout';
import { HEROES } from '../../../../../shared/data/heroes';

interface Props {
  widget: OverlayWidgetConfig;
}

const PREVIEW_SCALE = 0.75;

function getPositionStyle(edge: Edge): React.CSSProperties {
  const base: React.CSSProperties = { position: 'absolute', transform: `scale(${PREVIEW_SCALE})` };

  switch (edge) {
    case Edge.TopLeft:
      return { ...base, top: 6, left: 6, transformOrigin: 'top left' };
    case Edge.Top:
      return { ...base, top: 6, left: '50%', transform: `translateX(-50%) scale(${PREVIEW_SCALE})`, transformOrigin: 'top center' };
    case Edge.TopRight:
      return { ...base, top: 6, right: 6, transformOrigin: 'top right' };
    case Edge.Left:
      return { ...base, top: '50%', left: 6, transform: `translateY(-50%) scale(${PREVIEW_SCALE})`, transformOrigin: 'center left' };
    case Edge.Right:
      return { ...base, top: '50%', right: 6, transform: `translateY(-50%) scale(${PREVIEW_SCALE})`, transformOrigin: 'center right' };
    case Edge.BottomLeft:
      return { ...base, bottom: 6, left: 6, transformOrigin: 'bottom left' };
    case Edge.Bottom:
      return { ...base, bottom: 6, left: '50%', transform: `translateX(-50%) scale(${PREVIEW_SCALE})`, transformOrigin: 'bottom center' };
    case Edge.BottomRight:
      return { ...base, bottom: 6, right: 6, transformOrigin: 'bottom right' };
    default:
      return { ...base, top: '50%', right: 6, transform: `translateY(-50%) scale(${PREVIEW_SCALE})`, transformOrigin: 'center right' };
  }
}

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(34, 32, 33, 0.92)',
  border: '1px solid rgba(114, 148, 127, 0.5)',
  borderRadius: 6,
  padding: '8px 12px',
  backdropFilter: 'blur(8px)',
  fontFamily: "'Inter', system-ui, sans-serif",
  minWidth: 200,
};

const mainRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const heroImgStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  objectFit: 'cover',
  borderRadius: 4,
  flexShrink: 0,
};

const heroNameStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: '#c8a96a',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  flexShrink: 0,
};

const textStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 11,
  color: '#efdebf',
  lineHeight: 1.3,
};

const playerStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#efdebf',
};

const boughtStyle: React.CSSProperties = {
  color: '#9c8c72',
};

const itemNameStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#72947f',
};

const itemIconStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  objectFit: 'contain',
  borderRadius: 4,
  flexShrink: 0,
};

const MOCK_ITEM_IMAGE =
  'https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/unstoppable.webp';

const descriptionStyle: React.CSSProperties = {
  marginTop: 4,
  paddingTop: 4,
  borderTop: '1px solid rgba(114, 148, 127, 0.25)',
  fontSize: 9,
  color: '#9c8c72',
  lineHeight: 1.4,
};

const WidgetPreview: React.FC<Props> = ({ widget }) => {
  if (!widget.enabled) return null;

  const posStyle = getPositionStyle(widget.dock_edge);
  const showDescription =
    widget.layout_mode === 'expanded' || widget.layout_mode === 'expanded_all';

  return (
    <div className="widget-preview-item" style={posStyle}>
      <div style={cardStyle}>
        <div style={mainRowStyle}>
          <img
            style={heroImgStyle}
            src={HEROES[1]?.images.icon_image_small_webp ?? ''}
            alt="Infernus"
          />
          <span style={heroNameStyle}>INFERNUS</span>
          <span style={textStyle}>
            <span style={playerStyle}>EnemyPlayer42</span>
            <span style={boughtStyle}> bought </span>
            <span style={itemNameStyle}>Unstoppable</span>
          </span>
          <img
            style={itemIconStyle}
            src={MOCK_ITEM_IMAGE}
            alt="Unstoppable"
          />
        </div>
        {showDescription && (
          <div style={descriptionStyle}>
            Active: Become immune to immobilize, slow and debuffs for 3s
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetPreview;
