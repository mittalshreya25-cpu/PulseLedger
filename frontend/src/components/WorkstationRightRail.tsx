import React from "react";
import { IconBell, IconShield, IconCheck, IconAlert, IconRepeat, IconZap } from "./Icons";

export const WorkstationRightRail: React.FC = () => {
  return (
    <aside className="workstation-right-rail">
      {/* Notifications Header */}
      <div className="rail-section">
        <div className="rail-header">
          <span className="rail-title">Live Ingestion Feed</span>
          <span className="rail-badge">Real-time</span>
        </div>

        <div className="rail-list">
          <div className="rail-item">
            <div className="rail-icon-box">
              <IconZap size={14} color="var(--tide)" />
            </div>
            <div className="rail-content">
              <div className="rail-text">Bank SMS parsed: ₹140 Swiggy debit</div>
              <div className="rail-time">Canara Bank • Just now</div>
            </div>
          </div>

          <div className="rail-item">
            <div className="rail-icon-box">
              <IconCheck size={14} color="var(--tide)" />
            </div>
            <div className="rail-content">
              <div className="rail-text">Learned rule replayed 8 transactions</div>
              <div className="rail-time">Chai Point → Food • 12m ago</div>
            </div>
          </div>

          <div className="rail-item">
            <div className="rail-icon-box">
              <IconAlert size={14} color="var(--saffron)" />
            </div>
            <div className="rail-content">
              <div className="rail-text">Netflix price jumped +30.1%</div>
              <div className="rail-time">₹499 → ₹649 • 1h ago</div>
            </div>
          </div>

          <div className="rail-item">
            <div className="rail-icon-box">
              <IconRepeat size={14} color="var(--tide)" />
            </div>
            <div className="rail-content">
              <div className="rail-text">Allowance credited +₹5,000.00</div>
              <div className="rail-time">Parent UPI • 3d ago</div>
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous Security & Vault Status */}
      <div className="rail-section" style={{ marginTop: "24px" }}>
        <div className="rail-header">
          <span className="rail-title">Security & Guardrails</span>
          <span className="rail-badge active">Active</span>
        </div>

        <div className="rail-card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <IconShield size={16} color="var(--tide)" />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF" }}>
              Zero-Cloud Privacy Sandbox
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--slate)", lineHeight: 1.45 }}>
            All SMS ingestion and ledger computations execute locally on this machine. No cloud
            sync, zero financial data telemetry.
          </p>
          <div
            style={{
              marginTop: "12px",
              paddingTop: "8px",
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.75rem",
            }}
          >
            <span style={{ color: "var(--slate)" }}>SEBI 3-Layer Firewall</span>
            <span style={{ color: "var(--tide)", fontWeight: 700 }}>VERIFIED</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

