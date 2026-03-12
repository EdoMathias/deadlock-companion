import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HEROES } from '../../shared/data/heroes';

interface HeroSelectProps {
  value: number | string | null;
  onChange: (value: string | null) => void;
}

const sortedHeroes = Object.entries(HEROES)
  .filter(([, h]) => h.images?.icon_image_small)
  .sort(([, a], [, b]) => a.name.localeCompare(b.name));

const HeroSelect: React.FC<HeroSelectProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedHero = value != null ? HEROES[Number(value)] : null;

  const filtered = useMemo(() => {
    if (!search) return sortedHeroes;
    const q = search.toLowerCase();
    return sortedHeroes.filter(([, h]) => h.name.toLowerCase().includes(q));
  }, [search]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) setSearch('');
      return !prev;
    });
  }, []);

  const handleSelect = useCallback(
    (key: string | null) => {
      onChange(key);
      setOpen(false);
      setSearch('');
    },
    [onChange],
  );

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div className="hero-select" ref={containerRef}>
      <button
        type="button"
        className="hero-select__trigger"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedHero ? (
          <>
            {selectedHero.images?.icon_image_small && (
              <img
                className="hero-select__icon"
                src={selectedHero.images.icon_image_small}
                alt=""
              />
            )}
            <span className="hero-select__label">{selectedHero.name}</span>
          </>
        ) : (
          <span className="hero-select__label">All Heroes</span>
        )}
        <span className="hero-select__chevron" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="hero-select__dropdown" role="listbox">
          <input
            ref={searchRef}
            className="hero-select__search"
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
                setSearch('');
              }
            }}
          />
          <div className="hero-select__options">
            <button
              type="button"
              className={`hero-select__option ${value == null ? 'hero-select__option--selected' : ''}`}
              onClick={() => handleSelect(null)}
              role="option"
              aria-selected={value == null}
            >
              <span className="hero-select__option-label">All Heroes</span>
            </button>
            {filtered.map(([key, hero]) => (
              <button
                type="button"
                key={key}
                className={`hero-select__option ${String(value) === key ? 'hero-select__option--selected' : ''}`}
                onClick={() => handleSelect(key)}
                role="option"
                aria-selected={String(value) === key}
              >
                {hero.images?.icon_image_small && (
                  <img
                    className="hero-select__icon"
                    src={hero.images.icon_image_small}
                    alt=""
                  />
                )}
                <span className="hero-select__option-label">{hero.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroSelect;
