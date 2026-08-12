import React, { useMemo, useState } from 'react';
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
import HeroStatsFiltersBar from './components/HeroStatsFilters';
import HeroStatsTable from './components/HeroStatsTable';
import HeroComparisonTable from './components/HeroComparisonTable';
import { track } from '../../../../shared/services/analytics';

const logger = createLogger('HeroStatsView');

type ViewMode = 'standard' | 'comparison';

const DEFAULT_FILTERS: HeroStatsFilters = {
  game_mode: 'normal',
  sort_by: 'win_rate',
  sort_direction: 'desc',
};

function heroName(heroId: number): string {
  return HEROES[heroId]?.name ?? `#${heroId}`;
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
  const [filters, setFilters] = useState<HeroStatsFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [comparisonSort, setComparisonSort] = useState<{
    key: HeroComparisonSortKey;
    direction: 'asc' | 'desc';
  }>({ key: 'win_rate_delta', direction: 'desc' });

  const isComparison = viewMode === 'comparison';

  const { rows, loading, error, totalMatches, pickRateNormalized } =
    useHeroStats(filters);
  const {
    rows: comparisonRows,
    loading: comparisonLoading,
    error: comparisonError,
  } = useHeroStatsComparison(filters, isComparison);

  const sortBy: HeroStatsSortKey = filters.sort_by ?? 'win_rate';
  const sortDirection: 'asc' | 'desc' = filters.sort_direction ?? 'desc';

  const sortedRows = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    const copy = [...rows];

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
  }, [rows, sortBy, sortDirection]);

  const sortedComparisonRows = useMemo(() => {
    const dir = comparisonSort.direction === 'asc' ? 1 : -1;
    const copy = [...comparisonRows];

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
  }, [comparisonRows, comparisonSort]);

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
    if (mode === 'comparison') {
      track('hero_stats_comparison_viewed', {});
      // Ranked/unranked only exist for the standard game; normalize game
      // mode so the filter bar (rank slider) stays enabled and consistent.
      if (filters.game_mode !== 'normal') {
        setFilters((prev) => ({ ...prev, game_mode: 'normal' }));
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
      />

      {activeError && (
        <div className="hero-stats-error-banner">
          Failed to load data: {activeError}
        </div>
      )}

      {activeLoading && !hasRows ? (
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

      {!activeLoading && (
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
