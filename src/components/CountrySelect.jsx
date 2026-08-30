// src/components/CountrySelect.jsx
// A type-to-filter country picker -- the plain <select> this replaces works fine for
// the first handful of the app's 36 countries, but scanning a flat alphabetical list
// for, say, "Poland" gets tedious past that. Same value/onChange(code) contract as a
// native select so it drops into any existing `<select value={x} onChange={...}>` call
// site with the props swapped, not a UI rewrite.
import React, { useState, useRef, useEffect, useId } from 'react';
import './CountrySelect.css';

const CountrySelect = ({ countries, value, onChange, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useId();

  const selected = countries.find(c => c.code === value);

  const filtered = query.trim()
    ? countries.filter(c =>
        c.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        c.currency.toLowerCase().includes(query.trim().toLowerCase())
      )
    : countries;

  // Closing on blur would fire before a click on an option registers -- use mousedown
  // outside the whole wrapper instead, which reliably fires after an option's own
  // onMouseDown-driven select (see the option button below).
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const openList = () => {
    setQuery('');
    setHighlightIdx(Math.max(0, filtered.findIndex(c => c.code === value)));
    setOpen(true);
  };

  const selectCountry = (code) => {
    onChange(code);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') { openList(); e.preventDefault(); }
      return;
    }
    if (e.key === 'ArrowDown') { setHighlightIdx(i => Math.min(filtered.length - 1, i + 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setHighlightIdx(i => Math.max(0, i - 1)); e.preventDefault(); }
    else if (e.key === 'Enter') { if (filtered[highlightIdx]) selectCountry(filtered[highlightIdx].code); e.preventDefault(); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(''); e.preventDefault(); }
  };

  return (
    <div className="country-select" ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        className="country-select-input"
        value={open ? query : (selected?.name ?? '')}
        placeholder={selected?.name}
        onFocus={openList}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlightIdx(0); }}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <ul className="country-select-list" role="listbox" id={listboxId}>
          {filtered.length === 0 && <li className="country-select-empty">No matching country</li>}
          {filtered.map((c, i) => (
            <li key={c.code} role="option" aria-selected={c.code === value}>
              <button
                type="button"
                className={`country-select-option ${i === highlightIdx ? 'highlighted' : ''} ${c.code === value ? 'selected' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); selectCountry(c.code); }}
                onMouseEnter={() => setHighlightIdx(i)}
              >
                <span>{c.name}</span>
                <span className="country-select-currency">{c.currency}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CountrySelect;
