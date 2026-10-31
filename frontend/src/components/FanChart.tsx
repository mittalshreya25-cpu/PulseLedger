import React, { useState } from "react";
import { formatINR } from "../utils/format";

interface PercentilePoint {
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

export const FanChart: React.FC<FanChartProps> = ({
  data,
  bufferPaise = 20000,
  height = 240,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--slate)" }}>
        No simulation data available
      </div>
    );
  }

  const width = 500;
  const padding = { top: 20, right: 30, bottom: 35, left: 65 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max across all points and buffer with dynamic responsive bounds
  const valuesOnly = data.flatMap((d) => [d.p10, d.p25, d.p50, d.p75, d.p90, bufferPaise]);
  const dataMin = Math.min(...valuesOnly);
  const dataMax = Math.max(...valuesOnly);
  const rangeSpan = Math.max(100000, dataMax - dataMin);
  const minVal = Math.max(0, dataMin - rangeSpan * 0.1);
  const maxVal = dataMax + rangeSpan * 0.15;

  const scaleX = (index: number) => {
    if (data.length <= 1) return padding.left;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const scaleY = (val: number) => {
    if (maxVal === minVal) return padding.top + chartHeight / 2;
    const ratio = (val - minVal) / (maxVal - minVal);
    return padding.top + chartHeight * (1 - ratio);
  };

  // Build SVG polygon paths for P10-P90 outer fan and P25-P75 inner fan
  const topPointsP90 = data.map((d, i) => `${scaleX(i)},${scaleY(d.p90)}`);
  const bottomPointsP10 = data.slice().reverse().map((d, i) => {
    const origIndex = data.length - 1 - i;
    return `${scaleX(origIndex)},${scaleY(d.p10)}`;
  });
  const pathP10P90 = `M ${topPointsP90.join(" L ")} L ${bottomPointsP10.join(" L ")} Z`;

  const topPointsP75 = data.map((d, i) => `${scaleX(i)},${scaleY(d.p75)}`);
  const bottomPointsP25 = data.slice().reverse().map((d, i) => {
    const origIndex = data.length - 1 - i;
    return `${scaleX(origIndex)},${scaleY(d.p25)}`;
  });
  const pathP25P75 = `M ${topPointsP75.join(" L ")} L ${bottomPointsP25.join(" L ")} Z`;

  // Median line
  const pathP50 = data.map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.p50)}`).join(" ");

  const bufferY = scaleY(bufferPaise);
  const zeroY = scaleY(0);

  const activePoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length ? data[hoverIndex] : null;

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="fanOuterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tide)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--tide)" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="fanInnerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tide)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--tide)" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {/* Zero baseline */}
        {zeroY >= padding.top && zeroY <= padding.top + chartHeight && (
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="var(--persimmon)"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
        )}

        {/* Buffer line */}
        {bufferY >= padding.top && bufferY <= padding.top + chartHeight && (
          <line
            x1={padding.left}
            y1={bufferY}
            x2={width - padding.right}
            y2={bufferY}
            stroke="var(--saffron)"
            strokeDasharray="3 3"
            strokeWidth="1.2"
          />
        )}

        {/* Fan Areas */}
        <path d={pathP10P90} fill="url(#fanOuterGrad)" />
        <path d={pathP25P75} fill="url(#fanInnerGrad)" />

        {/* Median line */}
        <path d={pathP50} fill="none" stroke="var(--tide)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover vertical bar & interactive target circles */}
        {data.map((d, i) => {
          const cx = scaleX(i);
          return (
            <rect
              key={i}
              x={cx - chartWidth / (data.length * 2)}
              y={padding.top}
              width={chartWidth / data.length}
              height={chartHeight}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoverIndex(i)}
            />
          );
        })}

        {hoverIndex !== null && (
          <>
            <line
              x1={scaleX(hoverIndex)}
              y1={padding.top}
              x2={scaleX(hoverIndex)}
              y2={padding.top + chartHeight}
              stroke="var(--ink)"
              strokeOpacity="0.4"
              strokeDasharray="2 2"
            />
            <circle
              cx={scaleX(hoverIndex)}
              cy={scaleY(data[hoverIndex].p50)}
              r="4.5"
              fill="var(--surface)"
              stroke="var(--tide)"
              strokeWidth="2.5"
            />
          </>
        )}

        {/* X-Axis labels (start, mid, end) */}
        <text
          x={padding.left}
          y={height - 10}
          fill="var(--slate)"
          fontSize="11"
          fontFamily="var(--font-ui)"
          textAnchor="start"
        >
          {data[0]?.date ? data[0].date.substring(5) : "Today"}
        </text>
        {data.length > 2 && (
          <text
            x={padding.left + chartWidth / 2}
            y={height - 10}
            fill="var(--slate)"
            fontSize="11"
            fontFamily="var(--font-ui)"
            textAnchor="middle"
          >
            Day {data[Math.floor(data.length / 2)]?.day}
          </text>
        )}
        <text
          x={width - padding.right}
          y={height - 10}
          fill="var(--slate)"
          fontSize="11"
          fontFamily="var(--font-ui)"
          textAnchor="end"
        >
          Day 365
        </text>

        {/* Y-Axis labels */}
        <text
          x={padding.left - 8}
          y={padding.top + 10}
          fill="var(--slate)"
          fontSize="10"
          fontFamily="var(--font-ui)"
          textAnchor="end"
        >
          {formatINR(maxVal)}
        </text>
        <text
          x={padding.left - 8}
          y={padding.top + chartHeight}
          fill="var(--slate)"
          fontSize="10"
          fontFamily="var(--font-ui)"
          textAnchor="end"
        >
          {formatINR(minVal)}
        </text>
      </svg>

      {/* Interactive Tooltip Card */}
      {activePoint && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "rgba(16, 38, 46, 0.94)",
            color: "#FFFFFF",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            pointerEvents: "none",
            backdropFilter: "blur(4px)",
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--mist)", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: "2px", marginBottom: "4px" }}>
            Day {activePoint.day} ({activePoint.date})
          </div>
          <div>P90 (Optimistic): <strong style={{ color: "#74C69D" }}>{formatINR(activePoint.p90)}</strong></div>
          <div>P50 (Expected): <strong style={{ color: "#E0AAFF" }}>{formatINR(activePoint.p50)}</strong></div>
          <div>P10 (Conservative): <strong style={{ color: "#FFA69E" }}>{formatINR(activePoint.p10)}</strong></div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "4px", fontSize: "11px", color: "var(--slate)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: 12, height: 12, background: "rgba(20, 118, 110, 0.2)", borderRadius: 2 }} />
          P10–P90 (90% Conf.)
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: 12, height: 12, background: "rgba(20, 118, 110, 0.4)", borderRadius: 2 }} />
          P25–P75 (50% Conf.)
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: 12, height: 3, background: "var(--tide)", borderRadius: 1 }} />
          P50 Median
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: 12, height: 1, borderTop: "1px dashed var(--saffron)" }} />
          Buffer
        </span>
      </div>
    </div>
  );
};

