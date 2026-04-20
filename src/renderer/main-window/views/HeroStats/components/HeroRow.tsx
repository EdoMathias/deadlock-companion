import React from 'react';
import type { HeroStatsComputed } from '../../../../../shared/types/heroStats';
import { HEROES } from '../../../../../shared/data/heroes';

interface Props {
  row: HeroStatsComputed;
  rank: number;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const HeroRow: React.FC<Props> = ({ row, rank }) => {
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
      <td className="hero-stats-cell hero-stats-cell--winrate">
        {formatPercent(row.win_rate)}
      </td>
      <td className="hero-stats-cell hero-stats-cell--pickrate">
        {formatPercent(row.pick_rate)}
      </td>
      <td className="hero-stats-cell hero-stats-cell--banrate">
        {formatPercent(row.ban_rate)}
      </td>
      <td className="hero-stats-cell hero-stats-cell--matches">
        {row.matches.toLocaleString()}
      </td>
    </tr>
  );
};

export default HeroRow;
