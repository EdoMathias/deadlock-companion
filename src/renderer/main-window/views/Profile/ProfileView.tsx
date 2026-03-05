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
import { getHero, HeroInfo } from '../../../../shared/data/heroes';

const playersApi = new PlayersApi(deadlockApiConfig);

interface AggregateStats {
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  totalTimePlayed: number;
  avgMatchDuration: number;
  signatureHeroId: number | null;
  signatureHeroMatches: number;
  signatureHeroWins: number;
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
      totalTimePlayed: 0,
      avgMatchDuration: 0,
      signatureHeroId: null,
      signatureHeroMatches: 0,
      signatureHeroWins: 0,
    };
  }

  let wins = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalTimePlayed = 0;
  const heroCount: Record<number, { matches: number; wins: number }> = {};

  for (const m of matches) {
    const isWin = m.match_result === m.player_team;
    if (isWin) wins++;
    totalKills += m.player_kills ?? 0;
    totalDeaths += m.player_deaths ?? 0;
    totalAssists += m.player_assists ?? 0;
    totalTimePlayed += m.match_duration_s ?? 0;

    if (m.hero_id != null) {
      if (!heroCount[m.hero_id]) heroCount[m.hero_id] = { matches: 0, wins: 0 };
      heroCount[m.hero_id].matches++;
      if (isWin) heroCount[m.hero_id].wins++;
    }
  }

  let signatureHeroId: number | null = null;
  let signatureHeroMatches = 0;
  let signatureHeroWins = 0;
  for (const [heroIdStr, data] of Object.entries(heroCount)) {
    if (data.matches > signatureHeroMatches) {
      signatureHeroId = Number(heroIdStr);
      signatureHeroMatches = data.matches;
      signatureHeroWins = data.wins;
    }
  }

  return {
    matches: count,
    wins,
    losses: count - wins,
    winRate: (wins / count) * 100,
    avgKills: totalKills / count,
    avgDeaths: totalDeaths / count,
    avgAssists: totalAssists / count,
    totalTimePlayed,
    avgMatchDuration: totalTimePlayed / count,
    signatureHeroId,
    signatureHeroMatches,
    signatureHeroWins,
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

  const signatureHero: HeroInfo | undefined =
    stats?.signatureHeroId != null ? getHero(stats.signatureHeroId) : undefined;

  const winRatePct = stats ? Math.min(100, Math.max(0, stats.winRate)) : 0;

  return (
    <section className="view-container profile-container">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="profile-header">
        <div className="profile-header__identity">
          {steam?.avatarfull && (
            <img
              className="profile-header__avatar"
              src={steam.avatarfull}
              alt={steam.personaname ?? 'Player avatar'}
            />
          )}
          <div className="profile-header__info">
            <h2 className="profile-header__name">
              {steam?.personaname ?? 'Unknown Player'}
            </h2>
            <span className="profile-header__steam-id">
              Steam ID: {steamId}
            </span>
          </div>
        </div>

        <div className="profile-header__right">
          {stats && stats.matches > 0 && (
            <div className="profile-header__meta">
              <span>{stats.matches.toLocaleString()} Total Matches</span>
              <span className="profile-header__meta-dot">·</span>
              <span className="profile-header__meta-winrate">
                {stats.winRate.toFixed(1)}% Overall Win Rate
              </span>
            </div>
          )}
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => fetchProfile(true)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : isCached ? 'Refresh (cached)' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Loading / Error states ────────────────────────────── */}
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

      {/* ── Main: hero card + stats panel ────────────────────── */}
      {!isLoading && !error && stats && (
        <div className="profile-main">
          {/* Left — Signature Hero Card */}
          <div className="profile-hero-card">
            <div className="profile-hero-card__image-wrap">
              {signatureHero?.images.icon_hero_card_webp ? (
                <img
                  className="profile-hero-card__image"
                  src={signatureHero.images.icon_hero_card_webp}
                  alt={signatureHero.name}
                />
              ) : steam?.avatarfull ? (
                <img
                  className="profile-hero-card__image profile-hero-card__image--avatar"
                  src={steam.avatarfull}
                  alt={steam.personaname ?? 'Player avatar'}
                />
              ) : (
                <div className="profile-hero-card__image-placeholder">👤</div>
              )}
            </div>

            <div className="profile-hero-card__body">
              <span className="profile-hero-card__name">
                {signatureHero?.name ?? steam?.personaname ?? 'Unknown'}
              </span>
              {signatureHero?.tags?.[0] && (
                <span className="profile-hero-card__tag">
                  {signatureHero.tags[0].toUpperCase()}
                </span>
              )}
              <span className="profile-hero-card__badge">MOST PLAYED HERO</span>
            </div>

            <div className="profile-hero-card__footer">
              <div className="profile-hero-card__footer-stat">
                <span className="profile-hero-card__footer-label">
                  MATCHES PLAYED
                </span>
                <span className="profile-hero-card__footer-value">
                  {stats.signatureHeroMatches.toLocaleString()}
                </span>
              </div>
              <div className="profile-hero-card__footer-stat">
                <span className="profile-hero-card__footer-label">
                  VICTORIES
                </span>
                <span className="profile-hero-card__footer-value profile-hero-card__footer-value--wins">
                  {stats.signatureHeroWins.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right — Stats Panel */}
          <div className="profile-stats-panel">
            {/* Win Rate */}
            <div className="stat-feature-card">
              <span className="stat-feature-card__label">WIN RATE</span>
              <span className="stat-feature-card__value stat-feature-card__value--success">
                {stats.winRate.toFixed(1)}%
              </span>
              <div className="stat-feature-card__bar-track">
                <div
                  className="stat-feature-card__bar-fill"
                  style={{ width: `${winRatePct}%` }}
                />
              </div>
              <span className="stat-feature-card__sub">
                {stats.wins}W / {stats.losses}L
              </span>
            </div>

            {/* Total Matches */}
            <div className="stat-feature-card">
              <span className="stat-feature-card__label">MATCHES</span>
              <span className="stat-feature-card__value">
                {stats.matches.toLocaleString()}
              </span>
              <span className="stat-feature-card__sub">
                {stats.wins.toLocaleString()} Wins ·{' '}
                {stats.losses.toLocaleString()} Losses
              </span>
            </div>

            {/* K/D/A — spans both columns */}
            <div className="stat-feature-card stat-feature-card--full-width">
              <span className="stat-feature-card__label">K/D/A</span>
              <span className="stat-feature-card__value">
                {stats.avgKills.toFixed(1)} / {stats.avgDeaths.toFixed(1)} /{' '}
                {stats.avgAssists.toFixed(1)}
              </span>
              <span className="stat-feature-card__sub">
                Kill / Death / Assist
              </span>
            </div>

            {/* Total Time Played */}
            <div className="stat-feature-card">
              <span className="stat-feature-card__label">TOTAL HOURS</span>
              <span className="stat-feature-card__value">
                {(stats.totalTimePlayed / 3600).toFixed(1)}
                <span className="stat-feature-card__value-unit"> hrs</span>
              </span>
              <span className="stat-feature-card__sub">
                Time across all matches
              </span>
            </div>

            {/* Avg Match Duration */}
            <div className="stat-feature-card">
              <span className="stat-feature-card__label">AVG DURATION</span>
              <span className="stat-feature-card__value">
                {Math.floor(stats.avgMatchDuration / 60)}
                <span className="stat-feature-card__value-unit">m </span>
                {Math.round(stats.avgMatchDuration % 60)}
                <span className="stat-feature-card__value-unit">s</span>
              </span>
              <span className="stat-feature-card__sub">Per match average</span>
            </div>
          </div>
        </div>
      )}

      {/* ── No data fallback ─────────────────────────────────── */}
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
