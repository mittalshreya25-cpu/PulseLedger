import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { TouchCursor } from "../components/TouchCursor";

export const Scene3Ledger: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Filter chip active state: taps Food at frame 180 (6s), reverts to All at frame 280 (9.3s)
  const isFoodFilterActive = frame >= 180 && frame <= 280;

  // Touch Cursor Timeline paced across 45-second scene (1,350 frames):
  // Phase 1 (frames 120-220, 4.0s - 7.3s): Taps Food filter chip
  // Phase 2 (frames 230-310, 7.6s - 10.3s): Taps All filter chip
  // Phase 3 (frames 360-480, 12.0s - 16.0s): Glides to Chai Point row, taps to open bottom sheet
  // Phase 4 (frames 520-650, 17.3s - 21.6s): Taps Food category in bottom sheet
  // Phase 5 (frames 760-980, 25.3s - 32.6s): Hovers over Netflix +30.1% Price Creep card
  // Phase 6 (frames 1120-1320, 37.3s - 44.0s): Glides to bottom dock, taps Plan tab
  let cursorX = 200;
  let cursorY = 220;
  let isTapping = false;

  if (frame < 230) {
    cursorX = interpolate(frame, [120, 180], [200, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [120, 180], [400, 215], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 180 && frame <= 210;
  } else if (frame < 330) {
    cursorX = interpolate(frame, [230, 280], [140, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [230, 280], [215, 215], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 280 && frame <= 310;
  } else if (frame < 520) {
    cursorX = interpolate(frame, [360, 450], [60, 220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [360, 450], [215, 410], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 450 && frame <= 480;
  } else if (frame < 720) {
    cursorX = interpolate(frame, [520, 610], [220, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [520, 610], [410, 690], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 610 && frame <= 650;
  } else if (frame < 1050) {
    // Hovers over Netflix row and price creep alert
    cursorX = interpolate(frame, [760, 860], [200, 220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [760, 860], [690, 320], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = false;
  } else {
    // Navigates to floating dock and taps Plan tab
    cursorX = interpolate(frame, [1120, 1240], [220, 250], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [1120, 1240], [320, 840], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 1240 && frame <= 1300;
  }

  // Mobile bottom sheet opens at frame 460 (15.3s), closes at frame 680 (22.6s)
  const sheetOpen = spring({
    frame: frame - 460,
    fps,
    config: { damping: 14, stiffness: 85 },
  });
  const showSheet = frame >= 460 && frame <= 690;

  // Rule Learned Toast pops at frame 690 (23.0s) and stays through frame 1050 (35.0s)
  const toastPop = spring({
    frame: frame - 690,
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
      {/* Left: Interactive Phone Screen Operating Ledger */}
      <div style={{ transform: `scale(${enter})`, position: "relative" }}>
        <PhoneMockup width={430} height={900} activeTab={frame >= 1260 ? "plan" : "ledger"}>
          {/* Mobile Screen Content */}
          <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden", position: "relative" }}>
            {/* Header */}
            <div>
              <div style={{ fontSize: "11px", color: "#10B981", fontWeight: 800, textTransform: "uppercase" }}>
                Audited Double-Entry Register
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 900, margin: "2px 0 0 0", color: "#FFFFFF" }}>
                Financial Transaction Ledger
              </h3>
            </div>

            {/* KPI Stat Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "14px", padding: "10px 14px" }}>
                <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>Total Outflows (Dr.)</div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#EF4444", marginTop: "2px" }}>-₹1,553.00</div>
              </div>
              <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "14px", padding: "10px 14px" }}>
                <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700 }}>Net Liquidity</div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#10B981", marginTop: "2px" }}>+₹3,447.00</div>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { label: "All (7)", active: !isFoodFilterActive },
                { label: "Food (3)", active: isFoodFilterActive },
                { label: "Subs (2)", active: false },
                { label: "Credit (1)", active: false },
              ].map((chip, i) => (
                <span
                  key={i}
                  style={{
                    background: chip.active ? "#10B981" : "#12141F",
                    color: chip.active ? "#000000" : "#94A3B8",
                    border: chip.active ? "1px solid #10B981" : "1px solid rgba(255,255,255,0.08)",
                    padding: "4px 10px",
                    borderRadius: "14px",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  {chip.label}
                </span>
              ))}
            </div>

            {/* Transaction Cards List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Row 1: Swiggy */}
              <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "14px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "13px", color: "#FFFFFF" }}>Swiggy Food</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>31 Oct 2026 • Bank SMS</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900, color: "#EF4444", fontSize: "14px" }}>-₹140.00</div>
                  <div style={{ fontSize: "10px", color: "#10B981", fontWeight: 700 }}>🍔 Food</div>
                </div>
              </div>

              {!isFoodFilterActive && (
                /* Row 2: Netflix */
                <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "14px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "13px", color: "#FFFFFF" }}>Netflix India</div>
                    <div style={{ fontSize: "10px", color: "#F59E0B", fontWeight: 700 }}>⚠️ Price Creep +30.1%</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, color: "#EF4444", fontSize: "14px" }}>-₹649.00</div>
                    <div style={{ fontSize: "10px", color: "#94A3B8" }}>🎬 Entertainment</div>
                  </div>
                </div>
              )}

              {/* Row 3: Chai Point (Target of Click) */}
              <div
                style={{
                  background: showSheet ? "rgba(16, 185, 129, 0.15)" : "#12141F",
                  border: showSheet ? "2px solid #10B981" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "13px", color: "#FFFFFF" }}>Chai Point</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>29 Oct 2026 • SMS Debit</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900, color: "#EF4444", fontSize: "14px" }}>-₹250.00</div>
                  <div style={{ fontSize: "10px", background: "#10B981", color: "#000000", padding: "2px 8px", borderRadius: "6px", fontWeight: 800 }}>
                    Food ▾
                  </div>
                </div>
              </div>

              {!isFoodFilterActive && (
                /* Row 4: Allowance Credit */
                <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "14px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "13px", color: "#FFFFFF" }}>Parent Allowance</div>
                    <div style={{ fontSize: "10px", color: "#94A3B8" }}>28 Oct 2026 • UPI Credit</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, color: "#10B981", fontSize: "14px" }}>+₹5,000.00</div>
                    <div style={{ fontSize: "10px", color: "#10B981", fontWeight: 700 }}>💵 Allowance</div>
                  </div>
                </div>
              )}
            </div>

            {/* Native Mobile Bottom Sheet (Sliding Up on Tap) */}
            {showSheet && (
              <div
                style={{
                  position: "absolute",
                  bottom: "0px",
                  left: "0px",
                  right: "0px",
                  background: "#161824",
                  borderTop: "2px solid #10B981",
                  borderTopLeftRadius: "24px",
                  borderTopRightRadius: "24px",
                  padding: "16px 20px 80px 20px",
                  boxShadow: "0 -10px 40px rgba(0,0,0,0.9)",
                  transform: `translateY(${interpolate(sheetOpen, [0, 1], [250, 0])}px)`,
                  zIndex: 80,
                }}
              >
                <div style={{ width: "40px", height: "4px", background: "#33354A", borderRadius: "2px", margin: "0 auto 12px auto" }} />
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#FFFFFF", marginBottom: "4px" }}>Reclassify: Chai Point</div>
                <div style={{ fontSize: "11px", color: "#CBD5E1", marginBottom: "14px" }}>
                  Will create rule and replay across all matching past transactions
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {["🍔 Food (Dining & Snacks)", "🛵 Transport & Commute", "🎬 Entertainment"].map((cat, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: idx === 0 ? "rgba(16, 185, 129, 0.25)" : "#0D0E15",
                        border: idx === 0 ? "1px solid #10B981" : "1px solid rgba(255,255,255,0.08)",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: idx === 0 ? "#10B981" : "#FFFFFF",
                      }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rule Learned Success Toast */}
            {toastPop > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "14px",
                  right: "14px",
                  background: "#090A0F",
                  border: "2px solid #10B981",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.9)",
                  transform: `scale(${toastPop}) translateY(${interpolate(toastPop, [0, 1], [-20, 0])}px)`,
                  opacity: toastPop,
                  zIndex: 95,
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#10B981", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "14px" }}>
                  ✓
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: "12px", color: "#FFFFFF" }}>Deterministic Rule Learned</div>
                  <div style={{ fontSize: "11px", color: "#E2E8F0" }}>Chai Point → Food replayed across <strong>8 historical transactions</strong>!</div>
                </div>
              </div>
            )}
          </div>

          {/* Animated Touch Cursor */}
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
          SECTION 02 • AUDITED TABLE 1 & REPLAY
        </div>

        <h2 style={{ fontSize: "52px", fontWeight: 900, margin: 0, letterSpacing: "-1.5px", color: "#FFFFFF", lineHeight: 1.1 }}>
          Integer-Paise Ledger & Self-Learning Rule Replay
        </h2>

        <p style={{ fontSize: "20px", color: "#F1F5F9", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
          PulseLedger eliminates floating-point drift by storing every value strictly in integer paise. When you
          correct any merchant tag, our deterministic engine replays the rule across all past records instantly.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#161824", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "16px", padding: "18px 22px", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#10B981" }}>🔁 Autonomous Rule Replay</div>
            <div style={{ fontSize: "14px", color: "#CBD5E1", marginTop: "6px", lineHeight: 1.4, fontWeight: 500 }}>
              Categorize once, never repeat. The rulebook remembers merchants and automatically maintains clean ledger registers.
            </div>
          </div>

          <div style={{ background: "#161824", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "16px", padding: "18px 22px", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#F59E0B" }}>📈 Subscription Creep Detector</div>
            <div style={{ fontSize: "14px", color: "#CBD5E1", marginTop: "6px", lineHeight: 1.4, fontWeight: 500 }}>
              Alerts you immediately when a recurring subscription silently increases price (e.g. Netflix +30.1% spike).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
