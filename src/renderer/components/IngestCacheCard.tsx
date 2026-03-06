import React, { useRef, useState } from 'react';
import { scanFileList } from '../../shared/services/httpcacheScan';
import { submitSaltsToApi } from '../../shared/services/matchMetadataFetcher';
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
  const [isScanning, setIsScanning] = useState(false);
  const [saltsFound, setSaltsFound] = useState(0);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleScan = async (files: FileList) => {
    setIsScanning(true);
    setSaltsFound(0);
    setResult(null);
    logger.log(`Starting httpcache scan of ${files.length} files…`);

    try {
      const salts = await scanFileList(files, (count) => {
        setSaltsFound(count);
      });

      logger.log(`Scan complete: found ${salts.length} unique match salts`);

      if (salts.length === 0) {
        setResult({
          type: 'error',
          message: 'No match data found in the selected folder.',
        });
        setIsScanning(false);
        return;
      }

      const success = await submitSaltsToApi(salts);
      if (success) {
        setResult({
          type: 'success',
          message: `Uploaded ${salts.length} match salts! These matches will become available shortly.`,
        });
      } else {
        setResult({
          type: 'error',
          message: 'Failed to upload match data. Please try again.',
        });
      }
    } catch (err) {
      logger.error('httpcache scan error:', err);
      setResult({
        type: 'error',
        message: 'An error occurred while scanning.',
      });
    } finally {
      setIsScanning(false);
    }
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
            Scan your Steam <code>httpcache</code> folder to upload match salts
            and help populate the community database. Only match IDs and salts
            are uploaded — no personal data.
          </p>
          <p className="ingest-card__hint">
            Default path:{' '}
            <code>C:\Program Files (x86)\Steam\appcache\httpcache</code>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is not in standard types
            webkitdirectory=""
            style={{ display: 'none' }}
            onChange={async (e) => {
              if (e.target.files && e.target.files.length > 0) {
                await handleScan(e.target.files);
                e.target.value = '';
              }
            }}
          />

          <div className="ingest-card__actions">
            <button
              className="btn btn--primary btn--sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
            >
              {isScanning ? `Scanning… (${saltsFound} found)` : 'Select Folder'}
            </button>
          </div>

          {result && (
            <div
              className={`ingest-card__result ${result.type === 'success' ? 'ingest-card__result--success' : 'ingest-card__result--error'}`}
            >
              {result.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
