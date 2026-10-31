import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneRise = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 70 },
  });

  const iconGlow = Math.sin(frame / 12) * 0.25 + 0.75;

  // At frame 120 (4s), the splash screen unlocks into the live Overview screen!
  const hasUnlocked = frame >= 120;
  const unlockProgress = spring({
    frame: frame - 120,
    fps,
    config: { damping: 14, stiffness: 80 },
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
        overflow: "hidden",
      }}
    >
      {/* Background Ambient Glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "20%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
          transform: `scale(${iconGlow})`,
          pointerEvents: "none",
        }}
      />

      {/* Center-Left: The Smartphone Operating (Splash -> Live App) */}
      <div
        style={{
          transform: `translateY(${interpolate(phoneRise, [0, 1], [250, 0])}px)`,
          opacity: 1,
          zIndex: 10,
        }}
      >
        <PhoneMockup width={430} height={900} activeTab="home">
          {!hasUnlocked ? (
            /* Splash Screen (First 4 Seconds) */
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "28px",
                  background: "linear-gradient(135deg, #10B981 0%, #047857 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "48px",
                  color: "#FFFFFF",
                  boxShadow: `0 14px 45px rgba(16, 185, 129, ${iconGlow * 0.8})`,
                  marginBottom: "24px",
                }}
              >
                ⚡
              </div>

              <h2 style={{ fontSize: "38px", fontWeight: 900, margin: "0 0 8px 0", letterSpacing: "-1px", color: "#FFFFFF" }}>
                PulseLedger
              </h2>

              <p style={{ fontSize: "15px", color: "#E2E8F0", margin: "0 0 24px 0", lineHeight: 1.5, fontWeight: 500 }}>
                Autonomous Financial Workstation
              </p>

              <div
                style={{
                  background: "#12141F",
                  border: "1px solid #10B981",
                  padding: "8px 18px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#10B981",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.2)",
                }}
              >
                ● Initializing Local Sandbox...
              </div>
            </div>
          ) : (
            /* Unlocked Live App Overview Screen (Operated on Phone) */
            <div
              style={{
                flex: 1,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                transform: `scale(${interpolate(unlockProgress, [0, 1], [0.92, 1])})`,
                opacity: unlockProgress,
              }}
            >
              {/* User Header */}
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
                  Active Allowance
                </div>
              </div>

              {/* Main Gauge Card */}
              <div
                style={{
                  background: "#12141F",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "22px",
                  padding: "22px 18px",
                  textAlign: "center",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
                }}
              >
                <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }}>
                  Safe-to-Spend Limit Today
                </div>
                <div style={{ fontSize: "52px", fontWeight: 900, color: "#FFFFFF", margin: "8px 0 2px 0", letterSpacing: "-1px" }}>
                  ₹3,447
                </div>
                <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 700 }}>
                  ● 0.0% Shortfall Risk Reconciled
                </div>
              </div>

              {/* Quick Action Activity */}
              <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "18px", padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", color: "#CBD5E1", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
                  Recent Local Movements
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#FFFFFF" }}>Swiggy Food</div>
                    <div style={{ fontSize: "10px", color: "#94A3B8" }}>Parsed Bank SMS</div>
                  </div>
                  <div style={{ fontWeight: 800, color: "#EF4444" }}>-₹140.00</div>
                </div>
              </div>
            </div>
          )}
        </PhoneMockup>
      </div>

      {/* Center-Right: Ultra-Crisp High-Contrast Presentation Typography */}
      <div
        style={{
          maxWidth: "680px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          zIndex: 10,
          opacity: 1, // Full opacity - 100% visible immediately!
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
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
          📱 NATIVE MOBILE APPLICATION
        </div>

        <h1
          style={{
            fontSize: "66px",
            fontWeight: 900,
            lineHeight: 1.08,
            margin: 0,
            letterSpacing: "-2px",
            color: "#FFFFFF",
            textShadow: "0 4px 30px rgba(0, 0, 0, 0.9)",
          }}
        >
          Autonomous. Private. Designed for your Phone.
        </h1>

        <p style={{ fontSize: "22px", color: "#F1F5F9", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
          Experience personal finance without the cloud. PulseLedger brings institutional-grade double-entry
          accounting, stochastic forecasting, and local AI directly to your smartphone.
        </p>

        {/* Feature Highlights Grid - High Contrast Bright Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "8px" }}>
          {[
            { title: "🛡️ Zero-Cloud Privacy", desc: "100% on-device local sandbox. Zero telemetry." },
            { title: "⚡ Integer-Paise Math", desc: "Strict double-entry accounting with zero rounding bugs." },
            { title: "📈 365-Day Monte Carlo", desc: "1,000 stochastic runs modeling cash-flow trajectory." },
            { title: "🤖 SEBI-Guarded Local SLM", desc: "Compliant on-device AI financial coach." },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: "#161824",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "16px",
                padding: "16px 20px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF" }}>{item.title}</div>
              <div style={{ fontSize: "13px", color: "#CBD5E1", marginTop: "6px", lineHeight: 1.4, fontWeight: 500 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
