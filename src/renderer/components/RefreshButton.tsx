import React, { useEffect, useState } from 'react';
import { timeAgo } from '../../shared/utils/timeFormat';

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
  isCached: boolean;
  lastRefreshTime: number | null;
  tooltipText?: string;
  loadingLabel?: string;
}

const REFRESH_ICON = (
  <svg
    className="refresh-btn__icon"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.5 2v6h-6" />
    <path d="M2.5 22v-6h6" />
    <path d="M21.34 15.57A10 10 0 0 1 3.07 9" />
    <path d="M2.66 8.43A10 10 0 0 1 20.93 15" />
  </svg>
);

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isLoading,
  isCached,
  lastRefreshTime,
  tooltipText = 'Refresh data from the Deadlock API cache',
  loadingLabel = 'Refreshing…',
}) => {
  // Re-render relative time every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastRefreshTime) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [lastRefreshTime]);

  const agoText = lastRefreshTime ? timeAgo(lastRefreshTime) : null;

  return (
    <div className="refresh-btn-wrap">
      <button
        className={`btn refresh-btn ${isLoading ? 'refresh-btn--loading' : ''}`}
        onClick={onRefresh}
        disabled={isLoading}
        title={tooltipText}
      >
        {REFRESH_ICON}
        <span className="refresh-btn__label">
          {isLoading ? loadingLabel : 'Refresh'}
        </span>
      </button>
      {agoText && !isLoading && (
        <span
          className={`refresh-btn__ago ${isCached ? 'refresh-btn__ago--cached' : ''}`}
        >
          {isCached ? `Cached · ${agoText}` : agoText}
        </span>
      )}
    </div>
  );
};
