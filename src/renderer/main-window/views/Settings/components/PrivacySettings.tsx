import React, { useState } from 'react';
import {
  isAnalyticsOptedOut,
  optInAnalytics,
  optOutAnalytics,
  track,
} from '../../../../../shared/services/analytics';

const PrivacySettings: React.FC = () => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(
    !isAnalyticsOptedOut(),
  );

  const handleToggleAnalytics = () => {
    const nextEnabled = !analyticsEnabled;
    setAnalyticsEnabled(nextEnabled);
    if (nextEnabled) {
      optInAnalytics();
      track('analytics_opt_in');
    } else {
      // Fire the event before opting out, so the opt-out itself is recorded.
      track('analytics_opt_out');
      optOutAnalytics();
    }
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Privacy &amp; Analytics</h3>
      <p className="settings-section-description">
        Help improve Deadlock Companion by sharing anonymous usage data. No
        personal information (no Steam ID or player names) is ever collected.
      </p>
      <label
        className="settings-section-caption"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={analyticsEnabled}
          onChange={handleToggleAnalytics}
        />
        Share anonymous usage analytics
      </label>
    </div>
  );
};

export default PrivacySettings;
