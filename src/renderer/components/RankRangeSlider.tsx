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
  /**
   * When true the slider trigger is non-interactive (dropdown can't open)
   * and rendered in a muted style. Useful for contexts where the current
   * game mode / endpoint does not accept rank filtering.
   */
  disabled?: boolean;
}

const RankRangeSlider: React.FC<RankRangeSliderProps> = ({
  minBadge,
  maxBadge,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);
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
      // Art is per-tier now (one image per tier, shared across subranks).
      for (const rank of SELECTABLE_RANKS) {
        const img = new Image();
        img.src = getRankIconUrl(rank.tier);
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
  const triggerLabel = !isFiltered
    ? 'All Ranks'
    : lowBadge === highBadge
      ? badgeToLabel(lowBadge)
      : `${badgeToLabel(lowBadge)} – ${badgeToLabel(highBadge)}`;

  const lowPercent = (lowPos / MAX_SLIDER_POS) * 100;
  const highPercent = (highPos / MAX_SLIDER_POS) * 100;

  const trackStyle: React.CSSProperties = {
    background: `linear-gradient(to right,
      var(--color-bg-card) ${lowPercent}%,
      var(--color-accent-primary) ${lowPercent}%,
      var(--color-accent-primary) ${highPercent}%,
      var(--color-bg-card) ${highPercent}%)`,
  };

  const setRange = useCallback(
    (newLow: number, newHigh: number) => {
      setLowPos(newLow);
      setHighPos(newHigh);
      emitChange(newLow, newHigh);
    },
    [emitChange],
  );

  const presets = useMemo(() => {
    // Split the tier list into four roughly-equal bands (Low/Mid/High/Top),
    // front-loading the remainder so the split is stable however many
    // tiers `ranks.ts` defines — not hardcoded to today's count of 11.
    const n = SELECTABLE_RANKS.length;
    const base = Math.floor(n / 4);
    const remainder = n % 4;
    const bandLabels = ['Low', 'Mid', 'High', 'Top'];
    const bands: { label: string; startIdx: number; endIdx: number }[] = [];
    let start = 0;
    for (let i = 0; i < 4; i++) {
      const size = base + (i < remainder ? 1 : 0);
      bands.push({ label: bandLabels[i], startIdx: start, endIdx: start + size - 1 });
      start += size;
    }

    const toPreset = (
      label: string,
      startIdx: number,
      endIdx: number,
      low: number,
      high: number,
    ) => ({
      label,
      low,
      high,
      title: `${SELECTABLE_RANKS[startIdx].name} – ${SELECTABLE_RANKS[endIdx].name}`,
      active: lowPos === low && highPos === high,
    });

    return [
      { label: 'Any', low: 0, high: MAX_SLIDER_POS, title: 'All ranks', active: lowPos === 0 },
      ...bands.map((b) =>
        toPreset(b.label, b.startIdx, b.endIdx, b.startIdx * 6 + 1, b.endIdx * 6 + 6),
      ),
    ];
  }, [lowPos, highPos]);

  return (
    <div className="rank-slider" ref={containerRef}>
      <button
        type="button"
        className={`rank-slider__trigger${
          disabled ? ' rank-slider__trigger--disabled' : ''
        }`}
        onClick={() => {
          if (disabled) return;
          setOpen((p) => !p);
        }}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {lowInfo && (
          <img
            className="rank-slider__trigger-icon"
            src={getRankIconUrl(lowInfo.tier)}
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
                  src={getRankIconUrl(lowInfo.tier)}
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
                  src={getRankIconUrl(highInfo.tier)}
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
            <div className="rank-slider__ticks" aria-hidden="true">
              {SELECTABLE_RANKS.map((rank, i) => {
                const tierStart = i * 6 + 1;
                const tierEnd = i * 6 + 6;
                const inRange = tierEnd >= lowPos && tierStart <= highPos;
                const pct = (i / (SELECTABLE_RANKS.length - 1)) * 100;
                return (
                  <span
                    key={rank.tier}
                    className={`rank-slider__tick${inRange ? ' rank-slider__tick--active' : ''}`}
                    style={{ left: `${pct}%` }}
                  />
                );
              })}
            </div>
            <input
              type="range"
              className="rank-slider__input rank-slider__input--low"
              min={0}
              max={MAX_SLIDER_POS}
              step={1}
              value={lowPos}
              onChange={handleLowChange}
              aria-label="Lowest rank"
            />
            <input
              type="range"
              className="rank-slider__input rank-slider__input--high"
              min={0}
              max={MAX_SLIDER_POS}
              step={1}
              value={highPos}
              onChange={handleHighChange}
              aria-label="Highest rank"
            />
          </div>

          <span className="rank-slider__hint">Drag either handle, or pick a preset</span>

          <div className="rank-slider__presets" role="radiogroup" aria-label="Rank presets">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                role="radio"
                aria-checked={preset.active}
                title={preset.title}
                className={`rank-slider__preset${preset.active ? ' rank-slider__preset--active' : ''}`}
                onClick={() => setRange(preset.low, preset.high)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RankRangeSlider;
