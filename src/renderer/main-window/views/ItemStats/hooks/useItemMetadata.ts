import { useState, useEffect } from 'react';
import type { ItemMetadata } from '../../../../../shared/types/items';
import { fetchAllItems } from '../../../../../shared/services/deadlock-api/assetsApiService';

export function useItemMetadata() {
  const [items, setItems] = useState<ItemMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllItems();
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}
