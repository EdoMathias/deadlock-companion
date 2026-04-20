import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NotificationPreset } from '../../../../../shared/types/itemAlerts';
import type { ItemMetadata } from '../../../../../shared/types/items';

interface Props {
  presets: NotificationPreset[];
  trackedCount: number;
  onApplyPreset: (preset: NotificationPreset, allItems: ItemMetadata[]) => void;
  onClearAll: () => void;
  allItems: ItemMetadata[];
}

const PresetSelector: React.FC<Props> = ({
  presets,
  trackedCount,
  onApplyPreset,
  onClearAll,
  allItems,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

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
    <div className="preset-selector" ref={containerRef}>
      <button
        type="button"
        className="preset-selector__trigger"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="preset-selector__label">
          Item Alerts Presets
        </span>
        <span className="preset-selector__badge">{trackedCount}</span>
        <span className="preset-selector__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="preset-selector__dropdown">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset-selector__option"
              onClick={() => onApplyPreset(preset, allItems)}
              title={preset.description}
            >
              <span className="preset-selector__option-label">
                {preset.name}
              </span>
              <span className="preset-selector__option-desc">
                {preset.description}
              </span>
            </button>
          ))}
          <div className="preset-selector__divider" />
          <button
            type="button"
            className="preset-selector__option preset-selector__option--danger"
            onClick={() => {
              onClearAll();
              setOpen(false);
            }}
          >
            <span className="preset-selector__option-label">Clear All</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PresetSelector;
