import { useEffect, useState } from 'react';
import type { HeroStatsFilters } from '../../../../../shared/types/heroStats';
import { fetchHeroStats } from '../../../../../shared/services/deadlock-api/heroesApiService';
import { createLogger } from '../../../../../shared/services/Logger';
import type { RankCompareTarget } from '../utils/rankCompare';

const logger = createLogger('useRankCompareStats');

export interface RankCompareStat {
  matches: number;
  win_rate: number;
}

interface UseRankCompareStatsResult {
  stats: Map<number, RankCompareStat> | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches hero stats for the rank the user picked to compare against (the
 * Overall tab's "+ Compare with…" control) and reduces it to a per-hero win
 * rate map. Pass `target: null` to skip the fetch entirely — e.g. while no
 * comparison is active, or on the Ranked-vs-Normal tab.
 */
export function useRankCompareStats(
  filters: HeroStatsFilters,
  target: RankCompareTarget | null,
): UseRankCompareStatsResult {
  const [stats, setStats] = useState<Map<number, RankCompareStat> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compareFilters: HeroStatsFilters | null = target
    ? { ...filters, min_average_badge: target.minBadge, max_average_badge: target.maxBadge }
    : null;

  useEffect(() => {
    if (!compareFilters) {
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchHeroStats(compareFilters)
      .then((rows) => {
        if (cancelled) return;
        const map = new Map<number, RankCompareStat>();
        for (const r of rows) {
          const matches = r.matches ?? 0;
          const wins = r.wins ?? 0;
          map.set(r.hero_id, { matches, win_rate: matches > 0 ? wins / matches : 0 });
        }
        setStats(map);
      })
      .catch((err) => {
        if (cancelled) return;
        logger.error('Failed to load rank comparison stats', err);
        setError(String(err));
        setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(compareFilters)]);

  return { stats, loading, error };
}
