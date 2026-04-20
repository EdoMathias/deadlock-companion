import React from 'react';
import type { ItemStatsFilters as Filters, ItemSlotType, ItemTier } from '../../../../../shared/types/items';
import type { NotificationPreset } from '../../../../../shared/types/itemAlerts';
import type { ItemMetadata } from '../../../../../shared/types/items';
import HeroSelect from '../../../../components/HeroSelect';
import RankRangeSlider from '../../../../components/RankRangeSlider';
import PresetSelector from './PresetSelector';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  presets: NotificationPreset[];
  trackedCount: number;
  onApplyPreset: (preset: NotificationPreset, allItems: ItemMetadata[]) => void;
  onClearAll: () => void;
  allItems: ItemMetadata[];
}

const SLOT_TYPES: { value: ItemSlotType | ''; label: string }[] = [
  { value: '', label: 'All Slots' },
  { value: 'weapon', label: 'Weapon' },
  { value: 'spirit', label: 'Spirit' },
  { value: 'vitality', label: 'Vitality' },
];

const TIERS: { value: ItemTier | 0; label: string }[] = [
  { value: 0, label: 'All Tiers' },
  { value: 1, label: 'Tier 1' },
  { value: 2, label: 'Tier 2' },
  { value: 3, label: 'Tier 3' },
  { value: 4, label: 'Tier 4' },
];

const SORT_OPTIONS = [
  { value: 'win_rate', label: 'Win Rate' },
  { value: 'matches', label: 'Popularity' },
  { value: 'avg_buy_time_s', label: 'Buy Time' },
  { value: 'confidence', label: 'Confidence' },
];

const GAME_MODES: { value: string; label: string }[] = [
  { value: '', label: 'All Modes' },
  { value: 'normal', label: 'Normal' },
  { value: 'street_brawl', label: 'Street Brawl' },
];

const ItemStatsFiltersBar: React.FC<Props> = ({
  filters,
  onChange,
  searchQuery,
  onSearchChange,
  presets,
  trackedCount,
  onApplyPreset,
  onClearAll,
  allItems,
}) => {
  const update = (patch: Partial<Filters>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <div className="item-stats-filters">
      <div className="item-stats-filters-row">
        <input
          type="text"
          className="item-stats-search-input"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <HeroSelect
          value={filters.hero_id ?? null}
          onChange={(key) => update({ hero_id: key != null ? Number(key) : undefined })}
        />

        <RankRangeSlider
          minBadge={filters.min_average_badge}
          maxBadge={filters.max_average_badge}
          onChange={(min, max) =>
            update({ min_average_badge: min, max_average_badge: max })
          }
        />

        <select
          className="item-stats-filter-select"
          value={filters.game_mode ?? ''}
          onChange={(e) =>
            update({ game_mode: e.target.value || undefined })
          }
        >
          {GAME_MODES.map((gm) => (
            <option key={gm.value} value={gm.value}>
              {gm.label}
            </option>
          ))}
        </select>

        <PresetSelector
          presets={presets}
          trackedCount={trackedCount}
          onApplyPreset={onApplyPreset}
          onClearAll={onClearAll}
          allItems={allItems}
        />
      </div>

      <div className="item-stats-filters-row">
        <div className="item-stats-filter-pills">
          {SLOT_TYPES.map((st) => (
            <button
              key={st.value}
              className={`item-stats-pill ${(filters.item_slot_type ?? '') === st.value ? 'item-stats-pill--active' : ''}`}
              onClick={() =>
                update({
                  item_slot_type: st.value
                    ? (st.value as ItemSlotType)
                    : undefined,
                })
              }
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="item-stats-filter-pills">
          {TIERS.map((t) => (
            <button
              key={t.value}
              className={`item-stats-pill ${(filters.item_tier ?? 0) === t.value ? 'item-stats-pill--active' : ''}`}
              onClick={() =>
                update({
                  item_tier: t.value ? (t.value as ItemTier) : undefined,
                })
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          className="item-stats-filter-select"
          value={filters.sort_by ?? 'win_rate'}
          onChange={(e) =>
            update({ sort_by: e.target.value as Filters['sort_by'] })
          }
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Sort: {o.label}
            </option>
          ))}
        </select>

        <button
          className="item-stats-pill"
          onClick={() =>
            update({
              sort_direction:
                filters.sort_direction === 'asc' ? 'desc' : 'asc',
            })
          }
          title="Toggle sort direction"
        >
          {filters.sort_direction === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>

        <div className="item-stats-min-matches">
          <label>Min matches:</label>
          <input
            type="number"
            className="item-stats-filter-input"
            value={filters.min_matches ?? 20}
            min={1}
            onChange={(e) =>
              update({ min_matches: Math.max(1, Number(e.target.value)) })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ItemStatsFiltersBar;
