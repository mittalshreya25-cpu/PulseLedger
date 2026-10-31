import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DesktopFrame } from "../components/DesktopFrame";

export const Scene2Overview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Animated SMS incoming at frame 150
  const smsProgress = spring({
    frame: frame - 60,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // Goal ripple card pop at frame 300
  const rippleProgress = spring({
    frame: frame - 180,
    fps,
    config: { damping: 12, stiffness: 70 },
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
          PILLAR 01
        </span>
        <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#FFFFFF" }}>
          The Overview Dashboard: Safe-to-Spend & Autonomous SMS Sync
        </h2>
      </div>

      <div style={{ transform: `scale(${enter})`, opacity: enter, marginTop: "40px" }}>
        <DesktopFrame width={1640} height={920} title="PulseLedger / Overview / Aarav (Student/Intern)">
          <div style={{ flex: 1, display: "flex", height: "100%" }}>
            {/* Left Mini Sidebar */}
            <div
              style={{
                width: "240px",
                background: "#08211E",
                borderRight: "1px solid rgba(218, 241, 222, 0.1)",
                padding: "20px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#163832", display: "flex", alignItems: "center", justifyContent: "center", color: "#8EB69B", fontWeight: 700 }}>
                  A
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>Aarav</div>
                  <div style={{ fontSize: "11px", color: "#8EB69B" }}>Student / Intern</div>
                </div>
              </div>

              {[
                { label: "Overview", active: true, icon: "📊" },
                { label: "Ledger & Subs", active: false, icon: "📑" },
                { label: "Plan & What-If", active: false, icon: "📈" },
                { label: "Coach & Review", active: false, icon: "🤖" },
              ].map((tab, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: tab.active ? "rgba(142, 182, 155, 0.2)" : "transparent",
                    color: tab.active ? "#DAF1DE" : "rgba(218, 241, 222, 0.6)",
                    border: tab.active ? "1px solid rgba(142, 182, 155, 0.4)" : "none",
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              ))}

              <div style={{ marginTop: "auto", borderTop: "1px solid rgba(218, 241, 222, 0.1)", paddingTop: "14px" }}>
                <div style={{ fontSize: "11px", color: "#8EB69B", textTransform: "uppercase", fontWeight: 700 }}>
                  Zero-Cloud Security
                </div>
                <div style={{ fontSize: "12px", color: "#52B788", marginTop: "4px" }}>
                  ● SEBI 3-Layer Active
                </div>
              </div>
            </div>

            {/* Center Content Workspace */}
            <div style={{ flex: 1, padding: "24px 30px", display: "flex", flexDirection: "column", gap: "20px", overflow: "hidden" }}>
              {/* Header Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{ background: "rgba(142, 182, 155, 0.15)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", color: "#8EB69B", border: "1px solid rgba(218, 241, 222, 0.2)" }}>
                    Allowance Regime
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(218, 241, 222, 0.7)" }}>Today: Oct 31, 2026</div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <span style={{ background: "#163832", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>🌙 Dark</span>
                  <span style={{ background: "transparent", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", color: "rgba(218, 241, 222, 0.6)" }}>☀️ Light</span>
                </div>
              </div>

              {/* Top Hero Cards: Safe-to-Spend & Ripple Calculator */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
                {/* Safe-to-Spend Gauge Card */}
                <div
                  style={{
                    background: "rgba(11, 43, 38, 0.6)",
                    border: "1px solid rgba(218, 241, 222, 0.15)",
                    borderRadius: "18px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", color: "#8EB69B", textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px" }}>
                      Autonomous Daily Safe-to-Spend
                    </span>
                    <span style={{ fontSize: "12px", background: "rgba(82, 183, 136, 0.2)", color: "#52B788", padding: "2px 8px", borderRadius: "6px" }}>
                      Healthy Reserve
                    </span>
                  </div>

                  <div style={{ margin: "20px 0" }}>
                    <div style={{ fontSize: "56px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-1px" }}>
                      ₹3,447
                    </div>
                    <div style={{ fontSize: "14px", color: "rgba(218, 241, 222, 0.7)", marginTop: "4px" }}>
                      Calm daily velocity based on 7 reconciled movements
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span>Spent Today: ₹1,553</span>
                      <span>Total Available: ₹5,000</span>
                    </div>
                    <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "31%", height: "100%", background: "#52B788", borderRadius: "4px" }} />
                    </div>
                  </div>
                </div>

                {/* Quick Spend & Goal Ripple */}
                <div
                  style={{
                    background: "rgba(11, 43, 38, 0.6)",
                    border: "1px solid rgba(218, 241, 222, 0.15)",
                    borderRadius: "18px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#8EB69B", textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px" }}>
                    Instant Goal Ripple Impact
                  </span>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1, background: "rgba(5, 31, 32, 0.8)", border: "1px solid rgba(218, 241, 222, 0.2)", borderRadius: "8px", padding: "10px 14px", fontSize: "14px" }}>
                      ₹1,200 (Dinner with Friends)
                    </div>
                    <button style={{ background: "#8EB69B", color: "#051F20", border: "none", borderRadius: "8px", padding: "0 18px", fontWeight: 700, fontSize: "13px" }}>
                      Simulate
                    </button>
                  </div>

                  {/* Simulated Ripple Pop-up */}
                  <div
                    style={{
                      background: "rgba(243, 156, 18, 0.15)",
                      border: "1px solid #F39C12",
                      borderRadius: "12px",
                      padding: "14px",
                      transform: `scale(${rippleProgress})`,
                      opacity: rippleProgress,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#F39C12", fontWeight: 700, fontSize: "13px" }}>
                      <span>⚠️ Goal Delay Forecast:</span>
                    </div>
                    <div style={{ fontSize: "13px", marginTop: "4px", color: "#DAF1DE", lineHeight: 1.4 }}>
                      This ₹1,200 purchase shifts your <strong>Primary Laptop Fund goal</strong> by approximately <strong>2 days</strong>.
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Category Pills */}
              <div style={{ background: "rgba(11, 43, 38, 0.4)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(218, 241, 222, 0.1)" }}>
                <div style={{ fontSize: "12px", color: "#8EB69B", fontWeight: 600, marginBottom: "8px" }}>
                  Quick Discretionary Tags
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {["🍔 Swiggy (Food)", "🛵 Rapido (Transport)", "🎬 Netflix (Sub)", "☕ Chai Point (Food)", "📦 Amazon (Shopping)"].map((tag, i) => (
                    <span key={i} style={{ background: "#163832", padding: "6px 12px", borderRadius: "8px", fontSize: "12px" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Live Ingestion Feed Rail */}
            <div
              style={{
                width: "360px",
                background: "#08211E",
                borderLeft: "1px solid rgba(218, 241, 222, 0.1)",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "15px" }}>Live Ingestion Feed</span>
                <span style={{ fontSize: "11px", color: "#52B788", background: "rgba(82, 183, 136, 0.2)", padding: "2px 8px", borderRadius: "4px" }}>
                  ● Real-Time
                </span>
              </div>

              {/* Feed Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Incoming animated SMS */}
                <div
                  style={{
                    background: "rgba(142, 182, 155, 0.2)",
                    border: "1px solid #8EB69B",
                    borderRadius: "12px",
                    padding: "12px",
                    transform: `translateX(${interpolate(smsProgress, [0, 1], [40, 0])}px)`,
                    opacity: smsProgress,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#52B788", fontWeight: 700 }}>
                    <span>⚡ Bank SMS Parsed</span>
                    <span>Just Now</span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "4px" }}>₹140 Swiggy debit</div>
                  <div style={{ fontSize: "11px", color: "rgba(218, 241, 222, 0.7)" }}>Canara Bank • Categorized: Food</div>
                </div>

                <div style={{ background: "rgba(11, 43, 38, 0.6)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(218, 241, 222, 0.1)" }}>
                  <div style={{ fontSize: "12px", color: "#8EB69B", fontWeight: 600 }}>Rule Engine Active</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>Learned rule replayed 8 transactions</div>
                  <div style={{ fontSize: "11px", color: "rgba(218, 241, 222, 0.6)" }}>Chai Point → Food</div>
                </div>

                <div style={{ background: "rgba(11, 43, 38, 0.6)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(218, 241, 222, 0.1)" }}>
                  <div style={{ fontSize: "12px", color: "#F39C12", fontWeight: 600 }}>⚠️ Subscription Alert</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>Netflix price jumped +30.1%</div>
                  <div style={{ fontSize: "11px", color: "rgba(218, 241, 222, 0.6)" }}>₹499 → ₹649 • 1h ago</div>
                </div>

                <div style={{ background: "rgba(11, 43, 38, 0.6)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(218, 241, 222, 0.1)" }}>
                  <div style={{ fontSize: "12px", color: "#52B788", fontWeight: 600 }}>Credit Reconciled</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>Allowance credited +₹5,000.00</div>
                  <div style={{ fontSize: "11px", color: "rgba(218, 241, 222, 0.6)" }}>Parent UPI • 3d ago</div>
                </div>
              </div>
            </div>
          </div>
        </DesktopFrame>
      </div>
    </div>
  );
};
