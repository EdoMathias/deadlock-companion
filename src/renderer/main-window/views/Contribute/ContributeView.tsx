import React, { useCallback, useRef, useState } from 'react';
import {
  scanFileList,
  scanFiles,
} from '../../../../shared/services/httpcacheScan';
import { submitSaltsToApi } from '../../../../shared/services/matchMetadataFetcher';
import { createLogger } from '../../../../shared/services/Logger';

const logger = createLogger('ContributeView');

const DEFAULT_PATH = 'C:\\Program Files (x86)\\Steam\\appcache\\httpcache';

const ContributeView: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [saltsFound, setSaltsFound] = useState(0);
  const [filesScanned, setFilesScanned] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processScan = useCallback(
    async (
      doScan: (
        onProgress: (n: number) => void,
      ) => Promise<import('deadlock_api_client').ClickhouseSalts[]>,
      fileCount: number,
    ) => {
      setIsScanning(true);
      setSaltsFound(0);
      setFilesScanned(0);
      setTotalFiles(fileCount);
      setResult(null);
      logger.log(
        `[Ingestion] Starting httpcache scan: ${fileCount} files to process`,
      );

      try {
        const salts = await doScan((count) => {
          setSaltsFound(count);
        });

        const duplicatesSkipped = fileCount - salts.length;
        logger.log(
          `[Ingestion] Scan complete: ${salts.length} unique salts found, ${duplicatesSkipped} duplicates skipped`,
        );

        if (salts.length === 0) {
          setResult({
            type: 'error',
            message:
              'No match data found. Make sure you selected the httpcache folder.',
          });
          setIsScanning(false);
          return;
        }

        logger.log(`[Ingestion] Submitting ${salts.length} salts to API…`);
        const success = await submitSaltsToApi(salts);
        if (success) {
          logger.log(
            `[Ingestion] Successfully submitted ${salts.length} salts to API`,
          );
          setResult({
            type: 'success',
            message: `Successfully uploaded ${salts.length} match salts! Matches usually appear in 1-10 minutes. During high load, processing may take longer.`,
          });
        } else {
          logger.error(`[Ingestion] Failed to submit salts to API`);
          setResult({
            type: 'error',
            message: 'Failed to upload match data. Please try again.',
          });
        }
      } catch (err) {
        logger.error('httpcache scan error:', err);
        setResult({
          type: 'error',
          message: 'An error occurred while scanning. Please try again.',
        });
      } finally {
        setIsScanning(false);
      }
    },
    [],
  );

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = e.target.files;
        await processScan(
          (onProgress) => scanFileList(files, onProgress),
          files.length,
        );
        e.target.value = '';
      }
    },
    [processScan],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const items = e.dataTransfer.items;
      if (!items || items.length === 0) return;

      // Collect all File objects by recursively traversing dropped entries
      const allFiles: File[] = [];

      const readEntry = (entry: FileSystemEntry): Promise<void> => {
        return new Promise((resolve) => {
          if (entry.isFile) {
            (entry as FileSystemFileEntry).file(
              (f) => {
                allFiles.push(f);
                resolve();
              },
              () => resolve(), // skip unreadable files
            );
          } else if (entry.isDirectory) {
            const reader = (entry as FileSystemDirectoryEntry).createReader();
            const readBatch = () => {
              reader.readEntries(
                async (entries) => {
                  if (entries.length === 0) {
                    resolve();
                    return;
                  }
                  for (const child of entries) await readEntry(child);
                  readBatch(); // directories may return entries in batches
                },
                () => resolve(),
              );
            };
            readBatch();
          } else {
            resolve();
          }
        });
      };

      const entries: FileSystemEntry[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) entries.push(entry);
      }

      if (entries.length === 0) return;

      // Traverse all dropped entries to collect files
      for (const entry of entries) await readEntry(entry);

      if (allFiles.length > 0) {
        await processScan(
          (onProgress) => scanFiles(allFiles, onProgress),
          allFiles.length,
        );
      }
    },
    [processScan],
  );

  return (
    <section className="view-container contribute-container">
      <div className="view-header">
        <h2 className="view-title">Contribute Match Data</h2>
      </div>

      <div className="contribute-intro">
        <p>
          Help grow the community match database by scanning your Steam{' '}
          <code>httpcache</code> folder. This extracts match IDs and replay
          salts from cached files and uploads them to the Deadlock API — making
          matches available for everyone.
        </p>
        <p className="contribute-privacy">
          🔒 <strong>Privacy:</strong> Only match IDs and salts are uploaded. No
          personal information is collected.
        </p>
      </div>

      <div className="contribute-columns">
        {/* Left column: drop zone + path guide + result */}
        <div className="contribute-columns__main">
          {/* Drop zone */}
          <div
            className={`contribute-dropzone ${isDragOver ? 'contribute-dropzone--active' : ''} ${isScanning ? 'contribute-dropzone--scanning' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isScanning && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === 'Enter' && !isScanning && fileInputRef.current?.click()
            }
          >
            <input
              ref={fileInputRef}
              type="file"
              // @ts-expect-error webkitdirectory is not in standard types
              webkitdirectory=""
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />

            {isScanning ? (
              <div className="contribute-dropzone__scanning">
                <div className="contribute-dropzone__spinner" />
                <p className="contribute-dropzone__status">
                  Scanning… {saltsFound} match{saltsFound !== 1 ? 'es' : ''}{' '}
                  found
                </p>
              </div>
            ) : (
              <>
                <div className="contribute-dropzone__icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="contribute-dropzone__title">
                  Drop your httpcache folder here
                </p>
                <p className="contribute-dropzone__subtitle">
                  or click to browse
                </p>
              </>
            )}
          </div>

          {/* Path guide */}
          <div className="contribute-path-guide">
            <h4>Where to find it</h4>
            <p>The default Steam httpcache location on Windows:</p>
            <code className="contribute-path-code">{DEFAULT_PATH}</code>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`contribute-result ${result.type === 'success' ? 'contribute-result--success' : 'contribute-result--error'}`}
            >
              <span className="contribute-result__icon">
                {result.type === 'success' ? '✅' : '❌'}
              </span>
              <p>{result.message}</p>
            </div>
          )}
        </div>

        {/* Right column: steps guide */}
        <div className="contribute-columns__side">
          <div className="contribute-steps">
            <h4 className="contribute-steps__title">How it works</h4>
            <ol className="contribute-steps__list">
              <li>Launch Deadlock</li>
              <li>Go to your profile</li>
              <li>Open Match History</li>
              <li>Click the specific matches you want to record</li>
              <li>Exit the game</li>
              <li>
                Upload the <code>httpcache</code> folder here
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContributeView;
