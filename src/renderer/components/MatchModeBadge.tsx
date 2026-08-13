import React from 'react';
import {
  MATCH_MODE_LABELS,
  isRankedMatchMode,
  parseMatchMode,
} from '../../shared/consts';

interface MatchModeBadgeProps {
  /**
   * Numeric `match_mode` from the deadlock-api, or the human-readable string
   * the Overwolf GEP reports (`"Ranked"` / `"Unranked"`). Both are normalized
   * through `parseMatchMode`.
   */
  matchMode: number | string | null | undefined;
  /**
   * When true (the default), only ranked matches render. Lists use this so
   * every normal game doesn't get an "Unranked" chip; the match detail header
   * passes `false` to keep showing both.
   */
  rankedOnly?: boolean;
  className?: string;
}

/**
 * Gold "Ranked" pill (muted for every other queue). Shared by the match
 * history list, the match detail header, and the live match header so the
 * ranked treatment is identical everywhere.
 */
const MatchModeBadge: React.FC<MatchModeBadgeProps> = ({
  matchMode,
  rankedOnly = true,
  className,
}) => {
  const mode = parseMatchMode(matchMode);
  if (mode == null || mode <= 0) return null;

  const isRanked = isRankedMatchMode(mode);
  if (rankedOnly && !isRanked) return null;

  return (
    <span
      className={`mode-badge mode-badge--${isRanked ? 'ranked' : 'unranked'}${
        className ? ` ${className}` : ''
      }`}
    >
      {MATCH_MODE_LABELS[mode] ?? `Mode ${mode}`}
    </span>
  );
};

export default MatchModeBadge;
