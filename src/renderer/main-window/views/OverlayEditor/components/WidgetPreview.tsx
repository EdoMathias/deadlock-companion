import React from 'react';
import { Edge } from '@overwolf/odk-ts/window/enums/edge';
import type { OverlayWidgetConfig } from '../../../../../shared/types/overlayLayout';
import { HEROES } from '../../../../../shared/data/heroes';
import { UltReadyIcon, UltUnlockedIcon } from '../../../../components/UltimateGlyphIcons';

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

/* ── Shared styles ─────────────────────────────────────────────────── */

const cardBase: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(34, 32, 33, 0.92)',
  border: '1px solid rgba(114, 148, 127, 0.5)',
  borderRadius: 6,
  backdropFilter: 'blur(8px)',
  fontFamily: "'Inter', system-ui, sans-serif",
};

/* ── Alert preview styles ──────────────────────────────────────────── */

const alertCardStyle: React.CSSProperties = {
  ...cardBase,
  padding: '8px 12px',
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

/* ── Counter Items preview styles ──────────────────────────────────── */

const ciCardStyle: React.CSSProperties = {
  ...cardBase,
  minWidth: 180,
  maxWidth: 220,
  overflow: 'hidden',
};

const ciHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 10px',
  borderBottom: '1px solid rgba(63, 93, 77, 0.6)',
  background: 'rgba(47, 68, 66, 0.6)',
};

const ciTitleStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: '#efdebf',
};

const ciHintStyle: React.CSSProperties = {
  fontSize: 8,
  color: '#9c8c72',
  background: 'rgba(255,255,255,0.06)',
  padding: '1px 5px',
  borderRadius: 3,
};

const ciEnemyRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  padding: '5px 10px',
  borderBottom: '1px solid rgba(63, 93, 77, 0.6)',
};

const ciEnemyBtnStyle = (active: boolean): React.CSSProperties => ({
  width: 22,
  height: 22,
  borderRadius: 3,
  border: active ? '1.5px solid #72947f' : '1.5px solid transparent',
  opacity: active ? 1 : 0.35,
  overflow: 'hidden',
  padding: 0,
  background: 'rgba(47, 68, 66, 0.6)',
});

const ciEnemyIconStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const ciItemRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};

const ciItemImgStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  objectFit: 'contain',
  borderRadius: 2,
  background: 'rgba(47, 68, 66, 0.6)',
  flexShrink: 0,
};

const ciItemNameStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 9,
  fontWeight: 500,
  color: '#efdebf',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const ciWrStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 600,
  color: '#72947f',
  flexShrink: 0,
};

const MOCK_ENEMY_IDS = [15, 2, 8, 11, 35];
const MOCK_ITEMS = [
  { name: 'Unstoppable', wr: '54.2%', img: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/items/vitality/unstoppable.webp' },
  { name: 'Mystic Reverb', wr: '53.1%', img: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/items/spirit/mystic_reverb.webp' },
  { name: 'Crippling Headshot', wr: '52.8%', img: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/crippling_headshot.webp' },
];

/* ── Sub-components ────────────────────────────────────────────────── */

const AlertPreview: React.FC<{ widget: OverlayWidgetConfig }> = ({ widget }) => {
  const showDescription =
    widget.layout_mode === 'expanded' || widget.layout_mode === 'expanded_all';

  return (
    <div style={alertCardStyle}>
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
  );
};

const CounterItemsPreview: React.FC = () => (
  <div style={ciCardStyle}>
    <div style={ciHeaderStyle}>
      <span style={ciTitleStyle}>Counter Items</span>
      <span style={ciHintStyle}>Alt+Shift+F</span>
    </div>
    <div style={ciEnemyRowStyle}>
      {MOCK_ENEMY_IDS.map((id, i) => {
        const hero = HEROES[id];
        const img = hero?.images.icon_image_small_webp ?? hero?.images.icon_image_small;
        return (
          <div key={id} style={ciEnemyBtnStyle(i < 4)}>
            {img && <img style={ciEnemyIconStyle} src={img} alt={hero?.name ?? ''} />}
          </div>
        );
      })}
    </div>
    {MOCK_ITEMS.map((item) => (
      <div key={item.name} style={ciItemRowStyle}>
        <img style={ciItemImgStyle} src={item.img} alt={item.name} />
        <span style={ciItemNameStyle}>{item.name}</span>
        <span style={ciWrStyle}>{item.wr}</span>
      </div>
    ))}
  </div>
);

/* ── Ultimate Alert preview styles ────────────────────────────────── */

const ultCardStyle: React.CSSProperties = {
  ...cardBase,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 7,
  width: 320,
};

/* Relation colors mirror the in-game card: red = enemy, green = team. */
const ULT_ENEMY_RGB = '168, 70, 50';
const ULT_TEAM_RGB = '114, 148, 127';

const ultHeroImgStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  objectFit: 'cover',
  borderRadius: 5,
  flexShrink: 0,
};

const ultHeroNameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#c8a96a',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  flexShrink: 0,
  minWidth: 66,
};

const ultStatusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  flex: 1,
};

const ultGlyphStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  color: '#72947f',
  lineHeight: 1,
};

const ultLabelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#efdebf',
  whiteSpace: 'nowrap',
};

const ultRelationStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#9c8c72',
  flexShrink: 0,
};

const ultStackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

interface UltPreviewCardProps {
  widget: OverlayWidgetConfig;
  relationRgb: string;
  relationLabel: string;
  heroId: number;
  kind: 'ready' | 'unlocked';
}

const UltimateAlertPreviewCard: React.FC<UltPreviewCardProps> = ({
  widget,
  relationRgb,
  relationLabel,
  heroId,
  kind,
}) => {
  const showBorder = widget.relation_border !== false;
  const showTint = widget.relation_tint !== false;
  const showPulse = widget.appear_pulse !== false;
  const isReady = kind === 'ready';

  const hero = HEROES[heroId];
  const heroImg = hero?.images.icon_image_small_webp ?? hero?.images.icon_image_small ?? '';
  const heroName = (hero?.name ?? '').toUpperCase();

  const style: React.CSSProperties = {
    ...ultCardStyle,
    ...(showBorder && { border: `2px solid rgb(${relationRgb})` }),
    ...(showTint && {
      backgroundImage: `linear-gradient(rgba(${relationRgb}, 0.18), rgba(${relationRgb}, 0.18))`,
    }),
  };

  return (
    <div className={showPulse ? 'ult-preview-pulse-anim' : undefined} style={style}>
      <img style={ultHeroImgStyle} src={heroImg} alt={heroName} />
      <span style={ultHeroNameStyle}>{heroName}</span>
      <span style={ultStatusStyle}>
        <span style={{ ...ultGlyphStyle, color: isReady ? '#72947f' : '#c8a96a' }}>
          {isReady ? <UltReadyIcon size={17} /> : <UltUnlockedIcon size={17} />}
        </span>
        <span style={ultLabelStyle}>{isReady ? 'Ult Ready' : 'Ult Unlocked'}</span>
      </span>
      <span style={ultRelationStyle}>{relationLabel}</span>
    </div>
  );
};

const UltimateAlertPreview: React.FC<{ widget: OverlayWidgetConfig }> = ({ widget }) => {
  // Re-mount the stack whenever the pulse toggle flips so the CSS animation
  // replays, giving the user a live preview of the effect on toggle.
  const pulseKey = widget.appear_pulse !== false ? 'pulse-on' : 'pulse-off';

  return (
    <div style={ultStackStyle} key={pulseKey}>
      <UltimateAlertPreviewCard
        widget={widget}
        relationRgb={ULT_ENEMY_RGB}
        relationLabel="Enemy"
        heroId={1}
        kind="ready"
      />
      <UltimateAlertPreviewCard
        widget={widget}
        relationRgb={ULT_TEAM_RGB}
        relationLabel="Ally"
        heroId={2}
        kind="unlocked"
      />
    </div>
  );
};

/* ── Main component ────────────────────────────────────────────────── */

const WidgetPreview: React.FC<Props> = ({ widget }) => {
  if (!widget.enabled) return null;

  const posStyle = getPositionStyle(widget.dock_edge);

  return (
    <div className="widget-preview-item" style={posStyle}>
      {widget.widget_id === 'counter_items' ? (
        <CounterItemsPreview />
      ) : widget.widget_id === 'ultimate_alert' ? (
        <UltimateAlertPreview widget={widget} />
      ) : (
        <AlertPreview widget={widget} />
      )}
    </div>
  );
};

export default WidgetPreview;
