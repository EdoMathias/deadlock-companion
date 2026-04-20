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
}

const PICK_RATE_RAW_TOOLTIP =
  'How often this hero shows up in a match.';

const PICK_RATE_NORMALIZED_TOOLTIP =
  'Each hero\'s games compared to the most-played hero in the filtered pool (top hero = 100%). Kicks in when a "Min matches" filter is on, because the usual pick rate stops meaning real-world popularity once the player pool is trimmed.';

interface ColumnDef {
  key: HeroStatsSortKey;
  label: string;
  className: string;
  tooltip?: string;
}

const HeroStatsTable: React.FC<Props> = ({
  rows,
  sortBy,
  sortDirection,
  onSortChange,
  pickRateNormalized,
}) => {
  const columns: ColumnDef[] = [
    { key: 'name', label: 'Hero', className: 'hero-stats-th--hero' },
    { key: 'win_rate', label: 'Win Rate', className: 'hero-stats-th--winrate' },
    {
      key: 'pick_rate',
      label: pickRateNormalized ? 'Pick Rate (Normalized)' : 'Pick Rate',
      className: 'hero-stats-th--pickrate',
      tooltip: pickRateNormalized
        ? PICK_RATE_NORMALIZED_TOOLTIP
        : PICK_RATE_RAW_TOOLTIP,
    },
    { key: 'ban_rate', label: 'Ban Rate', className: 'hero-stats-th--banrate' },
    { key: 'matches', label: 'Matches', className: 'hero-stats-th--matches' },
  ];

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
              const isSorted = sortBy === col.key;
              return (
                <th
                  key={col.key}
                  className={`hero-stats-th ${col.className} ${isSorted ? 'hero-stats-th--sorted' : ''}`}
                  onClick={() => onSortChange(col.key)}
                  style={{ cursor: 'pointer' }}
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
            <HeroRow key={row.hero_id} row={row} rank={index + 1} />
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
