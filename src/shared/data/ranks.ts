/**
 * Static rank data derived from the deadlock-api.com assets ranks response.
 *
 * Source: https://api.deadlock-api.com/v1/assets/ranks
 * Last updated: 2026-03-28
 *
 * Badge values encode as tier * 10 + subrank (e.g. Arcanist 5 = 45).
 * Each tier (except Obscurus) has 6 subranks.
 */

const RANK_ICON_BASE =
  'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks';

export interface RankTier {
  tier: number;
  name: string;
  color: string;
  subranks: number;
}

export const RANKS: RankTier[] = [
  { tier: 0, name: 'Obscurus', color: '#333333', subranks: 0 },
  { tier: 1, name: 'Initiate', color: '#6A3E1E', subranks: 6 },
  { tier: 2, name: 'Seeker', color: '#882355', subranks: 6 },
  { tier: 3, name: 'Alchemist', color: '#5C6DAB', subranks: 6 },
  { tier: 4, name: 'Arcanist', color: '#719C47', subranks: 6 },
  { tier: 5, name: 'Ritualist', color: '#DDA326', subranks: 6 },
  { tier: 6, name: 'Emissary', color: '#EE4F57', subranks: 6 },
  { tier: 7, name: 'Archon', color: '#B47FEB', subranks: 6 },
  { tier: 8, name: 'Oracle', color: '#955138', subranks: 6 },
  { tier: 9, name: 'Phantom', color: '#7C7C7C', subranks: 6 },
  { tier: 10, name: 'Ascendant', color: '#C39751', subranks: 6 },
  { tier: 11, name: 'Eternus', color: '#5CE9A9', subranks: 6 },
];

export const SELECTABLE_RANKS = RANKS.filter((r) => r.subranks > 0);

/** Total slider positions: 66 (11 tiers x 6 subranks). 0 = "All Ranks". */
export const MAX_SLIDER_POS = SELECTABLE_RANKS.length * 6;

export function getRankIconUrl(tier: number, subrank: number): string {
  return `${RANK_ICON_BASE}/rank${tier}/badge_sm_subrank${subrank}.webp`;
}

/** Convert a slider position (1..66) to a badge value (11..116). */
export function sliderPosToBadge(pos: number): number {
  if (pos <= 0) return 0;
  const tierIndex = Math.ceil(pos / 6) - 1;
  const subrank = ((pos - 1) % 6) + 1;
  const tier = SELECTABLE_RANKS[tierIndex].tier;
  return tier * 10 + subrank;
}

/** Convert a badge value (11..116) back to a slider position (1..66). */
export function badgeToSliderPos(badge: number): number {
  if (!badge || badge <= 0) return 0;
  const tier = Math.floor(badge / 10);
  const subrank = badge % 10;
  const tierIndex = SELECTABLE_RANKS.findIndex((r) => r.tier === tier);
  if (tierIndex < 0) return 0;
  return tierIndex * 6 + subrank;
}

/** Get rank name + subrank label from a badge value. */
export function badgeToLabel(badge: number): string {
  if (!badge || badge <= 0) return 'All Ranks';
  const tier = Math.floor(badge / 10);
  const subrank = badge % 10;
  const rank = RANKS.find((r) => r.tier === tier);
  if (!rank) return 'Unknown';
  return `${rank.name} ${subrank}`;
}

/** Get the tier and subrank from a badge value. */
export function badgeToTierSubrank(badge: number): { tier: number; subrank: number } {
  const tier = Math.floor(badge / 10);
  const subrank = badge % 10;
  return { tier, subrank };
}
