// Game class IDs for supported games
// Deadlock's Overwolf class ID
export const kDeadlockClassId = 24482;

export const kWindowNames = {
  background: 'background',
  mainDesktop: 'main_desktop',
  mainIngame: 'main_ingame',
  rotationIngame: 'rotation_ingame',
  companionAppReady: 'companion_app_ready',
  alertOverlay: 'alert_overlay',
  counterItems: 'counter_items',
};

export const kHotkeys = {
  toggleMainIngameWindow: 'ToggleInGameMain',
  toggleMainDesktopWindow: 'ToggleDesktopMain',
  toggleRotationIngameWindow: 'ToggleInGameRotation',
  toggleCounterItemsWindow: 'ToggleCounterItems',
};

export type HotkeyData = {
  name: string;
  title: string;
  binding: string;
  modifiers: overwolf.settings.hotkeys.HotkeyModifiers;
  virtualKeycode: number;
};

export const DEADLOCK_API_BASE_URL = 'https://api.deadlock-api.com';
// Assets API was migrated from the standalone assets.deadlock-api.com host
// (decommissioned) to /v1/assets under the main API. Paths are now /items,
// /heroes, /ranks (no /v2 prefix).
export const DEADLOCK_ASSETS_BASE_URL = `${DEADLOCK_API_BASE_URL}/v1/assets`;
export const kGepStatusUrl = `https://game-events-status.overwolf.com/${kDeadlockClassId}_prod.json`;

export const GAME_MODE_LABELS: Record<number, string> = {
  0: 'Invalid',
  1: 'Normal',
  2: '1v1 Test',
  3: 'Sandbox',
  4: 'Street Brawl',
  5: 'Explore NYC',
};

export const LIVE_GAME_MODE_LABELS: Record<string, string> = {
  StreetBrawl: 'Street Brawl',
};

export const MATCH_MODE_LABELS: Record<number, string> = {
  0: 'Invalid',
  1: 'Unranked',
  2: 'Private Lobby',
  3: 'Co-op Bot',
  4: 'Ranked',
  5: 'Server Test',
  6: 'Tutorial',
  7: 'Hero Labs',
};

const GAME_MODE_CODES_BY_LABEL: Record<string, number> = Object.fromEntries(
  Object.entries(GAME_MODE_LABELS).map(([code, label]) => [
    label.toLowerCase(),
    Number(code),
  ]),
);

/**
 * Normalizes a game mode to its numeric code. Mirrors `parseMatchMode`: the
 * API reports numbers, the GEP reports display labels ("Normal",
 * "Street Brawl" — already mapped through `LIVE_GAME_MODE_LABELS`).
 */
export function parseGameMode(
  value: number | string | null | undefined,
): number | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const trimmed = value.trim();
  const numeric = Number(trimmed);
  if (trimmed !== '' && Number.isFinite(numeric)) return numeric;

  return GAME_MODE_CODES_BY_LABEL[trimmed.toLowerCase()];
}

/** `match_mode` code for a ranked queue game. */
export const RANKED_MATCH_MODE = 4;

const MATCH_MODE_CODES_BY_LABEL: Record<string, number> = Object.fromEntries(
  Object.entries(MATCH_MODE_LABELS).map(([code, label]) => [
    label.toLowerCase(),
    Number(code),
  ]),
);

/**
 * Normalizes a match mode to its numeric code.
 *
 * The deadlock-api match history returns `match_mode` as a number, while the
 * Overwolf GEP `game_info.game_mode` payload reports it as a human-readable
 * string (`{"match_mode":"Unranked","game_mode":"Normal"}`). Both funnel
 * through here so everything downstream speaks one representation.
 */
export function parseMatchMode(
  value: number | string | null | undefined,
): number | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const trimmed = value.trim();
  const numeric = Number(trimmed);
  if (trimmed !== '' && Number.isFinite(numeric)) return numeric;

  return MATCH_MODE_CODES_BY_LABEL[trimmed.toLowerCase()];
}

/** True when the given match mode (numeric code or GEP label) is Ranked. */
export function isRankedMatchMode(
  value: number | string | null | undefined,
): boolean {
  return parseMatchMode(value) === RANKED_MATCH_MODE;
}
