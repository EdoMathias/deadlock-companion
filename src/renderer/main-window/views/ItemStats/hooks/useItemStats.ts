import { useState, useEffect, useCallback } from 'react';
import type {
  ItemStatsFilters,
  ItemAnalyticsComputed,
} from '../../../../../shared/types/items';
import {
  fetchItemStats,
} from '../../../../../shared/services/deadlock-api/itemsApiService';

/**
 * Wilson score interval lower bound for a given win count / total.
 * Gives a "confidence-adjusted" win rate that penalizes small samples.
 */
function wilsonLowerBound(wins: number, total: number, z = 1.96): number {
  if (total === 0) return 0;
  const p = wins / total;
  const denominator = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return (centre - spread) / denominator;
}

export function useItemAnalytics(filters: ItemStatsFilters) {
  const [analytics, setAnalytics] = useState<ItemAnalyticsComputed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMatches, setTotalMatches] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchItemStats(filters);
      const total = data.reduce((sum, row) => sum + row.matches, 0);
      setTotalMatches(total);

      const computed: ItemAnalyticsComputed[] = data.map((row) => ({
        ...row,
        win_rate: row.matches > 0 ? row.wins / row.matches : 0,
        pick_rate: total > 0 ? row.matches / total : 0,
        confidence: wilsonLowerBound(row.wins, row.matches),
      }));

      setAnalytics(computed);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  return { analytics, loading, error, totalMatches, refetch: load };
}

