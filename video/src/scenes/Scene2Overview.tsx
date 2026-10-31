import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { TouchCursor } from "../components/TouchCursor";

export const Scene2Overview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // 1. Dynamic Island SMS Notification drops at frame 300 (10.0s), dismisses at frame 560 (18.6s)
  const showNotification = frame >= 300 && frame <= 560;
  const notifText = showNotification ? "Bank SMS: ₹140 Swiggy" : null;
  const notifSub = showNotification ? "Canara Bank • Parsed into Food category" : null;

  // 2. Safe-to-Spend value animates from ₹3,587 down to ₹3,447 when SMS is tapped/cleared (14s - 17s)
  const safeSpendVal = interpolate(frame, [420, 510], [3587, 3447], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. Touch Cursor Path paced smoothly across the 45-second scene (1,350 frames):
  // Phase 1 (frames 0 - 320, 0s - 10.6s): Resting near Safe-to-Spend dial
  // Phase 2 (frames 320 - 450, 10.6s - 15.0s): Glides up to Dynamic Island SMS, taps it at frame 420-450
  // Phase 3 (frames 540 - 720, 18.0s - 24.0s): Glides down to Quick Spend input, taps it at frame 680-720
  // Phase 4 (frames 760 - 920, 25.3s - 30.6s): Glides to "Ripple" button, taps it at frame 880-920
  // Phase 5 (frames 960 - 1100, 32.0s - 36.6s): Hovers over expanded Goal Ripple delay card
  // Phase 6 (frames 1120 - 1320, 37.3s - 44.0s): Glides down to bottom dock, taps Ledger at frame 1240-1280
  let cursorX = 215;
  let cursorY = 280;
  let isTapping = false;

  if (frame < 320) {
    // Resting gently near the Safe-to-Spend dial
    cursorX = 215;
    cursorY = 280;
    isTapping = false;
  } else if (frame < 540) {
    // Taps SMS banner at top
    cursorX = interpolate(frame, [320, 420], [215, 215], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [320, 420], [280, 52], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 420 && frame <= 460;
  } else if (frame < 760) {
    // Moves to Quick Spend field and taps
    cursorX = interpolate(frame, [540, 680], [215, 180], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [540, 680], [52, 490], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 680 && frame <= 720;
  } else if (frame < 960) {
    // Moves to Ripple button and taps
    cursorX = interpolate(frame, [760, 880], [180, 340], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [760, 880], [490, 490], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 880 && frame <= 920;
  } else if (frame < 1120) {
    // Hovers over the newly expanded Goal Ripple card
    cursorX = interpolate(frame, [960, 1040], [340, 215], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [960, 1040], [490, 560], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = false;
  } else {
    // Taps Ledger dock tab at bottom
    cursorX = interpolate(frame, [1120, 1240], [215, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [1120, 1240], [560, 840], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 1240 && frame <= 1300;
  }

  // Ripple card pops at frame 890 (29.6s)
  const rippleProgress = spring({
    frame: frame - 890,
    fps,
    config: { damping: 12, stiffness: 80 },
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
      {/* Left: Interactive Phone Screen Operating Overview */}
      <div style={{ transform: `scale(${enter})`, position: "relative" }}>
        <PhoneMockup
          width={430}
          height={900}
          activeTab={frame >= 1260 ? "ledger" : "home"}
          notificationText={notifText}
          notificationSub={notifSub}
        >
          {/* Mobile Screen Content */}
          <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px", overflow: "hidden" }}>
            {/* Top User Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1E202E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#10B981", border: "1px solid #10B981" }}>
                  A
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>Aarav</div>
                  <div style={{ fontSize: "11px", color: "#CBD5E1" }}>Student / Intern</div>
                </div>
              </div>

              <div style={{ background: "#10B981", color: "#000000", padding: "4px 12px", borderRadius: "14px", fontSize: "11px", fontWeight: 900 }}>
                Allowance Regime
              </div>
            </div>

            {/* Central Safe-to-Spend Dial Card */}
            <div
              style={{
                background: "#12141F",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "22px",
                padding: "20px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
              }}
            >
              <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }}>
                Autonomous Safe-to-Spend Today
              </div>

              <div style={{ fontSize: "52px", fontWeight: 900, color: "#FFFFFF", margin: "10px 0 4px 0", letterSpacing: "-1px" }}>
                ₹{Math.round(safeSpendVal).toLocaleString("en-IN")}
              </div>

              <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 700 }}>
                ● Velocity Healthy (₹1,553 spent / ₹5,000 allowance)
              </div>

              {/* Progress Bar */}
              <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", marginTop: "14px", overflow: "hidden" }}>
                <div style={{ width: "31%", height: "100%", background: "linear-gradient(90deg, #10B981, #34D399)", borderRadius: "3px" }} />
              </div>
            </div>

            {/* Quick Spend Simulation Input */}
            <div
              style={{
                background: "#12141F",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "18px",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "11px", color: "#CBD5E1", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
                Simulate Discretionary Spend
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <div
                  style={{
                    flex: 1,
                    background: "#090A0F",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "#FFFFFF",
                    fontWeight: 600,
                  }}
                >
                  {frame >= 180 ? "₹1,200 (Dinner with Friends)" : "Enter amount to test..."}
                </div>
                <button
                  style={{
                    background: isTapping && frame >= 260 && frame <= 280 ? "#34D399" : "#10B981",
                    color: "#000000",
                    border: "none",
                    borderRadius: "10px",
                    padding: "0 14px",
                    fontWeight: 900,
                    fontSize: "12px",
                    transform: isTapping && frame >= 260 && frame <= 280 ? "scale(0.95)" : "scale(1)",
                  }}
                >
                  Ripple
                </button>
              </div>

              {/* Animated Goal Ripple Card */}
              {rippleProgress > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    background: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid #F59E0B",
                    borderRadius: "12px",
                    padding: "12px",
                    transform: `scale(${rippleProgress})`,
                    opacity: rippleProgress,
                  }}
                >
                  <div style={{ color: "#F59E0B", fontSize: "11px", fontWeight: 900, textTransform: "uppercase" }}>
                    ⚠️ Goal Ripple Delay Forecast
                  </div>
                  <div style={{ fontSize: "12px", color: "#FFFFFF", marginTop: "4px", lineHeight: 1.4, fontWeight: 500 }}>
                    This ₹1,200 spend shifts your <strong>Laptop Fund goal</strong> by approximately <strong>2 days</strong>.
                  </div>
                </div>
              )}
            </div>

            {/* Recent Reconciled Activity */}
            <div
              style={{
                background: "#12141F",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "18px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ fontSize: "11px", color: "#CBD5E1", fontWeight: 800, textTransform: "uppercase" }}>
                Recent Reconciled Activity
              </div>

              {[
                { payee: "Swiggy", tag: "Food (Parsed SMS)", amt: "-₹140.00", color: "#EF4444" },
                { payee: "Allowance", tag: "UPI Reconciled", amt: "+₹5,000.00", color: "#10B981" },
              ].map((tx, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#FFFFFF" }}>{tx.payee}</div>
                    <div style={{ fontSize: "10px", color: "#94A3B8" }}>{tx.tag}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: tx.color }}>{tx.amt}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Animated Touch Cursor Operating Screen */}
          <TouchCursor x={cursorX} y={cursorY} isTapping={isTapping} visible={true} />
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
          SECTION 01 • OVERVIEW & INGESTION
        </div>

        <h2 style={{ fontSize: "52px", fontWeight: 900, margin: 0, letterSpacing: "-1.5px", color: "#FFFFFF", lineHeight: 1.1 }}>
          Living Financial Pulse & Zero-Touch SMS Sync
        </h2>

        <p style={{ fontSize: "20px", color: "#F1F5F9", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
          Instead of outdated monthly budgets that fail on daily realities, PulseLedger continuously computes your
          <strong style={{ color: "#10B981" }}> Safe-to-Spend limit</strong> based on upcoming bills, recurring commitments, and cash velocity.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#161824", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "16px", padding: "18px 22px", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#10B981" }}>⚡ Autonomous SMS Ingestion</div>
            <div style={{ fontSize: "14px", color: "#CBD5E1", marginTop: "6px", lineHeight: 1.4, fontWeight: 500 }}>
              Bank SMS parsed locally via regex and fuzzy matching in milliseconds — zero cloud storage, zero telemetry.
            </div>
          </div>

          <div style={{ background: "#161824", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "16px", padding: "18px 22px", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#F59E0B" }}>⚠️ Goal Ripple Engine</div>
            <div style={{ fontSize: "14px", color: "#CBD5E1", marginTop: "6px", lineHeight: 1.4, fontWeight: 500 }}>
              Quantifies exact opportunity cost: simulates how many days any discretionary purchase delays your primary life goals.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
