import React, { useEffect } from 'react';
import type { HeroStatsFilters as Filters } from '../../../../../shared/types/heroStats';
import {
  STATS_MODE_OPTIONS,
  filtersToStatsMode,
  statsModeToFilters,
} from '../../../../../shared/data/modeOptions';
import { badgeToLabel } from '../../../../../shared/data/ranks';
import RankRangeSlider from '../../../../components/RankRangeSlider';
import DateRangeSelector from '../../../../components/DateRangeSelector';
import InfoIcon from '../../../../components/InfoIcon';
import ModeSelect from '../../../../components/ModeSelect';
import { getRankCompareOptions, type RankCompareTarget } from '../utils/rankCompare';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  /**
   * Hide the game-mode dropdown (used by the Ranked-vs-Normal view, which
   * fixes game mode to Normal since only the standard game has a
   * ranked/unranked split). Also hides the rank-vs-rank "+ Compare with…"
   * control, which only makes sense on the Overall tab.
   */
  hideGameMode?: boolean;
  /** Restores the default filter set. */
  onReset: () => void;
  /** False when the filters already equal the defaults. */
  canReset: boolean;
  /** Active rank-vs-rank comparison, or `null` if none is selected. */
  rankCompareTarget: RankCompareTarget | null;
  /** Whether the quick-chip comparison row is expanded. */
  rankCompareOpen: boolean;
  onRankCompareToggleOpen: () => void;
  onRankComparePick: (target: RankCompareTarget) => void;
  onRankCompareClear: () => void;
  /** Hero-name search, applied client-side to whichever table is active. */
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** Restricts the table to heroes the player has played. */
  myHeroesOnly: boolean;
  onMyHeroesToggle: () => void;
}

const MIN_HERO_MATCHES_TOTAL_TOOLTIP =
  'Only count games from players who have played this hero at least N times ever (across all patches). Shows how the hero performs in experienced hands.';

const RANK_DISABLED_TOOLTIP =
  'Street Brawl does not support rank-based filtering yet. Switch to Normal or All Modes to filter by rank.';

const HeroStatsFiltersBar: React.FC<Props> = ({
  filters,
  onChange,
  hideGameMode = false,
  onReset,
  canReset,
  rankCompareTarget,
  rankCompareOpen,
  onRankCompareToggleOpen,
  onRankComparePick,
  onRankCompareClear,
  searchQuery,
  onSearchChange,
  myHeroesOnly,
  onMyHeroesToggle,
}) => {
  const update = (patch: Partial<Filters>) => {
    onChange({ ...filters, ...patch });
  };

  const isRankUnsupported = filters.game_mode === 'street_brawl';
  const compareOptions = hideGameMode
    ? []
    : getRankCompareOptions(filters.min_average_badge, filters.max_average_badge);
  const rankRangeLabel = !filters.min_average_badge
    ? 'All Ranks'
    : filters.max_average_badge && filters.max_average_badge !== filters.min_average_badge
      ? `${badgeToLabel(filters.min_average_badge)} – ${badgeToLabel(filters.max_average_badge)}`
      : badgeToLabel(filters.min_average_badge);

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
      <div className="hero-stats-filters-cells">
        <div className="hero-stats-filters-top">
          {!hideGameMode && (
            <div className="hero-stats-filter-cell">
              <span className="hero-stats-filter-cell-label">Mode</span>
              <ModeSelect
                value={filtersToStatsMode(filters)}
                options={STATS_MODE_OPTIONS}
                onChange={(mode) => update(statsModeToFilters(mode))}
                ariaLabel="Game mode"
              />
            </div>
          )}

          <div className="hero-stats-filter-cell">
            <span className="hero-stats-filter-cell-label">Date</span>
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
          </div>

          <div className="hero-stats-filter-cell">
            <label
              className="hero-stats-filter-cell-label"
              htmlFor="hero-stats-min-hero-matches-total-input"
            >
              Min. matches
            </label>
            <div className="hero-stats-min-matches">
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

          <div className="hero-stats-filters-actions">
            <button
              type="button"
              className="stats-filter-reset"
              onClick={onReset}
              disabled={!canReset}
              title={
                canReset
                  ? 'Restore the default filters'
                  : 'Filters are already at their defaults'
              }
            >
              Reset
            </button>

            <input
              type="search"
              className="hero-stats-search-input"
              placeholder="Find a hero"
              aria-label="Find a hero"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <button
              type="button"
              aria-pressed={myHeroesOnly}
              className={`hero-stats-my-heroes-toggle${
                myHeroesOnly ? ' hero-stats-my-heroes-toggle--active' : ''
              }`}
              onClick={onMyHeroesToggle}
            >
              My heroes
            </button>
          </div>
        </div>

        <div className="hero-stats-filters-rank-row">
          <span className="hero-stats-filter-cell-label">Rank</span>
          <RankRangeSlider
            minBadge={filters.min_average_badge}
            maxBadge={filters.max_average_badge}
            onChange={(min, max) =>
              update({ min_average_badge: min, max_average_badge: max })
            }
            disabled={isRankUnsupported}
          />
          {isRankUnsupported && <InfoIcon title={RANK_DISABLED_TOOLTIP} />}
          {!hideGameMode && (
            <button
              type="button"
              className={`hero-stats-rank-compare-toggle${
                rankCompareTarget ? ' hero-stats-rank-compare-toggle--active' : ''
              }`}
              disabled={compareOptions.length === 0}
              title={
                compareOptions.length === 0
                  ? 'Pick a rank range first to compare it against another rank'
                  : undefined
              }
              aria-expanded={rankCompareOpen || rankCompareTarget != null}
              onClick={onRankCompareToggleOpen}
            >
              {rankCompareTarget ? `vs ${rankCompareTarget.name}` : '+ Compare with…'}
            </button>
          )}
          {!hideGameMode && (rankCompareOpen || rankCompareTarget) && compareOptions.length > 0 && (
            <div
              className="hero-stats-rank-compare-row"
              role="group"
              aria-label="Compare with another rank"
            >
              <span className="hero-stats-rank-compare-label">
                Compare {rankRangeLabel} with
              </span>
              {compareOptions.map((option) => (
                <button
                  key={option.kind}
                  type="button"
                  aria-pressed={rankCompareTarget?.kind === option.kind}
                  className={`hero-stats-rank-compare-chip${
                    rankCompareTarget?.kind === option.kind
                      ? ' hero-stats-rank-compare-chip--active'
                      : ''
                  }`}
                  onClick={() => onRankComparePick(option)}
                >
                  {option.chipLabel}
                </button>
              ))}
              {rankCompareTarget && (
                <button
                  type="button"
                  className="hero-stats-rank-compare-remove"
                  aria-label="Remove comparison"
                  onClick={onRankCompareClear}
                >
                  × Remove comparison
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroStatsFiltersBar;
