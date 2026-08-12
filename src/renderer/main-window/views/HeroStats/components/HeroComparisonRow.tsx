import React from 'react';
import type { HeroWinRateComparisonRow } from '../../../../../shared/types/heroStats';
import { HEROES } from '../../../../../shared/data/heroes';

interface Props {
  row: HeroWinRateComparisonRow;
  rank: number;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Delta in percentage points, signed (e.g. `+2.3`, `-1.8`). */
function formatDelta(value: number): string {
  const pts = value * 100;
  const sign = pts > 0 ? '+' : '';
  return `${sign}${pts.toFixed(1)}`;
}

function deltaClass(value: number): string {
  const pts = value * 100;
  if (pts >= 0.05) return 'hero-compare-cell--delta-pos';
  if (pts <= -0.05) return 'hero-compare-cell--delta-neg';
  return 'hero-compare-cell--delta-neutral';
}

const HeroComparisonRow: React.FC<Props> = ({ row, rank }) => {
  const hero = HEROES[row.hero_id];
  const name = hero?.name ?? `Hero #${row.hero_id}`;
  const iconSrc = hero?.images?.icon_image_small;

  return (
    <tr className="hero-stats-row">
      <td className="hero-stats-cell hero-stats-cell--rank">{rank}</td>
      <td className="hero-stats-cell hero-stats-cell--name">
        {iconSrc ? (
          <img className="hero-stats-hero-icon" src={iconSrc} alt="" />
        ) : (
          <div className="hero-stats-hero-icon hero-stats-hero-icon--placeholder" />
        )}
        <span className="hero-stats-hero-name">{name}</span>
      </td>
      <td className="hero-stats-cell hero-compare-cell--ranked">
        {formatPercent(row.ranked_win_rate)}
      </td>
      <td className="hero-stats-cell hero-compare-cell--normal">
        {formatPercent(row.normal_win_rate)}
      </td>
      <td
        className={`hero-stats-cell hero-compare-cell--delta ${deltaClass(
          row.win_rate_delta,
        )}`}
      >
        {formatDelta(row.win_rate_delta)}
      </td>
    </tr>
  );
};

export default HeroComparisonRow;
