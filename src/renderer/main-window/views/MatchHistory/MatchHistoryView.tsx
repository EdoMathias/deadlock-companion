import React, { useCallback, useEffect, useState } from 'react';
import { PlayersApi, PlayerMatchHistoryEntry } from 'deadlock_api_client';
import { deadlockApiConfig } from '../../../../shared/services/deadlock-api/deadlockApiClient';
import { useSteamId } from '../../../hooks/useSteamId';
import { steamIdToAccountId } from '../../../../shared/utils/steamUtils';
import { matchCache } from '../../../services/matchCache';
import { getHero } from '../../../../shared/data/heroes';
import MatchDetailView from './MatchDetailView';

const playersApi = new PlayersApi(deadlockApiConfig);

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Match History View
 *
 * Lists the player's recent Deadlock matches from deadlock-api.com.
 * Responses are cached in localStorage for 5 minutes to limit API calls.
 * Requires the player's Steam ID — enter it in Settings > General.
 */
const MatchHistoryView: React.FC = () => {
  const { steamId } = useSteamId();
  const [matches, setMatches] = useState<PlayerMatchHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const accountId = steamId ? steamIdToAccountId(steamId) : null;

  const fetchMatches = useCallback(
    async (forceRefresh = false) => {
      if (!accountId) return;
      setIsLoading(true);
      setError(null);

      try {
        if (!forceRefresh) {
          const cached = await matchCache.getHistory(accountId);
          if (cached) {
            setMatches(cached);
            setIsCached(true);
            setIsLoading(false);
            return;
          }
        }

        setIsCached(false);
        const response = await playersApi.matchHistory({
          accountId,
          onlyStoredHistory: true,
        });
        const data = response.data ?? [];
        await matchCache.setHistory(accountId, data);
        setMatches(data);
      } catch (err) {
        setError('Failed to load match history. Please try again.');
        console.error('Match history fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [accountId],
  );

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  if (selectedMatchId !== null && accountId !== null) {
    return (
      <MatchDetailView
        matchId={selectedMatchId}
        accountId={accountId}
        onBack={() => setSelectedMatchId(null)}
      />
    );
  }

  if (!steamId) {
    return (
      <section className="view-container match-history-container">
        <div className="view-header">
          <h2 className="view-title">Match History</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">���</div>
          <h3 className="empty-state-title">Steam ID Required</h3>
          <p className="empty-state-description">
            Enter your Steam ID in <strong>Settings → General</strong> to view
            your match history.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="view-container match-history-container">
      <div className="view-header">
        <h2 className="view-title">Match History</h2>
        <div className="view-header-actions">
          {isCached && <span className="cache-indicator">Cached</span>}
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => fetchMatches(true)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading-state">
          <p>Loading match history…</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => fetchMatches(true)}
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && matches.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">���</div>
          <h3 className="empty-state-title">No Matches Found</h3>
          <p className="empty-state-description">
            No match history found for this account yet.
          </p>
        </div>
      )}

      {!isLoading && matches.length > 0 && (
        <div className="match-list">
          {matches.map((match) => {
            const isWin = match.match_result === match.player_team;
            const hero = getHero(match.hero_id);
            return (
              <div
                key={match.match_id}
                className={`match-card ${isWin ? 'match-card--win' : 'match-card--loss'}`}
                onClick={() => setSelectedMatchId(match.match_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && setSelectedMatchId(match.match_id)
                }
              >
                <div className="match-card__outcome">
                  {isWin ? 'WIN' : 'LOSS'}
                </div>
                <div className="match-card__details">
                  <span className="match-card__hero">
                    {hero ? hero.name : `Hero ${match.hero_id}`}
                  </span>
                  <span className="match-card__kda">
                    {match.player_kills} / {match.player_deaths} /{' '}
                    {match.player_assists}
                  </span>
                  <span className="match-card__duration">
                    {formatDuration(match.match_duration_s)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MatchHistoryView;
