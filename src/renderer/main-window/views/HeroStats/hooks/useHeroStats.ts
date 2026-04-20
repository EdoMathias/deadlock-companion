import { useCallback, useEffect, useState } from 'react';
import type {
  HeroStatsComputed,
  HeroStatsFilters,
} from '../../../../../shared/types/heroStats';
import {
  BANS_PER_MATCH,
  getPickrateMultiplier,
} from '../../../../../shared/types/heroStats';
import {
  fetchHeroStats,
  fetchHeroBanStats,
} from '../../../../../shared/services/deadlock-api/heroesApiService';
import { createLogger } from '../../../../../shared/services/Logger';

const logger = createLogger('useHeroStats');

interface UseHeroStatsResult {
  rows: HeroStatsComputed[];
  loading: boolean;
  error: string | null;
  totalMatches: number;
  /**
   * True when either `min_hero_matches` or `min_hero_matches_total` is
   * set. In that mode the API aggregates over a restricted player pool,
   * so the raw `matches / sumMatches` fraction stops representing true
   * real-world pick rate. We switch to `matches / maxMatches` (share
   * relative to the most-played hero in the filtered sample) and the
   * table relabels the column "Pick Rate (Normalized)".
   */
  pickRateNormalized: boolean;
  refetch: () => void;
}

export function useHeroStats(filters: HeroStatsFilters): UseHeroStatsResult {
  const [rows, setRows] = useState<HeroStatsComputed[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [pickRateNormalized, setPickRateNormalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, bans] = await Promise.all([
        fetchHeroStats(filters),
        fetchHeroBanStats(filters),
      ]);

      const sumMatches = stats.reduce((sum, r) => sum + (r.matches ?? 0), 0);
      const maxMatches = stats.reduce(
        (max, r) => Math.max(max, r.matches ?? 0),
        0,
      );
      const pickrateMultiplier = getPickrateMultiplier(filters.game_mode);
      const totalMatches = Math.round(sumMatches / pickrateMultiplier);

      const banByHero = new Map<number, number>();
      let totalBans = 0;
      for (const row of bans) {
        const n = row.bans ?? 0;
        banByHero.set(row.hero_id, (banByHero.get(row.hero_id) ?? 0) + n);
        totalBans += n;
      }
      const banMatchesDenominator = totalBans / BANS_PER_MATCH;

      const normalized =
        (filters.min_hero_matches ?? 0) > 0 ||
        (filters.min_hero_matches_total ?? 0) > 0;

      const computed: HeroStatsComputed[] = stats.map((r) => {
        const matches = r.matches ?? 0;
        const wins = r.wins ?? 0;
        const losses = r.losses ?? 0;
        const bansForHero = banByHero.get(r.hero_id) ?? 0;
        const pickRate = normalized
          ? maxMatches > 0
            ? matches / maxMatches
            : 0
          : sumMatches > 0
            ? (pickrateMultiplier * matches) / sumMatches
            : 0;
        return {
          hero_id: r.hero_id,
          matches,
          wins,
          losses,
          bans: bansForHero,
          win_rate: matches > 0 ? wins / matches : 0,
          pick_rate: pickRate,
          ban_rate:
            banMatchesDenominator > 0
              ? bansForHero / banMatchesDenominator
              : 0,
        };
      });

      setRows(computed);
      setTotalMatches(totalMatches);
      setPickRateNormalized(normalized);
    } catch (err) {
      logger.error('Failed to load hero stats', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return {
    rows,
    loading,
    error,
    totalMatches,
    pickRateNormalized,
    refetch: load,
  };
}
