// src/components/SubTabs.jsx
// Small reusable pill-style sub-navigation for a top-level tab that bundles several
// distinct tools/sections onto one page (Power Tools' calculators, Net Worth's
// tracker/allocation/forecast/FX stress test) -- lets each section get its own
// focused view instead of one long scroll, without needing a whole new top-level tab
// (and the tier-gating/nav-wiring that would come with one) for each.
import React from 'react';
import './SubTabs.css';

// tabs: [{ key, label }]
// groups (optional): [{ label, keys: [key, ...] }] -- when passed, the pills are
// rendered under small category headers in the given order instead of one flat row.
// Any tab not named in a group falls into a trailing unlabelled catch-all so nothing
// silently disappears if the two lists drift.
// lockedKeys (optional): a Set of tab keys the current user can't open -- rendered with
// a padlock and, on click, calls onLockedClick(key) instead of onChange (e.g. to open
// a pricing modal) so the pill still advertises the tool without switching to it.
const SubTabs = ({ tabs, active, onChange, ariaLabel, groups, lockedKeys, onLockedClick }) => {
  const isLocked = (key) => !!(lockedKeys && lockedKeys.has && lockedKeys.has(key));
  const Pill = (t) => {
    const locked = isLocked(t.key);
    return (
      <button
        key={t.key}
        type="button"
        role="tab"
        aria-selected={active === t.key}
        title={locked ? 'Included with Ultra — tap to see pricing' : undefined}
        className={`sub-tab-btn ${active === t.key ? 'active' : ''} ${locked ? 'locked' : ''}`}
        onClick={() => (locked ? onLockedClick && onLockedClick(t.key) : onChange(t.key))}
      >
        {t.label}{locked && <span className="sub-tab-lock" aria-label="locked"> 🔒</span>}
      </button>
    );
  };

  if (!groups || !groups.length) {
    return (
      <div className="sub-tabs" role="tablist" aria-label={ariaLabel}>
        {tabs.map(Pill)}
      </div>
    );
  }

  const byKey = new Map(tabs.map(t => [t.key, t]));
  const grouped = new Set(groups.flatMap(g => g.keys));
  const leftovers = tabs.filter(t => !grouped.has(t.key));

  return (
    <div className="sub-tabs-grouped" role="tablist" aria-label={ariaLabel}>
      {groups.map(g => (
        <div className="sub-tab-group" key={g.label}>
          <span className="sub-tab-group-label">{g.label}</span>
          <div className="sub-tabs">
            {g.keys.map(k => byKey.get(k)).filter(Boolean).map(Pill)}
          </div>
        </div>
      ))}
      {leftovers.length > 0 && (
        <div className="sub-tab-group">
          <span className="sub-tab-group-label">More</span>
          <div className="sub-tabs">{leftovers.map(Pill)}</div>
        </div>
      )}
    </div>
  );
};

export default SubTabs;
