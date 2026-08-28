// src/components/GrowthChart.jsx
// A small dependency-free inline-SVG line chart: Balance vs. Real Value (today's
// money) over time. Two series, fixed hue order, hover crosshair + tooltip, and a
// legend -- see the dataviz skill's mark specs. The existing yearly data table
// elsewhere on the page is this chart's "table view" fallback, so every value here
// is already reachable without hovering.
import React, { useState, useRef, useMemo } from 'react';
import './GrowthChart.css';

const WIDTH = 640;
const HEIGHT = 280;
const PAD_LEFT = 60;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 30;

// Round a max value up to a "nice" number so axis ticks land on clean figures
// (0 / 1,000 / 2,000, never 0 / 1,247 / 2,494).
const niceCeil = (value) => {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let niceNormalized;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 2.5) niceNormalized = 2.5;
  else if (normalized <= 5) niceNormalized = 5;
  else niceNormalized = 10;
  return niceNormalized * magnitude;
};

const formatCompact = (value) => {
  const abs = Math.abs(value);
  if (abs >= 1000000) return (value / 1000000).toFixed(abs >= 10000000 ? 0 : 1) + 'M';
  if (abs >= 1000) return (value / 1000).toFixed(abs >= 10000 ? 0 : 1) + 'K';
  return Math.round(value).toString();
};

const GrowthChart = ({ yearlyData, initial = 0, symbol = '' }) => {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  // Prepend a year-0 starting point (the initial deposit) so the lines visibly
  // start from where the plan begins, not from year 1's balance.
  const points = useMemo(() => {
    const base = yearlyData.map(d => ({ year: d.year, balance: d.balance, realValue: d.realValue }));
    return [{ year: 0, balance: initial, realValue: initial }, ...base];
  }, [yearlyData, initial]);

  if (points.length < 2) return null;

  const minYear = points[0].year;
  const maxYear = points[points.length - 1].year;
  const rawMax = Math.max(...points.map(p => Math.max(p.balance, p.realValue)));
  const maxVal = niceCeil(rawMax * 1.05 || 1);
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (maxVal / tickCount) * i);

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xScale = (year) => PAD_LEFT + (maxYear === minYear ? 0 : ((year - minYear) / (maxYear - minYear)) * plotW);
  const yScale = (val) => PAD_TOP + plotH - (val / maxVal) * plotH;

  const linePath = (key) => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.year).toFixed(2)} ${yScale(p[key]).toFixed(2)}`).join(' ');

  // Show at most ~7 year labels on the x-axis so they never crowd together.
  const xLabelStep = Math.max(1, Math.ceil(points.length / 7));
  const xLabels = points.filter((_, i) => i % xLabelStep === 0 || i === points.length - 1);

  const updateHoverFromClientX = (clientX) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * WIDTH;
    const year = minYear + ((relX - PAD_LEFT) / plotW) * (maxYear - minYear);
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.year - year);
      if (dist < nearestDist) { nearestDist = dist; nearest = i; }
    });
    setHoverIdx(nearest);
  };

  const handlePointerMove = (e) => updateHoverFromClientX(e.clientX);
  const handlePointerLeave = () => setHoverIdx(null);

  const handleKeyDown = (e) => {
    if (hoverIdx === null) { setHoverIdx(points.length - 1); return; }
    if (e.key === 'ArrowLeft') { setHoverIdx(Math.max(0, hoverIdx - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { setHoverIdx(Math.min(points.length - 1, hoverIdx + 1)); e.preventDefault(); }
    else if (e.key === 'Escape') { setHoverIdx(null); }
  };

  const hover = hoverIdx !== null ? points[hoverIdx] : null;
  // Keep the tooltip box inside the chart -- flip to the left of the crosshair once
  // the point is past the chart's midline so it never runs off the right edge.
  const tooltipFlip = hover ? xScale(hover.year) > PAD_LEFT + plotW / 2 : false;

  return (
    <div className="growth-chart">
      <div className="growth-chart-legend">
        <span className="growth-chart-legend-item"><span className="growth-chart-swatch balance" />Balance</span>
        <span className="growth-chart-legend-item"><span className="growth-chart-swatch real" />Real Value (today's money)</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="growth-chart-svg"
        role="img"
        aria-label="Balance and real value projected over time"
        tabIndex={0}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        onBlur={handlePointerLeave}
      >
        {/* Gridlines + y-axis labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={yScale(t)} y2={yScale(t)} className="growth-chart-gridline" />
            <text x={PAD_LEFT - 8} y={yScale(t)} className="growth-chart-axis-label" textAnchor="end" dominantBaseline="middle">
              {symbol}{formatCompact(t)}
            </text>
          </g>
        ))}

        {/* X-axis year labels */}
        {xLabels.map((p) => (
          <text key={p.year} x={xScale(p.year)} y={HEIGHT - PAD_BOTTOM + 18} className="growth-chart-axis-label" textAnchor="middle">
            Yr {p.year}
          </text>
        ))}

        {/* Lines */}
        <path d={linePath('realValue')} className="growth-chart-line real" fill="none" />
        <path d={linePath('balance')} className="growth-chart-line balance" fill="none" />

        {/* End markers + direct end-labels */}
        <circle cx={xScale(points[points.length - 1].year)} cy={yScale(points[points.length - 1].realValue)} r="4" className="growth-chart-endpoint real" />
        <circle cx={xScale(points[points.length - 1].year)} cy={yScale(points[points.length - 1].balance)} r="4" className="growth-chart-endpoint balance" />

        {/* Crosshair + hover markers */}
        {hover && (
          <g>
            <line x1={xScale(hover.year)} x2={xScale(hover.year)} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} className="growth-chart-crosshair" />
            <circle cx={xScale(hover.year)} cy={yScale(hover.balance)} r="4" className="growth-chart-endpoint balance" />
            <circle cx={xScale(hover.year)} cy={yScale(hover.realValue)} r="4" className="growth-chart-endpoint real" />
          </g>
        )}
      </svg>

      {hover && (
        <div
          className="growth-chart-tooltip"
          style={{
            left: `${(xScale(hover.year) / WIDTH) * 100}%`,
            transform: tooltipFlip ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="growth-chart-tooltip-year">Year {hover.year}</div>
          <div className="growth-chart-tooltip-row"><span className="growth-chart-key balance" />Balance <strong>{symbol}{Math.round(hover.balance).toLocaleString()}</strong></div>
          <div className="growth-chart-tooltip-row"><span className="growth-chart-key real" />Real Value <strong>{symbol}{Math.round(hover.realValue).toLocaleString()}</strong></div>
        </div>
      )}
    </div>
  );
};

export default GrowthChart;
