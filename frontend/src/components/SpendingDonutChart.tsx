import React from "react";
import { formatINR } from "../utils/format";

interface CategorySpend {
  category: string;
  amount_paise: number;
  percentage: number;
}

interface SpendingDonutChartProps {
  categories: CategorySpend[];
  totalSpendPaise: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#8EB69B",             // Celadon Sage from curated swatch
  "Money Transfer": "#235347", // Mid Pine
  Entertainment: "#E9A159",    // FlowFunds sunset warm amber
  Education: "#163832",        // Spruce
  Services: "#4E7A6E",         // Soft Celadon
  Transport: "#6FA38F",        // Pale Pine
  Miscellaneous: "#3A6055",    // Deep Moss
};

export const SpendingDonutChart: React.FC<SpendingDonutChartProps> = ({
  categories,
  totalSpendPaise,
}) => {
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke offsets
  let accumulatedPercent = 0;
  const slices = categories.map((cat) => {
    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += cat.percentage;
    const color = CATEGORY_COLORS[cat.category] || "#94A3B8";

    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
      color,
    };
  });

  return (
    <div className="card donut-card" style={{ height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="section-title" style={{ fontSize: "1.05rem" }}>
          Spending Breakdown
        </h3>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--tide)",
            background: "rgba(204, 255, 0, 0.12)",
            padding: "3px 8px",
            borderRadius: "12px",
          }}
        >
          Monthly Velocity
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          gap: "20px",
          marginTop: "10px",
          flexWrap: "wrap",
        }}
      >
        {/* SVG Donut */}
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />
            {slices.map((slice, i) => (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease",
                  filter: slice.category === "Food" ? "drop-shadow(0 0 6px var(--tide-glow))" : undefined,
                }}
              />
            ))}
          </svg>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--slate)", textTransform: "uppercase", fontWeight: 700 }}>
              Oct Debits
            </span>
            <span
              className="money"
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
              }}
            >
              {formatINR(totalSpendPaise)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: "150px" }}>
          {categories.slice(0, 4).map((cat, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: CATEGORY_COLORS[cat.category] || "#94A3B8",
                    boxShadow:
                      cat.category === "Food" ? "0 0 6px var(--tide-glow)" : "none",
                  }}
                />
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>{cat.category}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="money" style={{ color: "var(--slate)", fontSize: "0.8rem" }}>
                  {formatINR(cat.amount_paise)}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: cat.category === "Food" ? "var(--tide)" : "var(--ink)",
                    fontSize: "0.8rem",
                    minWidth: "35px",
                    textAlign: "right",
                  }}
                >
                  {cat.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

