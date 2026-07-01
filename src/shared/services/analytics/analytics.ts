/**
 * PostHog analytics wrapper for the Deadlock Companion Overwolf app.
 *
 * Design notes (Overwolf-specific):
 * - Each Overwolf window is its own JS context, so `posthog-js` is initialized
 *   per window via {@link initAnalytics}. A shared, deterministic `distinct_id`
 *   (the Overwolf `machineId`) keeps every window pointing at the same person.
 * - `request_batching` is disabled: overlay windows open and close with matches,
 *   and the background page is timer-throttled — batched events could be lost.
 *   Event volume is low by design (aggregated match summaries), so sending each
 *   event immediately is the safe trade-off.
 * - Only anonymous data is sent. No Steam ID, no player names (see events.ts).
 */

import posthog from 'posthog-js';
import { createLogger } from '../Logger';
import {
  ANALYTICS_DEVICE_ID_KEY,
  ANALYTICS_OPT_OUT_KEY,
  POSTHOG_HOST,
  POSTHOG_KEY,
} from './config';
import {
  AnalyticsEventName,
  AnalyticsEventProperties,
  WindowName,
} from './events';
import { registerApiErrorTracking } from './apiErrorTracking';

const logger = createLogger('Analytics');

let initPromise: Promise<void> | null = null;
let posthogInitialized = false;
let enabled = false;
let ready = false;
/** True once init has finished (successfully or not). Guards the pending queue. */
let initSettled = false;

/** Events issued before init completes are queued here, then flushed on ready. */
const pendingQueue: Array<() => void> = [];

function isOptedOut(): boolean {
  try {
    return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === 'true';
  } catch {
    return false;
  }
}

function generateDeviceId(): string {
  try {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to the manual generator
  }
  return `dl-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function getMachineId(): Promise<string | undefined> {
  return new Promise((resolve) => {
    try {
      overwolf.profile.getCurrentUser((res) => {
        resolve(res && res.success && res.machineId ? res.machineId : undefined);
      });
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * Resolve a stable, anonymous device id used as the PostHog distinct_id.
 * Prefers a previously persisted id; otherwise the Overwolf machineId (which is
 * stable across reinstalls); otherwise a generated UUID. Never PII.
 */
async function resolveDistinctId(): Promise<string> {
  try {
    const stored = localStorage.getItem(ANALYTICS_DEVICE_ID_KEY);
    if (stored) return stored;
  } catch {
    // ignore storage errors
  }
  const machineId = await getMachineId();
  const id = machineId || generateDeviceId();
  try {
    localStorage.setItem(ANALYTICS_DEVICE_ID_KEY, id);
  } catch {
    // ignore storage errors
  }
  return id;
}

function detectWindowName(): Promise<WindowName> {
  return new Promise((resolve) => {
    try {
      overwolf.windows.getCurrentWindow((res) => {
        const name =
          res && res.success && res.window ? res.window.name : undefined;
        resolve((name as WindowName) || 'unknown');
      });
    } catch {
      resolve('unknown');
    }
  });
}

function getAppVersion(): Promise<string | undefined> {
  return new Promise((resolve) => {
    try {
      overwolf.extensions.current.getManifest((manifest) => {
        resolve(manifest?.meta?.version);
      });
    } catch {
      resolve(undefined);
    }
  });
}

function flushQueue(): void {
  while (pendingQueue.length > 0) {
    const fn = pendingQueue.shift();
    try {
      fn?.();
    } catch (error) {
      logger.warn('Failed to flush queued analytics event', error);
    }
  }
}

/**
 * Initialize analytics for the current window. Safe to call multiple times
 * (subsequent calls return the same promise). No-ops when no key is configured
 * or the user has opted out.
 *
 * @param windowNameHint Optional explicit window name. The background page
 *   passes this since `getCurrentWindow` is most reliable for renderer windows.
 */
export function initAnalytics(windowNameHint?: WindowName): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    ready = false;
    initSettled = false;
    try {
      if (!POSTHOG_KEY) {
        logger.log('No PostHog key configured — analytics disabled');
        return;
      }
      if (isOptedOut()) {
        logger.log('User opted out of analytics — not initializing');
        return;
      }

      const [distinctId, windowName, appVersion] = await Promise.all([
        resolveDistinctId(),
        windowNameHint
          ? Promise.resolve(windowNameHint)
          : detectWindowName(),
        getAppVersion(),
      ]);

      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_external_dependency_loading: true,
        advanced_disable_flags: true,
        request_batching: false,
        persistence: 'localStorage',
        bootstrap: {
          distinctID: distinctId,
          isIdentifiedID: true,
        },
      });
      posthogInitialized = true;

      posthog.register({
        window: windowName,
        app_version: appVersion ?? 'unknown',
      });

      enabled = true;
      ready = true;
      registerApiErrorTracking(track);
      logger.log('Analytics initialized', { window: windowName, appVersion });
    } catch (error) {
      logger.error('Failed to initialize analytics', error);
    } finally {
      // Mark settled and drain the queue: enabled → events send; disabled →
      // the queued closures no-op, preventing unbounded growth.
      initSettled = true;
      flushQueue();
    }
  })();

  return initPromise;
}

/**
 * Capture an analytics event. Type-safe against the {@link AnalyticsEventProperties}
 * catalog. Buffers until init completes; no-ops if disabled or opted out.
 */
export function track<K extends AnalyticsEventName>(
  event: K,
  properties?: AnalyticsEventProperties[K],
): void {
  // Re-check opt-out on every call so a toggle takes effect across all windows
  // immediately (the flag lives in the shared-origin localStorage).
  if (isOptedOut()) return;

  const send = () => {
    if (!enabled) return;
    try {
      posthog.capture(event, properties as Record<string, unknown> | undefined);
    } catch (error) {
      logger.warn(`Failed to capture event "${event}"`, error);
    }
  };

  if (ready) {
    send();
  } else if (!initSettled) {
    // Init still in flight — buffer until it completes.
    pendingQueue.push(send);
  }
  // Otherwise init has settled with analytics disabled → drop silently.
}

/** Set person properties (`$set`) and/or one-time person properties (`$set_once`). */
export function setPersonProperties(
  set?: Record<string, unknown>,
  setOnce?: Record<string, unknown>,
): void {
  if (isOptedOut()) return;

  const run = () => {
    if (!enabled) return;
    try {
      posthog.setPersonProperties(set, setOnce);
    } catch (error) {
      logger.warn('Failed to set person properties', error);
    }
  };

  if (ready) {
    run();
  } else if (!initSettled) {
    pendingQueue.push(run);
  }
}

/** Whether the user has opted out of analytics. */
export function isAnalyticsOptedOut(): boolean {
  return isOptedOut();
}

/** Opt the user out of analytics (persisted, honored by all windows). */
export function optOutAnalytics(): void {
  try {
    localStorage.setItem(ANALYTICS_OPT_OUT_KEY, 'true');
  } catch {
    // ignore storage errors
  }
  try {
    if (posthogInitialized) posthog.opt_out_capturing();
  } catch {
    // ignore
  }
  enabled = false;
}

/** Opt the user back in and (re)initialize analytics if needed. */
export function optInAnalytics(): void {
  try {
    localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
  } catch {
    // ignore storage errors
  }

  if (posthogInitialized) {
    try {
      posthog.opt_in_capturing();
    } catch {
      // ignore
    }
    enabled = true;
    ready = true;
    flushQueue();
  } else {
    // Was opted out at startup, so init was skipped — run it now.
    initPromise = null;
    initAnalytics();
  }
}
