// src/components/NetWorthHistoryChart.jsx
// A small dependency-free inline-SVG line chart for the Net Worth tab's saved
// snapshot history -- same approach as GrowthChart.jsx (hover crosshair + tooltip,
// keyboard support, horizontally-scrollable on narrow screens) but for a single
// series indexed by snapshot date instead of by year. The plain list below this
// chart is still rendered underneath, so every value here stays reachable without
// hovering -- this is a visual summary on top of that list, not a replacement for it.
import React, { useState, useRef, useMemo } from 'react';
import './NetWorthHistoryChart.css';
import { niceCeil, niceFloor, formatCompact } from '../utils/chartFormat';

const WIDTH = 640;
const HEIGHT = 200;
const PAD_LEFT = 60;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 26;

// history entries are already converted to the display currency by the caller (see
// NetWorth.jsx's convertAmount usage) -- this component just plots numbers.
const NetWorthHistoryChart = ({ history, symbol = '' }) => {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  const points = useMemo(() => history.map(h => ({ date: h.date, value: h.netWorth })), [history]);

  if (points.length < 2) return null;

  const rawMax = Math.max(...points.map(p => p.value));
  const rawMin = Math.min(0, ...points.map(p => p.value));
  const maxVal = niceCeil((rawMax || 1) * 1.05);
  const minVal = niceFloor(rawMin);
  const range = maxVal - minVal || 1;
  const tickCount = 3;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => minVal + (range / tickCount) * i);

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xScale = (i) => PAD_LEFT + (points.length === 1 ? 0 : (i / (points.length - 1)) * plotW);
  const yScale = (val) => PAD_TOP + plotH - ((val - minVal) / range) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(2)} ${yScale(p.value).toFixed(2)}`).join(' ');
  const zeroY = yScale(0);

  const xLabelStep = Math.max(1, Math.ceil(points.length / 6));
  const xLabels = points.map((p, i) => ({ ...p, i })).filter((_, i) => i % xLabelStep === 0 || i === points.length - 1);

  const updateHoverFromClientX = (clientX) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * WIDTH;
    const rawIdx = ((relX - PAD_LEFT) / plotW) * (points.length - 1);
    const nearest = Math.max(0, Math.min(points.length - 1, Math.round(rawIdx)));
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
  const tooltipFlip = hover ? xScale(hoverIdx) > PAD_LEFT + plotW / 2 : false;

  return (
    <div className="nw-chart">
      <div className="nw-chart-scroll">
        <div className="nw-chart-inner">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="nw-chart-svg"
            role="img"
            aria-label="Net worth over time"
            tabIndex={0}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onKeyDown={handleKeyDown}
            onBlur={handlePointerLeave}
          >
            {ticks.map((t, i) => (
              <g key={i}>
                <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={yScale(t)} y2={yScale(t)} className="nw-chart-gridline" />
                <text x={PAD_LEFT - 8} y={yScale(t)} className="nw-chart-axis-label" textAnchor="end" dominantBaseline="middle">
                  {symbol}{formatCompact(t)}
                </text>
              </g>
            ))}

            {minVal < 0 && <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={zeroY} y2={zeroY} className="nw-chart-zeroline" />}

            {xLabels.map((p) => (
              <text key={p.date} x={xScale(p.i)} y={HEIGHT - PAD_BOTTOM + 16} className="nw-chart-axis-label" textAnchor="middle">
                {new Date(p.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
              </text>
            ))}

            <path d={linePath} className="nw-chart-line" fill="none" />

            {points.map((p, i) => (
              <circle key={p.date} cx={xScale(i)} cy={yScale(p.value)} r={i === points.length - 1 ? 4 : 2.5} className="nw-chart-endpoint" />
            ))}

            {hover && (
              <g>
                <line x1={xScale(hoverIdx)} x2={xScale(hoverIdx)} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} className="nw-chart-crosshair" />
                <circle cx={xScale(hoverIdx)} cy={yScale(hover.value)} r="4" className="nw-chart-endpoint hover" />
              </g>
            )}
          </svg>

          {hover && (
            <div
              className="nw-chart-tooltip"
              style={{
                left: `${(xScale(hoverIdx) / WIDTH) * 100}%`,
                transform: tooltipFlip ? 'translateX(-100%)' : 'none'
              }}
            >
              <div className="nw-chart-tooltip-date">{new Date(hover.date).toLocaleDateString()}</div>
              <div className="nw-chart-tooltip-row">Net Worth <strong>{symbol}{Math.round(hover.value).toLocaleString()}</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetWorthHistoryChart;
