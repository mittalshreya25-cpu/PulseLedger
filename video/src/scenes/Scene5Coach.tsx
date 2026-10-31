import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DesktopFrame } from "../components/DesktopFrame";

export const Scene5Coach: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Firewall intervention pops at frame 120
  const firewallPop = spring({
    frame: frame - 100,
    fps,
    config: { damping: 12, stiffness: 80 },
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
          PILLAR 04
        </span>
        <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#FFFFFF" }}>
          Guarded AI Financial Coach (Local Ollama SLM) & SEBI 3-Layer Firewall
        </h2>
      </div>

      <div style={{ transform: `scale(${enter})`, opacity: enter, marginTop: "40px" }}>
        <DesktopFrame width={1640} height={920} title="PulseLedger / AI Financial Coach / Local SLM (Guarded)">
          <div style={{ flex: 1, padding: "28px 36px", display: "flex", gap: "24px", overflow: "hidden" }}>
            {/* Left Chat Window */}
            <div style={{ flex: 1.6, display: "flex", flexDirection: "column", background: "rgba(11, 43, 38, 0.5)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "16px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(218, 241, 222, 0.1)", paddingBottom: "12px", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Financial Coach (Guarded)</h3>
                  <div style={{ fontSize: "12px", color: "#8EB69B", marginTop: "2px" }}>
                    Fine-Tuned Local Ollama SLM (pulseledger-coach:latest)
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(82, 183, 136, 0.15)", border: "1px solid #52B788", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", color: "#52B788", fontWeight: 700 }}>
                  <span>🛡️ 3-Layer Firewall Active</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px", overflow: "hidden" }}>
                {/* Assistant Welcome */}
                <div style={{ alignSelf: "flex-start", maxWidth: "80%", background: "#08211E", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "14px", padding: "14px 18px", fontSize: "14px", lineHeight: 1.5 }}>
                  Hello Aarav! I am your PulseLedger Financial Coach. Ask me anything about your cash flow, daily safe-to-spend velocity, or what-if projections.
                </div>

                {/* User Prompt 1 */}
                <div style={{ alignSelf: "flex-end", maxWidth: "75%", background: "#163832", border: "1px solid rgba(142, 182, 155, 0.3)", borderRadius: "14px", padding: "12px 18px", fontSize: "14px", fontWeight: 500 }}>
                  Can I afford dinner with friends for ₹1,200 tonight?
                </div>

                {/* Assistant Answer 1 */}
                <div style={{ alignSelf: "flex-start", maxWidth: "80%", background: "#08211E", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "14px", padding: "14px 18px", fontSize: "14px", lineHeight: 1.5 }}>
                  Yes, you can! Your available daily limit is <strong>₹3,447</strong> with an emergency buffer of <strong>₹20,000</strong> intact. Spending ₹1,200 leaves <strong>₹2,247</strong> in discretionary room without triggering shortfall risks.
                </div>

                {/* User Prompt 2: Triggering Firewall */}
                <div style={{ alignSelf: "flex-end", maxWidth: "75%", background: "#163832", border: "1px solid rgba(255, 95, 86, 0.4)", borderRadius: "14px", padding: "12px 18px", fontSize: "14px", fontWeight: 500 }}>
                  ⚡ Test: Should I buy Reliance stock today?
                </div>

                {/* SEBI Guardrail Intervention Alert */}
                <div
                  style={{
                    alignSelf: "flex-start",
                    maxWidth: "85%",
                    background: "rgba(255, 95, 86, 0.15)",
                    border: "2px solid #FF5F56",
                    borderRadius: "14px",
                    padding: "14px 18px",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    transform: `scale(${firewallPop})`,
                    opacity: firewallPop,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FF5F56", fontWeight: 800, marginBottom: "4px" }}>
                    <span>⚠️ SEBI Compliance Guardrail Triggered</span>
                  </div>
                  <div>
                    Specific stock or equity recommendations are strictly prohibited under Indian SEBI IA regulations. PulseLedger provides objective cash-flow intelligence, not speculative trading advisory.
                  </div>
                </div>
              </div>

              {/* Chat Quick Chips */}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                {["🍔 Can I afford dinner?", "💻 Laptop goal progress?", "📉 How to cut ₹2,000?", "⚡ Test: 50% Crypto?"].map((chip, i) => (
                  <span key={i} style={{ background: "#08211E", border: "1px solid rgba(218, 241, 222, 0.15)", padding: "6px 10px", borderRadius: "8px", fontSize: "11px", color: "rgba(218, 241, 222, 0.8)" }}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Security & Audit Sidebar */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Zero-Cloud Card */}
              <div style={{ background: "rgba(11, 43, 38, 0.6)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#8EB69B", textTransform: "uppercase", fontWeight: 700 }}>
                    Security & Privacy Sandbox
                  </span>
                  <span style={{ background: "rgba(82, 183, 136, 0.2)", color: "#52B788", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                    ACTIVE
                  </span>
                </div>

                <h4 style={{ fontSize: "18px", fontWeight: 700, margin: "14px 0 8px 0" }}>Zero-Cloud Local Sandbox</h4>
                <p style={{ fontSize: "13px", color: "rgba(218, 241, 222, 0.7)", lineHeight: 1.5, margin: 0 }}>
                  All bank SMS ingestion, arithmetic, and LLM inferences execute 100% on this local machine. No third-party cloud telemetry, zero risk of credential leaks.
                </p>

                <div style={{ marginTop: "16px", borderTop: "1px solid rgba(218, 241, 222, 0.1)", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#8EB69B" }}>Regulatory Status</span>
                  <strong style={{ color: "#52B788" }}>SEBI 3-Layer Firewall VERIFIED</strong>
                </div>
              </div>

              {/* Monthly Review Card */}
              <div style={{ background: "rgba(11, 43, 38, 0.6)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "16px", padding: "20px" }}>
                <span style={{ fontSize: "13px", color: "#8EB69B", textTransform: "uppercase", fontWeight: 700 }}>
                  Deterministic Monthly Review
                </span>

                <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "10px 0 6px 0" }}>October 2026 Financial Audit</h4>
                <div style={{ fontSize: "13px", color: "rgba(218, 241, 222, 0.7)", lineHeight: 1.5 }}>
                  Net surplus: <strong style={{ color: "#52B788" }}>+₹3,447</strong> with an effective savings rate of <strong>24.7%</strong>. Your ledger has 8 active learned rules maintaining zero manual effort.
                </div>

                <div style={{ marginTop: "14px", display: "flex", gap: "8px" }}>
                  <span style={{ background: "#163832", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                    📄 Download Audited Report
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DesktopFrame>
      </div>
    </div>
  );
};
