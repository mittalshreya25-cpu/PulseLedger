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
    frame: frame - 20,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

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
        gap: "90px",
        padding: "60px 100px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#FFFFFF",
        position: "relative",
      }}
    >
      {/* Left: The Titanium Smartphone in Active State */}
      <div style={{ transform: `scale(${phonePop})`, opacity: phonePop, zIndex: 10 }}>
        <PhoneMockup width={420} height={880} activeTab="home">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: "16px" }}>PulseLedger</span>
              <span style={{ fontSize: "10px", background: "rgba(16, 185, 129, 0.2)", color: "#10B981", padding: "3px 8px", borderRadius: "10px", fontWeight: 700 }}>
                Mobile Native
              </span>
            </div>

            <div style={{ textAlign: "center", margin: "24px 0 10px 0" }}>
              <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px" }}>Safe-to-Spend Today</div>
              <div style={{ fontSize: "48px", fontWeight: 900, color: "#FFFFFF", margin: "6px 0" }}>₹3,447</div>
              <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>● All Engines Reconciled Locally</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "12px", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>Swiggy Food</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>Parsed Bank SMS</div>
                </div>
                <div style={{ fontWeight: 800, color: "#EF4444" }}>-₹140.00</div>
              </div>

              <div style={{ background: "rgba(18, 19, 26, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "12px", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>Parent Allowance</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>Reconciled UPI</div>
                </div>
                <div style={{ fontWeight: 800, color: "#10B981" }}>+₹5,000.00</div>
              </div>
            </div>
          </div>
        </PhoneMockup>
      </div>

      {/* Right: Closing Branding & GitHub Callout */}
      <div
        style={{
          maxWidth: "680px",
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
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid #10B981",
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
          📱 NATIVE MOBILE EXPERIENCE
        </div>

        <h1
          style={{
            fontSize: "64px",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-1.5px",
            background: "linear-gradient(135deg, #FFFFFF 30%, #E2E8F0 70%, #94A3B8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Autonomous. Private. Built for your Life.
        </h1>

        <p style={{ fontSize: "20px", color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>
          Designed for seamless mobile touch interactions on your phone, backed by audited double-entry registers,
          stochastic simulations, and local AI intelligence.
        </p>

        {/* GitHub Card */}
        <div
          style={{
            background: "rgba(18, 19, 26, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "18px",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Open Source on GitHub</span>
            <span style={{ background: "#10B981", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", color: "#000000", fontWeight: 800 }}>
              MIT License
            </span>
          </div>
          <div style={{ fontSize: "15px", color: "#10B981", fontFamily: "monospace", wordBreak: "break-all" }}>
            https://github.com/mittalshreya25-cpu/PulseLedger.git
          </div>
          <div style={{ fontSize: "13px", color: "#94A3B8" }}>
            Maintained by: <strong style={{ color: "#FFFFFF" }}>mittalshreya2517@gmail.com</strong>
          </div>
        </div>

        <div style={{ fontSize: "14px", color: "#64748B" }}>
          Stack: React, Vite, FastAPI, NumPy, SQLite & Ollama SLM.
        </div>
      </div>
    </div>
  );
};
