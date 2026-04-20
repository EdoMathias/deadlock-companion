import React from 'react';
import type { ItemStatsRow } from '../../../../../shared/types/items';

interface Props {
  row: ItemStatsRow;
  onToggleTrack: (itemId: number) => void;
}

const SLOT_COLORS: Record<string, string> = {
  weapon: '#c8a96a',
  spirit: '#a87fd4',
  vitality: '#6aaa6a',
};

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatPercent(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

const ItemRow: React.FC<Props> = ({ row, onToggleTrack }) => {
  const { metadata, analytics, isTracked } = row;

  return (
    <tr className="item-stats-row">

      <td className="item-stats-cell item-stats-cell--track">
        <button
          className={`item-stats-track-btn ${isTracked ? 'item-stats-track-btn--active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleTrack(metadata.id);
          }}
          title={isTracked ? 'Stop tracking this item' : 'Track this item for in-game alerts'}
        >
          {isTracked ? '🔔' : '🔕'}
        </button>
      </td>
      <td className="item-stats-cell item-stats-cell--icon">
        {metadata.shop_image_webp || metadata.shop_image ? (
          <img
            className="item-stats-item-icon"
            src={metadata.shop_image_webp ?? metadata.shop_image ?? ''}
            alt={metadata.name}
            loading="lazy"
          />
        ) : (
          <div className="item-stats-item-icon item-stats-item-icon--placeholder" />
        )}
      </td>
      <td className="item-stats-cell item-stats-cell--name">
        <span className="item-stats-item-name">{metadata.name}</span>
        {metadata.is_active_item && (
          <span className="item-stats-badge item-stats-badge--active">Active</span>
        )}
      </td>
      <td className="item-stats-cell item-stats-cell--tier">T{metadata.item_tier}</td>
      <td className="item-stats-cell item-stats-cell--slot">
        <span
          className="item-stats-slot-dot"
          style={{ backgroundColor: SLOT_COLORS[metadata.item_slot_type] ?? '#888' }}
        />
        {metadata.item_slot_type}
      </td>
      <td className="item-stats-cell item-stats-cell--cost">
        {metadata.cost != null ? metadata.cost.toLocaleString() : '—'}
      </td>
      <td className="item-stats-cell item-stats-cell--winrate">
        {formatPercent(analytics?.win_rate)}
      </td>
      <td className="item-stats-cell item-stats-cell--pickrate">
        {formatPercent(analytics?.pick_rate)}
      </td>
      <td className="item-stats-cell item-stats-cell--buytime">
        {analytics ? formatTime(analytics.avg_buy_time_s) : '—'}
      </td>
      <td className="item-stats-cell item-stats-cell--matches">
        {analytics?.matches?.toLocaleString() ?? '—'}
      </td>
    </tr>
  );
};

export default ItemRow;
