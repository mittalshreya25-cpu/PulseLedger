import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { TouchCursor } from "../components/TouchCursor";

export const Scene3Ledger: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Filter chip active state (frames 40-100 taps Food, then back to All)
  const isFoodFilterActive = frame >= 60 && frame <= 110;

  // Touch Cursor Timeline:
  // Phase 1 (frames 30-70): Taps Food filter chip
  // Phase 2 (frames 90-130): Taps All filter chip
  // Phase 3 (frames 140-180): Taps Chai Point row
  // Phase 4 (frames 200-240): Taps Food in bottom sheet
  // Phase 5 (frames 330-380): Taps Plan on floating dock
  let cursorX = 200;
  let cursorY = 220;
  let isTapping = false;

  if (frame < 80) {
    cursorX = interpolate(frame, [30, 60], [200, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [30, 60], [400, 215], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 60 && frame <= 75;
  } else if (frame < 140) {
    cursorX = interpolate(frame, [90, 115], [140, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [90, 115], [215, 215], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 115 && frame <= 130;
  } else if (frame < 200) {
    cursorX = interpolate(frame, [140, 170], [60, 220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [140, 170], [215, 410], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 170 && frame <= 190;
  } else if (frame < 300) {
    cursorX = interpolate(frame, [200, 230], [220, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [200, 230], [410, 690], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 230 && frame <= 250;
  } else {
    cursorX = interpolate(frame, [310, 350], [200, 250], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    cursorY = interpolate(frame, [310, 350], [690, 840], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    isTapping = frame >= 350 && frame <= 380;
  }

  // Mobile bottom sheet opens at frame 180, closes at frame 260
  const sheetOpen = spring({
    frame: frame - 180,
    fps,
    config: { damping: 14, stiffness: 85 },
  });
  const showSheet = frame >= 180 && frame <= 265;

  // Rule Learned Toast pops at frame 270
  const toastPop = spring({
    frame: frame - 265,
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
        <PhoneMockup width={430} height={900} activeTab={frame >= 360 ? "plan" : "ledger"}>
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
