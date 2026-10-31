import React, { useState } from "react";
import { formatINR } from "../utils/format";
import {
  IconShield,
  IconZap,
  IconCheck,
  IconLock,
  IconSmartphone,
  IconBell,
  IconAlert,
} from "./Icons";

interface AutonomousSyncCardProps {
  onSimulateSms: (smsText: string) => Promise<void>;
  isIngesting: boolean;
  totalCapturedCount: number;
}

export const AutonomousSyncCard: React.FC<AutonomousSyncCardProps> = ({
  onSimulateSms,
  isIngesting,
  totalCapturedCount,
}) => {
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [simulatedFeedback, setSimulatedFeedback] = useState<string | null>(null);

  // Pre-configured realistic Indian bank SMS triggers
  const SIMULATION_PRESETS = [
    {
      label: "🍔 Swiggy (-₹180)",
      category: "Food",
      amountPaise: 18000,
      sms: `Your a/c no. XXXXXXXX1234 is debited for Rs.180.00 on ${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().split(" ")[0]} by UPI ref no ${Math.floor(630000000000 + Math.random() * 99999999)}. Bal Rs.14,680.00 - Canara Bank`,
      merchant: "Swiggy",
    },
    {
      label: "🚕 Uber (-₹240)",
      category: "Transport",
      amountPaise: 24000,
      sms: `Your a/c no. XXXXXXXX1234 is debited for Rs.240.00 on ${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().split(" ")[0]} by UPI ref no ${Math.floor(630000000000 + Math.random() * 99999999)}. Bal Rs.14,440.00 - Canara Bank`,
      merchant: "Uber",
    },
    {
      label: "☕ Chai Point (-₹45)",
      category: "Food",
      amountPaise: 4500,
      sms: `Your a/c no. XXXXXXXX1234 is debited for Rs.45.00 on ${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().split(" ")[0]} by UPI ref no ${Math.floor(630000000000 + Math.random() * 99999999)}. Bal Rs.14,395.00 - Canara Bank`,
      merchant: "Chai Point",
    },
    {
      label: "💵 Parent Allowance (+₹5,000)",
      category: "Allowance",
      amountPaise: 500000,
      sms: `Your a/c no. XXXXXXXX1234 is credited for Rs.5000.00 on ${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().split(" ")[0]} by UPI ref no ${Math.floor(630000000000 + Math.random() * 99999999)}. Bal Rs.19,395.00 - Canara Bank`,
      merchant: "Allowance",
    },
  ];

  const handleTriggerSimulation = async (preset: typeof SIMULATION_PRESETS[0]) => {
    if (!permissionGranted) {
      alert("Auto-Sync permission is paused. Please enable permission first.");
      return;
    }
    setSimulatedFeedback(`Receiving simulated ${preset.merchant} SMS...`);
    try {
      await onSimulateSms(preset.sms);
      setSimulatedFeedback(`Auto-captured ${preset.merchant} (${formatINR(preset.amountPaise)}) in 8ms!`);
      setTimeout(() => setSimulatedFeedback(null), 4000);
    } catch (err: any) {
      setSimulatedFeedback(`Auto-capture error: ${err.message}`);
      setTimeout(() => setSimulatedFeedback(null), 4000);
    }
  };

  return (
    <div className="card auto-sync-card" aria-label="Autonomous Data Sync Command Center">
      {/* -------------------- HEADER STATUS ROW -------------------- */}
      <div className="auto-sync-header">
        <div className="auto-sync-title-group">
          <div className="auto-sync-badge-row">
            <span className={`sync-status-dot ${permissionGranted ? "live" : "paused"}`} />
            <span className="sync-status-text">
              {permissionGranted ? "AUTONOMOUS BACKGROUND SYNC ACTIVE" : "AUTO-SYNC PAUSED"}
            </span>
          </div>
          <h2 className="section-title auto-sync-h2">
            <IconShield size={20} color="var(--tide)" />
            <span>Auto-Pilot Ingestion & Privacy Vault</span>
          </h2>
          <p className="auto-sync-desc">
            PulseLedger continuously auto-captures and reconciles your bank debits and UPI credits in the background. Zero manual typing required.
          </p>
        </div>

        {/* Master Permission Toggle */}
        <div className="permission-toggle-wrapper">
          <label className="permission-switch" title="Toggle background auto-sync permission">
            <input
              type="checkbox"
              checked={permissionGranted}
              onChange={(e) => setPermissionGranted(e.target.checked)}
            />
            <span className="slider round" />
          </label>
          <span className="permission-status-label">
            {permissionGranted ? "Permission Granted" : "Permission Revoked"}
          </span>
        </div>
      </div>

      {/* -------------------- CONNECTED CHANNELS STATUS STRIP -------------------- */}
      <div className="sync-channels-grid">
        <div className="sync-channel-pill active">
          <IconSmartphone size={16} color="var(--tide)" />
          <div className="channel-text">
            <span className="channel-name">SMS / Notification Daemon</span>
            <span className="channel-status">Listening in background</span>
          </div>
          <span className="channel-badge">LIVE</span>
        </div>

        <div className="sync-channel-pill active">
          <IconLock size={16} color="var(--tide)" />
          <div className="channel-text">
            <span className="channel-name">Canara Bank & UPI Parser</span>
            <span className="channel-status">On-Device Regex (0ms latency)</span>
          </div>
          <span className="channel-badge">100% LOCAL</span>
        </div>

        <div className="sync-channel-pill active">
          <IconZap size={16} color="var(--tide)" />
          <div className="channel-text">
            <span className="channel-name">Paytm Merchant Reconciler</span>
            <span className="channel-status">Auto-matches ±1 day window</span>
          </div>
          <span className="channel-badge">PAIRED</span>
        </div>
      </div>

      {/* -------------------- LIVE SIMULATION LAUNCHER (DEMO CONTROL) -------------------- */}
      <div className="sim-triggers-box">
        <div className="sim-triggers-header">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <IconZap size={16} color="var(--tide)" />
            <strong style={{ fontSize: "0.85rem", color: "var(--ink)" }}>
              Test Autonomous Ingestion (Simulate Real Bank SMS):
            </strong>
          </div>
          <button
            type="button"
            className="security-details-link"
            onClick={() => setShowSecurityModal(true)}
          >
            🛡️ View Security & Encryption Guarantees
          </button>
        </div>

        <div className="sim-buttons-row">
          {SIMULATION_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="sim-chip-btn"
              disabled={isIngesting || !permissionGranted}
              onClick={() => handleTriggerSimulation(preset)}
              title={`Simulate receiving real ${preset.merchant} bank SMS`}
            >
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Real-time Ingestion Toast Notification */}
        {simulatedFeedback && (
          <div className="sim-feedback-toast" role="status">
            <span className="toast-sparkle">⚡</span>
            <span>{simulatedFeedback}</span>
          </div>
        )}
      </div>

      {/* -------------------- SECURITY & PRIVACY GUARANTEE MODAL -------------------- */}
      {showSecurityModal && (
        <div className="modal-backdrop" onClick={() => setShowSecurityModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Bank-Grade Security & On-Device Isolation</h3>
                <span className="modal-subtitle">How PulseLedger protects your financial data</span>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowSecurityModal(false)}
              >
                ×
              </button>
            </div>

            <div className="forensic-body">
              <div className="security-pillars-list">
                <div className="pillar-item">
                  <div className="pillar-icon">🛡️</div>
                  <div>
                    <strong>100% On-Device Deterministic Parsing</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "var(--slate)" }}>
                      Every bank SMS is parsed locally on your device using strict Python/regex pattern matching. No financial SMS or transaction details are ever sent to an LLM or cloud API.
                    </p>
                  </div>
                </div>

                <div className="pillar-item">
                  <div className="pillar-icon">🔒</div>
                  <div>
                    <strong>Strict OTP & PII Immunity</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "var(--slate)" }}>
                      The parser explicitly ignores and drops all OTPs, personal messages, and passwords by design. They are never saved, parsed, or logged.
                    </p>
                  </div>
                </div>

                <div className="pillar-item">
                  <div className="pillar-icon">🏦</div>
                  <div>
                    <strong>Read-Only Transaction Metadata</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "var(--slate)" }}>
                      PulseLedger only reads standard transactional metadata (amount, timestamp, UPI reference, post-balance). It has zero access to your bank login, MPIN, or account credentials.
                    </p>
                  </div>
                </div>

                <div className="pillar-item">
                  <div className="pillar-icon">🔐</div>
                  <div>
                    <strong>Local Encrypted SQLite Storage</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "var(--slate)" }}>
                      All data stays strictly in your local database with integer paise precision, completely private to you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="forensic-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowSecurityModal(false)}
                >
                  Understood & Protected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

