import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePatchDays, type PatchDay } from '../hooks/usePatchDays';

interface DateRangeSelectorProps {
  minUnixTimestamp?: number;
  maxUnixTimestamp?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}

type Mode = 'all' | 'patch' | 'custom';

function epochToInputDate(epochSec: number | undefined): string {
  if (epochSec == null) return '';
  const d = new Date(epochSec * 1000);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function inputDateToEpochStart(value: string): number | undefined {
  if (!value) return undefined;
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(ms)) return undefined;
  return Math.floor(ms / 1000);
}

function inputDateToEpochEnd(value: string): number | undefined {
  if (!value) return undefined;
  const ms = Date.parse(`${value}T23:59:59Z`);
  if (!Number.isFinite(ms)) return undefined;
  return Math.floor(ms / 1000);
}

/**
 * Attempts to derive the selected patch from the current timestamp range.
 * Returns the matching `PatchDay` if `min` aligns with a known patch epoch,
 * otherwise `null` (meaning the user has a custom range or no filter).
 */
function findMatchingPatch(
  days: PatchDay[],
  min: number | undefined,
): PatchDay | null {
  if (min == null) return null;
  return days.find((d) => d.epochSec === min) ?? null;
}

function deriveMode(
  days: PatchDay[],
  min: number | undefined,
  max: number | undefined,
): Mode {
  if (min == null && max == null) return 'all';
  if (findMatchingPatch(days, min)) return 'patch';
  return 'custom';
}

function formatDateLabel(epochSec: number): string {
  return epochToInputDate(epochSec);
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  minUnixTimestamp,
  maxUnixTimestamp,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { days, loading, error } = usePatchDays();

  const [customStart, setCustomStart] = useState(() =>
    epochToInputDate(minUnixTimestamp),
  );
  const [customEnd, setCustomEnd] = useState(() =>
    epochToInputDate(maxUnixTimestamp),
  );
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    setCustomStart(epochToInputDate(minUnixTimestamp));
    setCustomEnd(epochToInputDate(maxUnixTimestamp));
  }, [minUnixTimestamp, maxUnixTimestamp]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setCustomError(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setCustomError(null);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const patchCap = useMemo(() => days.slice(0, 5), [days]);
  const selectedPatch = useMemo(
    () => findMatchingPatch(days, minUnixTimestamp),
    [days, minUnixTimestamp],
  );
  const mode: Mode = useMemo(
    () => deriveMode(days, minUnixTimestamp, maxUnixTimestamp),
    [days, minUnixTimestamp, maxUnixTimestamp],
  );

  const triggerLabel = useMemo(() => {
    if (mode === 'all') return 'All time';
    if (mode === 'patch' && selectedPatch) {
      return selectedPatch.label;
    }
    const startLabel =
      minUnixTimestamp != null ? formatDateLabel(minUnixTimestamp) : '…';
    const endLabel =
      maxUnixTimestamp != null ? formatDateLabel(maxUnixTimestamp) : '…';
    return `${startLabel} \u2192 ${endLabel}`;
  }, [mode, selectedPatch, minUnixTimestamp, maxUnixTimestamp]);

  const handleSelectPatch = useCallback(
    (index: number) => {
      const patch = patchCap[index];
      if (!patch) return;
      const newer = patchCap[index - 1];
      const min = patch.epochSec;
      const max = newer ? newer.epochSec - 1 : undefined;
      onChange(min, max);
      setOpen(false);
      setCustomError(null);
    },
    [patchCap, onChange],
  );

  const handleReset = useCallback(() => {
    onChange(undefined, undefined);
    setCustomStart('');
    setCustomEnd('');
    setCustomError(null);
    setOpen(false);
  }, [onChange]);

  const handleApplyCustom = useCallback(() => {
    const min = inputDateToEpochStart(customStart);
    const max = inputDateToEpochEnd(customEnd);
    if (min != null && max != null && min > max) {
      setCustomError('Start date must be before end date');
      return;
    }
    if (min == null && max == null) {
      setCustomError('Enter at least one date');
      return;
    }
    setCustomError(null);
    onChange(min, max);
    setOpen(false);
  }, [customStart, customEnd, onChange]);

  return (
    <div className="date-range" ref={containerRef}>
      <button
        type="button"
        className="date-range__trigger"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="date-range__trigger-icon" aria-hidden="true">
          📅
        </span>
        <span className="date-range__trigger-label">{triggerLabel}</span>
        <span className="date-range__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="date-range__dropdown" role="dialog">
          <button
            type="button"
            className={`date-range__reset ${
              mode === 'all' ? 'date-range__reset--active' : ''
            }`}
            onClick={handleReset}
          >
            All time
          </button>

          <div className="date-range__section-label">Patches</div>
          <div className="date-range__patch-list">
            {loading && (
              <div className="date-range__empty">Loading patches…</div>
            )}
            {!loading && error && (
              <div className="date-range__empty">Patch list unavailable</div>
            )}
            {!loading && !error && patchCap.length === 0 && (
              <div className="date-range__empty">No patches available</div>
            )}
            {!loading &&
              !error &&
              patchCap.map((patch, index) => {
                const isSelected =
                  selectedPatch?.epochSec === patch.epochSec;
                return (
                  <button
                    type="button"
                    key={patch.iso}
                    className={`date-range__patch ${
                      isSelected ? 'date-range__patch--selected' : ''
                    }`}
                    onClick={() => handleSelectPatch(index)}
                  >
                    <span className="date-range__patch-label">
                      {patch.label}
                    </span>
                    {(index === 0 || patch.isBig) && (
                      <span className="date-range__patch-badges">
                        {index === 0 && (
                          <span className="date-range__patch-badge">
                            Latest
                          </span>
                        )}
                        {patch.isBig && (
                          <span
                            className="date-range__patch-badge date-range__patch-badge--big"
                            title="Major / milestone patch"
                          >
                            Major
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          <div className="date-range__divider" />

          <div className="date-range__section-label">Custom range</div>
          <div className="date-range__custom">
            <label className="date-range__field">
              <span className="date-range__field-label">Start</span>
              <input
                type="date"
                className="date-range__input"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setCustomError(null);
                }}
              />
            </label>
            <label className="date-range__field">
              <span className="date-range__field-label">End</span>
              <input
                type="date"
                className="date-range__input"
                value={customEnd}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  setCustomError(null);
                }}
              />
            </label>
          </div>
          {customError && (
            <div className="date-range__error" role="alert">
              {customError}
            </div>
          )}
          <button
            type="button"
            className="date-range__apply"
            onClick={handleApplyCustom}
          >
            Apply custom range
          </button>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;
