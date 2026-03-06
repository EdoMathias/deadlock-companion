/**
 * Returns a human-readable relative time string like "just now", "3 min ago", "2 hours ago".
 */
export function timeAgo(date: Date | number): string {
  const now = Date.now();
  const then = typeof date === 'number' ? date : date.getTime();
  const diffMs = now - then;
  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatPlayTime(milliseconds: number): string {
  if (!milliseconds || milliseconds <= 0) return '0s';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    // Show hours, minutes, and seconds if any are non-zero
    const parts: string[] = [`${hours}h`];
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    return parts.join(' ');
  }
  if (minutes > 0) {
    // Show minutes and seconds if seconds > 0
    if (seconds > 0) return `${minutes}m ${seconds}s`;
    return `${minutes}m`;
  }
  return `${seconds}s`;
}
