// src/components/AllocationChart.jsx
// A small dependency-free inline-SVG donut chart for Net Worth's asset/debt category
// breakdown -- built as a multi-segment ring using stroke-dasharray/stroke-dashoffset
// on stacked circles, the same technique HealthScoreGauge.jsx uses for its single-value
// ring, generalized to N segments. Categorical colors are assigned by category identity
// (colorVar on each segment), never cycled -- see the dataviz skill.
import React, { useState } from 'react';
import './AllocationChart.css';

const SIZE = 160;
const STROKE = 28;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// segments: [{ key, label, value, colorVar }] -- value must be >= 0; segments with a
// value of 0 are dropped before rendering (an empty slice has nothing to show or hover).
// symbol: currency symbol for the legend's amount column.
const AllocationChart = ({ segments, symbol = '' }) => {
  const [hoverKey, setHoverKey] = useState(null);
  const real = segments.filter(s => s.value > 0);
  const total = real.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  let cumulative = 0;
  const arcs = real.map(s => {
    const frac = s.value / total;
    const len = frac * CIRCUMFERENCE;
    const arc = { ...s, frac, dasharray: `${len} ${CIRCUMFERENCE - len}`, dashoffset: -cumulative };
    cumulative += len;
    return arc;
  });

  const dominant = real.reduce((max, s) => (s.value > max.value ? s : max), real[0]);
  const ariaLabel = `Allocation breakdown: ${real.map(s => `${s.label} ${Math.round(s.value / total * 100)}%`).join(', ')}`;

  return (
    <div className="alloc-chart">
      <div className="alloc-chart-ring-wrap">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={ariaLabel}>
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {arcs.map(arc => (
              <circle
                key={arc.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={hoverKey === arc.key ? STROKE + 4 : STROKE}
                style={{ stroke: `var(${arc.colorVar})`, strokeDasharray: arc.dasharray, strokeDashoffset: arc.dashoffset, transition: 'stroke-width 0.15s ease' }}
                onMouseEnter={() => setHoverKey(arc.key)}
                onMouseLeave={() => setHoverKey(null)}
                onFocus={() => setHoverKey(arc.key)}
                onBlur={() => setHoverKey(null)}
                tabIndex={0}
                role="img"
                aria-label={`${arc.label}: ${symbol}${Math.round(arc.value).toLocaleString()}, ${Math.round(arc.frac * 100)}%`}
              />
            ))}
          </g>
        </svg>
        <div className="alloc-chart-center">
          {hoverKey ? (
            <>
              <strong>{Math.round((arcs.find(a => a.key === hoverKey)?.frac || 0) * 100)}%</strong>
              <span>{arcs.find(a => a.key === hoverKey)?.label}</span>
            </>
          ) : (
            <>
              <strong>{symbol}{total >= 1000000 ? `${(total / 1000000).toFixed(1)}M` : Math.round(total).toLocaleString()}</strong>
              <span>Total</span>
            </>
          )}
        </div>
      </div>
      <ul className="alloc-chart-legend">
        {arcs.map(arc => (
          <li key={arc.key} className={hoverKey === arc.key ? 'hover' : ''} onMouseEnter={() => setHoverKey(arc.key)} onMouseLeave={() => setHoverKey(null)}>
            <span className="alloc-chart-swatch" style={{ background: `var(${arc.colorVar})` }} />
            <span className="alloc-chart-legend-label">{arc.label}</span>
            <span className="alloc-chart-legend-value">{symbol}{Math.round(arc.value).toLocaleString()} ({Math.round(arc.frac * 100)}%)</span>
          </li>
        ))}
      </ul>
      {dominant && dominant.value / total > 0.5 && (
        <p className="alloc-chart-note">
          {Math.round((dominant.value / total) * 100)}% of this is in {dominant.label} -- worth thinking about whether that's concentrated more than you'd like.
        </p>
      )}
    </div>
  );
};

export default AllocationChart;
