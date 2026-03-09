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
      {!hasMatchData && (
        <div className="view-header">
          <div className="view-header__left">
            <h2 className="view-title">Live Match</h2>
          </div>
          <div className="status-badge status-badge--idle">
            ○ No Active Match
          </div>
        </div>
      )}

      {!hasMatchData ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎮</div>
          <h3 className="empty-state-title">No Active Match</h3>
          <p className="empty-state-description">
            Start a Deadlock match to see your stats live here.
          </p>
          {!steamId && (
            <p className="empty-state-hint">
              Tip: Your Steam ID will be detected automatically when you launch
              the game. Alternatively, you can manually enter it in{' '}
              <strong>Settings → General</strong>.
            </p>
          )}
        </div>
      ) : (
        <div className="live-match-content">
          {/* Compact match header: status + mode + timer + scores + souls */}
          <div className="lm-header">
            <div className="lm-header__top">
              <div className="lm-header__info">
                <span
                  className={`lm-header__status ${
                    isMatchActive
                      ? 'lm-header__status--live'
                      : 'lm-header__status--ended'
                  }`}
                >
                  {isMatchActive ? '● LIVE MATCH' : '■ ENDED'}
                </span>
                {gameMode?.game_mode && (
                  <span className="lm-header__mode">{gameMode.game_mode}</span>
                )}
                {gameMode?.match_mode && (
                  <span className="lm-header__mode lm-header__mode--secondary">
                    {gameMode.match_mode}
                  </span>
                )}
              </div>
              <div className="lm-header__scores">
                <span className="lm-header__team-label lm-header__team-label--amber">
                  {teamNames.amber}
                  {localPlayerTeamId === 2 && (
                    <span className="scoreboard-your-team-badge">YOU</span>
                  )}
                </span>
                <span className="lm-header__kills lm-header__kills--amber">
                  {teamKills(amberPlayers)}
                </span>
                <span className="lm-header__skull">💀</span>
                <span className="lm-header__kills lm-header__kills--sapphire">
                  {teamKills(sapphirePlayers)}
                </span>
                <span className="lm-header__team-label lm-header__team-label--sapphire">
                  {teamNames.sapphire}
                  {localPlayerTeamId === 3 && (
                    <span className="scoreboard-your-team-badge">YOU</span>
                  )}
                </span>
              </div>
            </div>
            <div className="lm-header__meta">
              <span className="lm-header__timer">
                Match Time: {formatTimer(elapsedSeconds)}
              </span>
              {teamScores != null && (
                <span className="lm-header__obj-scores">
                  Objectives: {teamScores.amber} – {teamScores.sapphire}
                </span>
              )}
            </div>
            {totalSouls > 0 && (
              <div className="lm-header__souls">
                <div className="lm-header__souls-labels">
                  <span className="lm-header__souls-val lm-header__souls-val--amber">
                    {amberSouls.toLocaleString()}
                  </span>
                  <span className="lm-header__souls-title">Total Souls</span>
                  <span className="lm-header__souls-val lm-header__souls-val--sapphire">
                    {sapphireSouls.toLocaleString()}
                  </span>
                </div>
                <div className="souls-bar-track">
                  <div
                    className="souls-bar-fill souls-bar-fill--amber"
                    style={{ width: `${amberPct}%` }}
                  />
                </div>
                {leadTeam && soulsLead > 0 && (
                  <div className="lm-header__souls-lead">
                    {leadTeam} leads by {soulsLead.toLocaleString()} souls
                  </div>
                )}
              </div>
            )}
          </div>

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
