import { useEffect, useMemo, useState } from 'react';
import { PlayersApi } from 'deadlock_api_client';
import { deadlockApiConfig } from '../../../../../shared/services/deadlock-api/deadlockApiClient';
import { useSteamId } from '../../../../hooks/useSteamId';
import { useGameEventMatches } from '../../../../hooks/useGameEventMatches';
import { steamIdToAccountId } from '../../../../../shared/utils/steamUtils';
import { matchCache } from '../../../../services/matchCache';
import { createLogger } from '../../../../../shared/services/Logger';

const logger = createLogger('useMyHeroIds');
const playersApi = new PlayersApi(deadlockApiConfig);

interface UseMyHeroIdsResult {
  heroIds: Set<number>;
  loading: boolean;
}

/**
 * Heroes the player has actually played, merged from two independent
 * sources so "My heroes" works without Steam connected too (only ~7% of
 * users have it linked):
 *  - deadlock-api match history, if a Steam ID is set (mirrors MatchHistoryView)
 *  - locally cached Overwolf game-event matches (`matchCache`), which need no
 *    Steam link but only cover matches where the in-game match-history tab
 *    was opened
 */
export function useMyHeroIds(): UseMyHeroIdsResult {
  const { steamId } = useSteamId();
  const { entries: gameEventEntries } = useGameEventMatches();
  const [apiHeroIds, setApiHeroIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const accountId = steamId ? steamIdToAccountId(steamId) : null;

  useEffect(() => {
    if (!accountId) {
      setApiHeroIds(new Set());
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const cached = await matchCache.getHistory(accountId);
        const data =
          cached ??
          (await playersApi
            .matchHistory({ accountId, onlyStoredHistory: true })
            .then((r) => r.data ?? []));
        if (!cached) await matchCache.setHistory(accountId, data);
        if (cancelled) return;
        setApiHeroIds(new Set(data.map((m) => m.hero_id)));
      } catch (err) {
        if (!cancelled) {
          logger.warn('Failed to load match history for "My heroes"', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const heroIds = useMemo(() => {
    const merged = new Set(apiHeroIds);
    for (const entry of gameEventEntries) {
      const id = Number(entry.hero_id);
      if (Number.isFinite(id) && id > 0) merged.add(id);
    }
    return merged;
  }, [apiHeroIds, gameEventEntries]);

  return { heroIds, loading };
}
