/**
 * Global axios response interceptor that emits `api_request_failed` for failed
 * deadlock-api calls. Registered once per window (the app uses the default axios
 * instance everywhere), so a single interceptor covers every service.
 *
 * `track` is injected rather than imported to avoid a circular dependency with
 * analytics.ts.
 */

import axios from 'axios';
import { AnalyticsEventProperties, ApiEndpoint } from './events';

type ApiFailedTrackFn = (
  event: 'api_request_failed',
  properties: AnalyticsEventProperties['api_request_failed'],
) => void;

let registered = false;

/** Map a request URL to a coarse endpoint label (never includes query/PII). */
function endpointFromUrl(url?: string): ApiEndpoint | undefined {
  if (!url) return undefined;
  if (url.includes('hero-ban-stats')) return 'hero_ban_stats';
  if (url.includes('hero-stats')) return 'hero_stats';
  if (url.includes('item-stats')) return 'item_stats';
  if (url.includes('/v1/assets')) return 'assets';
  if (url.includes('/ingest')) return 'ingest_salts';
  if (url.includes('/metadata') || url.includes('/salts'))
    return 'match_metadata';
  return undefined;
}

export function registerApiErrorTracking(trackFn: ApiFailedTrackFn): void {
  if (registered) return;
  registered = true;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      try {
        const endpoint = endpointFromUrl(error?.config?.url);
        if (endpoint) {
          trackFn('api_request_failed', {
            endpoint,
            status_code: error?.response?.status,
            reason: error?.message ? String(error.message) : undefined,
          });
        }
      } catch {
        // Analytics must never interfere with the app's own error handling.
      }
      return Promise.reject(error);
    },
  );
}
