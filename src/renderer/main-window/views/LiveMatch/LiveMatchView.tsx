import React from 'react';
import { useSteamId } from '../../../hooks/useSteamId';
import { useLiveMatch } from '../../../hooks/useLiveMatch';
import type { EnrichedRosterEntry } from '../../../hooks/useLiveMatch';
import type { GameModeInfo } from '../../../../shared/types/liveMatch';
import ScoreboardTable from './ScoreboardTable';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getTeamNames(gameMode: GameModeInfo | null): {
  amber: string;
  sapphire: string;
} {
  if (gameMode?.game_mode === 'Street Brawl') {
    return { amber: 'Hidden King', sapphire: 'ArchMother' };
  }
  return { amber: 'Amber', sapphire: 'Sapphire' };
}

const LiveMatchView: React.FC = () => {
  const { steamId } = useSteamId();
  const {
    isMatchActive,
    isMatchEnded,
    roster,
    matchId,
    elapsedSeconds,
    gameMode,
    teamScores,
  } = useLiveMatch();

  const hasMatchData = isMatchActive || isMatchEnded;

  // Deadlock uses team_id 2 = Amber, 3 = Sapphire
  const amberPlayers = roster.filter((p) => p.team_id === 2);
  const sapphirePlayers = roster.filter((p) => p.team_id === 3);

  // Team-level stat totals
  const teamKills = (players: EnrichedRosterEntry[]) =>
    players.reduce((sum, p) => sum + p.kills, 0);

  const teamNames = getTeamNames(gameMode);

  // Determine which team the local player is on
  const localPlayerTeamId = roster.find((p) => p.is_local)?.team_id ?? null;

  // Total souls per team for the comparison bar
  const amberSouls = amberPlayers.reduce((sum, p) => sum + p.souls, 0);
  const sapphireSouls = sapphirePlayers.reduce((sum, p) => sum + p.souls, 0);
  const totalSouls = amberSouls + sapphireSouls;
  const amberPct = totalSouls > 0 ? (amberSouls / totalSouls) * 100 : 50;
  const soulsLead = Math.abs(amberSouls - sapphireSouls);
  const leadTeam =
    amberSouls > sapphireSouls
      ? teamNames.amber
      : sapphireSouls > amberSouls
        ? teamNames.sapphire
        : null;

  return (
    <section className="view-container live-match-container">
      <div className="view-header">
        <div className="view-header__left">
          <h2 className="view-title">Live Match</h2>
          {gameMode && (
            <div className="scoreboard-game-mode">
              {gameMode.game_mode && (
                <span className="scoreboard-match-mode-badge">
                  {gameMode.game_mode}
                </span>
              )}
              {gameMode.match_mode && (
                <span className="scoreboard-match-mode-badge scoreboard-match-mode-badge--secondary">
                  {gameMode.match_mode}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={`status-badge ${
            isMatchActive
              ? 'status-badge--active'
              : isMatchEnded
                ? 'status-badge--ended'
                : 'status-badge--idle'
          }`}
        >
          {isMatchActive
            ? '● Live'
            : isMatchEnded
              ? '■ Match Ended'
              : '○ No Active Match'}
        </div>
      </div>

      {!hasMatchData ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎮</div>
          <h3 className="empty-state-title">No Active Match</h3>
          <p className="empty-state-description">
            Launch Deadlock to see your live match stats here.
          </p>
          {!steamId && (
            <p className="empty-state-hint">
              Tip: Enter your Steam ID in Settings to unlock match history and
              profile features.
            </p>
          )}
        </div>
      ) : (
        <div className="live-match-content">
          {/* Match header bar */}
          <div className="scoreboard-header">
            <div className="scoreboard-header__team scoreboard-header__team--amber">
              <span className="scoreboard-header__team-name">
                {teamNames.amber}
                {localPlayerTeamId === 2 && (
                  <span className="scoreboard-your-team-badge">YOUR TEAM</span>
                )}
              </span>
              <span className="scoreboard-header__team-kills">
                {teamKills(amberPlayers)}
              </span>
              {teamScores != null && (
                <span className="scoreboard-header__team-score">
                  {teamScores.amber}
                </span>
              )}
            </div>

            <div className="scoreboard-header__center">
              <span className="scoreboard-header__timer">
                {formatTimer(elapsedSeconds)}
              </span>
              {matchId && (
                <span className="scoreboard-header__match-id">#{matchId}</span>
              )}
            </div>

            <div className="scoreboard-header__team scoreboard-header__team--sapphire">
              {teamScores != null && (
                <span className="scoreboard-header__team-score">
                  {teamScores.sapphire}
                </span>
              )}
              <span className="scoreboard-header__team-kills">
                {teamKills(sapphirePlayers)}
              </span>
              <span className="scoreboard-header__team-name">
                {teamNames.sapphire}
                {localPlayerTeamId === 3 && (
                  <span className="scoreboard-your-team-badge">YOUR TEAM</span>
                )}
              </span>
            </div>
          </div>

          {/* Souls comparison bar */}
          {totalSouls > 0 && (
            <div className="souls-bar-container">
              <div className="souls-bar-labels">
                <span className="souls-bar-value souls-bar-value--amber">
                  {amberSouls.toLocaleString()}
                </span>
                <span className="souls-bar-title">
                  Souls
                  {leadTeam && soulsLead > 0 && (
                    <span className="souls-bar-lead">
                      {' '}
                      ({leadTeam} +{soulsLead.toLocaleString()})
                    </span>
                  )}
                </span>
                <span className="souls-bar-value souls-bar-value--sapphire">
                  {sapphireSouls.toLocaleString()}
                </span>
              </div>
              <div className="souls-bar-track">
                <div
                  className="souls-bar-fill souls-bar-fill--amber"
                  style={{ width: `${amberPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Scoreboard tables */}
          {roster.length > 0 ? (
            <div className="live-match-scoreboard">
              <ScoreboardTable
                players={amberPlayers}
                elapsedSeconds={elapsedSeconds}
                teamLabel={`Team ${teamNames.amber}`}
                teamClassName="scoreboard-team--amber"
              />
              <ScoreboardTable
                players={sapphirePlayers}
                elapsedSeconds={elapsedSeconds}
                teamLabel={`Team ${teamNames.sapphire}`}
                teamClassName="scoreboard-team--sapphire"
              />
            </div>
          ) : (
            <div className="scoreboard-waiting">
              <p>Waiting for players…</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default LiveMatchView;
