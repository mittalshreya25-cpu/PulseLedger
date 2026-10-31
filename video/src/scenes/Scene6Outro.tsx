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
        gap: "90px",
        padding: "60px 100px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#FFFFFF",
        position: "relative",
      }}
    >
      {/* Background Spotlight */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "25%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Left: The Titanium Smartphone in Active State */}
      <div style={{ transform: `scale(${phonePop})`, opacity: 1, zIndex: 10 }}>
        <PhoneMockup width={430} height={900} activeTab="home">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 900, fontSize: "16px", color: "#FFFFFF" }}>PulseLedger</span>
              <span style={{ fontSize: "11px", background: "#10B981", color: "#000000", padding: "3px 10px", borderRadius: "10px", fontWeight: 900 }}>
                Mobile Native
              </span>
            </div>

            <div style={{ textAlign: "center", margin: "24px 0 10px 0" }}>
              <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }}>Safe-to-Spend Today</div>
              <div style={{ fontSize: "50px", fontWeight: 900, color: "#FFFFFF", margin: "6px 0" }}>₹3,447</div>
              <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 700 }}>● Reconciled Integer-Paise Math</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "14px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "13px", color: "#FFFFFF" }}>Swiggy Food</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>Parsed Bank SMS</div>
                </div>
                <div style={{ fontWeight: 900, color: "#EF4444" }}>-₹140.00</div>
              </div>

              <div style={{ background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "14px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "13px", color: "#FFFFFF" }}>Parent Allowance</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>Reconciled UPI</div>
                </div>
                <div style={{ fontWeight: 900, color: "#10B981" }}>+₹5,000.00</div>
              </div>
            </div>
          </div>
        </PhoneMockup>
      </div>

      {/* Right: Closing Branding & GitHub Callout (100% VISIBLE, CRISP, HIGH CONTRAST) */}
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
          📱 NATIVE MOBILE EXPERIENCE
        </div>

        <h1
          style={{
            fontSize: "64px",
            fontWeight: 900,
            margin: 0,
            letterSpacing: "-2px",
            color: "#FFFFFF",
            lineHeight: 1.1,
            textShadow: "0 4px 30px rgba(0, 0, 0, 0.9)",
          }}
        >
          Autonomous. Private. Built for your Life.
        </h1>

        <p style={{ fontSize: "22px", color: "#F1F5F9", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
          Designed for seamless mobile touch interactions on your phone, backed by audited double-entry registers,
          stochastic simulations, and local AI intelligence.
        </p>

        {/* GitHub Card - Ultra High Contrast */}
        <div
          style={{
            background: "#161824",
            border: "2px solid #10B981",
            borderRadius: "20px",
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 12px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF" }}>Open Source on GitHub</span>
            <span style={{ background: "#10B981", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", color: "#000000", fontWeight: 900 }}>
              MIT License
            </span>
          </div>

          <div style={{ fontSize: "18px", color: "#34D399", fontFamily: "monospace", fontWeight: 700, wordBreak: "break-all" }}>
            https://github.com/mittalshreya25-cpu/PulseLedger.git
          </div>

          <div style={{ fontSize: "15px", color: "#F1F5F9", fontWeight: 500, borderTop: "1px solid rgba(255, 255, 255, 0.12)", paddingTop: "10px" }}>
            Maintained by: <strong style={{ color: "#FFFFFF", fontWeight: 800 }}>mittalshreya2517@gmail.com</strong>
          </div>
        </div>

        <div style={{ fontSize: "15px", color: "#CBD5E1", fontWeight: 600 }}>
          Stack: React 18, Vite, FastAPI, NumPy, SQLite & Ollama SLM.
        </div>
      </div>
    </div>
  );
};
