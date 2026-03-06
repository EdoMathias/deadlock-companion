import React, { useRef, useState } from 'react';
import { scanFileList } from '../../../../../shared/services/httpcacheScan';
import { submitSaltsToApi } from '../../../../../shared/services/matchMetadataFetcher';
import { createLogger } from '../../../../../shared/services/Logger';

const logger = createLogger('DataSettings');

const DataSettings: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [saltsFound, setSaltsFound] = useState(0);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (files: FileList) => {
    setIsScanning(true);
    setSaltsFound(0);
    setResult(null);
    logger.log(`Starting httpcache scan of ${files.length} files…`);

    try {
      const salts = await scanFileList(files, (count) => {
        setSaltsFound(count);
        logger.warn(`Scan progress: ${count} salts found so far`);
      });

      logger.log(`Scan complete: found ${salts.length} unique match salts`);

      if (salts.length === 0) {
        logger.warn('No match data found in the selected directory');
        setResult({
          type: 'error',
          message: 'No match data found in the selected directory.',
        });
        setIsScanning(false);
        return;
      }

      logger.log(`Submitting ${salts.length} salts to ingest API…`);
      const success = await submitSaltsToApi(salts);
      if (success) {
        logger.log(`Successfully uploaded ${salts.length} match salts`);
        setResult({
          type: 'success',
          message: `Successfully uploaded ${salts.length} match salts! These matches will become available shortly.`,
        });
      } else {
        logger.error('Failed to upload salts to ingest API');
        setResult({
          type: 'error',
          message: 'Failed to upload match data. Please try again.',
        });
      }
    } catch (err) {
      logger.error('httpcache scan error:', err);
      setResult({
        type: 'error',
        message: 'An error occurred while scanning the directory.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Match Data Ingestion</h3>
      <p className="settings-section-description">
        Help improve match data availability by uploading salts from your Steam
        cache. This makes your recent matches — and others in the cache —
        available on the API for everyone.
      </p>

      <div className="settings-field">
        <label className="settings-label">Steam httpcache Directory</label>
        <p className="settings-hint">
          Select your Steam <code>httpcache</code> folder. The default location
          on Windows is:
          <br />
          <code>C:\Program Files (x86)\Steam\appcache\httpcache</code>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is not in standard types
          webkitdirectory=""
          className="settings-file-input"
          style={{ display: 'none' }}
          onChange={async (e) => {
            if (e.target.files && e.target.files.length > 0) {
              await handleScan(e.target.files);
              e.target.value = '';
            }
          }}
        />
        <button
          className="btn btn--primary btn--sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
        >
          {isScanning ? `Scanning… (${saltsFound} found)` : 'Select Directory'}
        </button>
      </div>

      {result && (
        <div
          className={`settings-notice ${result.type === 'success' ? 'settings-notice--success' : 'settings-notice--error'}`}
        >
          {result.message}
        </div>
      )}

      <div className="settings-field" style={{ marginTop: '1rem' }}>
        <p className="settings-hint">
          <strong>Tip:</strong> You can also scan your cache from the{' '}
          <strong>Contribute</strong> view in the sidebar.
        </p>
      </div>

      <div className="settings-field" style={{ marginTop: '1rem' }}>
        <p className="settings-hint">
          <strong>Privacy:</strong> Only match IDs and salts are uploaded. No
          personal information is collected.
        </p>
      </div>
    </div>
  );
};

export default DataSettings;
