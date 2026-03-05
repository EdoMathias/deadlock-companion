import { Configuration } from 'deadlock_api_client';

const DEADLOCK_API_BASE_URL = 'https://api.deadlock-api.com';
const DEADLOCK_API_KEY_STORAGE_KEY = 'deadlock_companion_api_key';

/**
 * Returns the user-configured optional API key for deadlock-api.com.
 * Patreon members can enter their key in Settings → General for
 * prioritized fetching.
 */
function getStoredApiKey(): string | undefined {
  try {
    return localStorage.getItem(DEADLOCK_API_KEY_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Shared Configuration instance for all deadlock-api API classes.
 *
 * Usage example:
 *   import { PlayersApi } from 'deadlock_api_client';
 *   import { deadlockApiConfig } from './deadlockApiClient';
 *   const api = new PlayersApi(deadlockApiConfig);
 */
export function createDeadlockApiConfig(): Configuration {
  const apiKey = getStoredApiKey();
  return new Configuration({
    basePath: DEADLOCK_API_BASE_URL,
    ...(apiKey ? { apiKey } : {}),
  });
}

/**
 * Lazily-initialized singleton config. Re-export for convenience.
 * Call createDeadlockApiConfig() when you need a fresh instance
 * (e.g. after the user updates their API key in Settings).
 */
export const deadlockApiConfig = createDeadlockApiConfig();
