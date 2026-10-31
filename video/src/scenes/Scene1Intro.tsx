import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const subtitleProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const deviceSlide = spring({
    frame: frame - 45,
    fps,
    config: { damping: 16, stiffness: 70 },
  });

  const glowPulse = Math.sin(frame / 15) * 0.2 + 0.8;

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle at 50% 30%, #0B2B26 0%, #051F20 70%, #020E0E 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#DAF1DE",
        overflow: "hidden",
      }}
    >
      {/* Background Ambient Glow Halo */}
      <div
        style={{
          position: "absolute",
          width: "900px",
          height: "900px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(142, 182, 155, 0.12) 0%, transparent 70%)",
          transform: `scale(${glowPulse})`,
          pointerEvents: "none",
        }}
      />

      {/* Main Title Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          transform: `scale(${titleProgress})`,
          opacity: titleProgress,
          zIndex: 10,
        }}
      >
        {/* Brand Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(142, 182, 155, 0.15)",
            border: "1px solid rgba(218, 241, 222, 0.3)",
            padding: "8px 20px",
            borderRadius: "30px",
            fontSize: "14px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            fontWeight: 700,
            color: "#8EB69B",
            marginBottom: "24px",
            boxShadow: "0 0 20px rgba(142, 182, 155, 0.2)",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#52B788" }} />
          Local-First Autonomous Finance • v2.4 Pro
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontSize: "88px",
            fontWeight: 800,
            margin: "0 0 16px 0",
            letterSpacing: "-2px",
            background: "linear-gradient(135deg, #FFFFFF 20%, #DAF1DE 60%, #8EB69B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 10px 40px rgba(0,0,0,0.6)",
          }}
        >
          PulseLedger
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "28px",
            maxWidth: "950px",
            lineHeight: 1.4,
            color: "rgba(218, 241, 222, 0.8)",
            margin: 0,
            transform: `translateY(${interpolate(subtitleProgress, [0, 1], [30, 0])}px)`,
            opacity: subtitleProgress,
          }}
        >
          The calm, audited personal finance workstation engineered for zero-cloud privacy,
          deterministic double-entry math, and guarded local intelligence.
        </p>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            gap: "18px",
            marginTop: "36px",
            transform: `translateY(${interpolate(subtitleProgress, [0, 1], [40, 0])}px)`,
            opacity: subtitleProgress,
          }}
        >
          {[
            "🛡️ 100% Zero-Cloud Privacy",
            "⚡ Integer-Paise Reconciled",
            "📈 365-Day Monte Carlo",
            "🤖 SEBI-Guarded Local SLM",
            "📱 Desktop & Mobile First",
          ].map((feat, i) => (
            <div
              key={i}
              style={{
                background: "rgba(11, 43, 38, 0.7)",
                border: "1px solid rgba(218, 241, 222, 0.2)",
                padding: "10px 18px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 600,
                color: "#DAF1DE",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              }}
            >
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Floating Device Showcase: Desktop and Phone */}
      <div
        style={{
          position: "absolute",
          bottom: "-140px",
          display: "flex",
          gap: "40px",
          alignItems: "flex-end",
          transform: `translateY(${interpolate(deviceSlide, [0, 1], [300, 0])}px)`,
          opacity: deviceSlide,
          zIndex: 5,
        }}
      >
        <PhoneMockup scale={0.75}>
          <div style={{ textAlign: "center", paddingTop: "20px" }}>
            <div style={{ fontSize: "14px", color: "#8EB69B", textTransform: "uppercase" }}>PulseLedger Mobile</div>
            <div style={{ fontSize: "32px", fontWeight: 700, margin: "12px 0", color: "#FFFFFF" }}>₹3,447</div>
            <div style={{ fontSize: "13px", color: "rgba(218, 241, 222, 0.7)" }}>Safe to Spend Today</div>
            <div
              style={{
                marginTop: "30px",
                background: "rgba(22, 56, 50, 0.7)",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "12px", color: "#8EB69B" }}>Live SMS Stream</div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "4px" }}>₹140 Swiggy debit parsed</div>
            </div>
          </div>
        </PhoneMockup>
      </div>
    </div>
  );
};
