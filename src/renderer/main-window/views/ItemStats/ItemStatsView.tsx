import React, { useState, useMemo } from 'react';
import type { ItemStatsFilters, ItemStatsRow, ItemAnalyticsComputed } from '../../../../shared/types/items';
import { useItemMetadata } from './hooks/useItemMetadata';
import { useItemAnalytics } from './hooks/useItemStats';
import { useNotificationPrefs } from './hooks/useNotificationPrefs';
import { useGepItemsSupport } from './hooks/useGepItemsSupport';
import ItemStatsFiltersBar from './components/ItemStatsFilters';
import ItemStatsTable from './components/ItemStatsTable';
import '../../../styles/views/item-stats.css';

const DEFAULT_FILTERS: ItemStatsFilters = {
  sort_by: 'win_rate',
  sort_direction: 'desc',
  min_matches: 20,
  game_mode: 'normal',
};

const ItemStatsView: React.FC = () => {
  const [filters, setFilters] = useState<ItemStatsFilters>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSortChange = (sortBy: ItemStatsFilters['sort_by']) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: sortBy,
      sort_direction:
        prev.sort_by === sortBy
          ? prev.sort_direction === 'desc'
            ? 'asc'
            : 'desc'
          : 'desc',
    }));
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h2 className="view-title">Item Stats</h2>
      </div>

      <ItemStatsFiltersBar
        filters={filters}
        onChange={setFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        presets={presets}
        trackedCount={trackedIds.length}
        onApplyPreset={applyPreset}
        onClearAll={clearAll}
        allItems={metadata}
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
