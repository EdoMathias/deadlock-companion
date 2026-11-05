import React, { useEffect, useState } from 'react';
import { SteamProfile } from 'deadlock_api_client';
import { useSteamId } from '../hooks/useSteamId';
import { useWindowInfo } from '../hooks/useWindowInfo';
import {
  fetchSteamProfileDirect,
  resolveVanityUrl,
} from '../../shared/services/steamWebApi';
import { parseSteamProfileInput } from '../../shared/utils/steamUtils';
import { track, setPersonProperties } from '../../shared/services/analytics';
import { createLogger } from '../../shared/services/Logger';

const logger = createLogger('SteamConnectGate');

/** How long to wait for GEP to report a Steam ID before showing the "failed" card. */
const AUTO_DETECT_TIMEOUT_MS = 8000;

type PasteStep = 'enter' | 'checking' | 'confirm';
type AutoPhase = 'waiting' | 'detected' | 'failed';

export interface SteamConnectGateProps {
  /** Which view is gated — drives copy and button labels only; navigation stays in place. */
  cameFrom: 'Match History' | 'Profile' | 'Hero Stats';
  /** Called once the user has explicitly confirmed a Steam account (auto-detected or pasted). */
  onConnected: () => void;
}

/**
 * Full-bleed "connect Steam" gate shown by Match History and Profile when
 * no Steam ID is on file. Offers two paths: passive auto-detection from the
 * running game (GEP `game_info.steam_id`, surfaced via useSteamId's storage
 * sync) and pasting a Steam profile link / SteamID64.
 */
export const SteamConnectGate: React.FC<SteamConnectGateProps> = ({
  cameFrom,
  onConnected,
}) => {
  const { steamId, setSteamId } = useSteamId();
  const { isIngameWindow } = useWindowInfo();

  const [autoPhase, setAutoPhase] = useState<AutoPhase>('waiting');
  const [autoProfile, setAutoProfile] = useState<SteamProfile | null>(null);

  const [pasteStep, setPasteStep] = useState<PasteStep>('enter');
  const [pasteValue, setPasteValue] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<{
    steamId64: string;
    profile: SteamProfile | null;
  } | null>(null);

  // Drive the automatic-detection card off the same signal Settings/other
  // views use (useSteamId's storage-event sync from the background's GEP
  // read). If we're in the in-game window and nothing shows up within the
  // timeout, treat it as failed and point the user at the paste box.
  useEffect(() => {
    if (steamId) {
      setAutoPhase('detected');
      return;
    }
    setAutoPhase('waiting');
    if (!isIngameWindow) return;
    const timer = setTimeout(() => {
      setAutoPhase((phase) => (phase === 'waiting' ? 'failed' : phase));
    }, AUTO_DETECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [steamId, isIngameWindow]);

  // Fetch the Steam display name for the "Connected as ..." auto-detect card.
  useEffect(() => {
    if (autoPhase !== 'detected' || !steamId) return;
    let cancelled = false;
    fetchSteamProfileDirect(steamId).then((profile) => {
      if (!cancelled) setAutoProfile(profile);
    });
    return () => {
      cancelled = true;
    };
  }, [autoPhase, steamId]);

  const trimmedPaste = pasteValue.trim();
  const parsedPaste = parseSteamProfileInput(trimmedPaste);
  const isValid = parsedPaste !== null;
  const isBad = trimmedPaste.length > 6 && !isValid;

  const handleContinue = async () => {
    if (!parsedPaste) return;
    setPasteStep('checking');
    setPasteError(null);

    let steamId64: string | null = null;
    try {
      steamId64 =
        parsedPaste.type === 'steamId64'
          ? parsedPaste.steamId64
          : await resolveVanityUrl(parsedPaste.vanity);
    } catch (err) {
      logger.error('Failed to resolve pasted Steam profile', err);
      steamId64 = null;
    }

    if (!steamId64) {
      setPasteStep('enter');
      setPasteError(
        "We couldn't find that Steam profile. Double-check the link and try again.",
      );
      return;
    }

    const profile = await fetchSteamProfileDirect(steamId64);
    setResolved({ steamId64, profile });
    setPasteStep('confirm');
  };

  const handleNotMe = () => {
    setPasteStep('enter');
    setResolved(null);
    setPasteValue('');
  };

  const handleConfirmPaste = () => {
    if (!resolved) return;
    setSteamId(resolved.steamId64);
    track('steam_id_connected', { source: 'prompt' });
    setPersonProperties({ steam_connected: true });
    onConnected();
  };

  const handleConfirmAuto = () => {
    track('steam_id_connected', { source: 'auto_detect' });
    setPersonProperties({ steam_connected: true });
    onConnected();
  };

  const COPY: Record<
    SteamConnectGateProps['cameFrom'],
    { headline: string; intro: string; goLabel: string; yesLabel: string }
  > = {
    Profile: {
      headline: 'See how you stack up',
      intro:
        'Your Profile needs your Steam account. Connect once and everything fills in after every game.',
      goLabel: 'Open Profile',
      yesLabel: 'Yes, open my Profile',
    },
    'Match History': {
      headline: 'See every match you play',
      intro:
        'Match History and your Profile need your Steam account. Connect once and everything fills in after every game.',
      goLabel: 'See my matches',
      yesLabel: 'Yes, load my matches',
    },
    'Hero Stats': {
      headline: 'See the heroes you play',
      intro:
        '“My heroes” needs your Steam account to know which heroes you play. Connect once and it stays up to date after every game.',
      goLabel: 'Show my heroes',
      yesLabel: 'Yes, show my heroes',
    },
  };
  const { headline, intro, goLabel, yesLabel } = COPY[cameFrom];

  const helpText = isBad
    ? "That doesn't look like a Steam profile link or a 17-digit SteamID64."
    : isValid
      ? 'Looks good. Continue to confirm the account.'
      : 'In Steam, click your name and copy the page URL. A 17-digit SteamID64 works too.';

  return (
    <div className="steam-gate">
      <section
        className="steam-gate__panel steam-gate__connect"
        aria-labelledby="steam-gate-title"
      >
        <div className="steam-gate__intro">
          <h2 id="steam-gate-title" className="steam-gate__headline">
            {headline}
          </h2>
          <p className="steam-gate__subtext">{intro}</p>
        </div>

        <div className="steam-gate__option" aria-label="Connect automatically">
          <div className="steam-gate__option-label">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
              className="steam-gate__option-icon"
            >
              <rect x="2" y="6" width="20" height="12" rx="3"></rect>
              <path d="M7 12h4M9 10v4M15 11h.01M18 13h.01"></path>
            </svg>
            <span className="steam-gate__option-title">
              Automatically, when you play
            </span>
          </div>
          <span className="steam-gate__option-desc">
            Launch Deadlock with the companion running. We read your Steam ID
            from the game.
          </span>

          {autoPhase === 'waiting' && (
            <span role="status" className="steam-gate__badge steam-gate__badge--waiting">
              <span className="steam-gate__badge-dot" />
              Waiting for game launch
            </span>
          )}

          {autoPhase === 'detected' && (
            <div role="status" className="steam-gate__auto-card">
              <span className="steam-gate__avatar" aria-hidden="true">
                {autoProfile?.avatarmedium && (
                  <img src={autoProfile.avatarmedium} alt="" />
                )}
              </span>
              <span className="steam-gate__auto-card-text">
                <span className="steam-gate__auto-card-name">
                  Connected as {autoProfile?.personaname ?? 'your Steam account'}
                </span>
                <span className="steam-gate__auto-card-meta">
                  Found in your running game
                </span>
              </span>
              <button
                type="button"
                className="steam-gate__btn steam-gate__btn--primary"
                onClick={handleConfirmAuto}
              >
                {goLabel}
              </button>
            </div>
          )}

          {autoPhase === 'failed' && (
            <div role="alert" className="steam-gate__alert">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                aria-hidden="true"
                className="steam-gate__alert-icon"
              >
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 7v6M12 16.5v.5"></path>
              </svg>
              <span className="steam-gate__alert-text">
                <strong>
                  Deadlock is running, but we couldn&apos;t read your Steam
                  ID.
                </strong>{' '}
                Paste your profile link below instead. It takes a few
                seconds.
              </span>
            </div>
          )}
        </div>

        <div className="steam-gate__divider">
          <span className="steam-gate__divider-line" />
          or connect right now
          <span className="steam-gate__divider-line" />
        </div>

        <div
          className={`steam-gate__option steam-gate__paste-box${
            autoPhase === 'failed' ? ' steam-gate__paste-box--highlight' : ''
          }`}
        >
          {pasteStep === 'enter' && (
            <>
              <div className="steam-gate__option-label">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  aria-hidden="true"
                  className="steam-gate__option-icon"
                >
                  <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"></path>
                  <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"></path>
                </svg>
                <label htmlFor="steam-input" className="steam-gate__option-title">
                  Paste your Steam profile link
                </label>
              </div>
              <div className="steam-gate__input-row">
                <div className="steam-gate__input-wrap">
                  <input
                    id="steam-input"
                    type="text"
                    value={pasteValue}
                    onChange={(e) => {
                      setPasteValue(e.target.value);
                      setPasteError(null);
                    }}
                    placeholder="steamcommunity.com/id/yourname"
                    aria-invalid={isBad}
                    aria-describedby="steam-help"
                    className={`steam-gate__input${
                      isBad
                        ? ' steam-gate__input--invalid'
                        : isValid
                          ? ' steam-gate__input--valid'
                          : ''
                    }`}
                  />
                  {isValid && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      aria-label="Valid link"
                      role="img"
                      className="steam-gate__input-check"
                    >
                      <path d="M5 12l5 5L20 7"></path>
                    </svg>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!isValid}
                  className="steam-gate__btn steam-gate__btn--continue"
                >
                  Continue
                </button>
              </div>
              <span
                id="steam-help"
                className={`steam-gate__help${
                  isBad || pasteError
                    ? ' steam-gate__help--error'
                    : isValid
                      ? ' steam-gate__help--valid'
                      : ''
                }`}
              >
                {pasteError ?? helpText}
              </span>
            </>
          )}

          {pasteStep === 'checking' && (
            <div role="status" className="steam-gate__checking">
              <svg
                className="steam-gate__spinner"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-6.2-8.6"></path>
              </svg>
              Looking up that Steam profile…
            </div>
          )}

          {pasteStep === 'confirm' && resolved && (
            <>
              <span className="steam-gate__option-title">Is this you?</span>
              <div className="steam-gate__confirm-card">
                <span className="steam-gate__avatar steam-gate__avatar--lg" aria-hidden="true">
                  {resolved.profile?.avatarmedium && (
                    <img src={resolved.profile.avatarmedium} alt="" />
                  )}
                </span>
                <span className="steam-gate__confirm-text">
                  <span className="steam-gate__confirm-name">
                    {resolved.profile?.personaname ?? 'Steam account'}
                  </span>
                  <span className="steam-gate__confirm-meta">
                    Steam profile
                  </span>
                </span>
              </div>
              <div className="steam-gate__confirm-actions">
                <button
                  type="button"
                  className="steam-gate__btn steam-gate__btn--primary"
                  onClick={handleConfirmPaste}
                >
                  {yesLabel}
                </button>
                <button
                  type="button"
                  className="steam-gate__btn steam-gate__btn--ghost"
                  onClick={handleNotMe}
                >
                  Not me
                </button>
              </div>
            </>
          )}
        </div>

        <p className="steam-gate__footnote">
          Used only to load your public Deadlock match data. You can change
          or remove it any time in Settings.
        </p>
      </section>

      <section className="steam-gate__panel steam-gate__preview" aria-label="What you'll get">
        <div className="steam-gate__preview-header">
          <span className="steam-gate__preview-label">What you&apos;ll get</span>
          <span className="steam-gate__preview-sample-tag">Sample</span>
        </div>

        <div className="steam-gate__preview-card">
          <span className="steam-gate__preview-card-label">
            Every match, right after you play
          </span>
          <div className="steam-gate__sample-match steam-gate__sample-match--win">
            <span className="steam-gate__sample-outcome steam-gate__sample-outcome--win">
              Win
            </span>
            <span className="steam-gate__sample-portrait" aria-hidden="true" />
            <span className="steam-gate__sample-hero">Vindicta</span>
            <span className="steam-gate__sample-kda">9/2/6</span>
            <span className="steam-gate__sample-spm">
              <span className="steam-gate__sample-spm-label">Souls/min</span>
              <span className="steam-gate__sample-spm-value">1,402</span>
            </span>
            <span className="steam-gate__sample-ago">12m ago</span>
          </div>
          <div className="steam-gate__sample-match steam-gate__sample-match--loss">
            <span className="steam-gate__sample-outcome steam-gate__sample-outcome--loss">
              Loss
            </span>
            <span className="steam-gate__sample-portrait" aria-hidden="true" />
            <span className="steam-gate__sample-hero">Haze</span>
            <span className="steam-gate__sample-kda">3/7/4</span>
            <span className="steam-gate__sample-spm">
              <span className="steam-gate__sample-spm-label">Souls/min</span>
              <span className="steam-gate__sample-spm-value">974</span>
            </span>
            <span className="steam-gate__sample-ago">Yesterday</span>
          </div>
        </div>

        <div className="steam-gate__preview-card steam-gate__preview-card--chart">
          <div className="steam-gate__chart-header">
            <span className="steam-gate__preview-card-label">
              Where you fell behind
            </span>
            <span className="steam-gate__chart-legend">
              <span className="steam-gate__chart-legend-item">
                <span className="steam-gate__chart-swatch steam-gate__chart-swatch--you" />
                You
              </span>
              <span className="steam-gate__chart-legend-item">
                <span className="steam-gate__chart-swatch steam-gate__chart-swatch--avg" />
                Average Vindicta
              </span>
            </span>
          </div>
          <svg
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
            role="img"
            aria-label="Sample chart: your net worth against the average for your hero and rank, with the stretches below average shaded red"
            className="steam-gate__chart-svg"
          >
            <path
              d="M84,74 L100,72 L116,69 L132,64 L132,60 L116,64 L100,67 L84,70 Z"
              className="steam-gate__chart-shade"
            />
            <path
              d="M284,30 L296,29 L308,25 L308,22 L296,24 L284,26 Z"
              className="steam-gate__chart-shade"
            />
            <polyline
              points="0,98 40,90 84,70 132,60 180,50 230,40 284,26 308,22 350,14 400,6"
              className="steam-gate__chart-line steam-gate__chart-line--avg"
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              points="0,98 40,88 84,74 100,72 116,69 132,64 180,47 230,36 284,30 296,29 308,25 350,11 400,3"
              className="steam-gate__chart-line steam-gate__chart-line--you"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="steam-gate__preview-card">
          <span className="steam-gate__preview-card-label">
            How you compare to players like you
          </span>
          {[
            { label: 'KDA', pct: 91, ord: 'st', modifier: 'gold' },
            { label: 'Damage', pct: 85, ord: 'th', modifier: 'green' },
            { label: 'Healing', pct: 22, ord: 'nd', modifier: 'red' },
          ].map((bar) => (
            <div className="steam-gate__bar-row" key={bar.label}>
              <span className="steam-gate__bar-label">{bar.label}</span>
              <span className="steam-gate__bar-track">
                <span
                  className={`steam-gate__bar-fill steam-gate__bar-fill--${bar.modifier}`}
                  style={{ width: `${bar.pct}%` }}
                />
                <span className="steam-gate__bar-midline" aria-hidden="true" />
              </span>
              <span
                className={`steam-gate__bar-pct steam-gate__bar-pct--${bar.modifier}`}
              >
                {bar.pct}
                {bar.ord}
              </span>
            </div>
          ))}
        </div>

        <div className="steam-gate__preview-card steam-gate__preview-card--highlight">
          <span className="steam-gate__lane-badge">Lane won</span>
          <span className="steam-gate__lane-text">
            <strong>+1,200 souls</strong> above expected at 10:00, plus which
            items to swap next time
          </span>
        </div>
      </section>
    </div>
  );
};

export default SteamConnectGate;
