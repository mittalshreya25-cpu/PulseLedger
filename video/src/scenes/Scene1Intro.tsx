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

  const textFade = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const iconGlow = Math.sin(frame / 12) * 0.25 + 0.75;

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle at 50% 50%, #0D0E15 0%, #06070A 60%, #000000 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 100px",
        gap: "90px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle Studio Spotlight in Background */}
      <div
        style={{
          position: "absolute",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
          transform: `scale(${iconGlow})`,
          pointerEvents: "none",
        }}
      />

      {/* Center-Left: The Smartphone Running the Splash Screen */}
      <div
        style={{
          transform: `translateY(${interpolate(phoneRise, [0, 1], [300, 0])}px)`,
          opacity: phoneRise,
          zIndex: 10,
        }}
      >
        <PhoneMockup width={420} height={880} activeTab="home">
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
            {/* Pulsing Luminous App Icon */}
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "28px",
                background: "linear-gradient(135deg, #10B981 0%, #047857 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "44px",
                color: "#FFFFFF",
                boxShadow: `0 12px 40px rgba(16, 185, 129, ${iconGlow * 0.7})`,
                marginBottom: "24px",
              }}
            >
              ⚡
            </div>

            <h2 style={{ fontSize: "36px", fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-1px" }}>
              PulseLedger
            </h2>

            <p style={{ fontSize: "14px", color: "#94A3B8", margin: "0 0 24px 0", lineHeight: 1.5 }}>
              Autonomous Financial Workstation
            </p>

            <div
              style={{
                background: "rgba(18, 19, 26, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#10B981",
              }}
            >
              ● Local-First Engine Active
            </div>
          </div>
        </PhoneMockup>
      </div>

      {/* Center-Right: Industrial Presentation Typography */}
      <div
        style={{
          maxWidth: "680px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          transform: `translateY(${interpolate(textFade, [0, 1], [40, 0])}px)`,
          opacity: textFade,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 800,
            color: "#10B981",
            width: "fit-content",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          📱 MOBILE-FIRST FINTECH ARCHITECTURE
        </div>

        <h1
          style={{
            fontSize: "68px",
            fontWeight: 800,
            lineHeight: 1.05,
            margin: 0,
            letterSpacing: "-2px",
            background: "linear-gradient(135deg, #FFFFFF 30%, #E2E8F0 70%, #94A3B8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Autonomous. Private. Designed for your Phone.
        </h1>

        <p style={{ fontSize: "22px", color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>
          Experience personal finance without the cloud. PulseLedger brings institutional-grade double-entry
          accounting, stochastic forecasting, and local AI directly to your smartphone.
        </p>

        {/* Feature Highlights Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
          {[
            { title: "🛡️ Zero-Cloud Privacy", desc: "No third-party server telemetry" },
            { title: "⚡ Integer-Paise Precision", desc: "Zero floating-point rounding bugs" },
            { title: "📈 365-Day Monte Carlo", desc: "1,000 runs probabilistic fan cone" },
            { title: "🤖 SEBI-Guarded Local SLM", desc: "Compliant on-device intelligence" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: "rgba(18, 19, 26, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "14px 18px",
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF" }}>{item.title}</div>
              <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
