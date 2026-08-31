// src/components/HealthScoreGauge.jsx
// A small dependency-free inline-SVG ring gauge for Dashboard's Financial Health Score
// -- a single headline number, so a stat-tile-style gauge rather than a full chart (see
// the dataviz skill: "is it even a chart?"). Color follows the score's own grade band,
// not an arbitrary series hue, since there's only ever one thing being shown.
import React from 'react';
import './HealthScoreGauge.css';

const SIZE = 140;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// A/B read as healthy (green), C as caution (yellow), D/F as needs-attention (red) --
// the same three-tier semantics as the rest of the app's status colors (e.g. Debt
// Payoff's verdict tones), not a new palette invented just for this gauge.
const GRADE_COLOR_VAR = { A: '--accent-green', B: '--accent-green', C: '--accent-yellow', D: '--accent-red', F: '--accent-red' };

const HealthScoreGauge = ({ score, grade, label, components }) => {
  const pct = Math.max(0, Math.min(100, score));
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);
  const colorVar = GRADE_COLOR_VAR[grade] || '--accent';

  return (
    <div className="health-gauge">
      <div className="health-gauge-ring-wrap">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Financial health score: ${score} out of 100, grade ${grade} (${label})`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} className="health-gauge-track" strokeWidth={STROKE} fill="none" />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            style={{ stroke: `var(${colorVar})`, strokeDasharray: CIRCUMFERENCE, strokeDashoffset: dashOffset }}
            className="health-gauge-arc"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <div className="health-gauge-center">
          <strong>{score}</strong>
          <span>/100</span>
        </div>
      </div>
      <div className="health-gauge-details">
        <div className="health-gauge-grade" style={{ color: `var(${colorVar})` }}>
          Grade {grade} -- {label}
        </div>
        <ul className="health-gauge-components">
          {components.map(c => (
            <li key={c.key}>
              <span>{c.label}</span>
              <span className="health-gauge-component-score">{c.score}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HealthScoreGauge;
