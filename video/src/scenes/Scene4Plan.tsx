import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { TouchCursor } from "../components/TouchCursor";

export const Scene4Plan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Touch Cursor Timeline:
  // Phase 1 (frames 30-140): Drags "Cut Dining Out" slider from 0% to 20%
  // Phase 2 (frames 170-250): Drags "Rent Change" slider to -₹500
  // Phase 3 (frames 320-380): Taps "Coach" tab on floating dock
  let cursorX = 120;
  let cursorY = 560;
  let isDragging = false;
  let sliderVal = 0;
  let rentSliderVal = 0;

  if (frame < 160) {
    sliderVal = interpolate(frame, [50, 130], [0, 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorX = interpolate(frame, [30, 50, 130], [120, 100, 260], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [30, 50, 130], [650, 560, 560], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isDragging = frame >= 50 && frame <= 135;
  } else if (frame < 280) {
    sliderVal = 20;
    rentSliderVal = interpolate(frame, [190, 250], [0, -500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorX = interpolate(frame, [160, 190, 250], [260, 180, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [160, 190, 250], [560, 620, 620], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isDragging = frame >= 190 && frame <= 255;
  } else {
    sliderVal = 20;
    rentSliderVal = -500;
    cursorX = interpolate(frame, [290, 330], [120, 340], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [290, 330], [620, 840], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isDragging = frame >= 330 && frame <= 360;
  }

  // Trajectory elevation reacting live to the slider drag
  const trajectoryLift = interpolate(frame, [50, 130], [0, 22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        background: "#08090E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 90px",
        gap: "80px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#FFFFFF",
        position: "relative",
      }}
    >
      {/* Left: Interactive Phone Screen Operating Monte Carlo Simulation */}
      <div style={{ transform: `scale(${enter})`, position: "relative" }}>
        <PhoneMockup width={430} height={900} activeTab={frame >= 340 ? "coach" : "plan"}>
          {/* Mobile Screen Content */}
          <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px", overflow: "hidden" }}>
            {/* Header */}
            <div>
              <div style={{ fontSize: "11px", color: "#10B981", fontWeight: 800, textTransform: "uppercase" }}>
                Monte Carlo Simulation
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 900, margin: "2px 0 0 0", color: "#FFFFFF" }}>
                365-Day Cash-Flow Trajectory
              </h3>
            </div>

            {/* KPI Stat Ribbon */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "12px", padding: "8px 12px" }}>
                <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>Starting (Day 0)</div>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#FFFFFF" }}>₹35,000</div>
              </div>
              <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "12px", padding: "8px 12px" }}>
                <div style={{ fontSize: "10px", color: "#10B981", fontWeight: 700 }}>Expected 1-Yr Net</div>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#10B981" }}>
                  ₹{(388264 + Math.round(trajectoryLift * 1400)).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* The SVG Fan Chart Container */}
            <div
              style={{
                background: "#12141F",
                border: "1px solid rgba(255, 255, 255, 0.12)",
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
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#047857" stopOpacity="0.10" />
                  </linearGradient>
                  <linearGradient id="sc4MCInner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#065F46" stopOpacity="0.25" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[35, 75, 115].map((y, i) => (
                  <g key={i}>
                    <line x1="50" y1={y} x2="385" y2={y} stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" />
                    <text x="44" y={y + 3} fill="#94A3B8" fontSize="9" textAnchor="end" fontFamily="monospace" fontWeight="600">
                      {["₹3.9L", "₹2.0L", "₹50k"][i]}
                    </text>
                  </g>
                ))}

                {/* Emergency Buffer Line */}
                <line x1="50" y1="135" x2="385" y2="135" stroke="#F59E0B" strokeDasharray="3 3" strokeWidth="1.2" />
                <text x="380" y="132" fill="#F59E0B" fontSize="8" textAnchor="end" fontWeight="800">
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
                  stroke="#FFFFFF"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />

                {/* X-Axis Labels */}
                <text x="50" y="155" fill="#94A3B8" fontSize="9" fontWeight="600">Today</text>
                <text x="160" y="155" fill="#94A3B8" fontSize="9" textAnchor="middle" fontWeight="600">Jan '27</text>
                <text x="270" y="155" fill="#94A3B8" fontSize="9" textAnchor="middle" fontWeight="600">May '27</text>
                <text x="385" y="155" fill="#94A3B8" fontSize="9" textAnchor="end" fontWeight="600">Day 365</text>
              </svg>

              <div style={{ display: "flex", justifyContent: "center", gap: "12px", fontSize: "10px", color: "#CBD5E1", marginTop: "2px", fontWeight: 700 }}>
                <span>■ P10–P90 (90%)</span>
                <span>■ P25–P75 (50%)</span>
                <span style={{ color: "#FFFFFF" }}>━ P50 Median</span>
              </div>
            </div>

            {/* Risk Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "12px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>Shortfall Risk (Below ₹0)</div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#10B981", marginTop: "2px" }}>0.0%</div>
              </div>
              <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "12px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>Buffer Breach Risk</div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#10B981", marginTop: "2px" }}>0.0%</div>
              </div>
            </div>

            {/* Interactive What-If Sliders */}
            <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "16px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 800 }}>
                  <span style={{ color: "#FFFFFF" }}>Cut Dining Out: {Math.round(sliderVal)}%</span>
                  <span style={{ color: "#10B981" }}>+Saves ~₹{Math.round(sliderVal * 120).toLocaleString("en-IN")}/mo</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.12)", borderRadius: "3px", marginTop: "6px", position: "relative" }}>
                  <div style={{ width: `${(sliderVal / 60) * 100}%`, height: "100%", background: "#10B981", borderRadius: "3px" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 800 }}>
                  <span style={{ color: "#FFFFFF" }}>Rent Change: {rentSliderVal < 0 ? `-₹${Math.abs(rentSliderVal)}` : `₹0`}</span>
                  <span style={{ color: "#10B981" }}>{rentSliderVal < 0 ? "+₹6,000/yr impact" : "₹0 impact"}</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.12)", borderRadius: "3px", marginTop: "6px", position: "relative" }}>
                  <div style={{ width: rentSliderVal < 0 ? "30%" : "0%", height: "100%", background: "#10B981", borderRadius: "3px" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Animated Touch Cursor Operating Sliders */}
          <TouchCursor x={cursorX} y={cursorY} isTapping={isDragging} visible={true} />
        </PhoneMockup>
      </div>

      {/* Right: High-Contrast Presentation Callouts */}
      <div style={{ maxWidth: "660px", display: "flex", flexDirection: "column", gap: "24px", zIndex: 10 }}>
        <div
          style={{
            background: "#10B981",
            color: "#000000",
            padding: "8px 18px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: 900,
            width: "fit-content",
            letterSpacing: "1px",
            textTransform: "uppercase",
            boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)",
          }}
        >
          SECTION 03 • MONTE CARLO STOCHASTIC ENGINE
        </div>

        <h2 style={{ fontSize: "52px", fontWeight: 900, margin: 0, letterSpacing: "-1.5px", color: "#FFFFFF", lineHeight: 1.1 }}>
          365-Day Trajectory & Real-Time What-If Sliders
        </h2>

        <p style={{ fontSize: "20px", color: "#F1F5F9", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
          Unlike static spreadsheets that ignore volatility, PulseLedger runs <strong style={{ color: "#10B981" }}>1,000 Monte Carlo paths</strong> using
          Common Random Numbers. The trajectory fans out into confidence intervals showing true probabilistic outcomes.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#161824", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "16px", padding: "18px 22px", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#10B981" }}>📊 Continuous Confidence Cone</div>
            <div style={{ fontSize: "14px", color: "#CBD5E1", marginTop: "6px", lineHeight: 1.4, fontWeight: 500 }}>
              Anchored at Day 0, showing 90% outer funnel (P10–P90), 50% core band, and central median curve with zero intra-month sawtooth jitter.
            </div>
          </div>

          <div style={{ background: "#161824", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "16px", padding: "18px 22px", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#38BDF8" }}>💼 Reverse Income Solver</div>
            <div style={{ fontSize: "14px", color: "#CBD5E1", marginTop: "6px", lineHeight: 1.4, fontWeight: 500 }}>
              Solves for exact required gross CTC under Indian income tax slabs (Sec 87A rebate) across living tiers like Bengaluru, Mumbai, and Delhi.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
