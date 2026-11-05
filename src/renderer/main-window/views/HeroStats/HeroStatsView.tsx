import React, { useEffect, useMemo, useState } from 'react';
import type {
  HeroStatsFilters,
  HeroStatsSortKey,
  HeroStatsComputed,
  HeroComparisonSortKey,
  HeroWinRateComparisonRow,
} from '../../../../shared/types/heroStats';
import { HEROES } from '../../../../shared/data/heroes';
import { createLogger } from '../../../../shared/services/Logger';
import { useHeroStats } from './hooks/useHeroStats';
import { useHeroStatsComparison } from './hooks/useHeroStatsComparison';
import { useRankCompareStats } from './hooks/useRankCompareStats';
import { useMyHeroIds } from './hooks/useMyHeroIds';
import { useSteamId } from '../../../hooks/useSteamId';
import { SteamConnectGate } from '../../../components/SteamConnectGate';
import HeroStatsFiltersBar from './components/HeroStatsFilters';
import HeroStatsTable from './components/HeroStatsTable';
import HeroComparisonTable from './components/HeroComparisonTable';
import { track } from '../../../../shared/services/analytics';
import type { RankCompareTarget } from './utils/rankCompare';
import {
  DEFAULT_HERO_STATS_FILTERS,
  getHeroStatsComparisonSort,
  getHeroStatsFilters,
  getHeroStatsViewMode,
  setHeroStatsComparisonSort,
  setHeroStatsFilters,
  setHeroStatsViewMode,
} from '../../../../shared/stores/statsFilterPrefs';

const logger = createLogger('HeroStatsView');

type ViewMode = 'standard' | 'comparison';

const DEFAULT_FILTERS = DEFAULT_HERO_STATS_FILTERS;

/**
 * Reset restores the filter controls only — the current sort and the active
 * Standard/Ranked-vs-Normal tab are deliberately preserved.
 */
const FILTER_KEYS: (keyof HeroStatsFilters)[] = [
  'game_mode',
  'match_mode',
  'min_average_badge',
  'max_average_badge',
  'min_unix_timestamp',
  'max_unix_timestamp',
  'min_hero_matches',
  'min_hero_matches_total',
];

function isDefaultFilters(filters: HeroStatsFilters): boolean {
  return FILTER_KEYS.every((key) => filters[key] === DEFAULT_FILTERS[key]);
}

function heroName(heroId: number): string {
  return HEROES[heroId]?.name ?? `#${heroId}`;
}

/**
 * Client-side search + "My heroes" filter, applied the same way to both the
 * Standard/Overall rows and the Ranked-vs-Normal comparison rows — the
 * filter bar that drives this is shared across both tabs.
 */
function filterByNameAndMine<T extends { hero_id: number }>(
  rows: T[],
  query: string,
  mineOnly: boolean,
  myHeroIds: Set<number>,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q && !mineOnly) return rows;
  return rows.filter((row) => {
    if (mineOnly && !myHeroIds.has(row.hero_id)) return false;
    if (q && !heroName(row.hero_id).toLowerCase().includes(q)) return false;
    return true;
  });
}

function getSortValue(row: HeroStatsComputed, key: HeroStatsSortKey): number {
  switch (key) {
    case 'win_rate':
      return row.win_rate;
    case 'pick_rate':
      return row.pick_rate;
    case 'ban_rate':
      return row.ban_rate;
    case 'matches':
      return row.matches;
    case 'win_rate_delta':
      return row.win_rate_delta ?? 0;
    default:
      return 0;
  }
}

function getComparisonSortValue(
  row: HeroWinRateComparisonRow,
  key: HeroComparisonSortKey,
): number {
  switch (key) {
    case 'ranked_win_rate':
      return row.ranked_win_rate;
    case 'normal_win_rate':
      return row.normal_win_rate;
    case 'win_rate_delta':
      return row.win_rate_delta;
    case 'ranked_matches':
      return row.ranked_matches;
    default:
      return 0;
  }
}

const HeroStatsView: React.FC = () => {
  // Filters, the active tab, and both sorts persist across navigation and app
  // restarts — this view is fully unmounted when the user switches pages.
  const [filters, setFilters] = useState<HeroStatsFilters>(getHeroStatsFilters);
  const [viewMode, setViewMode] = useState<ViewMode>(getHeroStatsViewMode);
  const [comparisonSort, setComparisonSort] = useState<{
    key: HeroComparisonSortKey;
    direction: 'asc' | 'desc';
  }>(getHeroStatsComparisonSort);

  useEffect(() => setHeroStatsFilters(filters), [filters]);
  useEffect(() => setHeroStatsViewMode(viewMode), [viewMode]);
  useEffect(
    () => setHeroStatsComparisonSort(comparisonSort),
    [comparisonSort],
  );

  const isComparison = viewMode === 'comparison';

  // Hero name search + "My heroes" toggle. Not persisted — like Item Stats'
  // search box, a stale query silently hiding rows on return would be worse
  // than retyping.
  const [heroSearch, setHeroSearch] = useState('');
  const [myHeroesOnly, setMyHeroesOnly] = useState(false);
  const { heroIds: myHeroIds, loading: myHeroesLoading } = useMyHeroIds();
  const { steamId } = useSteamId();
  // Decoupled from `steamId` itself so the gate's auto-detected confirmation
  // card has a moment to render instead of vanishing the instant GEP commits
  // the ID in the background (same pattern as ProfileView).
  const [gateAcknowledged, setGateAcknowledged] = useState(() => !!steamId);
  useEffect(() => {
    if (!steamId) setGateAcknowledged(false);
  }, [steamId]);
  const showSteamGate = myHeroesOnly && !gateAcknowledged;
  const noPlayedHeroes =
    myHeroesOnly && !showSteamGate && !myHeroesLoading && myHeroIds.size === 0;

  // Rank-vs-rank comparison (Overall tab's "+ Compare with…"), distinct from
  // the Ranked-vs-Normal `viewMode` above. Not persisted — it's scoped to the
  // current rank selection and stale the moment that selection changes.
  const [rankCompareTarget, setRankCompareTarget] = useState<RankCompareTarget | null>(
    null,
  );
  const [rankCompareOpen, setRankCompareOpen] = useState(false);

  // The quick targets are "one tier below/above the current range" — once
  // the range itself moves, a stale target would silently compare against
  // the wrong tier, so drop it instead.
  useEffect(() => {
    setRankCompareTarget(null);
    setRankCompareOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.min_average_badge, filters.max_average_badge]);

  const { rows, loading, error, totalMatches, pickRateNormalized } =
    useHeroStats(filters);
  const {
    rows: comparisonRows,
    loading: comparisonLoading,
    error: comparisonError,
  } = useHeroStatsComparison(filters, isComparison);
  const { stats: rankCompareStats } = useRankCompareStats(
    filters,
    isComparison ? null : rankCompareTarget,
  );

  const rowsWithRankCompare = useMemo(() => {
    if (!rankCompareTarget || !rankCompareStats) return rows;
    return rows.map((row) => {
      const compare = rankCompareStats.get(row.hero_id);
      if (!compare || compare.matches === 0) return row;
      return {
        ...row,
        compare_win_rate: compare.win_rate,
        win_rate_delta: row.win_rate - compare.win_rate,
      };
    });
  }, [rows, rankCompareTarget, rankCompareStats]);

  const visibleRows = useMemo(
    () => filterByNameAndMine(rowsWithRankCompare, heroSearch, myHeroesOnly, myHeroIds),
    [rowsWithRankCompare, heroSearch, myHeroesOnly, myHeroIds],
  );

  const sortBy: HeroStatsSortKey = filters.sort_by ?? 'win_rate';
  const sortDirection: 'asc' | 'desc' = filters.sort_direction ?? 'desc';

  const sortedRows = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    const copy = [...visibleRows];

    if (sortBy === 'name') {
      copy.sort(
        (a, b) => heroName(a.hero_id).localeCompare(heroName(b.hero_id)) * dir,
      );
    } else {
      copy.sort(
        (a, b) => (getSortValue(a, sortBy) - getSortValue(b, sortBy)) * dir,
      );
    }
    return copy;
  }, [visibleRows, sortBy, sortDirection]);

  const visibleComparisonRows = useMemo(
    () => filterByNameAndMine(comparisonRows, heroSearch, myHeroesOnly, myHeroIds),
    [comparisonRows, heroSearch, myHeroesOnly, myHeroIds],
  );

  const sortedComparisonRows = useMemo(() => {
    const dir = comparisonSort.direction === 'asc' ? 1 : -1;
    const copy = [...visibleComparisonRows];

    if (comparisonSort.key === 'name') {
      copy.sort(
        (a, b) => heroName(a.hero_id).localeCompare(heroName(b.hero_id)) * dir,
      );
    } else {
      copy.sort(
        (a, b) =>
          (getComparisonSortValue(a, comparisonSort.key) -
            getComparisonSortValue(b, comparisonSort.key)) *
          dir,
      );
    }
    return copy;
  }, [visibleComparisonRows, comparisonSort]);

  // Map each filter field to the analytics filter_type it represents.
  const FILTER_TYPE_BY_KEY: Partial<
    Record<
      keyof HeroStatsFilters,
      | 'game_mode'
      | 'rank_range'
      | 'date_range'
      | 'min_matches'
      | 'min_matches_all_time'
    >
  > = {
    game_mode: 'game_mode',
    // The mode dropdown writes both fields; the Set below dedupes them so
    // picking "Ranked" still emits exactly one event.
    match_mode: 'game_mode',
    min_average_badge: 'rank_range',
    max_average_badge: 'rank_range',
    min_unix_timestamp: 'date_range',
    max_unix_timestamp: 'date_range',
    min_hero_matches: 'min_matches',
    min_hero_matches_total: 'min_matches_all_time',
  };

  const handleFiltersChange = (next: HeroStatsFilters) => {
    const fired = new Set<string>();
    (Object.keys(FILTER_TYPE_BY_KEY) as (keyof HeroStatsFilters)[]).forEach(
      (key) => {
        const type = FILTER_TYPE_BY_KEY[key];
        if (type && filters[key] !== next[key] && !fired.has(type)) {
          fired.add(type);
          track('hero_stats_filtered', { filter_type: type });
        }
      },
    );
    setFilters(next);
  };

  const handleResetFilters = () => {
    track('hero_stats_filtered', { filter_type: 'reset' });
    // Keep the current sort — resetting the table order isn't what "reset
    // filters" means.
    setFilters((prev) => ({
      ...DEFAULT_FILTERS,
      sort_by: prev.sort_by,
      sort_direction: prev.sort_direction,
    }));
  };

  const handleSortChange = (key: HeroStatsSortKey) => {
    const direction: 'asc' | 'desc' =
      filters.sort_by === key
        ? filters.sort_direction === 'desc'
          ? 'asc'
          : 'desc'
        : key === 'name'
        ? 'asc'
        : 'desc';
    track('stats_sorted', {
      view: 'hero_stats',
      column: String(key),
      direction,
    });
    setFilters((prev) => ({
      ...prev,
      sort_by: key,
      sort_direction: direction,
    }));
  };

  const handleMyHeroesToggle = () => {
    track('hero_stats_filtered', { filter_type: 'my_heroes' });
    setMyHeroesOnly((prev) => !prev);
  };

  const handleRankCompareToggleOpen = () => setRankCompareOpen((prev) => !prev);

  const handleRankComparePick = (target: RankCompareTarget) => {
    track('hero_stats_rank_compared', {
      compare_target:
        target.kind === 'all'
          ? 'all_ranks'
          : target.kind === 'lower'
          ? 'lower_adjacent'
          : 'higher_adjacent',
    });
    setRankCompareTarget(target);
    setFilters((prev) => ({ ...prev, sort_by: 'win_rate_delta', sort_direction: 'desc' }));
  };

  const handleRankCompareClear = () => {
    setRankCompareTarget(null);
    setRankCompareOpen(false);
    setFilters((prev) =>
      prev.sort_by === 'win_rate_delta'
        ? { ...prev, sort_by: 'win_rate', sort_direction: 'desc' }
        : prev,
    );
  };

  const handleComparisonSortChange = (key: HeroComparisonSortKey) => {
    setComparisonSort((prev) => {
      const direction: 'asc' | 'desc' =
        prev.key === key
          ? prev.direction === 'desc'
            ? 'asc'
            : 'desc'
          : key === 'name'
          ? 'asc'
          : 'desc';
      track('stats_sorted', {
        view: 'hero_stats',
        column: String(key),
        direction,
      });
      return { key, direction };
    });
  };

  const handleModeChange = (mode: ViewMode) => {
    if (mode === viewMode) return;
    track('table_mode_switched', { view: 'hero_stats', mode });
    if (mode === 'comparison') {
      track('hero_stats_comparison_viewed', {});
      // Ranked/unranked only exist for the standard game, and this view
      // fetches both queues itself — normalize game mode so the filter bar
      // (rank slider) stays enabled and drop any single-queue selection.
      if (filters.game_mode !== 'normal' || filters.match_mode != null) {
        setFilters((prev) => ({
          ...prev,
          game_mode: 'normal',
          match_mode: undefined,
        }));
      }
    }
    setViewMode(mode);
  };

  const activeError = isComparison ? comparisonError : error;
  const activeLoading = isComparison ? comparisonLoading : loading;
  const hasRows = isComparison
    ? sortedComparisonRows.length > 0
    : sortedRows.length > 0;

  if (activeError) {
    logger.warn('Hero stats error', activeError);
  }

  return (
    <div className="view-container">
      <div className="view-header view-header--with-tabs">
        <h2 className="view-title">Hero Stats</h2>
        <div
          className="hero-stats-mode-toggle"
          role="tablist"
          aria-label="Hero stats view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isComparison}
            className={`hero-stats-mode-tab${
              !isComparison ? ' hero-stats-mode-tab--active' : ''
            }`}
            onClick={() => handleModeChange('standard')}
          >
            Standard
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isComparison}
            className={`hero-stats-mode-tab${
              isComparison ? ' hero-stats-mode-tab--active' : ''
            }`}
            onClick={() => handleModeChange('comparison')}
          >
            Ranked vs Normal
          </button>
        </div>
      </div>

      <HeroStatsFiltersBar
        filters={filters}
        onChange={handleFiltersChange}
        hideGameMode={isComparison}
        onReset={handleResetFilters}
        canReset={!isDefaultFilters(filters)}
        rankCompareTarget={rankCompareTarget}
        rankCompareOpen={rankCompareOpen}
        onRankCompareToggleOpen={handleRankCompareToggleOpen}
        onRankComparePick={handleRankComparePick}
        onRankCompareClear={handleRankCompareClear}
        searchQuery={heroSearch}
        onSearchChange={setHeroSearch}
        myHeroesOnly={myHeroesOnly}
        onMyHeroesToggle={handleMyHeroesToggle}
      />

      {activeError && (
        <div className="hero-stats-error-banner">
          Failed to load data: {activeError}
        </div>
      )}

      {noPlayedHeroes && (
        <div className="hero-stats-info-banner">
          No played heroes found yet. “My heroes” fills in from your match
          history — play a match, or open the in-game match history tab once.
        </div>
      )}

      {showSteamGate ? (
        <SteamConnectGate
          cameFrom="Hero Stats"
          onConnected={() => setGateAcknowledged(true)}
        />
      ) : activeLoading && !hasRows ? (
        <div className="hero-stats-loading">
          <div className="hero-stats-spinner" aria-hidden="true" />
          <span>Loading hero data...</span>
        </div>
      ) : (
        <div
          className={`hero-stats-table-container${
            activeLoading ? ' hero-stats-table-container--loading' : ''
          }`}
        >
          {isComparison ? (
            <HeroComparisonTable
              rows={sortedComparisonRows}
              sortBy={comparisonSort.key}
              sortDirection={comparisonSort.direction}
              onSortChange={handleComparisonSortChange}
            />
          ) : (
            <HeroStatsTable
              rows={sortedRows}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              pickRateNormalized={pickRateNormalized}
              compareActive={rankCompareTarget != null}
              compareLabel={rankCompareTarget?.name}
            />
          )}
          {activeLoading && (
            <div
              className="hero-stats-overlay"
              role="status"
              aria-live="polite"
            >
              <div className="hero-stats-overlay__pill">
                <div className="hero-stats-spinner" aria-hidden="true" />
                <span>Updating…</span>
              </div>
            </div>
          )}
        </div>
      )}

      {!activeLoading && !showSteamGate && (
        <div className="hero-stats-footer">
          {isComparison ? (
            <>{sortedComparisonRows.length} heroes compared · Ranked vs Normal</>
          ) : (
            <>
              {sortedRows.length} heroes shown ·{' '}
              {totalMatches.toLocaleString()} total matches analyzed
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HeroStatsView;
