import React, { useEffect, useState } from 'react';
import { useSteamId } from '../../../hooks/useSteamId';

/**
 * Live Match View
 *
 * Shows real-time stats for the user's current Deadlock match.
 *
 * Data sources:
 *  - Overwolf game events (game-state.service.ts / MessageChannel) for
 *    in-process telemetry (kills, deaths, items, etc.)
 *  - deadlock-api.com /v1/matches/active for supplementary live data
 *
 * Overwolf event integration is kept in the background service layer
 * (src/main/services/game-state.service.ts). Connect this view to
 * MessageChannel once event parsing is implemented.
 */
const LiveMatchView: React.FC = () => {
  const { steamId } = useSteamId();
  const [isGameActive, setIsGameActive] = useState(false);

  // Listen for game-state messages from the background page
  useEffect(() => {
    const handler = (message: overwolf.windows.MessageReceivedEvent) => {
      try {
        const payload = JSON.parse(message.content ?? '{}');
        if (payload.type === 'GAME_STATE_CHANGED') {
          setIsGameActive(payload.isRunning === true);
        }
      } catch {
        // Ignore parse errors
      }
    };
    overwolf.windows.onMessageReceived.addListener(handler);
    return () => {
      overwolf.windows.onMessageReceived.removeListener(handler);
    };
  }, []);

  return (
    <section className="view-container live-match-container">
      <div className="view-header">
        <h2 className="view-title">Live Match</h2>
        <div
          className={`status-badge ${isGameActive ? 'status-badge--active' : 'status-badge--idle'}`}
        >
          {isGameActive ? '● Live' : '○ No Active Match'}
        </div>
      </div>

      {!isGameActive ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎮</div>
          <h3 className="empty-state-title">No Active Match</h3>
          <p className="empty-state-description">
            Launch Deadlock to see your live match stats here.
          </p>
          {!steamId && (
            <p className="empty-state-hint">
              Tip: Enter your Steam ID in Settings to unlock match history and
              profile features.
            </p>
          )}
        </div>
      ) : (
        <div className="live-match-content">
          <p className="coming-soon-hint">
            Live match stats coming soon — Overwolf game event integration in
            progress.
          </p>
        </div>
      )}
    </section>
  );
};

export default LiveMatchView;
