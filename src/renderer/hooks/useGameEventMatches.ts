import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageType } from '../../main/services/MessageChannel';
import { matchCache } from '../services/matchCache';
import type { GameEventMatchEntry } from '../../shared/types/matchHistoryEvent';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('useGameEventMatches');

/**
 * Listens for match_history game events broadcast from the background controller
 * and persists them in IndexedDB. Returns the latest known entries.
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

  const handleMessage = useCallback((message: any) => {
    const data: GameEventMatchEntry[] | undefined = message?.data;
    if (!Array.isArray(data) || data.length === 0) {
      logger.warn('handleMessage: received empty or invalid payload', message);
      return;
    }

    const matchIds = data.map((e) => e.match_id);
    logger.log(
      `handleMessage: received ${data.length} game-event entries, match IDs: [${matchIds.join(', ')}]`,
    );

    matchCache
      .mergeGameEventMatches(data)
      .then(() => {
        logger.log('handleMessage: merged entries into IndexedDB');
        matchCache.getGameEventMatches().then((all) => {
          logger.log(
            `handleMessage: total stored game-event matches: ${all.length}`,
          );
          setEntries(all);
        });
      })
      .catch((err) => {
        logger.error('handleMessage: failed to merge game-event matches:', err);
      });
  }, []);

  // Register message listener
  useEffect(() => {
    if (typeof overwolf === 'undefined') return;

    logger.log(
      'Registering onMessageReceived listener for MATCH_HISTORY_UPDATE',
    );
    overwolf.windows.onMessageReceived.addListener((message: any) => {
      try {
        const payload =
          typeof message.content === 'string'
            ? JSON.parse(message.content)
            : message.content;
        if (payload?.type === MessageType.MATCH_HISTORY_UPDATE) {
          logger.log('Received MATCH_HISTORY_UPDATE message');
          handleMessage(payload);
        } else {
          logger.warn('Received non-match-history message:', payload?.type);
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
  }, [handleMessage]);

  return { entries, isListening };
}
