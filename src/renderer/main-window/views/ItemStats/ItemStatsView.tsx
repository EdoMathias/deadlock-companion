import React, { useEffect, useState, useMemo } from 'react';
import type { ItemStatsFilters, ItemStatsRow, ItemAnalyticsComputed } from '../../../../shared/types/items';
import { useItemMetadata } from '../../../hooks/useItemMetadata';
import { useItemAnalytics } from './hooks/useItemStats';
import { useNotificationPrefs } from './hooks/useNotificationPrefs';
import { useGepItemsSupport } from './hooks/useGepItemsSupport';
import ItemStatsFiltersBar from './components/ItemStatsFilters';
import ItemStatsTable from './components/ItemStatsTable';
import { track } from '../../../../shared/services/analytics';
import {
  DEFAULT_ITEM_STATS_FILTERS,
  getItemStatsFilters,
  setItemStatsFilters,
} from '../../../../shared/stores/statsFilterPrefs';
import '../../../styles/views/item-stats.css';

const DEFAULT_FILTERS = DEFAULT_ITEM_STATS_FILTERS;

/**
 * Reset restores the filter controls only — the current sort is deliberately
 * preserved.
 */
const FILTER_KEYS: (keyof ItemStatsFilters)[] = [
  'hero_id',
  'game_mode',
  'match_mode',
  'min_average_badge',
  'max_average_badge',
  'min_unix_timestamp',
  'max_unix_timestamp',
  'min_matches',
  'item_slot_type',
  'item_tier',
];

function isDefaultFilters(filters: ItemStatsFilters): boolean {
  return FILTER_KEYS.every((key) => filters[key] === DEFAULT_FILTERS[key]);
}

const ItemStatsView: React.FC = () => {
  // Filters persist across navigation and restarts; the search box does not —
  // a stale query silently hiding rows on return is worse than retyping.
  const [filters, setFilters] = useState<ItemStatsFilters>(getItemStatsFilters);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => setItemStatsFilters(filters), [filters]);

  const { items: metadata, loading: metaLoading, error: metaError } = useItemMetadata();
  const { analytics, loading: statsLoading, error: statsError, totalMatches } = useItemAnalytics(filters);
  const {
    toggle: toggleTrack,
    isTracked,
    presets,
    applyPreset,
    trackedIds,
    clearAll,
  } = useNotificationPrefs();
  const { supported: gepSupported } = useGepItemsSupport();

  const analyticsMap = useMemo(() => {
    const map = new Map<number, ItemAnalyticsComputed>();
    for (const row of analytics) {
      map.set(row.item_id, row);
    }
    return map;
  }, [analytics]);

  const rows: ItemStatsRow[] = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let filtered = metadata.filter((item) => {
      if (filters.item_slot_type && item.item_slot_type !== filters.item_slot_type) return false;
      if (filters.item_tier && item.item_tier !== filters.item_tier) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });

    const mapped: ItemStatsRow[] = filtered.map((meta) => ({
      metadata: meta,
      analytics: analyticsMap.get(meta.id) ?? null,
      isTracked: isTracked(meta.id),
    }));

    const sortBy = filters.sort_by ?? 'win_rate';
    const sortDir = filters.sort_direction === 'asc' ? 1 : -1;

    mapped.sort((a, b) => {
      const aVal = getSortValue(a, sortBy);
      const bVal = getSortValue(b, sortBy);
      return (aVal - bVal) * sortDir;
    });

    return mapped;
  }, [metadata, analyticsMap, filters, isTracked, searchQuery]);

  const loading = metaLoading || statsLoading;
  const error = metaError || statsError;

  // Map each filter field to the analytics filter_type it represents.
  const FILTER_TYPE_BY_KEY: Partial<
    Record<
      keyof ItemStatsFilters,
      'hero' | 'rank_range' | 'game_mode' | 'min_matches' | 'slot_type' | 'item_tier'
    >
  > = {
    hero_id: 'hero',
    min_average_badge: 'rank_range',
    max_average_badge: 'rank_range',
    game_mode: 'game_mode',
    // The mode dropdown writes both fields; the Set below dedupes them so
    // picking "Ranked" still emits exactly one event.
    match_mode: 'game_mode',
    min_matches: 'min_matches',
    item_slot_type: 'slot_type',
    item_tier: 'item_tier',
  };

  const handleFiltersChange = (next: ItemStatsFilters) => {
    const fired = new Set<string>();
    (Object.keys(FILTER_TYPE_BY_KEY) as (keyof ItemStatsFilters)[]).forEach(
      (key) => {
        const type = FILTER_TYPE_BY_KEY[key];
        if (type && filters[key] !== next[key] && !fired.has(type)) {
          fired.add(type);
          track('item_stats_filtered', {
            filter_type: type,
            has_value: next[key] != null && next[key] !== '',
          });
        }
      },
    );
    setFilters(next);
  };

  const handleResetFilters = () => {
    track('item_stats_filtered', { filter_type: 'reset' });
    // Keep the current sort — resetting the table order isn't what "reset
    // filters" means.
    setFilters((prev) => ({
      ...DEFAULT_FILTERS,
      sort_by: prev.sort_by,
      sort_direction: prev.sort_direction,
    }));
  };

  const handleSortChange = (sortBy: ItemStatsFilters['sort_by']) => {
    const direction =
      filters.sort_by === sortBy
        ? filters.sort_direction === 'desc'
          ? 'asc'
          : 'desc'
        : 'desc';
    track('stats_sorted', {
      view: 'item_stats',
      column: String(sortBy),
      direction,
    });
    setFilters((prev) => ({
      ...prev,
      sort_by: sortBy,
      sort_direction: direction,
    }));
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 className="view-title">Item Stats</h2>
      </div>

      <ItemStatsFiltersBar
        filters={filters}
        onChange={handleFiltersChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        presets={presets}
        trackedCount={trackedIds.length}
        onApplyPreset={applyPreset}
        onClearAll={clearAll}
        allItems={metadata}
        onReset={handleResetFilters}
        canReset={!isDefaultFilters(filters)}
      />

      {gepSupported === false && (
        <div className="item-stats-warning-banner">
          In-game item alerts require Overwolf GEP 267.0 or newer. Please update
          Overwolf to enable live enemy purchase notifications.
        </div>
      )}

      {error && (
        <div className="item-stats-error-banner">
          Failed to load data: {error}
        </div>
      )}

      {loading && rows.length === 0 ? (
        <div className="item-stats-loading">Loading item data...</div>
      ) : (
        <ItemStatsTable
          rows={rows}
          filters={filters}
          onToggleTrack={toggleTrack}
          onSortChange={handleSortChange}
        />
      )}

      {!loading && (
        <div className="item-stats-footer">
          {rows.length} items shown · {totalMatches.toLocaleString()} total matches analyzed
        </div>
      )}
    </div>
  );
};

function getSortValue(row: ItemStatsRow, sortBy: string): number {
  if (!row.analytics) return -Infinity;
  switch (sortBy) {
    case 'win_rate':
      return row.analytics.win_rate;
    case 'matches':
      return row.analytics.matches;
    case 'avg_buy_time_s':
      return row.analytics.avg_buy_time_s;
    case 'confidence':
      return row.analytics.confidence;
    default:
      return 0;
  }
}

export default ItemStatsView;
