// Game class IDs for supported games
// Deadlock's Overwolf class ID
export const kDeadlockClassId = 24482;

export const kWindowNames = {
  background: 'background',
  mainDesktop: 'main_desktop',
  mainIngame: 'main_ingame',
  rotationIngame: 'rotation_ingame',
  companionAppReady: 'companion_app_ready',
};

export const kHotkeys = {
  toggleMainIngameWindow: 'ToggleInGameMain',
  toggleMainDesktopWindow: 'ToggleDesktopMain',
  toggleRotationIngameWindow: 'ToggleInGameRotation',
};

export type HotkeyData = {
  name: string;
  title: string;
  binding: string;
  modifiers: overwolf.settings.hotkeys.HotkeyModifiers;
  virtualKeycode: number;
};

export const DEADLOCK_API_BASE_URL = 'https://api.deadlock-api.com';
export const DEADLOCK_ASSETS_BASE_URL = 'https://assets.deadlock-api.com';

export const GAME_MODE_LABELS: Record<number, string> = {
  0: 'Invalid',
  1: 'Normal',
  2: '1v1 Test',
  3: 'Sandbox',
  4: 'Street Brawl',
  5: 'Explore NYC',
};
