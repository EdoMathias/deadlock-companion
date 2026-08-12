import React from 'react';
import type {
  HeroWinRateComparisonRow,
  HeroComparisonSortKey,
} from '../../../../../shared/types/heroStats';
import HeroComparisonRow from './HeroComparisonRow';
import InfoIcon from '../../../../components/InfoIcon';

interface Props {
  rows: HeroWinRateComparisonRow[];
  sortBy: HeroComparisonSortKey;
  sortDirection: 'asc' | 'desc';
  onSortChange: (key: HeroComparisonSortKey) => void;
}

const DELTA_TOOLTIP =
  'Ranked win rate minus Normal (unranked) win rate, in percentage points. Positive means the hero wins more in ranked than in normal play.';

interface ColumnDef {
  key: HeroComparisonSortKey;
  label: string;
  className: string;
  tooltip?: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Hero', className: 'hero-stats-th--hero' },
  {
    key: 'ranked_win_rate',
    label: 'Ranked WR',
    className: 'hero-stats-th--winrate',
  },
  {
    key: 'normal_win_rate',
    label: 'Normal WR',
    className: 'hero-stats-th--winrate',
  },
  {
    key: 'win_rate_delta',
    label: 'Δ (Ranked − Normal)',
    className: 'hero-stats-th--winrate',
    tooltip: DELTA_TOOLTIP,
  },
];

const HeroComparisonTable: React.FC<Props> = ({
  rows,
  sortBy,
  sortDirection,
  onSortChange,
}) => {
  return (
    <div className="hero-stats-table-wrapper">
      <table className="hero-stats-table">
        <thead>
          <tr>
            <th className="hero-stats-th hero-stats-th--rank" aria-label="Rank">
              #
            </th>
            {COLUMNS.map((col) => {
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
            <HeroComparisonRow
              key={row.hero_id}
              row={row}
              rank={index + 1}
            />
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="hero-stats-empty">
          No heroes have enough ranked and normal games to compare in the
          current filters
        </div>
      )}
    </div>
  );
};

export default HeroComparisonTable;
