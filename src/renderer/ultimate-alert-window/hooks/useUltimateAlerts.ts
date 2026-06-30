import { useState, useEffect, useCallback, useRef } from 'react';
import type { UltimateAlert } from '../../../shared/types/ultimateAlerts';
import { getWidgetConfig } from '../../../shared/stores/overlayLayoutStore';
import { MessageType } from '../../../main/services/MessageChannel';

const MAX_VISIBLE = 5;
const DEFAULT_DISMISS_S = 5;

function getDismissMs(): number {
  const config = getWidgetConfig('ultimate_alert');
  return (config?.dismiss_timeout_s ?? DEFAULT_DISMISS_S) * 1000;
}

export function useUltimateAlerts() {
  const [alerts, setAlerts] = useState<UltimateAlert[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    const timer = timersRef.current.get(alertId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(alertId);
    }
  }, []);

  const addAlert = useCallback(
    (alert: UltimateAlert) => {
      setAlerts((prev) => {
        const next = [...prev, alert];
        if (next.length > MAX_VISIBLE) {
          const removed = next.shift();
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
        }
        return next;
      });

      const timer = setTimeout(() => {
        dismissAlert(alert.id);
      }, getDismissMs());
      timersRef.current.set(alert.id, timer);
    },
    [dismissAlert],
  );

  useEffect(() => {
    const handler = (message: overwolf.windows.MessageReceivedEvent) => {
      try {
        const payload =
          typeof message.content === 'string'
            ? JSON.parse(message.content)
            : message.content;

        if (payload?.type === MessageType.ULTIMATE_ALERT && payload?.data) {
          addAlert(payload.data as UltimateAlert);
        }
      } catch {
        // Ignore parse errors
      }
    };

    overwolf.windows.onMessageReceived.addListener(handler);
    return () => {
      overwolf.windows.onMessageReceived.removeListener(handler);
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [addAlert]);

  return { alerts, dismissAlert };
}
