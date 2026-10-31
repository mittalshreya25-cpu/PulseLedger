import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DesktopFrame } from "../components/DesktopFrame";

export const Scene3Ledger: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Cursor moves to category dropdown at frame 90
  const cursorMove = spring({
    frame: frame - 60,
    fps,
    config: { damping: 18, stiffness: 80 },
  });

  // Category dropdown opens at frame 130
  const dropdownOpen = spring({
    frame: frame - 120,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  // Learned Rule Toast pops at frame 210
  const toastProgress = spring({
    frame: frame - 190,
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
          PILLAR 02
        </span>
        <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#FFFFFF" }}>
          Audited Double-Entry Ledger (Table 1) & Self-Learning Rule Replay
        </h2>
      </div>

      <div style={{ transform: `scale(${enter})`, opacity: enter, marginTop: "40px" }}>
        <DesktopFrame width={1640} height={920} title="PulseLedger / Audited Ledger / Table 1">
          <div style={{ flex: 1, padding: "28px 36px", display: "flex", flexDirection: "column", gap: "20px", overflow: "hidden", position: "relative" }}>
            {/* Header & Filter Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(142, 182, 155, 0.15)", border: "1px solid rgba(218, 241, 222, 0.2)", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, color: "#8EB69B" }}>
                  AUDITED DOUBLE-ENTRY REGISTER • 7 RECORDS
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: 700, margin: "6px 0 0 0" }}>Financial Transaction Ledger</h3>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ background: "rgba(11, 43, 38, 0.7)", border: "1px solid rgba(218, 241, 222, 0.2)", borderRadius: "8px", padding: "8px 16px", fontSize: "13px" }}>
                  🔍 Search payee, ref, or amount...
                </div>
                <div style={{ background: "#163832", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", fontWeight: 600 }}>
                  📥 Export CSV
                </div>
              </div>
            </div>

            {/* Top KPI Ribbon */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              {[
                { label: "Ledger Volume", val: "7", sub: "Total Movements", color: "#FFFFFF" },
                { label: "Total Outflows (Dr.)", val: "-₹1,553", sub: "Debited to vendors", color: "#FF5F56" },
                { label: "Total Inflows (Cr.)", val: "+₹5,000", sub: "Allowance & Credits", color: "#52B788" },
                { label: "Net Movement", val: "+₹3,447", sub: "Net Positive Liquidity", color: "#8EB69B" },
              ].map((kpi, i) => (
                <div key={i} style={{ background: "rgba(11, 43, 38, 0.6)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "14px", padding: "16px 20px" }}>
                  <div style={{ fontSize: "12px", color: "rgba(218, 241, 222, 0.7)", fontWeight: 600 }}>{kpi.label}</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: kpi.color, margin: "4px 0" }}>{kpi.val}</div>
                  <div style={{ fontSize: "11px", color: "#8EB69B" }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Category Filter Chips Bar */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {[
                { name: "All Categories", count: 7, active: true },
                { name: "Allowance", count: 1, active: false },
                { name: "Food", count: 3, active: false },
                { name: "Education", count: 0, active: false },
                { name: "Entertainment", count: 2, active: false },
                { name: "Transport", count: 1, active: false },
              ].map((cat, i) => (
                <div
                  key={i}
                  style={{
                    background: cat.active ? "#8EB69B" : "rgba(11, 43, 38, 0.7)",
                    color: cat.active ? "#051F20" : "#DAF1DE",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 700,
                    border: "1px solid rgba(218, 241, 222, 0.2)",
                  }}
                >
                  {cat.name} ({cat.count})
                </div>
              ))}
            </div>

            {/* Table 1 Data Rows */}
            <div style={{ flex: 1, background: "rgba(11, 43, 38, 0.5)", border: "1px solid rgba(218, 241, 222, 0.15)", borderRadius: "14px", overflow: "hidden" }}>
              {/* Table Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 1.8fr 1.2fr 1.2fr", padding: "14px 20px", background: "#08211E", fontSize: "12px", fontWeight: 700, color: "rgba(218, 241, 222, 0.6)", textTransform: "uppercase" }}>
                <span>Date & Time</span>
                <span>Payee & Details</span>
                <span>Category (Click to Edit)</span>
                <span>Flow Type</span>
                <span style={{ textAlign: "right" }}>Amount (INR)</span>
              </div>

              {/* Rows */}
              {[
                { date: "31 Oct", sub: "2026-10-31", payee: "Swiggy", tag: "SMS", cat: "🍔 Food", flow: "DEBIT", amt: "-₹140.00", isTarget: false },
                { date: "30 Oct", sub: "2026-10-30", payee: "Netflix", tag: "SMS", cat: "🎬 Entertainment", flow: "DEBIT", amt: "-₹649.00", isTarget: false },
                { date: "29 Oct", sub: "2026-10-29", payee: "Chai Point", tag: "SMS", cat: "🍔 Food", flow: "DEBIT", amt: "-₹250.00", isTarget: true },
                { date: "28 Oct", sub: "2026-10-28", payee: "Allowance", tag: "UPI", cat: "💵 Allowance", flow: "CREDIT", amt: "+₹5,000.00", isTarget: false },
                { date: "27 Oct", sub: "2026-10-27", payee: "Rapido", tag: "SMS", cat: "🛵 Transport", flow: "DEBIT", amt: "-₹65.00", isTarget: false },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 2fr 1.8fr 1.2fr 1.2fr",
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(218, 241, 222, 0.08)",
                    alignItems: "center",
                    fontSize: "14px",
                    background: row.isTarget && dropdownOpen > 0 ? "rgba(142, 182, 155, 0.12)" : "transparent",
                    transition: "background 0.2s",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{row.date}</div>
                    <div style={{ fontSize: "11px", color: "rgba(218, 241, 222, 0.6)" }}>{row.sub}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "6px", background: "#163832", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#8EB69B" }}>
                      {row.payee[0]}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>{row.payee}</span>
                      <span style={{ marginLeft: "8px", fontSize: "10px", background: "#051F20", padding: "2px 6px", borderRadius: "4px", color: "#8EB69B" }}>
                        {row.tag}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ background: "#163832", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", border: "1px solid rgba(218, 241, 222, 0.2)" }}>
                      {row.cat} ▾
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", fontWeight: 700, background: row.flow === "DEBIT" ? "rgba(255, 95, 86, 0.15)" : "rgba(82, 183, 136, 0.15)", color: row.flow === "DEBIT" ? "#FF5F56" : "#52B788" }}>
                      {row.flow}
                    </span>
                  </div>

                  <div style={{ textAlign: "right", fontWeight: 800, fontSize: "15px", color: row.flow === "DEBIT" ? "#FF5F56" : "#52B788" }}>
                    {row.amt}
                  </div>
                </div>
              ))}
            </div>

            {/* Toast Notification: Learned Rule Replay */}
            <div
              style={{
                position: "absolute",
                bottom: "30px",
                right: "40px",
                background: "rgba(11, 43, 38, 0.95)",
                border: "2px solid #52B788",
                boxShadow: "0 10px 40px rgba(0,0,0,0.7), 0 0 20px rgba(82, 183, 136, 0.3)",
                borderRadius: "14px",
                padding: "16px 22px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                transform: `scale(${toastProgress}) translateY(${interpolate(toastProgress, [0, 1], [30, 0])}px)`,
                opacity: toastProgress,
                zIndex: 20,
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#52B788", display: "flex", alignItems: "center", justifyContent: "center", color: "#051F20", fontSize: "18px", fontWeight: 900 }}>
                ✓
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "14px", color: "#FFFFFF" }}>Deterministic Rule Learned & Replayed</div>
                <div style={{ fontSize: "12px", color: "#DAF1DE", marginTop: "2px" }}>
                  "Chai Point" categorized as Food → <strong>8 historical transactions automatically updated</strong>!
                </div>
              </div>
            </div>
          </div>
        </DesktopFrame>
      </div>
    </div>
  );
};
