import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface ModeSelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface ModeSelectProps<T extends string | number> {
  value: T;
  options: ModeSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Custom dropdown for mode selection, matching the look of `HeroSelect` and
 * the rank / date-range triggers. Used by the Hero Stats, Item Stats, and
 * Match History filter bars so all four controls read as one set.
 */
function ModeSelect<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel = 'Mode',
  className,
}: ModeSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  const handleSelect = useCallback(
    (next: T) => {
      onChange(next);
      setOpen(false);
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div
      className={`mode-select${className ? ` ${className}` : ''}`}
      ref={containerRef}
    >
      <button
        type="button"
        className="mode-select__trigger"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="mode-select__label">{selected?.label ?? ''}</span>
        <span className="mode-select__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="mode-select__dropdown" role="listbox">
          {options.map((option) => (
            <button
              type="button"
              key={String(option.value)}
              className={`mode-select__option ${
                option.value === value ? 'mode-select__option--selected' : ''
              }`}
              onClick={() => handleSelect(option.value)}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ModeSelect;
