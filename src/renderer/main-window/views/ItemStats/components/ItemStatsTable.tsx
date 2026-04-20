import React from 'react';
import type { ItemStatsRow, ItemStatsFilters } from '../../../../../shared/types/items';
import ItemRow from './ItemRow';

interface Props {
  rows: ItemStatsRow[];
  filters: ItemStatsFilters;
  onToggleTrack: (itemId: number) => void;
  onSortChange: (sortBy: ItemStatsFilters['sort_by']) => void;
}

type SortKey = NonNullable<ItemStatsFilters['sort_by']>;

const COLUMN_HEADERS: { key: SortKey | null; label: string; className: string }[] = [
  { key: null, label: '', className: 'item-stats-th--track' },
  { key: null, label: '', className: 'item-stats-th--icon' },
  { key: null, label: 'Name', className: 'item-stats-th--name' },
  { key: null, label: 'Tier', className: 'item-stats-th--tier' },
  { key: null, label: 'Slot', className: 'item-stats-th--slot' },
  { key: null, label: 'Cost', className: 'item-stats-th--cost' },
  { key: 'win_rate', label: 'Win Rate', className: 'item-stats-th--winrate' },
  { key: 'matches', label: 'Pick Rate', className: 'item-stats-th--pickrate' },
  { key: 'avg_buy_time_s', label: 'Avg Buy', className: 'item-stats-th--buytime' },
  { key: 'matches', label: 'Matches', className: 'item-stats-th--matches' },
];

const ItemStatsTable: React.FC<Props> = ({
  rows,
  filters,
  onToggleTrack,
  onSortChange,
}) => {
  return (
    <div className="item-stats-table-wrapper">
      <table className="item-stats-table">
        <thead>
          <tr>
            {COLUMN_HEADERS.map((col, i) => (
              <th
                key={i}
                className={`item-stats-th ${col.className} ${col.key && filters.sort_by === col.key ? 'item-stats-th--sorted' : ''}`}
                onClick={col.key ? () => onSortChange(col.key!) : undefined}
                style={col.key ? { cursor: 'pointer' } : undefined}
              >
                {col.label}
                {col.key && filters.sort_by === col.key && (
                  <span className="item-stats-sort-arrow">
                    {filters.sort_direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ItemRow
              key={row.metadata.id}
              row={row}
              onToggleTrack={onToggleTrack}
            />
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="item-stats-empty">
          No items match the current filters
        </div>
      )}
    </div>
  );
};

export default ItemStatsTable;
