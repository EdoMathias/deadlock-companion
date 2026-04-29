import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MessageType } from '../../main/services/MessageChannel';
import type {
  LiveRosterEntry,
  LiveRosterUpdatePayload,
  LiveMatchStartPayload,
} from '../../shared/types/liveMatch';
import type { ItemMetadata } from '../../shared/types/items';
import type { ItemStats } from 'deadlock_api_client';
import { fetchCounterItemStats } from '../../shared/services/deadlock-api/itemsApiService';
import { fetchAllItems } from '../../shared/services/deadlock-api/assetsApiService';
import { getWidgetConfig } from '../../shared/stores/overlayLayoutStore';
import { getHero } from '../../shared/data/heroes';
import { HotkeysAPI } from '../../shared/services/hotkeys';
import { createLogger } from '../../shared/services/Logger';
import '../styles/index.css';

const logger = createLogger('CounterItems');

interface CounterItemRow {
  metadata: ItemMetadata;
  winRate: number;
  matches: number;
}

const CounterItems: React.FC = () => {
  const [roster, setRoster] = useState<LiveRosterEntry[]>([]);
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [selectedEnemyIds, setSelectedEnemyIds] = useState<Set<number>>(new Set());
  const [itemStats, setItemStats] = useState<ItemStats[]>([]);
  const [allItems, setAllItems] = useState<Map<number, ItemMetadata>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [hotkeyBinding, setHotkeyBinding] = useState('Alt+Shift+F');
  const [error, setError] = useState<string | null>(null);
  const [matchElapsedS, setMatchElapsedS] = useState(0);
  const [refreshIntervalS, setRefreshIntervalS] = useState(
    () => getWidgetConfig('counter_items')?.refresh_interval_s ?? 120,
  );

  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchStartTimeRef = useRef<number | null>(null);
  const prevEnemyKeyRef = useRef<string>('');

  const localPlayer = useMemo(
    () => roster.find((p) => p.is_local),
    [roster],
  );

  const enemies = useMemo(() => {
    if (!localPlayer) return [];
    return roster.filter(
      (p) => p.team_id !== localPlayer.team_id && p.hero_id > 0,
    );
  }, [roster, localPlayer]);

  // Initialize selected enemies when enemies change
  useEffect(() => {
    if (enemies.length === 0) return;
    setSelectedEnemyIds((prev) => {
      const enemyHeroIds = new Set(enemies.map((e) => e.hero_id));
      // Add newly-appeared enemies; keep existing selections that are still valid
      const next = new Set<number>();
      for (const id of enemyHeroIds) {
        if (prev.size === 0 || prev.has(id)) {
          next.add(id);
        }
      }
      // If prev had selections but none are valid anymore, select all
      if (next.size === 0) {
        return enemyHeroIds;
      }
      return next;
    });
  }, [enemies]);

  // Load item metadata once
  useEffect(() => {
    fetchAllItems()
      .then((items) => {
        const map = new Map<number, ItemMetadata>();
        for (const item of items) {
          map.set(item.id, item);
        }
        setAllItems(map);
      })
      .catch((err) => logger.warn('Failed to load item metadata:', err));
  }, []);

  // Load hotkey binding and listen for changes
  useEffect(() => {
    if (typeof overwolf === 'undefined') return;

    const loadBinding = () => {
      HotkeysAPI.fetchAll()
        .then((map) => {
          const hk = map.get('ToggleCounterItems');
          if (hk?.binding) setHotkeyBinding(hk.binding);
        })
        .catch(() => {});
    };

    loadBinding();

    const onChanged = () => loadBinding();
    overwolf.settings.hotkeys.onChanged.addListener(onChanged);
    return () => {
      overwolf.settings.hotkeys.onChanged.removeListener(onChanged);
    };
  }, []);

  // Fetch counter item stats when hero/enemy selection changes (debounced)
  const doFetch = useCallback((force = false) => {
    if (!localPlayer || localPlayer.hero_id <= 0) return;
    const enemyIds = Array.from(selectedEnemyIds).filter((id) => id > 0);
    if (enemyIds.length === 0) return;

    const key = `${localPlayer.hero_id}_${enemyIds.sort().join(',')}`;
    if (!force && key === prevEnemyKeyRef.current) return;
    prevEnemyKeyRef.current = key;

    setIsLoading(true);
    setError(null);

    fetchCounterItemStats(localPlayer.hero_id, enemyIds)
      .then((stats) => {
        setItemStats(stats);
        setIsLoading(false);
      })
      .catch((err) => {
        logger.warn('Failed to fetch counter item stats:', err);
        setError('Failed to load item recommendations.');
        setIsLoading(false);
      });
  }, [localPlayer, selectedEnemyIds]);

  useEffect(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => doFetch(false), 400);
    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [doFetch]);

  // Re-read widget config when the OverlayEditor (in another window) writes it.
  // The `storage` event fires in every window except the one that did the write,
  // so this picks up live slider changes from main_desktop / main_ingame.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'dl_overlay_layout') return;
      const next = getWidgetConfig('counter_items')?.refresh_interval_s ?? 120;
      setRefreshIntervalS(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Periodic refresh on the configured interval to update time-based filtering
  useEffect(() => {
    if (!isMatchActive) return;

    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    refreshIntervalRef.current = setInterval(() => {
      prevEnemyKeyRef.current = '';
      doFetch(true);
    }, refreshIntervalS * 1000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [isMatchActive, doFetch, refreshIntervalS]);

  // Start / stop the match elapsed-time ticker based on matchStartTimeRef.
  // Separated from the message listener so it doesn't get killed by the
  // listener's cleanup cycle.
  const startMatchTimer = useCallback(() => {
    if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    matchTimerRef.current = setInterval(() => {
      if (matchStartTimeRef.current != null) {
        setMatchElapsedS(Math.floor((Date.now() - matchStartTimeRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const stopMatchTimer = useCallback(() => {
    if (matchTimerRef.current) {
      clearInterval(matchTimerRef.current);
      matchTimerRef.current = null;
    }
  }, []);

  // Message listener -- no deps on isMatchActive so the listener is
  // registered once and never torn down mid-match.
  useEffect(() => {
    if (typeof overwolf === 'undefined') return;

    const handler = (message: overwolf.windows.MessageReceivedEvent) => {
      try {
        const payload =
          typeof message.content === 'string'
            ? JSON.parse(message.content)
            : message.content;

        if (!payload?.type) return;

        switch (payload.type) {
          case MessageType.LIVE_MATCH_START: {
            const data = payload.data as LiveMatchStartPayload;
            setIsMatchActive(true);
            setRoster([]);
            setItemStats([]);
            setSelectedEnemyIds(new Set());
            prevEnemyKeyRef.current = '';
            setError(null);
            matchStartTimeRef.current = data?.matchStartTimestamp ?? Date.now();
            setMatchElapsedS(0);
            startMatchTimer();
            break;
          }
          case MessageType.LIVE_ROSTER_UPDATE: {
            const data = payload.data as LiveRosterUpdatePayload;
            setRoster(data.roster ?? []);
            if (data.matchStartTimestamp && !data.isMatchEnded) {
              setIsMatchActive(true);
              if (!matchStartTimeRef.current) {
                matchStartTimeRef.current = data.matchStartTimestamp;
                setMatchElapsedS(Math.floor((Date.now() - data.matchStartTimestamp) / 1000));
                startMatchTimer();
              }
            }
            break;
          }
          case MessageType.LIVE_MATCH_END: {
            setIsMatchActive(false);
            stopMatchTimer();
            matchStartTimeRef.current = null;
            break;
          }
        }
      } catch (err) {
        logger.warn('Failed to parse message:', err);
      }
    };

    overwolf.windows.onMessageReceived.addListener(handler);

    // Request current state on mount
    const reqPayload = {
      type: MessageType.REQUEST_LIVE_MATCH_STATE,
      timestamp: Date.now(),
    };
    overwolf.windows.sendMessage(
      'background',
      MessageType.REQUEST_LIVE_MATCH_STATE,
      reqPayload,
      () => {},
    );

    return () => {
      overwolf.windows.onMessageReceived.removeListener(handler);
      stopMatchTimer();
    };
  }, [startMatchTimer, stopMatchTimer]);

  const toggleEnemy = useCallback((heroId: number) => {
    setSelectedEnemyIds((prev) => {
      const next = new Set(prev);
      if (next.has(heroId)) {
        if (next.size > 1) next.delete(heroId);
      } else {
        next.add(heroId);
      }
      return next;
    });
    prevEnemyKeyRef.current = '';
  }, []);

  // Bucket the elapsed time into the refresh window so the memo only
  // recalculates when the window ticks, not every second.
  const timeBucket = Math.floor(matchElapsedS / refreshIntervalS);

  // Build display rows: merge stats with metadata, filter by buy time, sort.
  // Uses timeBucket (not raw matchElapsedS) as the dependency so the list
  // updates on each refresh tick rather than every second.
  const displayRows = useMemo<CounterItemRow[]>(() => {
    if (itemStats.length === 0 || allItems.size === 0) return [];

    // Derive the effective elapsed time from the bucket so it's consistent
    // with the dependency that triggers this memo.
    const effectiveElapsed = timeBucket * refreshIntervalS;
    // Upper bound: items whose avg buy time is within one window ahead
    const upperBound = effectiveElapsed + refreshIntervalS;

    const rows: CounterItemRow[] = [];
    for (const stat of itemStats) {
      if (effectiveElapsed > 0 && stat.avg_buy_time_s > upperBound) {
        continue;
      }
      const meta = allItems.get(stat.item_id);
      if (!meta) continue;
      const winRate = stat.matches > 0 ? stat.wins / stat.matches : 0;
      rows.push({ metadata: meta, winRate, matches: stat.matches });
    }

    rows.sort((a, b) => b.winRate - a.winRate);
    return rows.slice(0, 20);
  }, [itemStats, allItems, timeBucket, refreshIntervalS]);

  if (!isMatchActive) {
    return (
      <div className="ci-root">
        <div className="ci-header">
          <span className="ci-title">Counter Items</span>
          <span className="ci-hotkey-hint">Press {hotkeyBinding} to hide</span>
        </div>
        <div className="ci-empty">Waiting for match...</div>
      </div>
    );
  }

  return (
    <div className="ci-root">
      <div className="ci-header">
        <span className="ci-title">Counter Items</span>
        <span className="ci-hotkey-hint">Press {hotkeyBinding} to hide</span>
      </div>

      {enemies.length > 0 && (
        <div className="ci-enemy-row">
          {enemies.map((enemy) => {
            const hero = getHero(enemy.hero_id);
            const isSelected = selectedEnemyIds.has(enemy.hero_id);
            const imgSrc =
              hero?.images.icon_image_small_webp ??
              hero?.images.icon_image_small;
            return (
              <button
                key={enemy.hero_id}
                className={`ci-enemy-btn ${isSelected ? 'ci-enemy-btn--active' : 'ci-enemy-btn--inactive'}`}
                onClick={() => toggleEnemy(enemy.hero_id)}
                title={hero?.name ?? enemy.hero_name}
              >
                {imgSrc ? (
                  <img
                    className="ci-enemy-icon"
                    src={imgSrc}
                    alt={hero?.name ?? enemy.hero_name}
                  />
                ) : (
                  <div className="ci-enemy-placeholder">
                    {(hero?.name ?? enemy.hero_name).charAt(0)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="ci-list-container">
        {isLoading && (
          <div className="ci-loading">
            <div className="ci-spinner" />
          </div>
        )}

        {error && !isLoading && (
          <div className="ci-error">{error}</div>
        )}

        {!isLoading && !error && displayRows.length === 0 && enemies.length > 0 && (
          <div className="ci-empty">No item recommendations yet.</div>
        )}

        {!isLoading && !error && displayRows.length > 0 && (
          <div className="ci-list">
            {displayRows.map((row) => {
              const imgSrc =
                row.metadata.shop_image_webp ?? row.metadata.shop_image ?? row.metadata.image_webp ?? row.metadata.image;
              return (
                <div key={row.metadata.id} className="ci-item-row">
                  <div className="ci-item-img-wrap">
                    {imgSrc ? (
                      <img className="ci-item-img" src={imgSrc} alt={row.metadata.name} />
                    ) : (
                      <div className="ci-item-img-placeholder" />
                    )}
                  </div>
                  <span className="ci-item-name">{row.metadata.name}</span>
                  <span className="ci-item-wr">
                    {(row.winRate * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const mountApp = () => {
  const container = document.getElementById('root');
  if (!container) {
    logger.error('Counter items root element not found');
    return;
  }

  const root = createRoot(container);
  root.render(<CounterItems />);
};

mountApp();
