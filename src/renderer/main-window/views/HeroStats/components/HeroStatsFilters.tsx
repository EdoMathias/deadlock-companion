import React, { useEffect } from 'react';
import type { HeroStatsFilters as Filters } from '../../../../../shared/types/heroStats';
import RankRangeSlider from '../../../../components/RankRangeSlider';
import DateRangeSelector from '../../../../components/DateRangeSelector';
import InfoIcon from '../../../../components/InfoIcon';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  /**
   * Hide the game-mode dropdown (used by the Ranked-vs-Normal view, which
   * fixes game mode to Normal since only the standard game has a
   * ranked/unranked split).
   */
  hideGameMode?: boolean;
}

const GAME_MODES: { value: string; label: string }[] = [
  { value: '', label: 'All Modes' },
  { value: 'normal', label: 'Normal' },
  { value: 'street_brawl', label: 'Street Brawl' },
];

const MIN_HERO_MATCHES_TOOLTIP =
  'Only count games from players who have played this hero at least N times in the selected period. Hides first-time tryouts so the numbers lean toward players who know the hero.';

const MIN_HERO_MATCHES_TOTAL_TOOLTIP =
  'Only count games from players who have played this hero at least N times ever (across all patches). Shows how the hero performs in experienced hands.';

const RANK_DISABLED_TOOLTIP =
  'Street Brawl does not support rank-based filtering yet. Switch to Normal or All Modes to filter by rank.';

const HeroStatsFiltersBar: React.FC<Props> = ({
  filters,
  onChange,
  hideGameMode = false,
}) => {
  const update = (patch: Partial<Filters>) => {
    onChange({ ...filters, ...patch });
  };

  const isRankUnsupported = filters.game_mode === 'street_brawl';

  // Street Brawl returns a 400 if rank filters are sent, so clear any
  // stale min/max badge whenever the user switches into that mode.
  useEffect(() => {
    if (
      isRankUnsupported &&
      (filters.min_average_badge != null || filters.max_average_badge != null)
    ) {
      onChange({
        ...filters,
        min_average_badge: undefined,
        max_average_badge: undefined,
      });
    }
  }, [isRankUnsupported, filters, onChange]);

  return (
    <div className="hero-stats-filters">
      <div className="hero-stats-filters-row">
        {!hideGameMode && (
          <select
            className="hero-stats-filter-select"
            value={filters.game_mode ?? ''}
            onChange={(e) =>
              update({ game_mode: e.target.value || undefined })
            }
            aria-label="Game mode"
          >
            {GAME_MODES.map((gm) => (
              <option key={gm.value || 'all'} value={gm.value}>
                {gm.label}
              </option>
            ))}
          </select>
        )}

        <DateRangeSelector
          minUnixTimestamp={filters.min_unix_timestamp}
          maxUnixTimestamp={filters.max_unix_timestamp}
          onChange={(min, max) =>
            update({
              min_unix_timestamp: min,
              max_unix_timestamp: max,
            })
          }
        />

        <div className="hero-stats-rank-group">
          <RankRangeSlider
            minBadge={filters.min_average_badge}
            maxBadge={filters.max_average_badge}
            onChange={(min, max) =>
              update({ min_average_badge: min, max_average_badge: max })
            }
            disabled={isRankUnsupported}
          />
          {isRankUnsupported && <InfoIcon title={RANK_DISABLED_TOOLTIP} />}
        </div>

        <div className="hero-stats-min-matches">
          <label htmlFor="hero-stats-min-hero-matches-input">
            Min matches (in range):
          </label>
          <InfoIcon title={MIN_HERO_MATCHES_TOOLTIP} />
          <input
            id="hero-stats-min-hero-matches-input"
            type="number"
            className="hero-stats-filter-input"
            value={filters.min_hero_matches ?? 0}
            min={0}
            title={MIN_HERO_MATCHES_TOOLTIP}
            onChange={(e) =>
              update({
                min_hero_matches: Math.max(0, Number(e.target.value)) || undefined,
              })
            }
          />
        </div>

        <div className="hero-stats-min-matches">
          <label htmlFor="hero-stats-min-hero-matches-total-input">
            Min matches (all-time):
          </label>
          <InfoIcon title={MIN_HERO_MATCHES_TOTAL_TOOLTIP} />
          <input
            id="hero-stats-min-hero-matches-total-input"
            type="number"
            className="hero-stats-filter-input"
            value={filters.min_hero_matches_total ?? 0}
            min={0}
            title={MIN_HERO_MATCHES_TOTAL_TOOLTIP}
            onChange={(e) =>
              update({
                min_hero_matches_total:
                  Math.max(0, Number(e.target.value)) || undefined,
              })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default HeroStatsFiltersBar;
