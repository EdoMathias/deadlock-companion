import React, { useCallback, useEffect, useState } from 'react';
import {
  PlayersApi,
  PlayerMatchHistoryEntry,
  SteamProfile,
} from 'deadlock_api_client';
import { deadlockApiConfig } from '../../../../shared/services/deadlock-api/deadlockApiClient';
import { fetchSteamProfileDirect } from '../../../../shared/services/steamWebApi';
import { useSteamId } from '../../../hooks/useSteamId';
import { steamIdToAccountId } from '../../../../shared/utils/steamUtils';
import { apiCache } from '../../../../shared/utils/apiCache';

const playersApi = new PlayersApi(deadlockApiConfig);

interface AggregateStats {
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
}

function computeStats(matches: PlayerMatchHistoryEntry[]): AggregateStats {
  const count = matches.length;
  if (count === 0) {
    return {
      matches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgKills: 0,
      avgDeaths: 0,
      avgAssists: 0,
    };
  }
  let wins = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  for (const m of matches) {
    if (m.match_result === m.player_team) wins++;
    totalKills += m.player_kills ?? 0;
    totalDeaths += m.player_deaths ?? 0;
    totalAssists += m.player_assists ?? 0;
  }
  return {
    matches: count,
    wins,
    losses: count - wins,
    winRate: (wins / count) * 100,
    avgKills: totalKills / count,
    avgDeaths: totalDeaths / count,
    avgAssists: totalAssists / count,
  };
}

/**
 * Profile View
 *
 * Shows the player's Deadlock account stats and rank information,
 * sourced from deadlock-api.com.
 * Requires the player's Steam ID — enter it in Settings > General.
 */
const ProfileView: React.FC = () => {
  const { steamId } = useSteamId();
  const [steam, setSteam] = useState<SteamProfile | null>(null);
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const accountId = steamId ? steamIdToAccountId(steamId) : null;

  const fetchProfile = useCallback(
    async (forceRefresh = false) => {
      if (!accountId || !steamId) return;
      setIsLoading(true);
      setError(null);
      try {
        let steamProfile: SteamProfile | null = null;
        let matchHistory: PlayerMatchHistoryEntry[] | null = null;

        if (!forceRefresh) {
          steamProfile = apiCache.get<SteamProfile>('steam_profile', accountId);
          matchHistory = apiCache.get<PlayerMatchHistoryEntry[]>(
            'match_history',
            accountId,
          );
        }

        if (steamProfile && matchHistory) {
          setSteam(steamProfile);
          setStats(computeStats(matchHistory));
          setIsCached(true);
          setIsLoading(false);
          return;
        }

        setIsCached(false);
        const fetches: Promise<void>[] = [];

        if (!steamProfile) {
          console.log('Fetching Steam profile for accountId', accountId);
          fetches.push(
            playersApi.steam({ accountIds: [accountId] }).then(async (res) => {
              steamProfile =
                Array.isArray(res.data) && res.data.length > 0
                  ? (res.data[0] ?? null)
                  : null;

              if (!steamProfile) {
                console.log(
                  'steam returned empty, falling back to Steam Web API for',
                  steamId,
                );
                steamProfile = await fetchSteamProfileDirect(steamId);

                console.log(
                  'Saved Steam profile from Web API fallback:',
                  steamProfile,
                );
              }

              if (steamProfile) {
                apiCache.set(
                  'steam_profile',
                  accountId,
                  steamProfile,
                  apiCache.TTL.STEAM_PROFILE,
                );
              }
            }),
          );
        }

        if (!matchHistory) {
          fetches.push(
            playersApi
              .matchHistory({ accountId, onlyStoredHistory: true })
              .then((res) => {
                matchHistory = res.data ?? [];
                apiCache.set(
                  'match_history',
                  accountId,
                  matchHistory,
                  apiCache.TTL.MATCH_HISTORY,
                );
              }),
          );
        }

        await Promise.all(fetches);
        setSteam(steamProfile);
        setStats(computeStats(matchHistory ?? []));
      } catch (err) {
        setError('Failed to load profile. Please try again.');
        console.error('Profile fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [accountId, steamId],
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (!steamId) {
    return (
      <section className="view-container profile-container">
        <div className="view-header">
          <h2 className="view-title">Profile</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3 className="empty-state-title">Steam ID Required</h3>
          <p className="empty-state-description">
            Enter your Steam ID in <strong>Settings → General</strong> to view
            your player profile.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="view-container profile-container">
      <div className="view-header">
        <h2 className="view-title">Profile</h2>
        <button
          className="btn btn--secondary btn--sm"
          onClick={() => fetchProfile(true)}
          disabled={isLoading}
        >
          {isLoading ? 'Loading…' : isCached ? 'Refresh (cached)' : 'Refresh'}
        </button>
      </div>

      {isLoading && (
        <div className="loading-state">
          <p>Loading profile…</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => fetchProfile(true)}
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && steam && (
        <div className="profile-steam-card">
          {steam.avatar && (
            <img
              className="profile-avatar"
              src={steam.avatarfull}
              alt={steam.personaname ?? 'Player avatar'}
            />
          )}
          <div className="profile-steam-info">
            <h3 className="profile-name">
              {steam.personaname ?? 'Unknown Player'}
            </h3>
            <span className="profile-steam-id">Steam ID: {steamId}</span>
          </div>
        </div>
      )}

      {!isLoading && !error && stats && (
        <div className="profile-stats-grid">
          <div className="stat-card">
            <span className="stat-card__label">Matches</span>
            <span className="stat-card__value">
              {stats.matches.toLocaleString()}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Wins</span>
            <span className="stat-card__value">
              {stats.wins.toLocaleString()}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Losses</span>
            <span className="stat-card__value">
              {stats.losses.toLocaleString()}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Win Rate</span>
            <span className="stat-card__value">
              {stats.winRate.toFixed(1)}%
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Avg Kills</span>
            <span className="stat-card__value">
              {stats.avgKills.toFixed(1)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Avg Deaths</span>
            <span className="stat-card__value">
              {stats.avgDeaths.toFixed(1)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Avg Assists</span>
            <span className="stat-card__value">
              {stats.avgAssists.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {!isLoading && !error && !stats && !steam && (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3 className="empty-state-title">No Data Found</h3>
          <p className="empty-state-description">
            No profile data found for this Steam account. Make sure your
            Deadlock games are set to public.
          </p>
        </div>
      )}
    </section>
  );
};

export default ProfileView;
