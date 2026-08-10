import React, { useMemo, useState } from 'react';
import type {
  HeroStatsFilters,
  HeroStatsSortKey,
  HeroStatsComputed,
} from '../../../../shared/types/heroStats';
import { HEROES } from '../../../../shared/data/heroes';
import { createLogger } from '../../../../shared/services/Logger';
import { useHeroStats } from './hooks/useHeroStats';
import HeroStatsFiltersBar from './components/HeroStatsFilters';
import HeroStatsTable from './components/HeroStatsTable';
import { track } from '../../../../shared/services/analytics';

const logger = createLogger('HeroStatsView');

const DEFAULT_FILTERS: HeroStatsFilters = {
  game_mode: 'normal',
  sort_by: 'win_rate',
  sort_direction: 'desc',
};

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

const HeroStatsView: React.FC = () => {
  const [filters, setFilters] = useState<HeroStatsFilters>(DEFAULT_FILTERS);

  const { rows, loading, error, totalMatches, pickRateNormalized } =
    useHeroStats(filters);

  const sortBy: HeroStatsSortKey = filters.sort_by ?? 'win_rate';
  const sortDirection: 'asc' | 'desc' = filters.sort_direction ?? 'desc';

  const sortedRows = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    const copy = [...rows];

    if (sortBy === 'name') {
      copy.sort((a, b) => {
        const aName = HEROES[a.hero_id]?.name ?? `#${a.hero_id}`;
        const bName = HEROES[b.hero_id]?.name ?? `#${b.hero_id}`;
        return aName.localeCompare(bName) * dir;
      });
    } else {
      copy.sort(
        (a, b) => (getSortValue(a, sortBy) - getSortValue(b, sortBy)) * dir,
      );
    }
    return copy;
  }, [rows, sortBy, sortDirection]);

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

  if (error) {
    logger.warn('Hero stats error', error);
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 className="view-title">Hero Stats</h2>
      </div>

      <HeroStatsFiltersBar filters={filters} onChange={handleFiltersChange} />

      {error && (
        <div className="hero-stats-error-banner">
          Failed to load data: {error}
        </div>
      )}

      {loading && sortedRows.length === 0 ? (
        <div className="hero-stats-loading">
          <div className="hero-stats-spinner" aria-hidden="true" />
          <span>Loading hero data...</span>
        </div>
      ) : (
        <div
          className={`hero-stats-table-container${
            loading ? ' hero-stats-table-container--loading' : ''
          }`}
        >
          <HeroStatsTable
            rows={sortedRows}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            pickRateNormalized={pickRateNormalized}
          />
          {loading && (
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

      {!loading && (
        <div className="hero-stats-footer">
          {sortedRows.length} heroes shown ·{' '}
          {totalMatches.toLocaleString()} total matches analyzed
        </div>
      )}
    </div>
  );
};

export default HeroStatsView;
