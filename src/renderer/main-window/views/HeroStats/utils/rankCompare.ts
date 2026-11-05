import { SELECTABLE_RANKS, badgeToTierSubrank } from '../../../../../shared/data/ranks';

export type RankCompareKind = 'lower' | 'higher' | 'all';

export interface RankCompareTarget {
  kind: RankCompareKind;
  minBadge?: number;
  maxBadge?: number;
  /** Chip button text, e.g. "▼ Acolyte", "▲ Sentinel", "All ranks". */
  chipLabel: string;
  /** Plain rank-tier name (or "All ranks"), for the "vs X" toggle text. */
  name: string;
}

function tierBadgeRange(tierIdx: number): { minBadge: number; maxBadge: number } {
  const tier = SELECTABLE_RANKS[tierIdx].tier;
  return { minBadge: tier * 10 + 1, maxBadge: tier * 10 + 6 };
}

/**
 * Quick comparison targets for the current rank selection: the single tier
 * immediately below/above it, plus "All ranks". Mirrors the Hero Stats mock's
 * `qd` list, generalized from the mock's flat rank list to this app's
 * tier+subrank badge model. Returns `[]` when no rank filter is active —
 * there's nothing meaningful to compare an unfiltered range against.
 */
export function getRankCompareOptions(
  minBadge: number | undefined,
  maxBadge: number | undefined,
): RankCompareTarget[] {
  if (!minBadge) return [];

  const lowTier = badgeToTierSubrank(minBadge).tier;
  const lastTier = SELECTABLE_RANKS[SELECTABLE_RANKS.length - 1].tier;
  const highTier = maxBadge ? badgeToTierSubrank(maxBadge).tier : lastTier;
  const lowIdx = SELECTABLE_RANKS.findIndex((r) => r.tier === lowTier);
  const highIdx = SELECTABLE_RANKS.findIndex((r) => r.tier === highTier);

  const options: RankCompareTarget[] = [];

  if (lowIdx > 0) {
    const tier = SELECTABLE_RANKS[lowIdx - 1];
    options.push({
      kind: 'lower',
      ...tierBadgeRange(lowIdx - 1),
      chipLabel: `▼ ${tier.name}`,
      name: tier.name,
    });
  }

  if (highIdx >= 0 && highIdx < SELECTABLE_RANKS.length - 1) {
    const tier = SELECTABLE_RANKS[highIdx + 1];
    options.push({
      kind: 'higher',
      ...tierBadgeRange(highIdx + 1),
      chipLabel: `▲ ${tier.name}`,
      name: tier.name,
    });
  }

  options.push({
    kind: 'all',
    minBadge: undefined,
    maxBadge: undefined,
    chipLabel: 'All ranks',
    name: 'All ranks',
  });

  return options;
}
