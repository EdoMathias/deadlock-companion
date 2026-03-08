import React from 'react';
import { getHero } from '../../../../shared/data/heroes';
import type { EnrichedRosterEntry } from '../../../hooks/useLiveMatch';

interface ScoreboardRowProps {
  player: EnrichedRosterEntry;
  elapsedSeconds: number;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const ScoreboardRow: React.FC<ScoreboardRowProps> = ({
  player,
  elapsedSeconds,
}) => {
  const hero = getHero(player.hero_id);
  const elapsedMinutes = elapsedSeconds / 60;
  const lhPerMin =
    elapsedMinutes > 0 ? (player.lastHits / elapsedMinutes).toFixed(1) : '—';

  return (
    <tr
      className={`scoreboard-row${player.is_local ? ' scoreboard-row--local' : ''}`}
    >
      <td className="scoreboard-cell scoreboard-cell--hero">
        {hero?.images.icon_image_small && (
          <img
            className="scoreboard-hero-icon"
            src={hero.images.icon_image_small}
            alt={hero.name}
          />
        )}
        <span className="scoreboard-hero-name">
          {hero?.name ?? player.hero_name}
        </span>
      </td>
      <td className="scoreboard-cell scoreboard-cell--player">
        {player.player_name}
        {player.is_local && <span className="scoreboard-you-badge">YOU</span>}
      </td>
      <td className="scoreboard-cell scoreboard-cell--kda">
        <span className="kda-kills">{player.kills}</span>
        {' / '}
        <span className="kda-deaths">{player.deaths}</span>
        {' / '}
        <span className="kda-assists">{player.assist}</span>
      </td>
      <td className="scoreboard-cell scoreboard-cell--num">{player.souls}</td>
      <td className="scoreboard-cell scoreboard-cell--num">
        {player.lastHits}
      </td>
      <td className="scoreboard-cell scoreboard-cell--num">{lhPerMin}</td>
      <td className="scoreboard-cell scoreboard-cell--num">
        {formatNumber(player.hero_damage)}
      </td>
      <td className="scoreboard-cell scoreboard-cell--num">
        {formatNumber(player.object_damage)}
      </td>
      <td className="scoreboard-cell scoreboard-cell--num">
        {formatNumber(player.hero_healing)}
      </td>
      <td className="scoreboard-cell scoreboard-cell--num">{player.level}</td>
    </tr>
  );
};

export default ScoreboardRow;
