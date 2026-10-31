import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { TouchCursor } from "../components/TouchCursor";

export const Scene3Ledger: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Touch cursor moves to Chai Point category button at frame 70, taps at frame 90
  const cursorX = interpolate(frame, [40, 80], [300, 260], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY = interpolate(frame, [40, 80], [600, 390], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isTappingTx = frame >= 85 && frame <= 100;

  // Mobile bottom sheet opens at frame 100
  const sheetOpen = spring({
    frame: frame - 95,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // Tap on "Food" in bottom sheet at frame 150
  const cursorX2 = interpolate(frame, [120, 150], [260, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY2 = interpolate(frame, [120, 150], [390, 680], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isTappingCategory = frame >= 145 && frame <= 160;

  // Rule Learned Toast pops at frame 165
  const toastPop = spring({
    frame: frame - 160,
    fps,
    config: { damping: 12, stiffness: 75 },
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
      {/* Left: Interactive Phone Screen Operating Ledger */}
      <div style={{ transform: `scale(${enter})`, opacity: enter, position: "relative" }}>
        <PhoneMockup width={430} height={900} activeTab="ledger">
          {/* Mobile Ledger Screen Content */}
          <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden", position: "relative" }}>
            {/* Header */}
            <div>
              <div style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, textTransform: "uppercase" }}>
                Audited Double-Entry Register
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "2px 0 0 0" }}>Financial Transaction Ledger</h3>
            </div>

            {/* KPI Stat Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "10px 14px" }}>
                <div style={{ fontSize: "10px", color: "#94A3B8" }}>Total Outflows (Dr.)</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#EF4444", marginTop: "2px" }}>-₹1,553.00</div>
              </div>
              <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "10px 14px" }}>
                <div style={{ fontSize: "10px", color: "#94A3B8" }}>Net Liquidity</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#10B981", marginTop: "2px" }}>+₹3,447.00</div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: "6px", overflow: "hidden" }}>
              {["All (7)", "Food (3)", "Subs (2)", "Credit (1)"].map((chip, i) => (
                <span
                  key={i}
                  style={{
                    background: i === 0 ? "#10B981" : "rgba(18, 19, 26, 0.8)",
                    color: i === 0 ? "#000000" : "#94A3B8",
                    padding: "4px 10px",
                    borderRadius: "14px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* Transaction Cards List (Table 1 Mobile Formulation) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Row 1: Swiggy */}
              <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>Swiggy Food</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>31 Oct 2026 • Bank SMS</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: "#EF4444", fontSize: "14px" }}>-₹140.00</div>
                  <div style={{ fontSize: "10px", color: "#10B981" }}>🍔 Food</div>
                </div>
              </div>

              {/* Row 2: Netflix */}
              <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>Netflix India</div>
                  <div style={{ fontSize: "10px", color: "#F59E0B" }}>⚠️ Price Creep +30.1%</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: "#EF4444", fontSize: "14px" }}>-₹649.00</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>🎬 Entertainment</div>
                </div>
              </div>

              {/* Row 3: Chai Point (Target of Touch Correction) */}
              <div
                style={{
                  background: sheetOpen > 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(18, 19, 26, 0.9)",
                  border: sheetOpen > 0 ? "1px solid #10B981" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>Chai Point</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>29 Oct 2026 • SMS Debit</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: "#EF4444", fontSize: "14px" }}>-₹250.00</div>
                  <div style={{ fontSize: "10px", background: "#10B981", color: "#000000", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                    Food ▾
                  </div>
                </div>
              </div>

              {/* Row 4: Allowance Credit */}
              <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>Parent UPI Credit</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>28 Oct 2026 • Allowance</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: "#10B981", fontSize: "14px" }}>+₹5,000.00</div>
                  <div style={{ fontSize: "10px", color: "#10B981" }}>💵 Allowance</div>
                </div>
              </div>
            </div>

            {/* Native Mobile Bottom Sheet (Sliding Up on Tap) */}
            {sheetOpen > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "0px",
                  left: "0px",
                  right: "0px",
                  background: "#12131A",
                  borderTop: "2px solid rgba(255, 255, 255, 0.15)",
                  borderTopLeftRadius: "24px",
                  borderTopRightRadius: "24px",
                  padding: "16px 20px 80px 20px",
                  boxShadow: "0 -10px 40px rgba(0,0,0,0.9)",
                  transform: `translateY(${interpolate(sheetOpen, [0, 1], [250, 0])}px)`,
                  zIndex: 80,
                }}
              >
                <div style={{ width: "40px", height: "4px", background: "#2A2B36", borderRadius: "2px", margin: "0 auto 12px auto" }} />
                <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "4px" }}>Reclassify: Chai Point</div>
                <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "14px" }}>
                  Will create rule and replay on all matching past transactions
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {["🍔 Food (Dining & Snacks)", "🛵 Transport & Commute", "🎬 Entertainment", "📦 General Discretionary"].map((cat, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: idx === 0 ? "rgba(16, 185, 129, 0.2)" : "#090A0F",
                        border: idx === 0 ? "1px solid #10B981" : "1px solid rgba(255,255,255,0.06)",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: idx === 0 ? "#10B981" : "#FFFFFF",
                      }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learned Rule Success Toast */}
            {toastPop > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "14px",
                  right: "14px",
                  background: "#090A0F",
                  border: "1px solid #10B981",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                  transform: `scale(${toastPop}) translateY(${interpolate(toastPop, [0, 1], [-20, 0])}px)`,
                  opacity: toastPop,
                  zIndex: 95,
                }}
              >
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#10B981", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "13px" }}>
                  ✓
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "12px", color: "#FFFFFF" }}>Deterministic Rule Learned</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>Chai Point → Food replayed across <strong>8 historical transactions</strong>!</div>
                </div>
              </div>
            )}
          </div>

          {/* Animated Touch Cursor */}
          <TouchCursor
            x={frame < 120 ? cursorX : cursorX2}
            y={frame < 120 ? cursorY : cursorY2}
            isTapping={frame < 120 ? isTappingTx : isTappingCategory}
            visible={frame >= 35}
          />
        </PhoneMockup>
      </div>

      {/* Right: Industrial Architecture Callouts */}
      <div style={{ maxWidth: "620px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981", padding: "4px 14px", borderRadius: "12px", fontSize: "13px", color: "#10B981", fontWeight: 800, width: "fit-content" }}>
          SECTION 02 • AUDITED TABLE 1 & REPLAY
        </div>

        <h2 style={{ fontSize: "48px", fontWeight: 800, margin: 0, letterSpacing: "-1px" }}>
          Integer-Paise Ledger & Self-Learning Rule Replay
        </h2>

        <p style={{ fontSize: "18px", color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>
          PulseLedger eliminates floating-point drift by storing every value strictly in integer paise. When you
          correct any merchant tag, our deterministic engine replays the rule across all past records instantly.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "rgba(18, 19, 26, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#10B981" }}>🔁 Autonomous Rule Replay</div>
            <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>
              Categorize once, never repeat. The rulebook remembers merchants and automatically maintains clean ledger registers.
            </div>
          </div>

          <div style={{ background: "rgba(18, 19, 26, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#F59E0B" }}>📈 Subscription Creep Detector</div>
            <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>
              Alerts you immediately when a recurring subscription silently increases price (e.g. Netflix +30.1% spike).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
