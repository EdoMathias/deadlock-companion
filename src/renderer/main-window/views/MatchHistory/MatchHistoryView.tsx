import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlayersApi, PlayerMatchHistoryEntry } from 'deadlock_api_client';
import { deadlockApiConfig } from '../../../../shared/services/deadlock-api/deadlockApiClient';
import { useSteamId } from '../../../hooks/useSteamId';
import { steamIdToAccountId } from '../../../../shared/utils/steamUtils';
import { matchCache } from '../../../services/matchCache';
import { getHero } from '../../../../shared/data/heroes';
import { useGameEventMatches } from '../../../hooks/useGameEventMatches';
import MatchDetailView from './MatchDetailView';
import { createLogger } from '../../../../shared/services/Logger';
import { GAME_MODE_LABELS } from '../../../../shared/consts';
import { RefreshButton } from '../../../components/RefreshButton';
import { DataContributionModal } from '../../../components/DataContributionModal';
import { useFTUE } from '../../../contexts/FTUEContext';

const logger = createLogger('MatchHistoryView');

const playersApi = new PlayersApi(deadlockApiConfig);

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Unified item for rendering — either from the API or from GEP events. */
interface MergedMatchEntry {
  match_id: number;
  hero_id: number;
  hero_name?: string;
  kills: number;
  deaths: number;
  assists: number;
  duration_s?: number;
  is_win?: boolean;
  game_mode?: number;
  source: 'api' | 'game-event';
}

/**
 * Match History View
 *
 * Merges two data sources:
 *  - deadlock-api.com match history (rich data, may be incomplete)
 *  - Overwolf game events match_history (basic KDA, always current)
 *
 * Requires the player's Steam ID — enter it in Settings > General.
 */
const MatchHistoryView: React.FC = () => {
  const { steamId } = useSteamId();
  const { hasSeenDataContribution, markDataContributionSeen, isFTUEComplete } =
    useFTUE();
  const [apiMatches, setApiMatches] = useState<PlayerMatchHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [gameModeFilter, setGameModeFilter] = useState<number | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [communityBannerDismissed, setCommunityBannerDismissed] = useState(
    () => {
      try {
        return localStorage.getItem('dl_community_banner_dismissed') === '1';
      } catch {
        return false;
      }
    },
  );
  const [verifiedMatchIds, setVerifiedMatchIds] = useState<
    Map<number, { duration_s: number; is_win: boolean }>
  >(() => {
    try {
      const stored = sessionStorage.getItem('dl_verified_match_ids');
      if (stored) {
        const entries: [number, { duration_s: number; is_win: boolean }][] =
          JSON.parse(stored);
        return new Map(entries);
      }
    } catch {
      /* ignore */
    }
    return new Map();
  });

  // Persist verified match IDs so badges survive view navigation
  useEffect(() => {
    if (verifiedMatchIds.size > 0) {
      sessionStorage.setItem(
        'dl_verified_match_ids',
        JSON.stringify(Array.from(verifiedMatchIds.entries())),
      );
    }
  }, [verifiedMatchIds]);

  const { entries: gameEventEntries } = useGameEventMatches();

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
            setApiMatches(cached);
            setIsCached(true);
            setIsLoading(false);
            return;
          }
        }

        setIsCached(false);
        logger.log(`Fetching match history from API for account ${accountId}…`);
        const response = await playersApi.matchHistory({
          accountId,
          onlyStoredHistory: true,
        });
        const data = response.data ?? [];
        logger.log(`API returned ${data.length} matches`);
        await matchCache.setHistory(accountId, data);
        setApiMatches(data);
        setLastRefreshTime(Date.now());
      } catch (err) {
        setError('Failed to load match history from API.');
        logger.error('Match history fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [accountId],
  );

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // ── Daily Full Sync (force_refetch from Steam) ────────────
  const forceFetchStorageKey = accountId
    ? `dl_force_fetch_date_${accountId}`
    : null;

  const canForceFetchToday = useCallback((): boolean => {
    if (!forceFetchStorageKey) return false;
    try {
      const stored = localStorage.getItem(forceFetchStorageKey);
      if (!stored) return true;
      return stored !== new Date().toLocaleDateString();
    } catch {
      return true;
    }
  }, [forceFetchStorageKey]);

  const [forceFetchAvailable, setForceFetchAvailable] = useState(() =>
    canForceFetchToday(),
  );

  const fetchMatchesFull = useCallback(async () => {
    if (!accountId || !forceFetchStorageKey) return;
    setIsSyncing(true);
    setError(null);

    try {
      logger.log(
        `Full Sync: fetching match history with forceRefetch for account ${accountId}…`,
      );
      const response = await playersApi.matchHistory({
        accountId,
        forceRefetch: true,
      });
      const data = response.data ?? [];
      logger.log(`Full Sync: API returned ${data.length} matches`);
      await matchCache.setHistory(accountId, data);
      setApiMatches(data);
      setIsCached(false);
      setLastRefreshTime(Date.now());

      // Mark today as used
      try {
        localStorage.setItem(
          forceFetchStorageKey,
          new Date().toLocaleDateString(),
        );
      } catch {
        // Ignore storage errors
      }
      setForceFetchAvailable(false);
    } catch (err: unknown) {
      const is429 = err instanceof Error && err.message.includes('429');
      if (is429) {
        setError(
          'Full Sync rate-limited. The API allows this once per hour — try again later.',
        );
      } else {
        setError('Full Sync failed. Please try again later.');
      }
      logger.error('Full Sync error:', err);
      // Don't mark the day as used on failure
    } finally {
      setIsSyncing(false);
    }
  }, [accountId, forceFetchStorageKey]);

  // Show data contribution modal on first visit (after FTUE completes)
  useEffect(() => {
    if (steamId && !hasSeenDataContribution && isFTUEComplete) {
      setShowDataModal(true);
    }
  }, [steamId, hasSeenDataContribution, isFTUEComplete]);

  const handleCloseDataModal = useCallback(() => {
    setShowDataModal(false);
    markDataContributionSeen();
  }, [markDataContributionSeen]);

  // Merge API matches with game-event matches, deduplicating by match_id.
  // Prefer API data when available (richer), fill gaps with game-event entries.
  const mergedMatches = useMemo<MergedMatchEntry[]>(() => {
    const byId = new Map<number, MergedMatchEntry>();

    // Add API matches first (richer data)
    for (const m of apiMatches) {
      byId.set(m.match_id, {
        match_id: m.match_id,
        hero_id: m.hero_id,
        kills: m.player_kills,
        deaths: m.player_deaths,
        assists: m.player_assists,
        duration_s: m.match_duration_s,
        is_win: m.match_result === m.player_team,
        game_mode: m.game_mode,
        source: 'api',
      });
    }

    // Fill in any matches not in API data from game events
    for (const ge of gameEventEntries) {
      const matchId = Number(ge.match_id);
      if (!byId.has(matchId)) {
        byId.set(matchId, {
          match_id: matchId,
          hero_id: Number(ge.hero_id),
          hero_name: ge.hero_name,
          kills: ge.kills,
          deaths: ge.deaths,
          assists: ge.assists,
          source: 'game-event',
        });
      }
    }

    // Sort by match_id descending (higher = more recent)
    const sorted = Array.from(byId.values()).sort(
      (a, b) => b.match_id - a.match_id,
    );

    // Promote game-event matches that were verified to have API data
    for (const entry of sorted) {
      if (
        entry.source === 'game-event' &&
        verifiedMatchIds.has(entry.match_id)
      ) {
        const verified = verifiedMatchIds.get(entry.match_id)!;
        entry.source = 'api';
        entry.duration_s = verified.duration_s;
        entry.is_win = verified.is_win;
      }
    }

    const apiCount = sorted.filter((m) => m.source === 'api').length;
    const geCount = sorted.filter((m) => m.source === 'game-event').length;
    logger.log(
      `Merged matches: ${sorted.length} total (${apiCount} from API, ${geCount} from game events)`,
    );
    return sorted;
  }, [apiMatches, gameEventEntries, verifiedMatchIds]);

  const filteredMatches = useMemo(() => {
    if (gameModeFilter === null) return mergedMatches;
    return mergedMatches.filter((m) => m.game_mode === gameModeFilter);
  }, [mergedMatches, gameModeFilter]);

  if (selectedMatchId !== null && accountId !== null) {
    return (
      <MatchDetailView
        matchId={selectedMatchId}
        accountId={accountId}
        onBack={() => setSelectedMatchId(null)}
        listEntry={apiMatches.find((m) => m.match_id === selectedMatchId)}
        onMatchVerified={(id, info) => {
          const player = info.players.find((p) => p.account_id === accountId);
          setVerifiedMatchIds((prev) => {
            const next = new Map(prev);
            next.set(id, {
              duration_s: info.duration_s,
              is_win: player ? player.team === info.winning_team : false,
            });
            return next;
          });
        }}
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
          <div className="empty-state-icon">📊</div>
          <h3 className="empty-state-title">Steam ID Required</h3>
          <p className="empty-state-description">
            Your Steam ID will be detected automatically when you launch the
            game. Alternatively, you can manually enter it in{' '}
            <strong>Settings → General</strong>.
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
          <select
            className="match-history-filter"
            value={gameModeFilter === null ? '' : gameModeFilter}
            onChange={(e) =>
              setGameModeFilter(
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
          >
            <option value="">All</option>
            {Object.entries(GAME_MODE_LABELS)
              .filter(([key]) => key !== '0')
              .map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
          </select>
          <RefreshButton
            onRefresh={() => fetchMatches(true)}
            isLoading={isLoading || isSyncing}
            isCached={isCached}
            lastRefreshTime={lastRefreshTime}
            tooltipText="Refresh match data from the Deadlock API cache"
            loadingLabel={isSyncing ? 'Syncing from Steam…' : 'Refreshing…'}
          />
          <div className="full-sync-btn-wrap">
            <button
              className="full-sync-btn"
              onClick={fetchMatchesFull}
              disabled={isSyncing || isLoading || !forceFetchAvailable}
              title={
                forceFetchAvailable
                  ? 'Sync your full match history from Steam and contribute it to the community database. Rate-limited to once per day.'
                  : 'Already synced today. Available again tomorrow.'
              }
            >
              ⟳ Full Sync
            </button>
          </div>
          <button
            className="info-icon-btn"
            onClick={() => setShowDataModal(true)}
            title="Why are some matches missing?"
          >
            ?
          </button>
        </div>
      </div>

      <DataContributionModal
        isOpen={showDataModal}
        onClose={handleCloseDataModal}
        scope="content"
      />

      {/* Community-powered banner (includes in-game tip when no game events yet) */}
      {!communityBannerDismissed && (
        <div className="match-history-banner match-history-banner--community">
          <span className="match-history-banner__icon">📊</span>
          <p className="match-history-banner__text">
            Match data is <strong>community-powered</strong>. The more players
            contribute, the more matches become available for everyone.
            {gameEventEntries.length === 0 && (
              <>
                {' '}
                Open the <em>Match History</em> tab in-game to capture basic
                stats instantly — full details become available once match data
                is contributed to the community database.
              </>
            )}{' '}
            <button
              className="btn--link"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('navigate-view', { detail: 'Contribute' }),
                )
              }
            >
              Contribute your matches →
            </button>
          </p>
          <button
            className="match-history-banner__dismiss"
            onClick={() => {
              setCommunityBannerDismissed(true);
              try {
                localStorage.setItem('dl_community_banner_dismissed', '1');
              } catch {
                /* ignore */
              }
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

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

      {!isLoading && !error && filteredMatches.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">���</div>
          <h3 className="empty-state-title">No Matches Found</h3>
          <p className="empty-state-description">
            This app relies on community-contributed data — matches appear once
            someone submits them to the database. Use <strong>Full Sync</strong>{' '}
            above to pull your recent matches from Steam, or visit the{' '}
            <button
              className="btn--link"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('navigate-view', { detail: 'Contribute' }),
                )
              }
            >
              Contribute
            </button>{' '}
            tab to upload match data from your Steam cache.
          </p>
        </div>
      )}

      {!isLoading && filteredMatches.length > 0 && (
        <div className="match-list">
          {filteredMatches.map((match) => {
            const hero = getHero(match.hero_id);
            const heroName =
              hero?.name ?? match.hero_name ?? `Hero ${match.hero_id}`;
            return (
              <div
                key={match.match_id}
                className={`match-card ${match.is_win === true ? 'match-card--win' : match.is_win === false ? 'match-card--loss' : ''}`}
                onClick={() => setSelectedMatchId(match.match_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && setSelectedMatchId(match.match_id)
                }
              >
                {hero?.images?.icon_image_small && (
                  <img
                    className="match-card__hero-icon"
                    src={hero.images.icon_image_small}
                    alt={heroName}
                  />
                )}
                {match.is_win != null && (
                  <div className="match-card__outcome">
                    {match.is_win ? 'WIN' : 'LOSS'}
                  </div>
                )}
                {match.game_mode != null && match.game_mode > 0 && (
                  <span className="match-card__game-mode">
                    {GAME_MODE_LABELS[match.game_mode] ??
                      `Mode ${match.game_mode}`}
                  </span>
                )}
                <div className="match-card__details">
                  <span className="match-card__hero">{heroName}</span>
                  <span className="match-card__kda">
                    {match.kills} / {match.deaths} / {match.assists}
                  </span>
                  {match.duration_s != null && (
                    <span className="match-card__duration">
                      {formatDuration(match.duration_s)}
                    </span>
                  )}
                  <span
                    className={`match-card__badge ${
                      match.source === 'game-event'
                        ? 'match-card__badge--pending'
                        : 'match-card__badge--full'
                    }`}
                    title={
                      match.source === 'game-event'
                        ? 'Basic data from game events — full stats appear once the match is submitted to the community database. Open this match or visit Contribute to help.'
                        : 'Full match data available from the community API'
                    }
                  >
                    {match.source === 'game-event' ? 'Pending' : 'Full Data'}
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
