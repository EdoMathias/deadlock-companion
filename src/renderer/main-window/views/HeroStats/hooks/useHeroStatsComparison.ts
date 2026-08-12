import { useCallback, useEffect, useState } from 'react';
import type {
  HeroStatsFilters,
  HeroWinRateComparisonRow,
} from '../../../../../shared/types/heroStats';
import { fetchHeroStatsByMatchMode } from '../../../../../shared/services/deadlock-api/heroesApiService';
import { createLogger } from '../../../../../shared/services/Logger';

const logger = createLogger('useHeroStatsComparison');

/**
 * Client-side floor on a hero's per-mode appearance count. Win rate on a
 * handful of games is noise, so heroes below this in either queue are
 * dropped from the comparison. (`matches` here is hero appearances, which
 * the analytics endpoint inflates ~12x vs real matches.)
 */
const MIN_SAMPLE = 50;

interface UseHeroStatsComparisonResult {
  rows: HeroWinRateComparisonRow[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches hero stats for the ranked and unranked queues in parallel and
 * merges them per hero into a win-rate comparison (ranked, normal, delta).
 * `game_mode` is forced to `normal` because only the standard game has a
 * ranked/unranked split. Pass `enabled: false` to skip the two network
 * calls while the comparison view isn't shown.
 */
export function useHeroStatsComparison(
  filters: HeroStatsFilters,
  enabled = true,
): UseHeroStatsComparisonResult {
  const [rows, setRows] = useState<HeroWinRateComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const base: HeroStatsFilters = { ...filters, game_mode: 'normal' };
      const [ranked, normal] = await Promise.all([
        fetchHeroStatsByMatchMode(base, 'ranked'),
        fetchHeroStatsByMatchMode(base, 'unranked'),
      ]);

      const rankedByHero = new Map(ranked.map((r) => [r.hero_id, r]));
      const merged: HeroWinRateComparisonRow[] = [];
      for (const n of normal) {
        const r = rankedByHero.get(n.hero_id);
        if (!r) continue; // require presence in both queues
        const rankedMatches = r.matches ?? 0;
        const normalMatches = n.matches ?? 0;
        if (rankedMatches < MIN_SAMPLE || normalMatches < MIN_SAMPLE) continue;

        const rankedWins = r.wins ?? 0;
        const normalWins = n.wins ?? 0;
        const rankedWinRate = rankedMatches > 0 ? rankedWins / rankedMatches : 0;
        const normalWinRate = normalMatches > 0 ? normalWins / normalMatches : 0;

        merged.push({
          hero_id: n.hero_id,
          ranked_matches: rankedMatches,
          ranked_wins: rankedWins,
          ranked_win_rate: rankedWinRate,
          normal_matches: normalMatches,
          normal_wins: normalWins,
          normal_win_rate: normalWinRate,
          win_rate_delta: rankedWinRate - normalWinRate,
        });
      }

      setRows(merged);
    } catch (err) {
      logger.error('Failed to load hero stats comparison', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading, error, refetch: load };
}
