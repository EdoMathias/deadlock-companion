import React from 'react';
import type { HeroStatsComputed } from '../../../../../shared/types/heroStats';
import { HEROES } from '../../../../../shared/data/heroes';
import {
  formatPercent,
  formatDelta,
  deltaClass,
  winRateBarFill,
  ratePercent,
} from '../utils/winRateFormat';

interface Props {
  row: HeroStatsComputed;
  rank: number;
  /** Renders the comparison WR + Δ columns (Overall tab's "+ Compare with…"). */
  compareActive?: boolean;
}

const HeroRow: React.FC<Props> = ({ row, rank, compareActive = false }) => {
  const hero = HEROES[row.hero_id];
  const name = hero?.name ?? `Hero #${row.hero_id}`;
  const iconSrc = hero?.images?.icon_image_small;
  const winRateBar = winRateBarFill(row.win_rate);

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
        <div className="hero-stats-winrate-cell">
          <span className="hero-stats-winrate-value">{formatPercent(row.win_rate)}</span>
          <span className="hero-stats-winrate-bar" aria-hidden="true">
            <span className="hero-stats-winrate-bar-center" />
            <span
              className={`hero-stats-winrate-bar-fill ${
                winRateBar.positive
                  ? 'hero-stats-winrate-bar-fill--pos'
                  : 'hero-stats-winrate-bar-fill--neg'
              }`}
              style={
                winRateBar.positive
                  ? { left: '50%', width: `${winRateBar.widthPercent}%` }
                  : { right: '50%', width: `${winRateBar.widthPercent}%` }
              }
            />
          </span>
        </div>
      </td>
      {compareActive && (
        <>
          <td className="hero-stats-cell hero-compare-cell--normal">
            {row.compare_win_rate != null ? formatPercent(row.compare_win_rate) : '—'}
          </td>
          <td
            className={`hero-stats-cell hero-compare-cell--delta ${
              row.win_rate_delta != null
                ? deltaClass(row.win_rate_delta)
                : 'hero-compare-cell--delta-neutral'
            }`}
          >
            {row.win_rate_delta != null ? formatDelta(row.win_rate_delta) : '—'}
          </td>
        </>
      )}
      <td className="hero-stats-cell hero-stats-cell--pickrate">
        <div className="hero-stats-rate-cell">
          <span className="hero-stats-rate-value">{formatPercent(row.pick_rate)}</span>
          <span className="hero-stats-rate-bar" aria-hidden="true">
            <span
              className="hero-stats-rate-bar-fill hero-stats-rate-bar-fill--pick"
              style={{ width: `${ratePercent(row.pick_rate)}%` }}
            />
          </span>
        </div>
      </td>
      <td className="hero-stats-cell hero-stats-cell--banrate">
        <div className="hero-stats-rate-cell">
          <span className="hero-stats-rate-value">{formatPercent(row.ban_rate)}</span>
          <span className="hero-stats-rate-bar" aria-hidden="true">
            <span
              className="hero-stats-rate-bar-fill hero-stats-rate-bar-fill--ban"
              style={{ width: `${ratePercent(row.ban_rate)}%` }}
            />
          </span>
        </div>
      </td>
      <td className="hero-stats-cell hero-stats-cell--matches">
        {row.matches.toLocaleString()}
      </td>
    </tr>
  );
};

export default HeroRow;
