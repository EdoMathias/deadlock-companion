import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageType } from '../../main/services/MessageChannel';
import { matchCache } from '../services/matchCache';
import type { GameEventMatchEntry } from '../../shared/types/matchHistoryEvent';
import type { LiveRosterEntry } from '../../shared/types/liveMatch';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('useGameEventMatches');

/**
 * Listens for match_history game events broadcast from the background controller
 * and persists them in IndexedDB. Returns the latest known entries.
 *
 * Also handles ROSTER_SNAPSHOT messages so the renderer stores the roster
 * in its own IndexedDB (cross-window IDB writes are unreliable in Overwolf).
 */
export function useGameEventMatches() {
  const [entries, setEntries] = useState<GameEventMatchEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const unregisterRef = useRef<(() => void) | null>(null);

  // Load persisted entries on mount
  useEffect(() => {
    logger.log('Loading cached game-event matches from IndexedDB…');
    matchCache
      .getGameEventMatches()
      .then((cached) => {
        logger.log(`Loaded ${cached.length} cached game-event matches`);
        if (cached.length > 0) setEntries(cached);
      })
      .catch((err) => {
        logger.error('Failed to load cached game-event matches:', err);
      });
  }, []);

  const handleMatchHistoryMessage = useCallback((message: any) => {
    const data: GameEventMatchEntry[] | undefined = message?.data;
    if (!Array.isArray(data) || data.length === 0) {
      logger.warn('handleMatchHistoryMessage: received empty or invalid payload', message);
      return;
    }

    const matchIds = data.map((e) => e.match_id);
    logger.log(
      `handleMatchHistoryMessage: received ${data.length} game-event entries, match IDs: [${matchIds.join(', ')}]`,
    );

    matchCache
      .mergeGameEventMatches(data)
      .then(() => {
        logger.log('handleMatchHistoryMessage: merged entries into IndexedDB');
        matchCache.getGameEventMatches().then((all) => {
          logger.log(
            `handleMatchHistoryMessage: total stored game-event matches: ${all.length}`,
          );
          setEntries(all);
        });
      })
      .catch((err) => {
        logger.error('handleMatchHistoryMessage: failed to merge game-event matches:', err);
      });
  }, []);

  const handleRosterSnapshot = useCallback((message: any) => {
    const data = message?.data as
      | { matchId: string; roster: LiveRosterEntry[] }
      | undefined;
    if (!data?.matchId || !Array.isArray(data.roster) || data.roster.length === 0) {
      logger.warn('handleRosterSnapshot: received empty or invalid payload', message);
      return;
    }

    logger.log(
      `handleRosterSnapshot: persisting ${data.roster.length} players for match ${data.matchId}`,
    );

    matchCache
      .setRosterSnapshot(data.matchId, data.roster)
      .then(() => {
        logger.log(`handleRosterSnapshot: saved roster for match ${data.matchId}`);
        logger.log(`handleRosterSnapshot: roster saved: ${data.roster}`);
      })
      .catch((err) => {
        logger.error('handleRosterSnapshot: failed to persist roster:', err);
      });
  }, []);

  // Register message listener
  useEffect(() => {
    if (typeof overwolf === 'undefined') return;

    logger.log(
      'Registering onMessageReceived listener for MATCH_HISTORY_UPDATE + ROSTER_SNAPSHOT',
    );
    overwolf.windows.onMessageReceived.addListener((message: any) => {
      try {
        const payload =
          typeof message.content === 'string'
            ? JSON.parse(message.content)
            : message.content;
        if (payload?.type === MessageType.MATCH_HISTORY_UPDATE) {
          logger.log('Received MATCH_HISTORY_UPDATE message');
          handleMatchHistoryMessage(payload);
        } else if (payload?.type === MessageType.ROSTER_SNAPSHOT) {
          logger.log('Received ROSTER_SNAPSHOT message');
          logger.log('roster snapshot payload:', payload);
          handleRosterSnapshot(payload);
        }
      } catch (err) {
        logger.warn('Failed to parse incoming message:', err);
      }
    });
    setIsListening(true);
    logger.log('Listener registered, isListening=true');

    return () => {
      // Overwolf's addListener doesn't return a remove handle easily,
      // but this hook stays alive for the window's lifetime.
    };
  }, [handleMatchHistoryMessage, handleRosterSnapshot]);

  return { entries, isListening };
}
