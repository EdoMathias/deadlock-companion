import React from 'react';

interface DataContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope?: 'global' | 'content';
}

const INGEST_REPO_URL = 'https://github.com/deadlock-api/deadlock-api-ingest';

export const DataContributionModal: React.FC<DataContributionModalProps> = ({
  isOpen,
  onClose,
  scope = 'global',
}) => {
  if (!isOpen) return null;

  const overlayClass =
    scope === 'content'
      ? 'modal-overlay modal-overlay--content'
      : 'modal-overlay';

  return (
    <div className={overlayClass} onClick={onClose}>
      <div
        className="modal-content data-contribution-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="release-notes-header">
          <div>
            <p className="release-notes-eyebrow">Match Data</p>
            <h3 className="release-notes-title">
              Why are some matches missing?
            </h3>
          </div>
        </div>

        <div className="data-contribution-body">
          <section className="data-contribution-section">
            <h4>How it works</h4>
            <p>
              The Deadlock API relies on community-contributed data. Matches
              appear after someone submits them to the database. To retain
              value, we use Overwolf's Game Events to populate your match
              history with basic information first, and after your contribution,
              more data will be available! Use <strong>Full Sync</strong> once
              per day to contribute your recent matches from Steam.
            </p>
          </section>

          <section className="data-contribution-section">
            <h4>Help the community</h4>
            <p>
              Contribute matches by scanning your Steam <code>httpcache</code>{' '}
              folder in the <strong>Contribute</strong> view. For advanced
              users, check out the community ingestion tool:
            </p>
            <a
              className="data-contribution-link"
              href={INGEST_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              deadlock-api/deadlock-api-ingest
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.5 }}
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </section>
        </div>

        <div className="modal-actions">
          <button
            className="modal-button modal-button-confirm"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
