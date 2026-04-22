import React from 'react';
import type { EnrichedRosterEntry } from '../../../hooks/useLiveMatch';
import type { ItemMetadata } from '../../../../shared/types/items';
import ScoreboardRow from './ScoreboardRow';

interface ScoreboardTableProps {
  players: EnrichedRosterEntry[];
  elapsedSeconds: number;
  teamLabel: string;
  teamClassName: string;
  isEnemyTeam: boolean;
  itemMetadata: Map<number, ItemMetadata>;
}

const ScoreboardTable: React.FC<ScoreboardTableProps> = ({
  players,
  elapsedSeconds,
  teamLabel,
  teamClassName,
  isEnemyTeam,
  itemMetadata,
}) => {
  const sorted = [...players].sort((a, b) => b.souls - a.souls);

  return (
    <div className={`scoreboard-team ${teamClassName}`}>
      <div className="scoreboard-team__header">{teamLabel}</div>
      <table className="scoreboard-table">
        <thead>
          <tr>
            <th className="scoreboard-th scoreboard-th--hero">Hero</th>
            <th className="scoreboard-th scoreboard-th--player">Player</th>
            <th className="scoreboard-th scoreboard-th--kda">K / D / A</th>
            <th className="scoreboard-th scoreboard-th--num">Souls</th>
            <th className="scoreboard-th scoreboard-th--num">LH</th>
            <th className="scoreboard-th scoreboard-th--num">LH/m</th>
            {isEnemyTeam ? (
              <th className="scoreboard-th scoreboard-th--items" colSpan={4}>
                Items
              </th>
            ) : (
              <>
                <th className="scoreboard-th scoreboard-th--num">DMG</th>
                <th className="scoreboard-th scoreboard-th--num">Obj</th>
                <th className="scoreboard-th scoreboard-th--num">Heal</th>
                <th className="scoreboard-th scoreboard-th--num">Lvl</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((player) => (
            <ScoreboardRow
              key={player.steam_id}
              player={player}
              elapsedSeconds={elapsedSeconds}
              isEnemyTeam={isEnemyTeam}
              itemMetadata={itemMetadata}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScoreboardTable;
