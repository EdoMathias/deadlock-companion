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
            <h4>How match data works</h4>
            <p>
              The Deadlock API relies on community-contributed data. Matches are
              only available once someone has submitted them to the database. If
              a match was played recently, it may take a while to appear.
            </p>
          </section>

          <section className="data-contribution-section">
            <h4>Use "Full Sync" once a day</h4>
            <p>
              The <strong>Full Sync</strong> button fetches your complete match
              history directly from Steam&apos;s servers and contributes it to
              the community database. This is rate-limited, so you can use it{' '}
              <strong>once per day</strong>. It&apos;s the best way to make sure
              your recent matches show up.
            </p>
          </section>

          <section className="data-contribution-section">
            <h4>Help grow the database</h4>
            <p>
              You can also contribute match data by running the community
              ingestion tool. This helps make matches available faster for
              everyone:
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

          <section className="data-contribution-section">
            <h4>Scan your Steam cache</h4>
            <p>
              You can scan your Steam <code>httpcache</code> folder from the
              <strong> Contribute</strong> view in the sidebar. It uploads match
              salts to the community database with one click.
            </p>
          </section>

          <section className="data-contribution-section data-contribution-section--dimmed">
            <h4>Automatic contributions</h4>
            <p>
              Good news — this app already helps! When you view match details,
              the app automatically submits match data (salts) to the API,
              helping populate the database for everyone.
            </p>
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
