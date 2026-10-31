import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { TouchCursor } from "../components/TouchCursor";

export const Scene2Overview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Notification drops at frame 60
  const showNotification = frame >= 60 && frame <= 220;
  const notifText = showNotification ? "Bank SMS: ₹140 Swiggy" : null;
  const notifSub = showNotification ? "Canara Bank • Parsed into Food category" : null;

  // Touch cursor movements:
  // Moves to Quick Spend button at frame 150, taps at frame 180
  const cursorX = interpolate(frame, [120, 160], [250, 210], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY = interpolate(frame, [120, 160], [600, 480], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isTapping = frame >= 170 && frame <= 190;

  // Goal ripple card pop at frame 190
  const rippleProgress = spring({
    frame: frame - 185,
    fps,
    config: { damping: 12, stiffness: 80 },
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
      {/* Left: Interactive Phone Screen Operating Overview */}
      <div style={{ transform: `scale(${enter})`, opacity: enter, position: "relative" }}>
        <PhoneMockup
          width={430}
          height={900}
          activeTab="home"
          notificationText={notifText}
          notificationSub={notifSub}
        >
          {/* Mobile Screen Content */}
          <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px", overflow: "hidden" }}>
            {/* Top User Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1E1F2A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#10B981" }}>
                  A
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>Aarav</div>
                  <div style={{ fontSize: "11px", color: "#94A3B8" }}>Student / Intern</div>
                </div>
              </div>

              <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", color: "#10B981", fontWeight: 700 }}>
                Allowance Regime
              </div>
            </div>

            {/* Central Safe-to-Spend Dial Card */}
            <div
              style={{
                background: "rgba(18, 19, 26, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "22px",
                padding: "20px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
                Autonomous Safe-to-Spend Today
              </div>

              <div style={{ fontSize: "52px", fontWeight: 900, color: "#FFFFFF", margin: "10px 0 4px 0", letterSpacing: "-1px" }}>
                ₹3,447
              </div>

              <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>
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
                background: "rgba(18, 19, 26, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "18px",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                Simulate Discretionary Spend
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <div
                  style={{
                    flex: 1,
                    background: "#090A0F",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "#FFFFFF",
                  }}
                >
                  ₹1,200 (Dinner with Friends)
                </div>
                <button
                  style={{
                    background: "#10B981",
                    color: "#000000",
                    border: "none",
                    borderRadius: "10px",
                    padding: "0 14px",
                    fontWeight: 800,
                    fontSize: "12px",
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
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid #F59E0B",
                    borderRadius: "12px",
                    padding: "12px",
                    transform: `scale(${rippleProgress})`,
                    opacity: rippleProgress,
                  }}
                >
                  <div style={{ color: "#F59E0B", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>
                    ⚠️ Goal Ripple Delay
                  </div>
                  <div style={{ fontSize: "12px", color: "#FFFFFF", marginTop: "4px", lineHeight: 1.4 }}>
                    This ₹1,200 spend delays your <strong>Laptop Fund</strong> by <strong>2 days</strong>.
                  </div>
                </div>
              )}
            </div>

            {/* Recent Reconciled List */}
            <div
              style={{
                background: "rgba(18, 19, 26, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "18px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>
                Recent Reconciled Activity
              </div>

              {[
                { payee: "Swiggy", tag: "Food", amt: "-₹140.00", color: "#EF4444" },
                { payee: "Allowance", tag: "UPI", amt: "+₹5,000.00", color: "#10B981" },
              ].map((tx, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{tx.payee}</div>
                    <div style={{ fontSize: "10px", color: "#94A3B8" }}>{tx.tag}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: tx.color }}>{tx.amt}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Animated Touch Cursor */}
          <TouchCursor x={cursorX} y={cursorY} isTapping={isTapping} visible={frame >= 110} />
        </PhoneMockup>
      </div>

      {/* Right: Industrial Architecture Callouts */}
      <div style={{ maxWidth: "620px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10B981", padding: "4px 14px", borderRadius: "12px", fontSize: "13px", color: "#10B981", fontWeight: 800, width: "fit-content" }}>
          SECTION 01 • OVERVIEW & INGESTION
        </div>

        <h2 style={{ fontSize: "48px", fontWeight: 800, margin: 0, letterSpacing: "-1px" }}>
          Living Financial Pulse & Zero-Touch SMS Sync
        </h2>

        <p style={{ fontSize: "18px", color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>
          Instead of outdated monthly budgets that fail on daily realities, PulseLedger continuously computes your
          <strong> Safe-to-Spend limit</strong> based on upcoming bills and liquid cash.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "rgba(18, 19, 26, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#10B981" }}>⚡ Instant SMS Ingestion</div>
            <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>
              Bank SMS parsed locally via regex and fuzzy matching in milliseconds — zero cloud storage.
            </div>
          </div>

          <div style={{ background: "rgba(18, 19, 26, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#F59E0B" }}>⚠️ Goal Ripple Engine</div>
            <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>
              Quantifies exact opportunity cost: simulates how many days any discretionary purchase delays your life goals.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
