import React, { useCallback, useEffect, useState } from 'react';
import { MatchesApi } from 'deadlock_api_client';
import { deadlockApiConfig } from '../../../../shared/services/deadlock-api/deadlockApiClient';
import { matchCache } from '../../../services/matchCache';
import { getHero } from '../../../../shared/data/heroes';
import type { MatchMetadataResponse, MatchPlayer } from './matchMetadata.types';

const matchesApi = new MatchesApi(deadlockApiConfig);

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatNetWorth(nw: number): string {
  if (nw >= 1000) return `${(nw / 1000).toFixed(1)}k`;
  return String(nw);
}

interface MatchDetailViewProps {
  matchId: number;
  accountId: number;
  onBack: () => void;
}

interface TeamTableProps {
  players: MatchPlayer[];
  accountId: number;
  teamLabel: string;
  isWinner: boolean;
}

const TeamTable: React.FC<TeamTableProps> = ({
  players,
  accountId,
  teamLabel,
  isWinner,
}) => (
  <div className="match-detail-team">
    <div
      className={`match-detail-team__title ${isWinner ? 'match-detail-team__title--win' : 'match-detail-team__title--loss'}`}
    >
      {teamLabel}
      <span className="match-detail-team__result">
        {isWinner ? 'WIN' : 'LOSS'}
      </span>
    </div>
    <table className="match-detail-table">
      <thead>
        <tr>
          <th className="match-detail-table__hero">Hero</th>
          <th className="match-detail-table__kda">K / D / A</th>
          <th className="match-detail-table__nw">Net Worth</th>
          <th className="match-detail-table__lh">Last Hits</th>
          <th className="match-detail-table__lvl">Lvl</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player) => {
          const hero = getHero(player.hero_id);
          const isSelf = player.account_id === accountId;
          return (
            <tr
              key={player.account_id}
              className={`match-detail-row${isSelf ? ' match-detail-row--self' : ''}`}
            >
              <td className="match-detail-table__hero">
                {hero ? hero.name : `Hero ${player.hero_id}`}
              </td>
              <td className="match-detail-table__kda">
                {player.kills} / {player.deaths} / {player.assists}
              </td>
              <td className="match-detail-table__nw">
                {formatNetWorth(player.net_worth)}
              </td>
              <td className="match-detail-table__lh">{player.last_hits}</td>
              <td className="match-detail-table__lvl">{player.level}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const MatchDetailView: React.FC<MatchDetailViewProps> = ({
  matchId,
  accountId,
  onBack,
}) => {
  const [metadata, setMetadata] = useState<MatchMetadataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cached =
        await matchCache.getMetadata<MatchMetadataResponse>(matchId);
      if (cached) {
        setMetadata(cached);
        setIsLoading(false);
        return;
      }
    } catch {
      // IDB unavailable — fall through to API fetch
    }

    try {
      const response = await matchesApi.metadata({ matchId });
      const data = response.data as unknown as MatchMetadataResponse;
      await matchCache.setMetadata(matchId, data);
      setMetadata(data);
    } catch (err) {
      setError('Failed to load match details. Please try again.');
      console.error('Match metadata fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const info = metadata?.match_info;
  const team0 = info?.players.filter((p) => p.team === 0) ?? [];
  const team1 = info?.players.filter((p) => p.team === 1) ?? [];

  return (
    <section className="view-container match-detail-container">
      <div className="match-detail-header">
        <button className="btn btn--secondary btn--sm" onClick={onBack}>
          ← Back
        </button>
        {info && (
          <div className="match-detail-header__info">
            <span className="match-detail-header__id">
              Match #{info.match_id}
            </span>
            <span className="match-detail-header__duration">
              {formatDuration(info.duration_s)}
            </span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="loading-state">
          <p>Loading match details…</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button
            className="btn btn--secondary btn--sm"
            onClick={fetchMetadata}
          >
            Retry
          </button>
        </div>
      )}

      {info && (
        <div className="match-detail-teams">
          <TeamTable
            players={team0}
            accountId={accountId}
            teamLabel="Team Amber"
            isWinner={info.winning_team === 0}
          />
          <TeamTable
            players={team1}
            accountId={accountId}
            teamLabel="Team Sapphire"
            isWinner={info.winning_team === 1}
          />
        </div>
      )}
    </section>
  );
};

export default MatchDetailView;
