export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Delta in percentage points, signed (e.g. `+2.3`, `-1.8`). */
export function formatDelta(value: number): string {
  const pts = value * 100;
  const sign = pts > 0 ? '+' : '';
  return `${sign}${pts.toFixed(1)}`;
}

export function deltaClass(value: number): string {
  const pts = value * 100;
  if (pts >= 0.05) return 'hero-compare-cell--delta-pos';
  if (pts <= -0.05) return 'hero-compare-cell--delta-neg';
  return 'hero-compare-cell--delta-neutral';
}

/**
 * Win-rate bar fill: grows from the 50% center line, clamped so an 8-point
 * deviation (42%/58%) fills the whole half-track — typical hero win rates
 * rarely swing further than that.
 */
export function winRateBarFill(winRate: number): {
  positive: boolean;
  widthPercent: number;
} {
  const pct = winRate * 100;
  const positive = pct >= 50;
  const widthPercent = Math.min(50, (Math.abs(pct - 50) / 8) * 50);
  return { positive, widthPercent };
}

/** Clamped bar-fill width (%) for a 0..1 rate against a "full bar" ceiling. */
export function ratePercent(value: number, maxValue = 0.2): number {
  return Math.min(100, (value / maxValue) * 100);
}
