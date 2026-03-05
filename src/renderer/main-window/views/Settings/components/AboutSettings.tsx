import React from 'react';

const AboutSettings: React.FC = () => {
  return (
    <div className="settings-section">
      <h3 className="settings-section-title">About Deadlock Companion</h3>
      <p className="settings-section-description">
        Deadlock Companion is an unofficial companion app for Deadlock, designed
        to help you track live match data, match history, and player profile
        statistics.
      </p>

      <p className="settings-section-caption">
        Match data and player statistics are provided by{' '}
        <a
          href="https://deadlock-api.com"
          target="_blank"
          rel="noopener noreferrer"
          className="settings-about-link"
        >
          deadlock-api.com
        </a>
        . This app uses the{' '}
        <a
          href="https://github.com/deadlock-api/openapi-clients/tree/master/typescript/api"
          target="_blank"
          rel="noopener noreferrer"
          className="settings-about-link"
        >
          deadlock_api_client
        </a>{' '}
        TypeScript client.
      </p>

      <div className="settings-about-copyright">
        <p className="settings-copyright-text">
          Deadlock and related marks are trademarks of Valve Corporation. This
          application is a fan-made project and is not affiliated with,
          endorsed, or sponsored by Valve Corporation.
        </p>
      </div>
    </div>
  );
};

export default AboutSettings;
