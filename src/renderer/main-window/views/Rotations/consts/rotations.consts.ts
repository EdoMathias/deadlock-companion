import { RotationActionType } from '../types/rotations.types';

/** LocalStorage key for the current rotation. Used by the desktop store and by the in-game window for real-time sync. */
export const STORAGE_CURRENT_ROTATION = 'deadlock.rotations.current.v1';

/** LocalStorage key for the current squad. Used by the desktop store and by the in-game window (e.g. squad index display). */
export const STORAGE_CURRENT_SQUAD = 'deadlock.current.squad.v1';

/** LocalStorage key for the in-game rotation window settings (step size, opacity, show squad index). Synced between editor and in-game window. */
export const ROTATION_WINDOW_SETTINGS_KEY = 'rotation_ingame_window_settings';

export const ACTION_TYPE_CONFIG: Record<
  RotationActionType,
  { label: string; shortLabel: string; color: string }
> = {
  final_strike: {
    label: 'Final Strike',
    shortLabel: 'Final',
    color: '#9c8c72',
  },
  skill: { label: 'Skill', shortLabel: 'Skill', color: '#72947f' },
  combo: { label: 'Combo', shortLabel: 'Combo', color: '#efdebf' },
  ultimate: { label: 'Ultimate', shortLabel: 'Ult', color: '#a84632' },
};
