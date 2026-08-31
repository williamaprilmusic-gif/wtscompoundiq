// src/components/SubTabs.jsx
// Small reusable pill-style sub-navigation for a top-level tab that bundles several
// distinct tools/sections onto one page (Power Tools' calculators, Net Worth's
// tracker/allocation/forecast/FX stress test) -- lets each section get its own
// focused view instead of one long scroll, without needing a whole new top-level tab
// (and the tier-gating/nav-wiring that would come with one) for each.
import React from 'react';
import './SubTabs.css';

// tabs: [{ key, label }]
const SubTabs = ({ tabs, active, onChange, ariaLabel }) => (
  <div className="sub-tabs" role="tablist" aria-label={ariaLabel}>
    {tabs.map(t => (
      <button
        key={t.key}
        type="button"
        role="tab"
        aria-selected={active === t.key}
        className={`sub-tab-btn ${active === t.key ? 'active' : ''}`}
        onClick={() => onChange(t.key)}
      >
        {t.label}
      </button>
    ))}
  </div>
);

export default SubTabs;
