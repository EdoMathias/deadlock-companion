import React from 'react';
import { createLogger } from '../../../../../shared/services/Logger';

const logger = createLogger('DataSettings');

const DataSettings: React.FC = () => {
  const handleGoToContribute = () => {
    logger.log('Navigating to Contribute view from DataSettings');
    window.dispatchEvent(
      new CustomEvent('navigate-view', { detail: 'Contribute' }),
    );
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Match Data Contribution</h3>
      <p className="settings-section-description">
        Help improve match data availability by contributing your Steam cache
        data. This makes your recent matches — and others in your cache —
        available on the API for the entire community.
      </p>

      <div className="settings-field">
        <p className="settings-hint">
          Use the <strong>Contribute</strong> view to scan your Steam{' '}
          <code>httpcache</code> folder and upload match salts with a simple
          drag-and-drop interface.
        </p>
        <button
          className="btn btn--primary btn--sm"
          onClick={handleGoToContribute}
        >
          Go to Contribute →
        </button>
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
