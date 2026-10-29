/**
 * Steam ID utilities for deadlock-api.com account ID conversion.
 *
 * deadlock-api.com uses Steam Account IDs (32-bit), not the full 64-bit
 * SteamID64. The conversion is: accountId = steamId64 - 76561197960265728
 */

const STEAM_ID_64_BASE = BigInt('76561197960265728');

/**
 * Converts a Steam ID64 (17-digit string) to a 32-bit account ID
 * as expected by deadlock-api.com endpoints.
 *
 * @param steamId - Steam ID64 as a numeric string (e.g. "76561198012345678")
 * @returns The 32-bit account ID, or null if the input is invalid.
 */
export function steamIdToAccountId(steamId: string): number | null {
  try {
    const trimmed = steamId.trim();
    if (!/^\d{17}$/.test(trimmed)) return null;
    const id64 = BigInt(trimmed);
    const accountId = Number(id64 - STEAM_ID_64_BASE);
    if (accountId <= 0) return null;
    return accountId;
  } catch {
    return null;
  }
}

/**
 * Converts a 32-bit account ID back to a Steam ID64 string.
 * Reverse of steamIdToAccountId.
 */
export function accountIdToSteamId64(accountId: number): string {
  return String(BigInt(accountId) + STEAM_ID_64_BASE);
}

/**
 * Validates that a string looks like a 17-digit Steam ID64.
 */
export function isValidSteamId64(steamId: string): boolean {
  return /^\d{17}$/.test(steamId.trim());
}

export type ParsedSteamProfileInput =
  | { type: 'steamId64'; steamId64: string }
  | { type: 'vanity'; vanity: string };

/**
 * Parses a pasted Steam profile link or raw SteamID64 into either an
 * already-resolved SteamID64 or a `/id/<vanity>` name that still needs
 * resolving via the Steam Web API (see `resolveVanityUrl` in steamWebApi.ts).
 *
 * Accepts, with or without a `https://` scheme:
 * - a raw 17-digit SteamID64
 * - steamcommunity.com/profiles/<steamid64>
 * - steamcommunity.com/id/<vanity>
 */
export function parseSteamProfileInput(
  input: string,
): ParsedSteamProfileInput | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  if (isValidSteamId64(trimmed)) {
    return { type: 'steamId64', steamId64: trimmed };
  }

  const profileMatch = trimmed.match(
    /steamcommunity\.com\/profiles\/(\d{17})/i,
  );
  if (profileMatch) {
    return { type: 'steamId64', steamId64: profileMatch[1] };
  }

  const vanityMatch = trimmed.match(/steamcommunity\.com\/id\/([^\s/?#]+)/i);
  if (vanityMatch) {
    return { type: 'vanity', vanity: vanityMatch[1] };
  }

  return null;
}
