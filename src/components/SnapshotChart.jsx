// src/components/SnapshotChart.jsx
// A small dependency-free inline-SVG multi-line chart for the app's various
// "save a snapshot over time" features (Net Worth's assets/debts/net worth, Debt
// Payoff's total balance). Generalizes what was originally a Net Worth-only,
// single-series chart -- rather than copy-pasting a near-identical chart a second
// time for Debt Payoff's history, every snapshot-history chart in the app now
// shares this one component and the axis-formatting helpers in chartFormat.js.
import React, { useState, useRef, useMemo } from 'react';
import './SnapshotChart.css';
import { niceCeil, niceFloor, formatCompact } from '../utils/chartFormat';

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 60;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 26;

// Fixed hue order, assigned by what the series *means* (never cycled/generated) --
// see the dataviz skill. "assets"/"net" read as growth/headline, "debts"/"total"
// (a lone debt-balance series, e.g. Debt Payoff's history) read as the same
// semantic red used for debt everywhere else in the app. "standard"/"plan" are Loan
// Calculator's two-line balance-over-time comparison -- gray for the do-nothing
// baseline, the same green used for a faster/better outcome everywhere else.
const SERIES_COLOR_VAR = {
  assets: '--accent-green',
  net: '--accent',
  debts: '--accent-red',
  total: '--accent-red',
  standard: '--mut',
  plan: '--accent-green'
};

const defaultFormatXAxis = (x) => new Date(x).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
const defaultFormatXTooltip = (x) => new Date(x).toLocaleDateString();

// points: [{ [xKey]: date|year, [seriesKey]: number, ... }]
// series: [{ key, label }] -- key must match a field on each point and a color above
// xKey: which field on each point is the x-axis value (default 'date', an ISO string).
// formatXAxis/formatXTooltip: how to render that value on the axis vs. in the hover
// tooltip -- default to date formatting; Loan Calculator's balance-over-time chart
// passes xKey="year" with plain-number formatters instead.
// projectedPoints: optional -- same shape as `points`, continuing on from the last real
// point (Net Worth's forecast is the only current caller). Rendered as a dashed
// continuation of each series' line rather than a second solid line, so it reads as
// "where this is headed" rather than a second real trend. Every existing caller omits
// this (defaults to []), which collapses every branch below back to the exact prior
// behavior -- `hasProjection` is false, `allPoints` is just `safePoints`, and no new
// path/marker renders.
const SnapshotChart = ({ points, series, symbol = '', xKey = 'date', formatXAxis = defaultFormatXAxis, formatXTooltip = defaultFormatXTooltip, projectedPoints = [] }) => {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  const safePoints = useMemo(() => points.map(p => ({ ...p })), [points]);
  const safeProjected = useMemo(() => projectedPoints.map(p => ({ ...p })), [projectedPoints]);

  if (safePoints.length < 2) return null;

  const hasProjection = safeProjected.length > 0;
  // Everything below scales/positions/labels off allPoints instead of safePoints so the
  // projected tail gets room on the axis and is included in the min/max range -- when
  // there's no projection, allPoints IS safePoints (same array), so this is a no-op.
  const allPoints = hasProjection ? [...safePoints, ...safeProjected] : safePoints;

  const allValues = allPoints.flatMap(p => series.map(s => p[s.key]));
  const rawMax = Math.max(...allValues);
  const rawMin = Math.min(0, ...allValues);
  const maxVal = niceCeil((rawMax || 1) * 1.05);
  const minVal = niceFloor(rawMin);
  const range = maxVal - minVal || 1;
  const tickCount = 3;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => minVal + (range / tickCount) * i);

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xScale = (i) => PAD_LEFT + (allPoints.length === 1 ? 0 : (i / (allPoints.length - 1)) * plotW);
  const yScale = (val) => PAD_TOP + plotH - ((val - minVal) / range) * plotH;

  const linePath = (key) => safePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(2)} ${yScale(p[key]).toFixed(2)}`).join(' ');
  // Starts from the last real point so the dashed tail joins the solid line with no gap.
  const projectedLinePath = (key) => [safePoints[safePoints.length - 1], ...safeProjected]
    .map((p, j) => `${j === 0 ? 'M' : 'L'} ${xScale(safePoints.length - 1 + j).toFixed(2)} ${yScale(p[key]).toFixed(2)}`).join(' ');
  const zeroY = yScale(0);

  const xLabelStep = Math.max(1, Math.ceil(allPoints.length / 6));
  const xLabels = allPoints.map((p, i) => ({ ...p, i })).filter((_, i) => i % xLabelStep === 0 || i === allPoints.length - 1);

  const updateHoverFromClientX = (clientX) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * WIDTH;
    const rawIdx = ((relX - PAD_LEFT) / plotW) * (allPoints.length - 1);
    const nearest = Math.max(0, Math.min(allPoints.length - 1, Math.round(rawIdx)));
    setHoverIdx(nearest);
  };

  const handlePointerMove = (e) => updateHoverFromClientX(e.clientX);
  const handlePointerLeave = () => setHoverIdx(null);

  const handleKeyDown = (e) => {
    if (hoverIdx === null) { setHoverIdx(allPoints.length - 1); return; }
    if (e.key === 'ArrowLeft') { setHoverIdx(Math.max(0, hoverIdx - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { setHoverIdx(Math.min(allPoints.length - 1, hoverIdx + 1)); e.preventDefault(); }
    else if (e.key === 'Escape') { setHoverIdx(null); }
  };

  const hover = hoverIdx !== null ? allPoints[hoverIdx] : null;
  const hoverIsProjected = hasProjection && hoverIdx !== null && hoverIdx > safePoints.length - 1;
  const tooltipFlip = hover ? xScale(hoverIdx) > PAD_LEFT + plotW / 2 : false;
  const ariaLabel = `${series.map(s => s.label).join(', ')} over time${hasProjection ? ', including a projected continuation' : ''}`;

  return (
    <div className="snap-chart">
      {series.length > 1 && (
        <div className="snap-chart-legend">
          {series.map(s => (
            <span key={s.key} className="snap-chart-legend-item">
              <span className="snap-chart-swatch" style={{ background: `var(${SERIES_COLOR_VAR[s.key]})` }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div className="snap-chart-scroll">
        <div className="snap-chart-inner">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="snap-chart-svg"
            role="img"
            aria-label={ariaLabel}
            tabIndex={0}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onKeyDown={handleKeyDown}
            onBlur={handlePointerLeave}
          >
            {ticks.map((t, i) => (
              <g key={i}>
                <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={yScale(t)} y2={yScale(t)} className="snap-chart-gridline" />
                <text x={PAD_LEFT - 8} y={yScale(t)} className="snap-chart-axis-label" textAnchor="end" dominantBaseline="middle">
                  {symbol}{formatCompact(t)}
                </text>
              </g>
            ))}

            {minVal < 0 && <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={zeroY} y2={zeroY} className="snap-chart-zeroline" />}

            {hasProjection && (
              <g>
                <line x1={xScale(safePoints.length - 1)} x2={xScale(safePoints.length - 1)} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} className="snap-chart-today-line" />
                <text x={xScale(safePoints.length - 1)} y={PAD_TOP - 4} className="snap-chart-axis-label" textAnchor="middle">Today</text>
              </g>
            )}

            {xLabels.map((p) => (
              <text key={p[xKey]} x={xScale(p.i)} y={HEIGHT - PAD_BOTTOM + 16} className="snap-chart-axis-label" textAnchor="middle">
                {formatXAxis(p[xKey])}
              </text>
            ))}

            {series.map(s => (
              <path key={s.key} d={linePath(s.key)} className="snap-chart-line" style={{ stroke: `var(${SERIES_COLOR_VAR[s.key]})` }} fill="none" />
            ))}

            {hasProjection && series.map(s => (
              <path key={`projected-${s.key}`} d={projectedLinePath(s.key)} className="snap-chart-line-projected" style={{ stroke: `var(${SERIES_COLOR_VAR[s.key]})` }} fill="none" />
            ))}

            {hasProjection && series.map(s => (
              <circle
                key={`projected-end-${s.key}`}
                cx={xScale(allPoints.length - 1)}
                cy={yScale(safeProjected[safeProjected.length - 1][s.key])}
                r="3.5"
                className="snap-chart-endpoint-projected"
                style={{ stroke: `var(${SERIES_COLOR_VAR[s.key]})` }}
              />
            ))}

            {series.map(s => safePoints.map((p, i) => (
              <circle
                key={`${s.key}-${p[xKey]}`}
                cx={xScale(i)}
                cy={yScale(p[s.key])}
                r={i === safePoints.length - 1 ? 4 : 2.5}
                className="snap-chart-endpoint"
                style={{ fill: `var(${SERIES_COLOR_VAR[s.key]})` }}
              />
            )))}

            {hover && (
              <g>
                <line x1={xScale(hoverIdx)} x2={xScale(hoverIdx)} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} className="snap-chart-crosshair" />
                {series.map(s => (
                  <circle
                    key={`hover-${s.key}`}
                    cx={xScale(hoverIdx)}
                    cy={yScale(hover[s.key])}
                    r="4"
                    className="snap-chart-endpoint hover"
                    style={{ fill: `var(${SERIES_COLOR_VAR[s.key]})` }}
                  />
                ))}
              </g>
            )}
          </svg>

          {hover && (
            <div
              className="snap-chart-tooltip"
              style={{
                left: `${(xScale(hoverIdx) / WIDTH) * 100}%`,
                transform: tooltipFlip ? 'translateX(-100%)' : 'none'
              }}
            >
              <div className="snap-chart-tooltip-date">
                {formatXTooltip(hover[xKey])}
                {hoverIsProjected && <span className="snap-chart-tooltip-projected-tag"> (projected)</span>}
              </div>
              {series.map(s => (
                <div key={s.key} className="snap-chart-tooltip-row">
                  <span className="snap-chart-key" style={{ background: `var(${SERIES_COLOR_VAR[s.key]})` }} />
                  {s.label} <strong>{symbol}{Math.round(hover[s.key]).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SnapshotChart;
