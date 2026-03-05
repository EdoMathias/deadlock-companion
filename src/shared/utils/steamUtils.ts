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
 * Validates that a string looks like a 17-digit Steam ID64.
 */
export function isValidSteamId64(steamId: string): boolean {
  return /^\d{17}$/.test(steamId.trim());
}
