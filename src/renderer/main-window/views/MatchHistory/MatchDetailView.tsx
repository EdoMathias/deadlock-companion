import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PlayersApi,
  PlayerMatchHistoryEntry,
  SteamProfile,
} from 'deadlock_api_client';
import { deadlockApiConfig } from '../../../../shared/services/deadlock-api/deadlockApiClient';
import { fetchMatchMetadataWithFallback } from '../../../../shared/services/matchMetadataFetcher';
import { fetchSteamProfileDirect } from '../../../../shared/services/steamWebApi';
import { accountIdToSteamId64 } from '../../../../shared/utils/steamUtils';
import { matchCache } from '../../../services/matchCache';
import { getHero } from '../../../../shared/data/heroes';
import type {
  MatchMetadataResponse,
  MatchPlayer,
  MatchSummaryData,
  MatchSummaryPlayer,
} from './matchMetadata.types';
import { createLogger } from '../../../../shared/services/Logger';
import { MATCH_MODE_LABELS } from '../../../../shared/consts';
import MatchTimelineChart from './components/MatchTimelineChart';
import TeamComparison from './components/TeamComparison';

const logger = createLogger('MatchDetailView');

const playersApi = new PlayersApi(deadlockApiConfig);

type ActiveTab = 'summary' | 'detailed';

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

function formatDateTime(unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Map API MatchPlayer[] to MatchSummaryPlayer[] (fallback when no roster snapshot exists). */
function apiPlayersToSummary(
  players: MatchPlayer[],
  matchId: string,
): MatchSummaryData {
  return {
    matchId,
    source: 'api-derived',
    players: players.map((p) => {
      const lastStat = p.stats?.[p.stats.length - 1];
      return {
        steam_id: p.account_id,
        hero_id: p.hero_id,
        hero_name: getHero(p.hero_id)?.name ?? `Hero ${p.hero_id}`,
        team_id: p.team === 0 ? 2 : 3, // map API team 0/1 → GEP convention 2/3
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        souls: p.last_hits,
        level: p.level,
        hero_damage: lastStat?.player_damage ?? 0,
        hero_healing: lastStat?.player_healing ?? 0,
        is_local: false, // not determinable from API data alone
      };
    }),
  };
}

/**
 * Merge a roster snapshot with authoritative API stats.
 * Keeps player_name and is_local from the roster; overwrites stats from API.
 */
function upgradeSummaryWithApi(
  roster: MatchSummaryData,
  apiPlayers: MatchPlayer[],
  matchId: string,
): MatchSummaryData {
  const rosterByHero = new Map(roster.players.map((p) => [p.hero_id, p]));

  return {
    matchId,
    source: 'api-upgraded',
    players: apiPlayers.map((ap) => {
      const rp = rosterByHero.get(ap.hero_id);
      const lastStat = ap.stats?.[ap.stats.length - 1];
      return {
        steam_id: ap.account_id,
        hero_id: ap.hero_id,
        hero_name: getHero(ap.hero_id)?.name ?? `Hero ${ap.hero_id}`,
        player_name: rp?.player_name,
        team_id: ap.team === 0 ? 2 : 3,
        kills: ap.kills,
        deaths: ap.deaths,
        assists: ap.assists,
        souls: ap.last_hits,
        level: ap.level,
        hero_damage: lastStat?.player_damage ?? 0,
        hero_healing: lastStat?.player_healing ?? 0,
        is_local: rp?.is_local ?? false,
      };
    }),
  };
}

// ────────────────── Summary Tab ──────────────────

interface SummaryTeamTableProps {
  players: MatchSummaryPlayer[];
  teamLabel: string;
  steamProfiles?: Map<number, SteamProfile>;
}

const SummaryTeamTable: React.FC<SummaryTeamTableProps> = ({
  players,
  teamLabel,
  steamProfiles,
}) => (
  <div className="summary-team">
    <div className="summary-team__title">{teamLabel}</div>
    <table className="summary-table">
      <thead>
        <tr>
          <th className="summary-table__th--hero">Hero</th>
          <th className="summary-table__th--player">Player</th>
          <th>K</th>
          <th>D</th>
          <th>A</th>
          <th>Souls</th>
          <th>Lvl</th>
          <th>Damage</th>
          <th>Healing</th>
        </tr>
      </thead>
      <tbody>
        {players.map((p) => {
          const hero = getHero(p.hero_id);
          const playerName =
            p.player_name ??
            steamProfiles?.get(p.steam_id)?.personaname ??
            String(p.steam_id);
          return (
            <tr
              key={p.steam_id}
              className={p.is_local ? 'summary-table__row--self' : undefined}
            >
              <td className="summary-table__td--hero">
                {hero && (
                  <img
                    className="summary-table__hero-icon"
                    src={hero.images.icon_image_small}
                    alt={hero.name}
                  />
                )}
                <span>{hero?.name ?? `Hero ${p.hero_id}`}</span>
              </td>
              <td className="summary-table__td--player">
                <span className="summary-table__player-name">{playerName}</span>
                {p.is_local && (
                  <span className="summary-table__you-badge">YOU</span>
                )}
              </td>
              <td>{p.kills}</td>
              <td>{p.deaths}</td>
              <td>{p.assists}</td>
              <td>{formatNumber(p.souls)}</td>
              <td>{p.level}</td>
              <td>{formatNumber(p.hero_damage)}</td>
              <td>{formatNumber(p.hero_healing)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

interface SummaryTabProps {
  summary: MatchSummaryData;
  steamProfiles?: Map<number, SteamProfile>;
  teamAmberName: string;
  teamSapphireName: string;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ summary, steamProfiles, teamAmberName, teamSapphireName }) => {
  // team_id 2 = Amber, 3 = Sapphire (GEP convention)
  const amber = summary.players.filter((p) => p.team_id === 2);
  const sapphire = summary.players.filter((p) => p.team_id === 3);

  // If api-derived, team mapping may use 2/3 already (we handle in apiPlayersToSummary)
  return (
    <div className="match-detail-summary">
      {summary.source === 'api-derived' && (
        <p className="summary-source-note">
          Showing data from API. Roster snapshot was not available for this
          match.
        </p>
      )}
      {summary.source === 'api-upgraded' && (
        <p className="summary-source-note">Stats verified against API data.</p>
      )}
      <div className="summary-teams">
        <SummaryTeamTable
          players={amber}
          teamLabel={`Team ${teamAmberName}`}
          steamProfiles={steamProfiles}
        />
        <SummaryTeamTable
          players={sapphire}
          teamLabel={`Team ${teamSapphireName}`}
          steamProfiles={steamProfiles}
        />
      </div>
    </div>
  );
};

// ────────────────── Detailed Tab (existing PlayerCard & TeamPanel) ──────────────────

interface MatchDetailViewProps {
  matchId: number;
  accountId: number;
  onBack: () => void;
  onMatchVerified?: (
    matchId: number,
    info: import('./matchMetadata.types').MatchInfo,
  ) => void;
  listEntry?: PlayerMatchHistoryEntry;
}

interface PlayerCardProps {
  player: MatchPlayer;
  selfAccountId: number;
  steamProfile?: SteamProfile;
  durationS: number;
  teamTotalKills: number;
  isMvp?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  selfAccountId,
  steamProfile,
  durationS,
  teamTotalKills,
  isMvp,
}) => {
  const hero = getHero(player.hero_id);
  const isSelf = player.account_id === selfAccountId;
  const durationMin = durationS > 0 ? durationS / 60 : 0;
  const lhPerMin =
    durationMin > 0 ? (player.last_hits / durationMin).toFixed(1) : '—';

  const lastStat = player.stats?.[player.stats.length - 1];
  const totalDamage = lastStat?.player_damage ?? 0;
  const totalHealing = lastStat?.player_healing ?? 0;
  const selfHealing = lastStat?.self_healing ?? 0;
  const allyHealing = totalHealing - selfHealing;

  const kdaRatio = (
    (player.kills + player.assists) /
    Math.max(player.deaths, 1)
  ).toFixed(1);
  const killParticipation =
    teamTotalKills > 0
      ? Math.round(((player.kills + player.assists) / teamTotalKills) * 100)
      : 0;
  const dpm =
    durationMin > 0 && totalDamage > 0
      ? (totalDamage / durationMin).toFixed(0)
      : null;
  const nwpm =
    durationMin > 0 ? (player.net_worth / durationMin).toFixed(0) : null;

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
          {isMvp && <span className="player-card__mvp-badge">★ MVP</span>}
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
        <span className="player-card__stat player-card__stat--kda-ratio">
          <span className="player-card__stat-label">KDA Ratio</span>
          {kdaRatio}
        </span>
        <span className="player-card__stat player-card__stat--kp">
          <span className="player-card__stat-label">Kill Part.</span>
          {killParticipation}%
        </span>
        <span className="player-card__stat">
          <span className="player-card__stat-label">Net Worth</span>
          {formatNetWorth(player.net_worth)}
        </span>
        {nwpm && (
          <span className="player-card__stat">
            <span className="player-card__stat-label">NW/min</span>
            {nwpm}
          </span>
        )}
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
        {dpm && (
          <span className="player-card__stat player-card__stat--damage">
            <span className="player-card__stat-label">DPM</span>
            {dpm}
          </span>
        )}
        {totalHealing > 0 && (
          <span className="player-card__stat player-card__stat--heal">
            <span className="player-card__stat-label">Heals</span>
            {formatNumber(totalHealing)}
            {(selfHealing > 0 || allyHealing > 0) && (
              <span className="player-card__stat-sub">
                Self: {formatNumber(selfHealing)} / Allies:{' '}
                {formatNumber(allyHealing)}
              </span>
            )}
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
}) => {
  const teamTotalKills = players.reduce((sum, p) => sum + p.kills, 0);

  // MVP: weighted score — KDA ratio (30%), damage share (40%), net worth share (30%)
  const teamTotalDamage = players.reduce((sum, p) => {
    const last = p.stats?.[p.stats.length - 1];
    return sum + (last?.player_damage ?? 0);
  }, 0);
  const teamTotalNW = players.reduce((sum, p) => sum + p.net_worth, 0);

  let mvpAccountId: number | null = null;
  if (players.length > 0) {
    let bestScore = -1;
    for (const p of players) {
      const kda = (p.kills + p.assists) / Math.max(p.deaths, 1);
      const last = p.stats?.[p.stats.length - 1];
      const dmg = last?.player_damage ?? 0;
      const dmgShare = teamTotalDamage > 0 ? dmg / teamTotalDamage : 0;
      const nwShare = teamTotalNW > 0 ? p.net_worth / teamTotalNW : 0;
      const score = kda * 0.3 + dmgShare * 0.4 + nwShare * 0.3;
      if (score > bestScore) {
        bestScore = score;
        mvpAccountId = p.account_id;
      }
    }
  }

  return (
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
            teamTotalKills={teamTotalKills}
            isMvp={player.account_id === mvpAccountId}
          />
        ))}
      </div>
    </div>
  );
};

// ────────────────── Main view with tabs ──────────────────

const MatchDetailView: React.FC<MatchDetailViewProps> = ({
  matchId,
  accountId,
  onBack,
  onMatchVerified,
  listEntry,
}) => {
  const isStreetBrawl = listEntry?.game_mode === 4;
  const teamAmberName = isStreetBrawl ? 'Hidden King' : 'Amber';
  const teamSapphireName = isStreetBrawl ? 'ArchMother' : 'Sapphire';

  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');

  // ── Summary state ──
  const [summaryData, setSummaryData] = useState<MatchSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // ── Detailed state ──
  const [metadata, setMetadata] = useState<MatchMetadataResponse | null>(null);
  const [detailedLoading, setDetailedLoading] = useState<
    null | 'checking-cache' | 'submitting-salts' | 'waiting-processing'
  >(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [detailedFetched, setDetailedFetched] = useState(false);
  const [steamProfiles, setSteamProfiles] = useState<Map<number, SteamProfile>>(
    new Map(),
  );

  // ── Load Summary data (instant from roster snapshot, fallback to API-derived) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSummaryLoading(true);
      try {
        const roster = await matchCache.getRosterSnapshot(matchId);
        if (!cancelled && roster?.length) {
          logger.log(
            `Match ${matchId}: loaded roster snapshot (${roster.length} players)`,
          );
          setSummaryData({
            matchId: String(matchId),
            source: 'roster-snapshot',
            players: roster.map((r) => ({
              steam_id: r.steam_id,
              hero_id: r.hero_id,
              hero_name:
                getHero(r.hero_id)?.name ?? r.hero_name ?? `Hero ${r.hero_id}`,
              player_name: r.player_name,
              team_id: r.team_id,
              kills: r.kills,
              deaths: r.deaths,
              assists: r.assist,
              souls: r.souls,
              level: r.level,
              hero_damage: r.hero_damage,
              hero_healing: r.hero_healing,
              is_local: r.is_local,
            })),
          });
          setSummaryLoading(false);

          // Also check for cached API metadata to verify the match badge
          // (promotes game-event → full-data in the history list)
          matchCache
            .getMetadata<MatchMetadataResponse>(matchId)
            .then((cached) => {
              if (cached?.match_info) {
                onMatchVerified?.(matchId, cached.match_info);
                setMetadata(cached);
                setDetailedFetched(true);

                // Upgrade or backfill summary with authoritative API stats
                if (cached.match_info?.players?.length) {
                  setSummaryData((prev) =>
                    prev?.source === 'roster-snapshot'
                      ? upgradeSummaryWithApi(prev, cached.match_info.players, String(matchId))
                      : prev
                  );
                }
              }
            })
            .catch(() => {});
          return;
        }
      } catch {
        // IDB error — continue to API fallback
      }

      // No roster snapshot → try loading from API metadata (cache only, don't fetch)
      try {
        const cached =
          await matchCache.getMetadata<MatchMetadataResponse>(matchId);
        if (!cancelled && cached?.match_info?.players?.length) {
          logger.log(
            `Match ${matchId}: no roster snapshot, deriving summary from cached API metadata`,
          );
          setSummaryData(
            apiPlayersToSummary(cached.match_info.players, String(matchId)),
          );
          // Also populate metadata for Detailed tab since we already have it
          setMetadata(cached);
          setDetailedFetched(true);
          if (cached.match_info) onMatchVerified?.(matchId, cached.match_info);
        } else if (!cancelled) {
          logger.log(
            `Match ${matchId}: no roster snapshot and no cached metadata — summary unavailable`,
          );
        }
      } catch {
        // Best-effort
      }

      if (!cancelled) setSummaryLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  // ── Fetch Detailed metadata (lazy — triggered when switching to Detailed tab) ──
  const fetchDetailed = useCallback(async () => {
    if (detailedFetched && metadata) return; // Already loaded
    setDetailedLoading('checking-cache');
    setDetailedError(null);
    logger.log(`Match ${matchId}: fetching detailed metadata…`);

    try {
      const cached =
        await matchCache.getMetadata<MatchMetadataResponse>(matchId);
      if (cached) {
        logger.log(`Match ${matchId}: detailed loaded from cache`);
        setMetadata(cached);
        setDetailedFetched(true);
        if (cached.match_info) onMatchVerified?.(matchId, cached.match_info);

        // Upgrade or backfill summary with authoritative API stats
        if (cached.match_info?.players?.length) {
          setSummaryData((prev) =>
            prev?.source === 'roster-snapshot'
              ? upgradeSummaryWithApi(
                  prev,
                  cached.match_info.players,
                  String(matchId),
                )
              : (prev ??
                apiPlayersToSummary(
                  cached.match_info.players,
                  String(matchId),
                )),
          );
        }

        setDetailedLoading(null);
        return;
      }
    } catch {
      logger.warn(`Match ${matchId}: IDB unavailable, falling through to API`);
    }

    try {
      setDetailedLoading('submitting-salts');
      setTimeout(() => {
        setDetailedLoading((prev) =>
          prev === 'submitting-salts' ? 'waiting-processing' : prev,
        );
      }, 2000);

      const data = await fetchMatchMetadataWithFallback(matchId);
      if (data) {
        logger.log(
          `Match ${matchId}: detailed fetched (${data.match_info?.players?.length ?? 0} players)`,
        );
        await matchCache.setMetadata(matchId, data);
        setMetadata(data);
        setDetailedFetched(true);
        if (data.match_info) onMatchVerified?.(matchId, data.match_info);

        // Upgrade or backfill summary with authoritative API stats
        if (data.match_info?.players?.length) {
          setSummaryData((prev) =>
            prev?.source === 'roster-snapshot'
              ? upgradeSummaryWithApi(
                  prev,
                  data.match_info.players,
                  String(matchId),
                )
              : (prev ??
                apiPlayersToSummary(data.match_info.players, String(matchId))),
          );
        }
      } else {
        setDetailedError(
          'Detailed data is not avaible yet. Please try again shortly. If the problem persists, please contribute to the database to speed up the process.',
        );
      }
    } catch (err) {
      setDetailedError('Failed to load match details. Please try again.');
      logger.error(`Match ${matchId}: detailed fetch error:`, err);
    } finally {
      setDetailedLoading(null);
    }
  }, [matchId, detailedFetched, metadata]);

  // Trigger detailed fetch when Detailed tab is first selected
  useEffect(() => {
    if (activeTab === 'detailed' && !detailedFetched) {
      fetchDetailed();
    }
  }, [activeTab, detailedFetched, fetchDetailed]);

  // ── Steam profiles (for Detailed tab only) ──
  useEffect(() => {
    const players = metadata?.match_info?.players;
    if (!players?.length) return;
    const accountIds = players.map((p) => p.account_id);

    matchCache
      .getSteamProfiles(matchId)
      .then((cached) => {
        if (cached?.length) {
          const map = new Map<number, SteamProfile>();
          for (const p of cached) map.set(p.account_id, p as SteamProfile);
          setSteamProfiles(map);
          return;
        }

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

            const toCache = Array.from(map.values()).map((p) => ({
              account_id: p.account_id!,
              personaname: p.personaname,
              avatarmedium: p.avatarmedium,
            }));
            matchCache.setSteamProfiles(matchId, toCache);
          })
          .catch(() => {});
      })
      .catch(() => {});
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
        <div className="match-detail-header__info">
          <span className="match-detail-header__id">Match #{matchId}</span>
          {info && (
            <span className="match-detail-header__duration">
              Duration: {formatDuration(info.duration_s)}
            </span>
          )}
          {(info?.start_time || listEntry?.start_time) && (
            <span className="match-detail-header__date">
              {formatDateTime(info?.start_time ?? listEntry!.start_time)}
            </span>
          )}
          {listEntry?.match_mode != null && listEntry.match_mode > 0 && (
            <span
              className={`match-detail-header__mode-badge match-detail-header__mode-badge--${listEntry.match_mode === 4 ? 'ranked' : 'unranked'}`}
            >
              {MATCH_MODE_LABELS[listEntry.match_mode] ??
                `Mode ${listEntry.match_mode}`}
            </span>
          )}
        </div>
      </div>

      {/* ── Abandon Warning ── */}
      {listEntry &&
        ((listEntry.abandoned_time_s != null &&
          listEntry.abandoned_time_s > 0) ||
          listEntry.team_abandoned) && (
          <div className="match-detail-abandon-banner">
            <span className="match-detail-abandon-banner__icon">⚠️</span>
            <span>
              {listEntry.team_abandoned
                ? 'A player on this team abandoned the match.'
                : `Player abandoned at ${formatDuration(listEntry.abandoned_time_s!)}.`}
            </span>
          </div>
        )}

      {/* ── Street Brawl Scores ── */}
      {listEntry?.game_mode === 4 && listEntry.brawl_score_team0 != null && (
        <div className="match-detail-brawl-scores">
          <span className="match-detail-brawl-scores__label">Street Brawl</span>
          <span className="match-detail-brawl-scores__score">
            <span className="match-detail-brawl-scores__team">{teamAmberName}</span>
            {listEntry.brawl_score_team0}
            <span className="match-detail-brawl-scores__divider">–</span>
            {listEntry.brawl_score_team1 ?? 0}
            <span className="match-detail-brawl-scores__team">{teamSapphireName}</span>
          </span>
          {listEntry.brawl_avg_round_time_s != null && (
            <span className="match-detail-brawl-scores__avg">
              Avg round:{' '}
              {formatDuration(Math.round(listEntry.brawl_avg_round_time_s))}
            </span>
          )}
        </div>
      )}

      {/* ── Tab Bar ── */}
      <div className="match-detail-tabs">
        <button
          className={`match-detail-tab${activeTab === 'summary' ? ' match-detail-tab--active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`match-detail-tab${activeTab === 'detailed' ? ' match-detail-tab--active' : ''}`}
          onClick={() => setActiveTab('detailed')}
        >
          Detailed
        </button>
      </div>

      {/* ── Summary Tab ── */}
      {activeTab === 'summary' && (
        <>
          {summaryLoading && (
            <div className="loading-state">
              <p>Loading summary…</p>
            </div>
          )}
          {!summaryLoading && !summaryData && (
            <div className="empty-state">
              <p>
                No summary data from Overwolf's game-events is available for
                this match. Switch to the{' '}
                <button
                  className="btn--link"
                  onClick={() => setActiveTab('detailed')}
                >
                  Detailed
                </button>{' '}
                tab to fetch full match data from the API.
              </p>
            </div>
          )}
          {summaryData && (
            <SummaryTab
              summary={summaryData}
              steamProfiles={steamProfiles}
              teamAmberName={teamAmberName}
              teamSapphireName={teamSapphireName}
            />
          )}
        </>
      )}

      {/* ── Detailed Tab ── */}
      {activeTab === 'detailed' && (
        <>
          {detailedLoading && (
            <div className="loading-state">
              <p>
                {detailedLoading === 'checking-cache' && 'Checking API cache…'}
                {detailedLoading === 'submitting-salts' &&
                  'Submitting match salts to API…'}
                {detailedLoading === 'waiting-processing' &&
                  'Waiting for API processing (usually 10-60s)…'}
              </p>
            </div>
          )}

          {detailedError && (
            <>
              <div className="error-state">
                <p>{detailedError}</p>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={fetchDetailed}
                >
                  Retry
                </button>
              </div>
              <div className="match-detail-contribute-cta">
                <div className="match-detail-contribute-cta__icon">📂</div>
                <div className="match-detail-contribute-cta__body">
                  <p>
                    <strong>This match isn't in the database yet.</strong> You
                    can help by scanning your Steam cache — it only takes a
                    moment and makes matches available for everyone.
                  </p>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('navigate-view', {
                          detail: 'Contribute',
                        }),
                      )
                    }
                  >
                    Go to Contribute
                  </button>
                </div>
              </div>
            </>
          )}

          {info && (
            <div className="match-detail-teams">
              <TeamPanel
                players={team0}
                selfAccountId={accountId}
                steamProfiles={steamProfiles}
                teamLabel={`Team ${teamAmberName}`}
                isWinner={info.winning_team === 0}
                durationS={info.duration_s}
              />
              <TeamPanel
                players={team1}
                selfAccountId={accountId}
                steamProfiles={steamProfiles}
                teamLabel={`Team ${teamSapphireName}`}
                isWinner={info.winning_team === 1}
                durationS={info.duration_s}
              />
            </div>
          )}

          {info && (
            <TeamComparison
              team0={team0}
              team1={team1}
              teamAmberName={teamAmberName}
              teamSapphireName={teamSapphireName}
            />
          )}

          {info && (
            <MatchTimelineChart
              players={info.players}
              durationS={info.duration_s}
            />
          )}
        </>
      )}
    </section>
  );
};

export default MatchDetailView;
