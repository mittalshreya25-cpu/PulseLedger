import React, { useState } from "react";
import { formatINR } from "../utils/format";

export interface PercentilePoint {
  day: number;
  date: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

interface FanChartProps {
  data: PercentilePoint[];
  bufferPaise?: number;
  height?: number;
}

// Compact, elegant currency formatter for chart axis ticks
function formatAxisINR(paise: number): string {
  const inr = Math.round(paise / 100);
  if (Math.abs(inr) >= 10000000) {
    return `₹${(inr / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
  }
  if (Math.abs(inr) >= 100000) {
    return `₹${(inr / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  }
  if (Math.abs(inr) >= 1000) {
    return `₹${(inr / 1000).toFixed(0)}k`;
  }
  return `₹${inr.toLocaleString("en-IN")}`;
}

// Generates smooth cubic Bézier SVG path through a series of (x, y) coordinates
function createSmoothCurve(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export const FanChart: React.FC<FanChartProps> = ({
  data,
  bufferPaise = 20000,
  height = 280,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--slate)",
          fontSize: "0.85rem",
        }}
      >
        No simulation trajectory data available
      </div>
    );
  }

  // Generous 800px viewBox with 85px left padding to comfortably fit currency labels
  const width = 800;
  const padding = { top: 25, right: 35, bottom: 42, left: 85 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Determine dynamic bounds across all percentile points and buffer
  const allValues = data.flatMap((d) => [d.p10, d.p25, d.p50, d.p75, d.p90, bufferPaise]);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const span = Math.max(100000, dataMax - dataMin);
  const minVal = Math.max(0, dataMin - span * 0.08);
  const maxVal = dataMax + span * 0.12;

  const scaleX = (index: number) => {
    if (data.length <= 1) return padding.left;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const scaleY = (val: number) => {
    if (maxVal === minVal) return padding.top + chartHeight / 2;
    const ratio = (val - minVal) / (maxVal - minVal);
    return padding.top + chartHeight * (1 - ratio);
  };

  // Coordinates for smooth curve paths
  const ptsP90 = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.p90) }));
  const ptsP75 = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.p75) }));
  const ptsP50 = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.p50) }));
  const ptsP25 = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.p25) }));
  const ptsP10 = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.p10) }));

  // Outer fan polygon: P90 curve forward, then P10 curve backwards
  const curveP90 = createSmoothCurve(ptsP90);
  const curveP10Rev = createSmoothCurve(ptsP10.slice().reverse());
  const pathOuterFan = `${curveP90} L ${curveP10Rev.slice(1)} Z`;

  // Inner fan polygon: P75 curve forward, then P25 curve backwards
  const curveP75 = createSmoothCurve(ptsP75);
  const curveP25Rev = createSmoothCurve(ptsP25.slice().reverse());
  const pathInnerFan = `${curveP75} L ${curveP25Rev.slice(1)} Z`;

  const pathP50 = createSmoothCurve(ptsP50);
  const pathP90Line = createSmoothCurve(ptsP90);
  const pathP10Line = createSmoothCurve(ptsP10);

  const bufferY = scaleY(bufferPaise);
  const zeroY = scaleY(0);

  // 4 horizontal gridlines
  const gridTicks = [0, 0.33, 0.66, 1.0].map((t) => {
    const val = minVal + t * (maxVal - minVal);
    return { val, y: scaleY(val) };
  });

  const activePoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length ? data[hoverIndex] : null;

  return (
    <div style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          {/* Luminous fan gradients with explicit RGBA stops for 100% browser compatibility */}
          <linearGradient id="mcFanOuterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8EB69B" stopOpacity="0.30" />
            <stop offset="50%" stopColor="#4A7C59" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#163832" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id="mcFanInnerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8EB69B" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#235347" stopOpacity="0.25" />
          </linearGradient>

          <filter id="p50Glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#8EB69B" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Horizontal Background Gridlines & Y-Axis Labels */}
        {gridTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke="rgba(218, 241, 222, 0.08)"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text
              x={padding.left - 12}
              y={tick.y + 3}
              fill="var(--slate)"
              fontSize="11"
              fontFamily="var(--font-mono, monospace)"
              fontWeight="500"
              textAnchor="end"
            >
              {formatAxisINR(tick.val)}
            </text>
          </g>
        ))}

        {/* Zero baseline (if within visible range) */}
        {zeroY >= padding.top && zeroY <= padding.top + chartHeight && (
          <g>
            <line
              x1={padding.left}
              y1={zeroY}
              x2={width - padding.right}
              y2={zeroY}
              stroke="#E63946"
              strokeDasharray="4 4"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />
            <text
              x={width - padding.right}
              y={zeroY - 4}
              fill="#E63946"
              fontSize="9"
              textAnchor="end"
              opacity="0.8"
            >
              ₹0 Shortfall Floor
            </text>
          </g>
        )}

        {/* Emergency Buffer line */}
        {bufferY >= padding.top && bufferY <= padding.top + chartHeight && (
          <g>
            <line
              x1={padding.left}
              y1={bufferY}
              x2={width - padding.right}
              y2={bufferY}
              stroke="#F39C12"
              strokeDasharray="3 3"
              strokeWidth="1.2"
              strokeOpacity="0.85"
            />
            <text
              x={width - padding.right}
              y={bufferY - 4}
              fill="#F39C12"
              fontSize="10"
              fontFamily="var(--font-ui)"
              fontWeight="600"
              textAnchor="end"
            >
              Safety Buffer ({formatAxisINR(bufferPaise)})
            </text>
          </g>
        )}

        {/* Outer Fan: 90% Confidence Band (P10–P90) */}
        <path d={pathOuterFan} fill="url(#mcFanOuterGrad)" />
        <path d={pathP90Line} fill="none" stroke="#8EB69B" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.45" />
        <path d={pathP10Line} fill="none" stroke="#8EB69B" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.45" />

        {/* Inner Fan: 50% Confidence Core (P25–P75) */}
        <path d={pathInnerFan} fill="url(#mcFanInnerGrad)" />

        {/* Central Expected Trajectory: P50 Median */}
        <path
          d={pathP50}
          fill="none"
          stroke="#DAF1DE"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#p50Glow)"
        />

        {/* Interactive Mouse Hover Targets */}
        {data.map((_, i) => {
          const cx = scaleX(i);
          const colWidth = chartWidth / Math.max(1, data.length - 1);
          return (
            <rect
              key={i}
              x={cx - colWidth / 2}
              y={padding.top}
              width={colWidth}
              height={chartHeight}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoverIndex(i)}
            />
          );
        })}

        {/* Active Hover Crosshair & Anchor Circle */}
        {hoverIndex !== null && (
          <g>
            <line
              x1={scaleX(hoverIndex)}
              y1={padding.top}
              x2={scaleX(hoverIndex)}
              y2={padding.top + chartHeight}
              stroke="#DAF1DE"
              strokeOpacity="0.45"
              strokeDasharray="2 2"
              strokeWidth="1.2"
            />
            <circle
              cx={scaleX(hoverIndex)}
              cy={scaleY(data[hoverIndex].p50)}
              r="5"
              fill="#0B2B26"
              stroke="#DAF1DE"
              strokeWidth="2.5"
            />
          </g>
        )}

        {/* X-Axis Milestone Labels (Months / Days) */}
        {data.map((d, i) => {
          // Display labels at Month 0 (Today), Month 3, Month 6, Month 9, and Month 12
          const isKeyMilestone =
            i === 0 ||
            i === Math.floor(data.length * 0.25) ||
            i === Math.floor(data.length * 0.5) ||
            i === Math.floor(data.length * 0.75) ||
            i === data.length - 1;

          if (!isKeyMilestone) return null;

          let label = `Day ${d.day}`;
          if (i === 0) label = "Today";
          else if (i === data.length - 1) label = "Day 365 (1 Yr)";
          else if (d.date) {
            const parts = d.date.split("-");
            if (parts.length >= 2) {
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const mIdx = parseInt(parts[1], 10) - 1;
              label = `${monthNames[mIdx]} '${parts[0].slice(2)}`;
            }
          }

          const anchor = i === 0 ? "start" : i === data.length - 1 ? "end" : "middle";

          return (
            <text
              key={i}
              x={scaleX(i)}
              y={height - 12}
              fill="var(--slate)"
              fontSize="11"
              fontFamily="var(--font-ui)"
              fontWeight="500"
              textAnchor={anchor}
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Floating Precision Hover Card */}
      {activePoint && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(11, 43, 38, 0.95)",
            border: "1px solid rgba(218, 241, 222, 0.25)",
            color: "#DAF1DE",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            pointerEvents: "none",
            backdropFilter: "blur(10px)",
            lineHeight: 1.5,
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#DAF1DE",
              borderBottom: "1px solid rgba(218, 241, 222, 0.15)",
              paddingBottom: "4px",
              marginBottom: "6px",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span>Timeline: Day {activePoint.day}</span>
            <span style={{ color: "var(--slate)", fontWeight: 500 }}>{activePoint.date}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span style={{ color: "#8EB69B" }}>P90 (Optimistic):</span>
            <strong>{formatINR(activePoint.p90)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span style={{ color: "#DAF1DE" }}>P50 (Expected):</span>
            <strong style={{ color: "#DAF1DE" }}>{formatINR(activePoint.p50)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span style={{ color: "rgba(218, 241, 222, 0.7)" }}>P10 (Conservative):</span>
            <strong>{formatINR(activePoint.p10)}</strong>
          </div>
          <div
            style={{
              marginTop: "4px",
              paddingTop: "4px",
              borderTop: "1px dashed rgba(218, 241, 222, 0.15)",
              fontSize: "11px",
              color: "#F39C12",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Buffer Cushion:</span>
            <span>+{formatINR(Math.max(0, activePoint.p50 - bufferPaise))}</span>
          </div>
        </div>
      )}

      {/* Visual Legend Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "18px",
          marginTop: "8px",
          fontSize: "11px",
          color: "var(--slate)",
          padding: "4px 0",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: 14,
              height: 10,
              background: "rgba(142, 182, 155, 0.22)",
              border: "1px dashed #8EB69B",
              borderRadius: 2,
            }}
          />
          P10–P90 (90% Conf. Cone)
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: 14,
              height: 10,
              background: "rgba(142, 182, 155, 0.45)",
              borderRadius: 2,
            }}
          />
          P25–P75 (50% Core)
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: 16,
              height: 3,
              background: "#DAF1DE",
              borderRadius: 2,
              boxShadow: "0 0 4px #8EB69B",
            }}
          />
          P50 Expected Median
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 14, height: 1, borderTop: "2px dashed #F39C12" }} />
          Emergency Reserve Floor
        </span>
      </div>
    </div>
  );
};
