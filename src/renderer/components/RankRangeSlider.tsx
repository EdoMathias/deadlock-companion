import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  SELECTABLE_RANKS,
  MAX_SLIDER_POS,
  getRankIconUrl,
  sliderPosToBadge,
  badgeToSliderPos,
  badgeToLabel,
  badgeToTierSubrank,
} from '../../shared/data/ranks';

interface RankRangeSliderProps {
  minBadge?: number;
  maxBadge?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}

const RankRangeSlider: React.FC<RankRangeSliderProps> = ({
  minBadge,
  maxBadge,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lowPos, setLowPos] = useState(() => badgeToSliderPos(minBadge ?? 0));
  const [highPos, setHighPos] = useState(() =>
    maxBadge ? badgeToSliderPos(maxBadge) : MAX_SLIDER_POS,
  );

  useEffect(() => {
    setLowPos(badgeToSliderPos(minBadge ?? 0));
    setHighPos(maxBadge ? badgeToSliderPos(maxBadge) : MAX_SLIDER_POS);
  }, [minBadge, maxBadge]);

  const preloadedRef = useRef(false);
  useEffect(() => {
    if (open && !preloadedRef.current) {
      preloadedRef.current = true;
      for (const rank of SELECTABLE_RANKS) {
        for (let s = 1; s <= 6; s++) {
          const img = new Image();
          img.src = getRankIconUrl(rank.tier, s);
        }
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const emitChange = useCallback(
    (newLow: number, newHigh: number) => {
      if (newLow <= 0) {
        onChange(undefined, undefined);
      } else {
        onChange(sliderPosToBadge(newLow), sliderPosToBadge(newHigh));
      }
    },
    [onChange],
  );

  const handleLowChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      const clamped = Math.min(v, highPos);
      setLowPos(clamped);
      emitChange(clamped, highPos);
    },
    [highPos, emitChange],
  );

  const handleHighChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      const clamped = Math.max(v, lowPos);
      setHighPos(clamped);
      emitChange(lowPos, clamped);
    },
    [lowPos, emitChange],
  );

  const lowBadge = sliderPosToBadge(lowPos);
  const highBadge = sliderPosToBadge(highPos);
  const lowInfo = lowBadge > 0 ? badgeToTierSubrank(lowBadge) : null;
  const highInfo = highBadge > 0 ? badgeToTierSubrank(highBadge) : null;

  const isFiltered = lowPos > 0;
  const triggerLabel = isFiltered
    ? `Rank: ${badgeToLabel(lowBadge)}+`
    : 'All Ranks';

  const lowPercent = (lowPos / MAX_SLIDER_POS) * 100;
  const highPercent = (highPos / MAX_SLIDER_POS) * 100;

  const trackStyle: React.CSSProperties = {
    background: `linear-gradient(to right,
      var(--color-bg-card) ${lowPercent}%,
      var(--color-accent-primary) ${lowPercent}%,
      var(--color-accent-primary) ${highPercent}%,
      var(--color-bg-card) ${highPercent}%)`,
  };

  return (
    <div className="rank-slider" ref={containerRef}>
      <button
        type="button"
        className="rank-slider__trigger"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {lowInfo && (
          <img
            className="rank-slider__trigger-icon"
            src={getRankIconUrl(lowInfo.tier, lowInfo.subrank)}
            alt=""
          />
        )}
        <span className="rank-slider__trigger-label">{triggerLabel}</span>
        <span className="rank-slider__chevron" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="rank-slider__dropdown">
          <div className="rank-slider__endpoints">
            <div className="rank-slider__endpoint">
              {lowInfo ? (
                <img
                  className="rank-slider__icon"
                  src={getRankIconUrl(lowInfo.tier, lowInfo.subrank)}
                  alt=""
                />
              ) : (
                <div className="rank-slider__icon rank-slider__icon--empty" />
              )}
              <span className="rank-slider__label">
                {lowBadge > 0 ? badgeToLabel(lowBadge) : 'Obscurus'}
              </span>
            </div>

            <div className="rank-slider__endpoint">
              {highInfo && (
                <img
                  className="rank-slider__icon"
                  src={getRankIconUrl(highInfo.tier, highInfo.subrank)}
                  alt=""
                />
              )}
              <span className="rank-slider__label">
                {badgeToLabel(highBadge)}
              </span>
            </div>
          </div>

          <div className="rank-slider__track-wrap">
            <div className="rank-slider__track" style={trackStyle} />
            <input
              type="range"
              className="rank-slider__input rank-slider__input--low"
              min={0}
              max={MAX_SLIDER_POS}
              step={1}
              value={lowPos}
              onChange={handleLowChange}
            />
            <input
              type="range"
              className="rank-slider__input rank-slider__input--high"
              min={0}
              max={MAX_SLIDER_POS}
              step={1}
              value={highPos}
              onChange={handleHighChange}
            />
          </div>

          <button
            type="button"
            className="rank-slider__reset"
            onClick={() => {
              setLowPos(0);
              setHighPos(MAX_SLIDER_POS);
              onChange(undefined, undefined);
            }}
          >
            Reset to All Ranks
          </button>
        </div>
      )}
    </div>
  );
};

export default RankRangeSlider;
