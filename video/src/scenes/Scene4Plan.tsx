import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { TouchCursor } from "../components/TouchCursor";

export const Scene4Plan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Touch cursor moves to "Cut Dining Out" slider at frame 50, drags right between frame 70 and 150
  const sliderDrag = interpolate(frame, [70, 150], [0, 20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursorX = interpolate(frame, [40, 70, 150], [200, 120, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorY = interpolate(frame, [40, 70, 150], [700, 620, 620], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const isDragging = frame >= 70 && frame <= 155;

  // Trajectory elevation reacting live to the slider drag
  const trajectoryLift = interpolate(frame, [70, 150], [0, 22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle at 40% 50%, #0B0C12 0%, #040507 60%, #000000 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        gap: "80px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#FFFFFF",
        position: "relative",
      }}
    >
      {/* Left: Interactive Phone Screen Operating Monte Carlo Simulation */}
      <div style={{ transform: `scale(${enter})`, opacity: enter, position: "relative" }}>
        <PhoneMockup width={430} height={900} activeTab="plan">
          {/* Mobile Screen Content */}
          <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px", overflow: "hidden" }}>
            {/* Header */}
            <div>
              <div style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, textTransform: "uppercase" }}>
                Monte Carlo Simulation
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "2px 0 0 0" }}>
                365-Day Cash-Flow Trajectory
              </h3>
            </div>

            {/* KPI Stat Ribbon */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "8px 12px" }}>
                <div style={{ fontSize: "10px", color: "#94A3B8" }}>Starting (Day 0)</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF" }}>₹35,000</div>
              </div>
              <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "8px 12px" }}>
                <div style={{ fontSize: "10px", color: "#10B981" }}>Expected 1-Yr Net</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#10B981" }}>
                  ₹{(388264 + Math.round(trajectoryLift * 1400)).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* The SVG Fan Chart Container */}
            <div
              style={{
                background: "rgba(18, 19, 26, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "18px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <svg viewBox="0 0 400 170" style={{ width: "100%", height: "155px", display: "block" }}>
                <defs>
                  <linearGradient id="sc4MCOuter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#047857" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="sc4MCInner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#065F46" stopOpacity="0.22" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[35, 75, 115].map((y, i) => (
                  <g key={i}>
                    <line x1="50" y1={y} x2="385" y2={y} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
                    <text x="44" y={y + 3} fill="#64748B" fontSize="9" textAnchor="end" fontFamily="monospace">
                      {["₹3.9L", "₹2.0L", "₹50k"][i]}
                    </text>
                  </g>
                ))}

                {/* Emergency Buffer Line */}
                <line x1="50" y1="135" x2="385" y2="135" stroke="#F59E0B" strokeDasharray="3 3" strokeWidth="1" />
                <text x="380" y="132" fill="#F59E0B" fontSize="8" textAnchor="end" fontWeight="700">
                  Buffer (₹20,000)
                </text>

                {/* Outer Fan: P10-P90 */}
                <path
                  d={`M 50 125 C 150 110, 260 ${80 - trajectoryLift}, 385 ${30 - trajectoryLift} L 385 ${55 - trajectoryLift} C 260 ${95 - trajectoryLift}, 150 115, 50 125 Z`}
                  fill="url(#sc4MCOuter)"
                />

                {/* Inner Fan: P25-P75 */}
                <path
                  d={`M 50 125 C 150 112, 260 ${85 - trajectoryLift}, 385 ${38 - trajectoryLift} L 385 ${48 - trajectoryLift} C 260 ${90 - trajectoryLift}, 150 114, 50 125 Z`}
                  fill="url(#sc4MCInner)"
                />

                {/* P50 Median Curve */}
                <path
                  d={`M 50 125 C 150 113, 260 ${87 - trajectoryLift}, 385 ${42 - trajectoryLift}`}
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* X-Axis Labels */}
                <text x="50" y="155" fill="#64748B" fontSize="9">Today</text>
                <text x="160" y="155" fill="#64748B" fontSize="9" textAnchor="middle">Jan '27</text>
                <text x="270" y="155" fill="#64748B" fontSize="9" textAnchor="middle">May '27</text>
                <text x="385" y="155" fill="#64748B" fontSize="9" textAnchor="end">Day 365</text>
              </svg>

              <div style={{ display: "flex", justifyContent: "center", gap: "12px", fontSize: "10px", color: "#94A3B8", marginTop: "2px" }}>
                <span>■ P10–P90 (90%)</span>
                <span>■ P25–P75 (50%)</span>
                <span style={{ color: "#34D399", fontWeight: 700 }}>━ P50 Median</span>
              </div>
            </div>

            {/* Risk Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#94A3B8" }}>Shortfall Risk (Below ₹0)</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#10B981", marginTop: "2px" }}>0.0%</div>
              </div>
              <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#94A3B8" }}>Buffer Breach Risk</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#10B981", marginTop: "2px" }}>0.0%</div>
              </div>
            </div>

            {/* Interactive What-If Sliders */}
            <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700 }}>
                  <span>Cut Dining Out: {Math.round(sliderDrag)}%</span>
                  <span style={{ color: "#10B981" }}>+Saves ~₹{Math.round(sliderDrag * 120).toLocaleString("en-IN")}/mo</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", marginTop: "6px", position: "relative" }}>
                  <div style={{ width: `${(sliderDrag / 60) * 100}%`, height: "100%", background: "#10B981", borderRadius: "3px" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700 }}>
                  <span>Rent Change: -₹500</span>
                  <span style={{ color: "#10B981" }}>+₹6,000/yr impact</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", marginTop: "6px", position: "relative" }}>
                  <div style={{ width: "30%", height: "100%", background: "#10B981", borderRadius: "3px" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Animated Touch Cursor */}
          <TouchCursor x={cursorX} y={cursorY} isTapping={isDragging} visible={frame >= 35} />
        </PhoneMockup>
      </div>

      {/* Right: Industrial Architecture Callouts */}
      <div style={{ maxWidth: "620px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981", padding: "4px 14px", borderRadius: "12px", fontSize: "13px", color: "#10B981", fontWeight: 800, width: "fit-content" }}>
          SECTION 03 • MONTE CARLO STOCHASTIC ENGINE
        </div>

        <h2 style={{ fontSize: "48px", fontWeight: 800, margin: 0, letterSpacing: "-1px" }}>
          365-Day Trajectory & Real-Time What-If Sliders
        </h2>

        <p style={{ fontSize: "18px", color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>
          Unlike static spreadsheets that ignore volatility, PulseLedger runs <strong>1,000 Monte Carlo paths</strong> using
          Common Random Numbers. The trajectory fans out into confidence intervals showing true probabilistic outcomes.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "rgba(18, 19, 26, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#10B981" }}>📊 Continuous Confidence Cone</div>
            <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>
              Anchored at Day 0, showing 90% outer funnel (P10–P90), 50% core band, and central median curve with zero intra-month sawtooth jitter.
            </div>
          </div>

          <div style={{ background: "rgba(18, 19, 26, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#38BDF8" }}>💼 Reverse Income Solver</div>
            <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>
              Solves for exact required gross CTC under Indian income tax slabs (Sec 87A rebate) across living tiers like Bengaluru, Mumbai, and Delhi.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
