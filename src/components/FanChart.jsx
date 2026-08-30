// src/components/FanChart.jsx
// Monte Carlo "fan" chart: p10-p90 and p25-p75 uncertainty bands plus the median path,
// year by year -- so the spread of outcomes is visible over time, not just as a single
// final-balance distribution. Same mark language as GrowthChart (2px line, hairline
// recessive gridlines, hover crosshair) with the uncertainty band as a ~10-16% wash
// per the dataviz skill's area-fill spec.
import React, { useState, useRef } from 'react';
import './FanChart.css';
import { niceCeil, formatCompact } from '../utils/chartFormat';

const WIDTH = 640;
const HEIGHT = 280;
const PAD_LEFT = 60;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 30;

const FanChart = ({ yearlyPercentiles, symbol = '' }) => {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!yearlyPercentiles || yearlyPercentiles.length < 2) return null;

  const minYear = yearlyPercentiles[0].year;
  const maxYear = yearlyPercentiles[yearlyPercentiles.length - 1].year;
  const rawMax = Math.max(...yearlyPercentiles.map(p => p.p90));
  const maxVal = niceCeil(rawMax * 1.05 || 1);
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (maxVal / tickCount) * i);

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xScale = (year) => PAD_LEFT + (maxYear === minYear ? 0 : ((year - minYear) / (maxYear - minYear)) * plotW);
  const yScale = (val) => PAD_TOP + plotH - (Math.max(val, 0) / maxVal) * plotH;

  const bandPath = (topKey, bottomKey) => {
    const top = yearlyPercentiles.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.year).toFixed(2)} ${yScale(p[topKey]).toFixed(2)}`).join(' ');
    const bottom = [...yearlyPercentiles].reverse().map(p => `L ${xScale(p.year).toFixed(2)} ${yScale(p[bottomKey]).toFixed(2)}`).join(' ');
    return `${top} ${bottom} Z`;
  };
  const linePath = (key) => yearlyPercentiles.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.year).toFixed(2)} ${yScale(p[key]).toFixed(2)}`).join(' ');

  const xLabelStep = Math.max(1, Math.ceil(yearlyPercentiles.length / 7));
  const xLabels = yearlyPercentiles.filter((_, i) => i % xLabelStep === 0 || i === yearlyPercentiles.length - 1);

  const updateHoverFromClientX = (clientX) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * WIDTH;
    const year = minYear + ((relX - PAD_LEFT) / plotW) * (maxYear - minYear);
    let nearest = 0;
    let nearestDist = Infinity;
    yearlyPercentiles.forEach((p, i) => {
      const dist = Math.abs(p.year - year);
      if (dist < nearestDist) { nearestDist = dist; nearest = i; }
    });
    setHoverIdx(nearest);
  };

  const handlePointerMove = (e) => updateHoverFromClientX(e.clientX);
  const handlePointerLeave = () => setHoverIdx(null);
  const handleKeyDown = (e) => {
    if (hoverIdx === null) { setHoverIdx(yearlyPercentiles.length - 1); return; }
    if (e.key === 'ArrowLeft') { setHoverIdx(Math.max(0, hoverIdx - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { setHoverIdx(Math.min(yearlyPercentiles.length - 1, hoverIdx + 1)); e.preventDefault(); }
    else if (e.key === 'Escape') { setHoverIdx(null); }
  };

  const hover = hoverIdx !== null ? yearlyPercentiles[hoverIdx] : null;
  const tooltipFlip = hover ? xScale(hover.year) > PAD_LEFT + plotW / 2 : false;

  return (
    <div className="fan-chart">
      <div className="fan-chart-legend">
        <span className="fan-chart-legend-item"><span className="fan-chart-swatch median" />Median (50th)</span>
        <span className="fan-chart-legend-item"><span className="fan-chart-swatch band-inner" />25th-75th percentile</span>
        <span className="fan-chart-legend-item"><span className="fan-chart-swatch band-outer" />10th-90th percentile</span>
      </div>

      {/* Same fix as GrowthChart -- scroll instead of shrinking the SVG's text past legibility. */}
      <div className="fan-chart-scroll">
      <div className="fan-chart-inner">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="fan-chart-svg"
        role="img"
        aria-label="Projected balance range over time across simulated market paths"
        tabIndex={0}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        onBlur={handlePointerLeave}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={yScale(t)} y2={yScale(t)} className="fan-chart-gridline" />
            <text x={PAD_LEFT - 8} y={yScale(t)} className="fan-chart-axis-label" textAnchor="end" dominantBaseline="middle">
              {symbol}{formatCompact(t)}
            </text>
          </g>
        ))}

        {xLabels.map((p) => (
          <text key={p.year} x={xScale(p.year)} y={HEIGHT - PAD_BOTTOM + 18} className="fan-chart-axis-label" textAnchor="middle">
            Yr {p.year}
          </text>
        ))}

        <path d={bandPath('p90', 'p10')} className="fan-chart-band outer" />
        <path d={bandPath('p75', 'p25')} className="fan-chart-band inner" />
        <path d={linePath('p50')} className="fan-chart-median" fill="none" />

        {hover && (
          <g>
            <line x1={xScale(hover.year)} x2={xScale(hover.year)} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} className="fan-chart-crosshair" />
            <circle cx={xScale(hover.year)} cy={yScale(hover.p50)} r="4" className="fan-chart-endpoint" />
          </g>
        )}
      </svg>

      {hover && (
        <div className="fan-chart-tooltip" style={{ left: `${(xScale(hover.year) / WIDTH) * 100}%`, transform: tooltipFlip ? 'translateX(-100%)' : 'none' }}>
          <div className="fan-chart-tooltip-year">Year {hover.year}</div>
          <div className="fan-chart-tooltip-row">90th <strong>{symbol}{Math.round(hover.p90).toLocaleString()}</strong></div>
          <div className="fan-chart-tooltip-row">75th <strong>{symbol}{Math.round(hover.p75).toLocaleString()}</strong></div>
          <div className="fan-chart-tooltip-row median">Median <strong>{symbol}{Math.round(hover.p50).toLocaleString()}</strong></div>
          <div className="fan-chart-tooltip-row">25th <strong>{symbol}{Math.round(hover.p25).toLocaleString()}</strong></div>
          <div className="fan-chart-tooltip-row">10th <strong>{symbol}{Math.round(hover.p10).toLocaleString()}</strong></div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
};

export default FanChart;
