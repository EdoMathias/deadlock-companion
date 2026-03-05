import React, { useState } from 'react';
import { Button } from '../../../../components';
import { useFTUE } from '../../../../contexts/FTUEContext';
import { useSteamId } from '../../../../hooks/useSteamId';
import { isValidSteamId64 } from '../../../../../shared/utils/steamUtils';

const GeneralSettings: React.FC = () => {
  const { resetFTUE } = useFTUE();
  const { steamId, setSteamId, clearSteamId } = useSteamId();

  const [inputValue, setInputValue] = useState<string>(steamId ?? '');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>(
    '',
  );

  const showFeedback = (msg: string, type: 'success' | 'error') => {
    setFeedbackMessage(msg);
    setFeedbackType(type);
    setTimeout(() => {
      setFeedbackMessage('');
      setFeedbackType('');
    }, 3500);
  };

  const handleSaveSteamId = () => {
    const trimmed = inputValue.trim();
    if (trimmed === '') {
      clearSteamId();
      showFeedback('Steam ID cleared.', 'success');
      return;
    }
    if (!isValidSteamId64(trimmed)) {
      showFeedback(
        'Invalid Steam ID. It must be a 17-digit SteamID64.',
        'error',
      );
      return;
    }
    setSteamId(trimmed);
    showFeedback('Steam ID saved!', 'success');
  };

  const handleResetFTUE = () => {
    resetFTUE();
  };

  return (
    <div className="settings-section">
      {/* Steam ID Section */}
      <h3 className="settings-section-title">Steam Account</h3>
      <p className="settings-section-description">
        Enter your 17-digit SteamID64 to enable Match History and Profile
        features. You can find it at{' '}
        <a
          href="https://steamid.io"
          target="_blank"
          rel="noopener noreferrer"
          className="settings-about-link"
        >
          steamid.io
        </a>
        .
      </p>

      <div className="settings-input-row">
        <input
          className="settings-text-input"
          type="text"
          placeholder="76561198XXXXXXXXX"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={17}
          spellCheck={false}
        />
        <Button variant="primary" onClick={handleSaveSteamId}>
          Save
        </Button>
      </div>

      {feedbackMessage && (
        <p className={`settings-feedback settings-feedback--${feedbackType}`}>
          {feedbackMessage}
        </p>
      )}

      {steamId && (
        <p className="settings-section-caption">
          Current: <code>{steamId}</code>
        </p>
      )}

      {/* Divider */}
      <div className="settings-divider" />

      {/* Tutorial Section */}
      <h3 className="settings-section-title">Tutorial</h3>
      <p className="settings-section-description">
        Reset the first-time user experience to see the welcome and feature tips
        again.
      </p>
      <Button variant="secondary" onClick={handleResetFTUE}>
        Reset Tutorial
      </Button>
    </div>
  );
};

export default GeneralSettings;
