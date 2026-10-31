import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneMockup } from "../components/PhoneMockup";
import { TouchCursor } from "../components/TouchCursor";

export const Scene5Coach: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Touch cursor moves to "⚡ Test: Buy Reliance?" chip at frame 60, taps at frame 85
  const cursorX = interpolate(frame, [30, 80], [210, 110], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorY = interpolate(frame, [30, 80], [550, 680], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isTapping = frame >= 80 && frame <= 100;

  // Firewall Intervention Sheet pops at frame 105
  const firewallPop = spring({
    frame: frame - 100,
    fps,
    config: { damping: 12, stiffness: 85 },
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
      {/* Left: Interactive Phone Screen Operating AI Coach */}
      <div style={{ transform: `scale(${enter})`, position: "relative" }}>
        <PhoneMockup width={430} height={900} activeTab="coach">
          {/* Mobile Screen Content */}
          <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px", overflow: "hidden", position: "relative" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#10B981", fontWeight: 800, textTransform: "uppercase" }}>
                  Fine-Tuned Local SLM
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 900, margin: "2px 0 0 0", color: "#FFFFFF" }}>
                  Financial Coach
                </h3>
              </div>

              <div style={{ background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10B981", padding: "4px 10px", borderRadius: "10px", fontSize: "10px", color: "#10B981", fontWeight: 800 }}>
                🛡️ 3-Layer Firewall
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", overflow: "hidden" }}>
              {/* Bot Message 1 */}
              <div style={{ alignSelf: "flex-start", maxWidth: "88%", background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "16px", padding: "12px 14px", fontSize: "12px", lineHeight: 1.45 }}>
                Hello Aarav! I am your PulseLedger Financial Coach. Ask me anything about your daily velocity or what-if plans.
              </div>

              {/* User Message 1 */}
              <div style={{ alignSelf: "flex-end", maxWidth: "80%", background: "#1E202E", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "16px", padding: "10px 14px", fontSize: "12px", fontWeight: 700, color: "#FFFFFF" }}>
                Can I afford dinner for ₹1,200 tonight?
              </div>

              {/* Bot Message 2 */}
              <div style={{ alignSelf: "flex-start", maxWidth: "88%", background: "#12141F", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "16px", padding: "12px 14px", fontSize: "12px", lineHeight: 1.45 }}>
                Yes! Your daily Safe-to-Spend limit is <strong>₹3,447</strong> with an emergency buffer of <strong>₹20,000</strong> intact. Spending ₹1,200 leaves <strong>₹2,247</strong> in discretionary cushion.
              </div>

              {/* User Message 2 */}
              <div style={{ alignSelf: "flex-end", maxWidth: "80%", background: "#1E202E", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "16px", padding: "10px 14px", fontSize: "12px", fontWeight: 700, color: "#FFFFFF" }}>
                ⚡ Test: Buy Reliance stock today?
              </div>

              {/* SEBI Compliance Guardrail Intervention Sheet */}
              {firewallPop > 0 && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    maxWidth: "92%",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "2px solid #EF4444",
                    borderRadius: "16px",
                    padding: "12px 14px",
                    boxShadow: "0 8px 30px rgba(239, 68, 68, 0.35)",
                    transform: `scale(${firewallPop})`,
                    opacity: firewallPop,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#EF4444", fontWeight: 900, fontSize: "11px", marginBottom: "3px" }}>
                    <span>🛡️ SEBI Compliance Guardrail Block</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#FFFFFF", lineHeight: 1.4, fontWeight: 500 }}>
                    Specific stock recommendations are strictly blocked under Indian SEBI regulations. PulseLedger provides cash-flow intelligence, not speculative trading advisory.
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div style={{ display: "flex", gap: "6px", overflow: "hidden", marginBottom: "60px" }}>
              {["⚡ Buy Reliance?", "💻 Laptop goal?", "📉 Cut ₹2k?"].map((chip, i) => (
                <span
                  key={i}
                  style={{
                    background: i === 0 ? "rgba(239, 68, 68, 0.2)" : "#12141F",
                    border: i === 0 ? "1px solid #EF4444" : "1px solid rgba(255, 255, 255, 0.12)",
                    color: i === 0 ? "#EF4444" : "#CBD5E1",
                    padding: "6px 10px",
                    borderRadius: "12px",
                    fontSize: "10px",
                    fontWeight: 800,
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
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
          SECTION 04 • GUARDED AI COACH & PRIVACY
        </div>

        <h2 style={{ fontSize: "52px", fontWeight: 900, margin: 0, letterSpacing: "-1.5px", color: "#FFFFFF", lineHeight: 1.1 }}>
          Fine-Tuned Local SLM & 3-Layer SEBI Firewall
        </h2>

        <p style={{ fontSize: "20px", color: "#F1F5F9", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
          PulseLedger integrates a quantized Small Language Model running locally via Ollama. It answers context-aware
          financial questions without ever sending your balance or private bank messages to cloud servers.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#161824", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "16px", padding: "18px 22px", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#EF4444" }}>🛡️ 3-Layer SEBI Intent Firewall</div>
            <div style={{ fontSize: "14px", color: "#CBD5E1", marginTop: "6px", lineHeight: 1.4, fontWeight: 500 }}>
              Regex classification, regex token masking, and deterministic pre/post-inference filters strictly block illegal stock tips and crypto speculation.
            </div>
          </div>

          <div style={{ background: "#161824", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "16px", padding: "18px 22px", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#10B981" }}>🔒 Zero-Cloud Privacy Sandbox</div>
            <div style={{ fontSize: "14px", color: "#CBD5E1", marginTop: "6px", lineHeight: 1.4, fontWeight: 500 }}>
              Bank SMS ingestion, SQLite double-entry register, and model inference run on-device. Zero telemetry.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
