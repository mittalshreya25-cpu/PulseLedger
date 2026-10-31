import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";

export const Scene6Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phonePop = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const textFade = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle at 50% 40%, #0B2B26 0%, #051F20 70%, #020E0E 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "80px",
        padding: "60px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#DAF1DE",
        position: "relative",
      }}
    >
      {/* Left: Mobile Phone Experience */}
      <div style={{ transform: `scale(${phonePop})`, opacity: phonePop, zIndex: 10 }}>
        <PhoneMockup scale={1.05}>
          <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            <div>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: "16px" }}>PulseLedger</span>
                <span style={{ fontSize: "11px", background: "rgba(142, 182, 155, 0.2)", padding: "2px 8px", borderRadius: "10px", color: "#8EB69B" }}>
                  Mobile Native
                </span>
              </div>

              {/* Main Gauge */}
              <div style={{ textAlign: "center", margin: "30px 0 20px 0" }}>
                <div style={{ fontSize: "12px", color: "#8EB69B", textTransform: "uppercase", letterSpacing: "1px" }}>Safe-to-Spend Today</div>
                <div style={{ fontSize: "42px", fontWeight: 900, color: "#FFFFFF", margin: "6px 0" }}>₹3,447</div>
                <div style={{ fontSize: "12px", color: "#52B788" }}>● 0.0% Shortfall Risk</div>
              </div>

              {/* Card List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ background: "rgba(22, 56, 50, 0.7)", borderRadius: "12px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>Swiggy Food</div>
                    <div style={{ fontSize: "10px", color: "rgba(218, 241, 222, 0.6)" }}>Bank SMS Parsed</div>
                  </div>
                  <span style={{ fontWeight: 700, color: "#FF5F56", fontSize: "13px" }}>-₹140.00</span>
                </div>

                <div style={{ background: "rgba(22, 56, 50, 0.7)", borderRadius: "12px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>Allowance Credit</div>
                    <div style={{ fontSize: "10px", color: "rgba(218, 241, 222, 0.6)" }}>UPI Received</div>
                  </div>
                  <span style={{ fontWeight: 700, color: "#52B788", fontSize: "13px" }}>+₹5,000.00</span>
                </div>
              </div>
            </div>

            {/* Floating Navigation Dock */}
            <div
              style={{
                background: "rgba(11, 43, 38, 0.95)",
                border: "1px solid rgba(218, 241, 222, 0.25)",
                borderRadius: "30px",
                padding: "8px 14px",
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                fontSize: "11px",
                fontWeight: 600,
                boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
              }}
            >
              <span style={{ color: "#8EB69B" }}>Overview</span>
              <span style={{ color: "rgba(218, 241, 222, 0.5)" }}>Ledger</span>
              <span style={{ color: "rgba(218, 241, 222, 0.5)" }}>Plan</span>
              <span style={{ color: "rgba(218, 241, 222, 0.5)" }}>Coach</span>
            </div>
          </div>
        </PhoneMockup>
      </div>

      {/* Right: Closing Branding & GitHub Callout */}
      <div
        style={{
          maxWidth: "700px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          transform: `translateY(${interpolate(textFade, [0, 1], [30, 0])}px)`,
          opacity: textFade,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(142, 182, 155, 0.15)",
            border: "1px solid rgba(218, 241, 222, 0.3)",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#8EB69B",
            width: "fit-content",
          }}
        >
          📱 MOBILE & DESKTOP DUAL EXPERIENCE
        </div>

        <h1
          style={{
            fontSize: "64px",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-1.5px",
            background: "linear-gradient(135deg, #FFFFFF 20%, #DAF1DE 60%, #8EB69B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Autonomous. Private. Beautiful.
        </h1>

        <p style={{ fontSize: "20px", color: "rgba(218, 241, 222, 0.8)", lineHeight: 1.5, margin: 0 }}>
          Designed for seamless mobile touch interactions on your phone and high-density financial workstation views on your desktop.
        </p>

        {/* GitHub Card */}
        <div
          style={{
            background: "rgba(11, 43, 38, 0.8)",
            border: "1px solid rgba(218, 241, 222, 0.25)",
            borderRadius: "16px",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#DAF1DE" }}>Open Source on GitHub</span>
            <span style={{ background: "#163832", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", color: "#8EB69B", fontWeight: 600 }}>
              MIT License
            </span>
          </div>
          <div style={{ fontSize: "16px", color: "#52B788", fontFamily: "monospace", wordBreak: "break-all" }}>
            https://github.com/mittalshreya25-cpu/PulseLedger.git
          </div>
          <div style={{ fontSize: "13px", color: "rgba(218, 241, 222, 0.6)" }}>
            Maintained by: <strong>mittalshreya2517@gmail.com</strong>
          </div>
        </div>

        <div style={{ fontSize: "15px", color: "rgba(218, 241, 222, 0.6)" }}>
          Built with React, Vite, FastAPI, NumPy, SQLite & Ollama SLM.
        </div>
      </div>
    </div>
  );
};
