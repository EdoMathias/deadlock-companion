import React from 'react';
import type {
  HeroStatsComputed,
  HeroStatsSortKey,
} from '../../../../../shared/types/heroStats';
import HeroRow from './HeroRow';
import InfoIcon from '../../../../components/InfoIcon';

interface Props {
  rows: HeroStatsComputed[];
  sortBy: HeroStatsSortKey;
  sortDirection: 'asc' | 'desc';
  onSortChange: (key: HeroStatsSortKey) => void;
  pickRateNormalized: boolean;
  /** Renders the comparison WR + Δ columns (Overall tab's "+ Compare with…"). */
  compareActive?: boolean;
  /** Plain rank name shown in the comparison column header, e.g. "Acolyte". */
  compareLabel?: string;
}

const PICK_RATE_RAW_TOOLTIP =
  'How often this hero shows up in a match.';

const PICK_RATE_NORMALIZED_TOOLTIP =
  'Each hero\'s games compared to the most-played hero in the filtered pool (top hero = 100%). Kicks in when a "Min matches" filter is on, because the usual pick rate stops meaning real-world popularity once the player pool is trimmed.';

const RANK_COMPARE_DELTA_TOOLTIP =
  "The selected rank range's win rate minus the comparison rank's win rate, in percentage points.";

interface ColumnDef {
  /** React key / aria id. Equal to `sortKey` for sortable columns. */
  key: string;
  label: string;
  className: string;
  tooltip?: string;
  /** Present only for columns the user can click to sort by. */
  sortKey?: HeroStatsSortKey;
}

const HeroStatsTable: React.FC<Props> = ({
  rows,
  sortBy,
  sortDirection,
  onSortChange,
  pickRateNormalized,
  compareActive = false,
  compareLabel,
}) => {
  const columns: ColumnDef[] = [
    { key: 'name', sortKey: 'name', label: 'Hero', className: 'hero-stats-th--hero' },
    { key: 'win_rate', sortKey: 'win_rate', label: 'Win Rate', className: 'hero-stats-th--winrate' },
  ];
  if (compareActive) {
    columns.push(
      {
        key: 'compare_win_rate',
        label: `WR · ${compareLabel ?? 'Compare'}`,
        className: 'hero-stats-th--winrate',
      },
      {
        key: 'win_rate_delta',
        sortKey: 'win_rate_delta',
        label: 'Δ',
        className: 'hero-stats-th--winrate',
        tooltip: RANK_COMPARE_DELTA_TOOLTIP,
      },
    );
  }
  columns.push(
    {
      key: 'pick_rate',
      sortKey: 'pick_rate',
      label: pickRateNormalized ? 'Pick Rate (Normalized)' : 'Pick Rate',
      className: 'hero-stats-th--pickrate',
      tooltip: pickRateNormalized
        ? PICK_RATE_NORMALIZED_TOOLTIP
        : PICK_RATE_RAW_TOOLTIP,
    },
    { key: 'ban_rate', sortKey: 'ban_rate', label: 'Ban Rate', className: 'hero-stats-th--banrate' },
    { key: 'matches', sortKey: 'matches', label: 'Matches', className: 'hero-stats-th--matches' },
  );

  return (
    <div className="hero-stats-table-wrapper">
      <table className="hero-stats-table">
        <thead>
          <tr>
            <th
              className="hero-stats-th hero-stats-th--rank"
              aria-label="Rank"
            >
              #
            </th>
            {columns.map((col) => {
              const isSorted = col.sortKey != null && sortBy === col.sortKey;
              return (
                <th
                  key={col.key}
                  className={`hero-stats-th ${col.className} ${isSorted ? 'hero-stats-th--sorted' : ''}`}
                  onClick={col.sortKey ? () => onSortChange(col.sortKey!) : undefined}
                  style={col.sortKey ? { cursor: 'pointer' } : undefined}
                  aria-sort={
                    isSorted
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                      {col.label}
                      {col.tooltip && (
                        <>
                          {' '}
                          <InfoIcon
                            title={col.tooltip}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </>
                      )}
                  {isSorted && (
                    <span className="hero-stats-sort-arrow">
                      {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <HeroRow
              key={row.hero_id}
              row={row}
              rank={index + 1}
              compareActive={compareActive}
            />
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="hero-stats-empty">
          No heroes match the current filters
        </div>
      )}
    </div>
  );
};

export default HeroStatsTable;
