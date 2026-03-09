import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageType } from '../../main/services/MessageChannel';
import type {
  LiveRosterEntry,
  LiveRosterUpdatePayload,
  LiveMatchStartPayload,
  GameModeInfo,
  TeamScores,
} from '../../shared/types/liveMatch';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('useLiveMatch');

/** Roster entry enriched with locally-computed last-hit count. */
export interface EnrichedRosterEntry extends LiveRosterEntry {
  lastHits: number;
}

export interface UseLiveMatchResult {
  isMatchActive: boolean;
  isMatchEnded: boolean;
  roster: EnrichedRosterEntry[];
  matchId: string | null;
  elapsedSeconds: number;
  gameMode: GameModeInfo | null;
  teamScores: TeamScores | null;
}

/**
 * Consumes live match events from the background controller.
 * Tracks roster updates, match start/end, and a live elapsed-time counter.
 * Enriches roster entries with a computed last-hits count.
 */
export function useLiveMatch(): UseLiveMatchResult {
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [isMatchEnded, setIsMatchEnded] = useState(false);
  const [roster, setRoster] = useState<EnrichedRosterEntry[]>([]);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gameMode, setGameMode] = useState<GameModeInfo | null>(null);
  const [teamScores, setTeamScores] = useState<TeamScores | null>(null);

  const matchStartTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track previous souls per player to detect changes → increment LH
  const prevSoulsRef = useRef<Map<number, number>>(new Map());
  const lastHitsRef = useRef<Map<number, number>>(new Map());

  const startTimer = useCallback((startTimestamp: number) => {
    // Clear any prior timer
    if (timerRef.current) clearInterval(timerRef.current);
    matchStartTimeRef.current = startTimestamp;
    setElapsedSeconds(Math.floor((Date.now() - startTimestamp) / 1000));

    timerRef.current = setInterval(() => {
      if (matchStartTimeRef.current == null) return;
      setElapsedSeconds(
        Math.floor((Date.now() - matchStartTimeRef.current) / 1000),
      );
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Message listener
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
            logger.log('LIVE_MATCH_START received', data);
            setIsMatchActive(true);
            setIsMatchEnded(false);
            setRoster([]);
            setMatchId(data?.matchId ?? null);
            setGameMode(null);
            setTeamScores(null);
            prevSoulsRef.current.clear();
            lastHitsRef.current.clear();
            startTimer(data?.matchStartTimestamp ?? Date.now());
            break;
          }
          case MessageType.LIVE_ROSTER_UPDATE: {
            const data = payload.data as LiveRosterUpdatePayload;
            const rawRoster = data.roster ?? [];

            // Update gameMode / teamScores if present
            if (data.gameMode) setGameMode(data.gameMode);
            if (data.teamScores) setTeamScores(data.teamScores);

            // Enrich with last-hit tracking
            const enriched: EnrichedRosterEntry[] = rawRoster.map((player) => {
              const id = player.steam_id;
              const prevSouls = prevSoulsRef.current.get(id);
              let lh = lastHitsRef.current.get(id) ?? 0;

              // If souls increased, count as a last-hit event
              if (prevSouls != null && player.souls > prevSouls) {
                lh += 1;
              }

              prevSoulsRef.current.set(id, player.souls);
              lastHitsRef.current.set(id, lh);

              return { ...player, lastHits: lh };
            });

            setRoster(enriched);

            // If we missed the match_start message, bootstrap from the roster update
            if (!matchStartTimeRef.current && data.matchStartTimestamp) {
              setIsMatchActive(true);
              setIsMatchEnded(false);
              setMatchId(data.matchId ?? null);
              startTimer(data.matchStartTimestamp);
            }
            break;
          }
          case MessageType.LIVE_MATCH_END: {
            logger.log('LIVE_MATCH_END received');
            setIsMatchActive(false);
            setIsMatchEnded(true);
            stopTimer();
            // Keep roster, scores, gameMode, teamScores for post-match review
            break;
          }
          // Also listen for game state so we know if the game exits entirely
          case MessageType.GAME_STATE_CHANGED: {
            const isRunning = payload.data?.isRunning === true;
            if (!isRunning) {
              setIsMatchActive(false);
              setIsMatchEnded(false);
              setRoster([]);
              setMatchId(null);
              setElapsedSeconds(0);
              setGameMode(null);
              setTeamScores(null);
              matchStartTimeRef.current = null;
              prevSoulsRef.current.clear();
              lastHitsRef.current.clear();
              stopTimer();
            }
            break;
          }
        }
      } catch (err) {
        logger.warn('Failed to parse incoming message:', err);
      }
    };

    overwolf.windows.onMessageReceived.addListener(handler);
    logger.log('Registered live match message listener');

    // Request current state from background controller on mount
    // This ensures we get the latest roster data if we're remounting mid-match
    const payload = {
      type: MessageType.REQUEST_LIVE_MATCH_STATE,
      timestamp: Date.now(),
    };
    overwolf.windows.sendMessage(
      'background',
      MessageType.REQUEST_LIVE_MATCH_STATE,
      payload,
      () => {
        logger.log('Requested current live match state');
      },
    );

    return () => {
      overwolf.windows.onMessageReceived.removeListener(handler);
      stopTimer();
    };
  }, [startTimer, stopTimer]);

  return {
    isMatchActive,
    isMatchEnded,
    roster,
    matchId,
    elapsedSeconds,
    gameMode,
    teamScores,
  };
}
