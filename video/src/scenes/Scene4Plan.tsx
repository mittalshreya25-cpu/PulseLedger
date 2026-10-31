import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DesktopFrame } from "../components/DesktopFrame";

export const Scene4Plan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Slider animation moves from 0 to 20% at frame 90
  const sliderProgress = interpolate(frame, [60, 150], [0, 20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Curve elevation based on slider
  const elevation = interpolate(frame, [60, 150], [0, 25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        background: "#020E0E",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#DAF1DE",
        position: "relative",
      }}
    >
      {/* Scene Header Callout */}
      <div
        style={{
          position: "absolute",
          top: "24px",
          left: "60px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          zIndex: 10,
        }}
      >
        <span
          style={{
            background: "#8EB69B",
            color: "#051F20",
            padding: "4px 12px",
            borderRadius: "6px",
            fontWeight: 800,
            fontSize: "14px",
          }}
        >
          PILLAR 03
        </span>
        <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#FFFFFF" }}>
          365-Day Monte Carlo Cash-Flow Trajectory & Interactive What-If Plan
        </h2>
      </div>

      <div style={{ transform: `scale(${enter})`, opacity: enter, marginTop: "40px" }}>
        <DesktopFrame width={1640} height={920} title="PulseLedger / Plan & Simulation / Monte Carlo 365 Days">
          <div style={{ flex: 1, padding: "28px 36px", display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>
            {/* Header & Badges */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px 0" }}>
                  Monte Carlo Cash-Flow Trajectory (365 Days)
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "rgba(218, 241, 222, 0.7)" }}>
                  1,000 stochastic simulation runs anchored at Day 0 starting balance with Common Random Numbers.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ background: "rgba(142, 182, 155, 0.2)", border: "1px solid #8EB69B", color: "#8EB69B", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                  📈 365-Day Trajectory
                </span>
                <span style={{ background: "rgba(11, 43, 38, 0.7)", border: "1px solid rgba(218, 241, 222, 0.2)", color: "rgba(218, 241, 222, 0.7)", padding: "6px 14px", borderRadius: "20px", fontSize: "12px" }}>
                  💼 Career & Gap Solver
                </span>
              </div>
            </div>

            {/* KPI Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
              <div style={{ background: "rgba(11, 43, 38, 0.6)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "12px", padding: "12px 18px" }}>
                <div style={{ fontSize: "11px", color: "#8EB69B", fontWeight: 700, textTransform: "uppercase" }}>Starting Balance (Day 0)</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", marginTop: "2px" }}>₹35,000.00</div>
              </div>
              <div style={{ background: "rgba(11, 43, 38, 0.6)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "12px", padding: "12px 18px" }}>
                <div style={{ fontSize: "11px", color: "#52B788", fontWeight: 700, textTransform: "uppercase" }}>Expected 1-Yr Net Cash (P50)</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#52B788", marginTop: "2px" }}>
                  ₹{(388264 + Math.round(elevation * 1200)).toLocaleString("en-IN")}.00
                </div>
              </div>
              <div style={{ background: "rgba(11, 43, 38, 0.6)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "12px", padding: "12px 18px" }}>
                <div style={{ fontSize: "11px", color: "#8EB69B", fontWeight: 700, textTransform: "uppercase" }}>Conservative Floor (P10)</div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#8EB69B", marginTop: "2px" }}>
                  ₹{(382523 + Math.round(elevation * 1000)).toLocaleString("en-IN")}.00
                </div>
              </div>
            </div>

            {/* Simulated Live SVG Fan Chart */}
            <div style={{ flex: 1, background: "rgba(11, 43, 38, 0.4)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "14px", padding: "16px 20px", display: "flex", flexDirection: "column", position: "relative" }}>
              <svg viewBox="0 0 800 240" style={{ width: "100%", height: "220px", display: "block" }}>
                <defs>
                  <linearGradient id="sc4FanOuter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8EB69B" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#163832" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="sc4FanInner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8EB69B" stopOpacity="0.52" />
                    <stop offset="100%" stopColor="#235347" stopOpacity="0.22" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[50, 100, 150, 200].map((y, i) => (
                  <g key={i}>
                    <line x1="80" y1={y} x2="760" y2={y} stroke="rgba(218, 241, 222, 0.08)" strokeDasharray="4 4" />
                    <text x="70" y={y + 4} fill="rgba(218, 241, 222, 0.5)" fontSize="11" textAnchor="end" fontFamily="monospace">
                      {["₹4.0L", "₹3.0L", "₹2.0L", "₹50k"][i]}
                    </text>
                  </g>
                ))}

                {/* Emergency Buffer Line */}
                <line x1="80" y1="210" x2="760" y2="210" stroke="#F39C12" strokeDasharray="3 3" strokeWidth="1.2" />
                <text x="755" y="206" fill="#F39C12" fontSize="10" textAnchor="end" fontWeight="600">
                  Emergency Buffer (₹20,000)
                </text>

                {/* Outer Fan: P10-P90 */}
                <path
                  d={`M 80 200 C 250 170, 450 ${120 - elevation}, 760 ${40 - elevation} L 760 ${75 - elevation} C 450 ${140 - elevation}, 250 180, 80 200 Z`}
                  fill="url(#sc4FanOuter)"
                />

                {/* Inner Fan: P25-P75 */}
                <path
                  d={`M 80 200 C 250 175, 450 ${128 - elevation}, 760 ${52 - elevation} L 760 ${65 - elevation} C 450 ${134 - elevation}, 250 178, 80 200 Z`}
                  fill="url(#sc4FanInner)"
                />

                {/* P50 Median Line */}
                <path
                  d={`M 80 200 C 250 176, 450 ${131 - elevation}, 760 ${58 - elevation}`}
                  fill="none"
                  stroke="#DAF1DE"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />

                {/* X-Axis Labels */}
                <text x="80" y="235" fill="rgba(218, 241, 222, 0.6)" fontSize="11">Today</text>
                <text x="250" y="235" fill="rgba(218, 241, 222, 0.6)" fontSize="11" textAnchor="middle">Jan '27</text>
                <text x="450" y="235" fill="rgba(218, 241, 222, 0.6)" fontSize="11" textAnchor="middle">Apr '27</text>
                <text x="620" y="235" fill="rgba(218, 241, 222, 0.6)" fontSize="11" textAnchor="middle">Jul '27</text>
                <text x="760" y="235" fill="rgba(218, 241, 222, 0.6)" fontSize="11" textAnchor="end">Day 365 (Oct '27)</text>
              </svg>

              {/* Legend Bar */}
              <div style={{ display: "flex", justifyContent: "center", gap: "24px", fontSize: "11px", color: "rgba(218, 241, 222, 0.7)", marginTop: "4px" }}>
                <span>■ P10–P90 (90% Conf. Cone)</span>
                <span>■ P25–P75 (50% Core)</span>
                <span style={{ color: "#DAF1DE", fontWeight: 700 }}>━ P50 Expected Median</span>
                <span style={{ color: "#F39C12" }}>┄ Emergency Reserve Floor</span>
              </div>
            </div>

            {/* Risk Metrics & What-If Sliders */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
              {/* Risk Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ background: "rgba(11, 43, 38, 0.6)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#8EB69B" }}>Shortfall Risk (Below ₹0)</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#52B788", marginTop: "2px" }}>0.0%</div>
                </div>
                <div style={{ background: "rgba(11, 43, 38, 0.6)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#8EB69B" }}>Buffer Breach Risk</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#52B788", marginTop: "2px" }}>0.0%</div>
                </div>
              </div>

              {/* Interactive Sliders */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "rgba(11, 43, 38, 0.6)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "10px", padding: "12px 18px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600 }}>
                    <span>What-if: Cut Dining Out: {Math.round(sliderProgress)}%</span>
                    <span style={{ color: "#52B788" }}>+Saves ~₹{Math.round(sliderProgress * 120).toLocaleString("en-IN")}/mo</span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", marginTop: "6px", position: "relative" }}>
                    <div style={{ width: `${(sliderProgress / 60) * 100}%`, height: "100%", background: "#8EB69B", borderRadius: "3px" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600 }}>
                    <span>What-if: Monthly Rent Change: -₹500</span>
                    <span style={{ color: "#52B788" }}>+₹6,000/yr surplus</span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", marginTop: "6px", position: "relative" }}>
                    <div style={{ width: "30%", height: "100%", background: "#8EB69B", borderRadius: "3px" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DesktopFrame>
      </div>
    </div>
  );
};
