import React, { useCallback, useEffect, useState } from 'react';
import { MatchesApi, PlayersApi, SteamProfile } from 'deadlock_api_client';
import { deadlockApiConfig } from '../../../../shared/services/deadlock-api/deadlockApiClient';
import { fetchMatchMetadataWithFallback } from '../../../../shared/services/matchMetadataFetcher';
import { fetchSteamProfileDirect } from '../../../../shared/services/steamWebApi';
import { accountIdToSteamId64 } from '../../../../shared/utils/steamUtils';
import { matchCache } from '../../../services/matchCache';
import { getHero } from '../../../../shared/data/heroes';
import type { MatchMetadataResponse, MatchPlayer } from './matchMetadata.types';
import { createLogger } from '../../../../shared/services/Logger';

const logger = createLogger('MatchDetailView');

const matchesApi = new MatchesApi(deadlockApiConfig);
const playersApi = new PlayersApi(deadlockApiConfig);

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatNetWorth(nw: number): string {
  if (nw >= 1000) return `${(nw / 1000).toFixed(1)}k`;
  return String(nw);
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface MatchDetailViewProps {
  matchId: number;
  accountId: number;
  onBack: () => void;
  onMatchVerified?: (
    matchId: number,
    info: import('./matchMetadata.types').MatchInfo,
  ) => void;
}

interface PlayerCardProps {
  player: MatchPlayer;
  selfAccountId: number;
  steamProfile?: SteamProfile;
  durationS: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  selfAccountId,
  steamProfile,
  durationS,
}) => {
  const hero = getHero(player.hero_id);
  const isSelf = player.account_id === selfAccountId;
  const lhPerMin =
    durationS > 0 ? (player.last_hits / (durationS / 60)).toFixed(1) : '—';

  // Stats entries are cumulative snapshots — the last entry holds full-match totals.
  const lastStat = player.stats?.[player.stats.length - 1];
  const totalDamage = lastStat?.player_damage ?? 0;
  const totalHealing = lastStat?.player_healing ?? 0;

  return (
    <div className={`player-card${isSelf ? ' player-card--self' : ''}`}>
      <div className="player-card__top">
        <div className="player-card__identity">
          {steamProfile?.avatarmedium ? (
            <img
              className="player-card__avatar"
              src={steamProfile.avatarmedium}
              alt={steamProfile.personaname ?? ''}
            />
          ) : (
            <div className="player-card__avatar player-card__avatar--empty" />
          )}
          <span className="player-card__name">
            {steamProfile?.personaname ?? String(player.account_id)}
          </span>
          {isSelf && <span className="player-card__you-badge">YOU</span>}
        </div>
        <span className="player-card__hero">
          {hero ? hero.name : `Hero ${player.hero_id}`}
        </span>
        <img
          src={hero.images.icon_image_small}
          alt={hero?.name}
          style={{ width: '35px' }}
        />
      </div>

      <div className="player-card__stats">
        <span className="player-card__stat player-card__stat--kda">
          <span className="player-card__stat-label">KDA</span>
          {player.kills} / {player.deaths} / {player.assists}
        </span>
        <span className="player-card__stat">
          <span className="player-card__stat-label">Net Worth</span>
          {formatNetWorth(player.net_worth)}
        </span>
        <span className="player-card__stat">
          <span className="player-card__stat-label">Souls</span>
          {player.last_hits}
        </span>
        <span className="player-card__stat">
          <span className="player-card__stat-label">Souls/min</span>
          {lhPerMin}
        </span>
        <span className="player-card__stat">
          <span className="player-card__stat-label">Level</span>
          {player.level}
        </span>
        {totalDamage > 0 && (
          <span className="player-card__stat player-card__stat--damage">
            <span className="player-card__stat-label">Damage</span>
            {formatNumber(totalDamage)}
          </span>
        )}
        {totalHealing > 0 && (
          <span className="player-card__stat player-card__stat--heal">
            <span className="player-card__stat-label">Heals</span>
            {formatNumber(totalHealing)}
          </span>
        )}
      </div>
    </div>
  );
};

interface TeamPanelProps {
  players: MatchPlayer[];
  selfAccountId: number;
  steamProfiles: Map<number, SteamProfile>;
  teamLabel: string;
  isWinner: boolean;
  durationS: number;
}

const TeamPanel: React.FC<TeamPanelProps> = ({
  players,
  selfAccountId,
  steamProfiles,
  teamLabel,
  isWinner,
  durationS,
}) => (
  <div
    className={`match-detail-team${isWinner ? ' match-detail-team--win' : ' match-detail-team--loss'}`}
  >
    <div
      className={`match-detail-team__title ${isWinner ? 'match-detail-team__title--win' : 'match-detail-team__title--loss'}`}
    >
      <span>{teamLabel}</span>
      <span className="match-detail-team__result">
        {isWinner ? 'VICTORY' : 'DEFEAT'}
      </span>
    </div>
    <div className="match-detail-team__players">
      {players.map((player) => (
        <PlayerCard
          key={player.account_id}
          player={player}
          selfAccountId={selfAccountId}
          steamProfile={steamProfiles.get(player.account_id)}
          durationS={durationS}
        />
      ))}
    </div>
  </div>
);

const MatchDetailView: React.FC<MatchDetailViewProps> = ({
  matchId,
  accountId,
  onBack,
  onMatchVerified,
}) => {
  const [metadata, setMetadata] = useState<MatchMetadataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steamProfiles, setSteamProfiles] = useState<Map<number, SteamProfile>>(
    new Map(),
  );

  const fetchMetadata = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    logger.log(`Fetching metadata for match ${matchId}…`);
    try {
      const cached =
        await matchCache.getMetadata<MatchMetadataResponse>(matchId);
      if (cached) {
        logger.log(`Match ${matchId}: loaded from IndexedDB cache`);
        setMetadata(cached);
        if (cached.match_info) onMatchVerified?.(matchId, cached.match_info);
        setIsLoading(false);
        return;
      }
      logger.log(`Match ${matchId}: not in cache, fetching from API…`);
    } catch {
      logger.warn(
        `Match ${matchId}: IndexedDB unavailable, falling through to API`,
      );
    }

    try {
      // Use the fallback pipeline: metadata → salts → ingest → retry
      const data = await fetchMatchMetadataWithFallback(matchId);
      if (data) {
        logger.log(
          `Match ${matchId}: metadata fetched successfully (${data.match_info?.players?.length ?? 0} players)`,
        );
        await matchCache.setMetadata(matchId, data);
        setMetadata(data);
        if (data.match_info) onMatchVerified?.(matchId, data.match_info);
      } else {
        logger.warn(
          `Match ${matchId}: fallback pipeline returned null — match not yet available`,
        );
        setError(
          'Match details not yet available. The match may still be processing.',
        );
      }
    } catch (err) {
      setError('Failed to load match details. Please try again.');
      logger.error(`Match ${matchId}: fetch error:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Batch-fetch Steam profiles for all players once metadata is available.
  // Non-blocking: cards render with account IDs first, names/avatars fill in.
  // Falls back to the Steam Web API for any accounts not in the deadlock-api db.
  // Results are cached in IndexedDB per match to avoid redundant calls.
  useEffect(() => {
    const players = metadata?.match_info?.players;
    if (!players?.length) return;
    const accountIds = players.map((p) => p.account_id);

    // Try loading from IndexedDB cache first
    matchCache
      .getSteamProfiles(matchId)
      .then((cached) => {
        if (cached?.length) {
          const map = new Map<number, SteamProfile>();
          for (const p of cached) {
            map.set(p.account_id, p as SteamProfile);
          }
          setSteamProfiles(map);
          return;
        }

        // Cache miss — fetch from APIs
        playersApi
          .steam({ accountIds })
          .then(async (res) => {
            const map = new Map<number, SteamProfile>();
            if (Array.isArray(res.data)) {
              for (const profile of res.data) {
                if (profile?.account_id != null)
                  map.set(profile.account_id, profile);
              }
            }

            // For any players not found in the deadlock-api db, try the Steam Web API
            const missingIds = accountIds.filter((id) => !map.has(id));
            await Promise.allSettled(
              missingIds.map(async (missingId) => {
                const profile = await fetchSteamProfileDirect(
                  accountIdToSteamId64(missingId),
                );
                if (profile) map.set(missingId, profile);
              }),
            );

            setSteamProfiles(new Map(map));

            // Persist to IndexedDB for next time
            const toCache = Array.from(map.values()).map((p) => ({
              account_id: p.account_id!,
              personaname: p.personaname,
              avatarmedium: p.avatarmedium,
            }));
            matchCache.setSteamProfiles(matchId, toCache);
          })
          .catch(() => {
            // Best-effort — cards render without avatars/names on failure
          });
      })
      .catch(() => {
        // IDB unavailable — fall through without cache
      });
  }, [metadata, matchId]);

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
              Match Duration: {formatDuration(info.duration_s)}
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

      {error && (
        <div className="match-detail-contribute-cta">
          <div className="match-detail-contribute-cta__icon">📂</div>
          <div className="match-detail-contribute-cta__body">
            <p>
              <strong>This match isn't in the database yet.</strong> You can
              help by scanning your Steam cache — it only takes a moment and
              makes matches available for everyone.
            </p>
            <button
              className="btn btn--primary btn--sm"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('navigate-view', { detail: 'Contribute' }),
                )
              }
            >
              Go to Contribute
            </button>
          </div>
        </div>
      )}

      {info && (
        <div className="match-detail-teams">
          <TeamPanel
            players={team0}
            selfAccountId={accountId}
            steamProfiles={steamProfiles}
            teamLabel="Team Amber"
            isWinner={info.winning_team === 0}
            durationS={info.duration_s}
          />
          <TeamPanel
            players={team1}
            selfAccountId={accountId}
            steamProfiles={steamProfiles}
            teamLabel="Team Sapphire"
            isWinner={info.winning_team === 1}
            durationS={info.duration_s}
          />
        </div>
      )}
    </section>
  );
};

export default MatchDetailView;
