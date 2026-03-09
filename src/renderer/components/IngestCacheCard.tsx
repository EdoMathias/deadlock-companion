import React, { useState } from 'react';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('IngestCacheCard');

const EXPANDED_STORAGE_KEY = 'dl_ingest_card_expanded';

function getInitialExpanded(): boolean {
  try {
    const stored = localStorage.getItem(EXPANDED_STORAGE_KEY);
    // Default to expanded when no preference has been saved yet
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export const IngestCacheCard: React.FC = () => {
  const [expanded, setExpanded] = useState(getInitialExpanded);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    try {
      localStorage.setItem(EXPANDED_STORAGE_KEY, String(next));
    } catch {
      // Ignore
    }
  };

  /** Expand programmatically (used by post-game prompt navigation). */
  const expand = () => {
    if (!expanded) {
      setExpanded(true);
      try {
        localStorage.setItem(EXPANDED_STORAGE_KEY, 'true');
      } catch {
        // Ignore
      }
    }
  };

  // Allow parent to trigger expand via localStorage flag
  React.useEffect(() => {
    try {
      if (localStorage.getItem('dl_ingest_card_auto_expand') === 'true') {
        localStorage.removeItem('dl_ingest_card_auto_expand');
        expand();
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleGoToContribute = () => {
    logger.log('Navigating to Contribute view from IngestCacheCard');
    window.dispatchEvent(
      new CustomEvent('navigate-view', { detail: 'Contribute' }),
    );
  };

  return (
    <div
      id="ingest-cache-card"
      className={`ingest-card ${expanded ? 'ingest-card--expanded' : ''}`}
    >
      <button
        className="ingest-card__header"
        onClick={toggleExpanded}
        type="button"
      >
        <span className="ingest-card__icon">📂</span>
        <span className="ingest-card__title">Contribute Match Data</span>
        <span
          className={`ingest-card__chevron ${expanded ? 'ingest-card__chevron--open' : ''}`}
        >
          ▸
        </span>
      </button>

      {expanded && (
        <div className="ingest-card__body">
          <p className="ingest-card__description">
            Help grow the community match database by scanning your Steam{' '}
            <code>httpcache</code> folder. This uploads match salts to make
            matches available for everyone.
          </p>
          <p className="ingest-card__description">
            🔒 Only match IDs and salts are uploaded — no personal information.
          </p>

          <div className="ingest-card__actions">
            <button
              className="btn btn--primary btn--sm"
              onClick={handleGoToContribute}
            >
              Go to Contribute →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
