import React, { useState } from 'react';

const DISMISSED_STORAGE_KEY = 'dl_ingest_prompt_dismissed';

interface IngestPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToScanner: () => void;
  scope?: 'global' | 'content';
}

export const IngestPromptModal: React.FC<IngestPromptModalProps> = ({
  isOpen,
  onClose,
  onGoToScanner,
  scope = 'global',
}) => {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontAskAgain) {
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
      } catch {
        // Ignore
      }
    }
    onClose();
  };

  const handleGoToScanner = () => {
    if (dontAskAgain) {
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
      } catch {
        // Ignore
      }
    }
    onGoToScanner();
  };

  const overlayClass =
    scope === 'content'
      ? 'modal-overlay modal-overlay--content'
      : 'modal-overlay';

  return (
    <div className={overlayClass} onClick={handleClose}>
      <div
        className="modal-content ingest-prompt-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="release-notes-header">
          <div>
            <p className="release-notes-eyebrow">Post-Game</p>
            <h3 className="release-notes-title">Contribute your match data?</h3>
          </div>
        </div>

        <div className="ingest-prompt-body">
          <p>
            Deadlock just closed. You can scan your Steam <code>httpcache</code>{' '}
            folder to upload match salts and make recent matches available on
            the API for everyone.
          </p>
          <p>
            Only match IDs and salts are uploaded — no personal information is
            collected.
          </p>
        </div>

        <label className="ingest-prompt-checkbox">
          <input
            type="checkbox"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
          />
          Don&apos;t ask again
        </label>

        <div className="modal-actions">
          <button
            className="modal-button modal-button-cancel"
            onClick={handleClose}
          >
            Not now
          </button>
          <button
            className="modal-button modal-button-confirm"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--color-accent-primary) 10%, transparent)',
              borderColor:
                'color-mix(in srgb, var(--color-accent-primary) 30%, transparent)',
              color: 'var(--color-accent-primary)',
            }}
            onClick={handleGoToScanner}
          >
            Contribute Now
          </button>
        </div>
      </div>
    </div>
  );
};
