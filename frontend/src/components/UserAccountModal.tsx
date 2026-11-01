import React, { useState } from "react";
import { UserProfile, saveUserProfile } from "../utils/userVault";

interface UserAccountModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProfile: UserProfile) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<"role" | "budget" | "privacy">("role");
  
  // Form State
  const [name, setName] = useState(profile.name === "My Account" ? "" : profile.name);
  const [designation, setDesignation] = useState(profile.designation);
  const [city, setCity] = useState(profile.city);

  const [monthlyIncome, setMonthlyIncome] = useState(profile.monthlyIncomePaise / 100);
  const [inflowDay, setInflowDay] = useState(profile.inflowDayOfMonth);
  const [fixedCosts, setFixedCosts] = useState(profile.fixedCostsPaise / 100);
  const [discretionary, setDiscretionary] = useState(profile.discretionaryPaise / 100);
  const [buffer, setBuffer] = useState(profile.bufferPaise / 100);

  const [goalName, setGoalName] = useState(profile.primaryGoalName);
  const [goalTarget, setGoalTarget] = useState(profile.primaryGoalTargetPaise / 100);
  const [goalDate, setGoalDate] = useState(profile.primaryGoalDate);

  const [pin, setPin] = useState(profile.securityPin || "");
  const [permVault, setPermVault] = useState(profile.permissions.localStorageVault);
  const [permSms, setPermSms] = useState(profile.permissions.smsIngestion);
  const [permAlerts, setPermAlerts] = useState(profile.permissions.velocityAlerts);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: name.trim() || "My Account",
      designation,
      city,
      monthlyIncomePaise: Math.round(monthlyIncome * 100),
      inflowDayOfMonth: Number(inflowDay),
      fixedCostsPaise: Math.round(fixedCosts * 100),
      discretionaryPaise: Math.round(discretionary * 100),
      bufferPaise: Math.round(buffer * 100),
      primaryGoalName: goalName.trim() || "Emergency Reserve",
      primaryGoalTargetPaise: Math.round(goalTarget * 100),
      primaryGoalDate: goalDate,
      securityPin: pin.trim() ? pin.trim().slice(0, 6) : undefined,
      permissions: {
        localStorageVault: permVault,
        smsIngestion: permSms,
        velocityAlerts: permAlerts,
        biometricLock: profile.permissions.biometricLock,
      },
      isConfigured: true,
      updatedAt: new Date().toISOString(),
    };

    saveUserProfile(updated);
    onSave(updated);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(4, 5, 8, 0.82)",
        backdropFilter: "blur(10px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#12141F",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.15)",
          overflow: "hidden",
          color: "#FFFFFF",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 16px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>🛡️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Create Your Private Account</h3>
                <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700 }}>
                  ● 100% On-Device Vault • Zero Data Leakage Guarantee
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {/* Subtabs */}
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            {[
              { id: "role", label: "1. Profile & Role" },
              { id: "budget", label: "2. Living Budget" },
              { id: "privacy", label: "3. Permissions & Security" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: "8px 6px",
                  fontSize: "11px",
                  fontWeight: 800,
                  borderRadius: "10px",
                  border: activeTab === tab.id ? "1px solid #10B981" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: activeTab === tab.id ? "rgba(16, 185, 129, 0.18)" : "rgba(255, 255, 255, 0.03)",
                  color: activeTab === tab.id ? "#10B981" : "#94A3B8",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {activeTab === "role" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#CBD5E1", fontWeight: 700, marginBottom: "6px" }}>
                  Your Full Name or Handle
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shreya Mittal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#08090E",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#CBD5E1", fontWeight: 700, marginBottom: "6px" }}>
                  Professional Designation
                </label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value as any)}
                  style={{
                    width: "100%",
                    background: "#08090E",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="Student / Intern">🎓 Student / Intern (Allowance & Stipend regime)</option>
                  <option value="Salaried Professional">💼 Salaried Professional (Monthly Payroll & Tax Slabs)</option>
                  <option value="Freelancer / Consultant">🎨 Freelancer / Independent Consultant (Variable Cash)</option>
                  <option value="Business Owner / Founder">🏢 Business Owner / Founder (Drawings & Retained Capital)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#CBD5E1", fontWeight: 700, marginBottom: "6px" }}>
                  City of Residence (Living Cost Tier)
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as any)}
                  style={{
                    width: "100%",
                    background: "#08090E",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="Bengaluru">Bengaluru (1.25x Cost Multiplier)</option>
                  <option value="Mumbai">Mumbai (1.35x Cost Multiplier)</option>
                  <option value="Delhi-NCR">Delhi-NCR (1.20x Cost Multiplier)</option>
                  <option value="Hyderabad / Pune">Hyderabad / Pune (1.15x Cost Multiplier)</option>
                  <option value="Tier-2 / Tier-3 City">Tier-2 / Tier-3 City (1.00x Base Index)</option>
                </select>
              </div>

              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "14px", padding: "12px 14px", fontSize: "12px", color: "#94A3B8", lineHeight: 1.45 }}>
                🔒 <strong>Privacy Assurance:</strong> Your name, role, and city index are stored exclusively in your local device vault. No other user or cloud entity can view your account.
              </div>
            </div>
          )}

          {activeTab === "budget" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#CBD5E1", fontWeight: 700, marginBottom: "4px" }}>
                    Monthly In-Hand Income (₹)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    style={{
                      width: "100%",
                      background: "#08090E",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#10B981",
                      fontSize: "14px",
                      fontWeight: 800,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#CBD5E1", fontWeight: 700, marginBottom: "4px" }}>
                    Payday of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={inflowDay}
                    onChange={(e) => setInflowDay(Number(e.target.value))}
                    style={{
                      width: "100%",
                      background: "#08090E",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#FFFFFF",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#CBD5E1", fontWeight: 700, marginBottom: "4px" }}>
                    Fixed Living Costs (Rent/Food/EMI)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={fixedCosts}
                    onChange={(e) => setFixedCosts(Number(e.target.value))}
                    style={{
                      width: "100%",
                      background: "#08090E",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#EF4444",
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#CBD5E1", fontWeight: 700, marginBottom: "4px" }}>
                    Discretionary Target (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={discretionary}
                    onChange={(e) => setDiscretionary(Number(e.target.value))}
                    style={{
                      width: "100%",
                      background: "#08090E",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#F39C12",
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#CBD5E1", fontWeight: 700, marginBottom: "4px" }}>
                  Emergency Reserve Buffer Floor (₹)
                </label>
                <input
                  type="number"
                  min="5000"
                  step="1000"
                  value={buffer}
                  onChange={(e) => setBuffer(Number(e.target.value))}
                  style={{
                    width: "100%",
                    background: "#08090E",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    color: "#FFFFFF",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Goal planning */}
              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#10B981" }}>🎯 Primary Life Goal Target</span>
                <div>
                  <input
                    type="text"
                    placeholder="Goal name, e.g. MacBook Fund"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#08090E",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <input
                    type="number"
                    placeholder="Target Amount (₹)"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(Number(e.target.value))}
                    style={{
                      width: "100%",
                      background: "#08090E",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                    }}
                  />
                  <input
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#08090E",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "#08090E", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "14px", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10B981", fontWeight: 800, fontSize: "13px", marginBottom: "4px" }}>
                  <span>🛡️</span> Zero-Cloud Privacy Guarantee
                </div>
                <p style={{ margin: 0, fontSize: "11px", color: "#94A3B8", lineHeight: 1.5 }}>
                  PulseLedger never uploads your bank balances, account details, or transaction histories to external cloud servers. All computations happen on this device.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "12px" }}>
                  <input
                    type="checkbox"
                    checked={permVault}
                    onChange={(e) => setPermVault(e.target.checked)}
                    style={{ accentColor: "#10B981", width: "16px", height: "16px" }}
                  />
                  <span>
                    <strong>On-Device SQLite Vault Permission</strong>
                    <div style={{ fontSize: "10px", color: "#94A3B8" }}>Encrypts and stores personal ledger records in local sandbox.</div>
                  </span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "12px" }}>
                  <input
                    type="checkbox"
                    checked={permSms}
                    onChange={(e) => setPermSms(e.target.checked)}
                    style={{ accentColor: "#10B981", width: "16px", height: "16px" }}
                  />
                  <span>
                    <strong>Private Bank SMS Parsing Permission</strong>
                    <div style={{ fontSize: "10px", color: "#94A3B8" }}>Allows local regex parser to extract amounts without cloud transmission.</div>
                  </span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "12px" }}>
                  <input
                    type="checkbox"
                    checked={permAlerts}
                    onChange={(e) => setPermAlerts(e.target.checked)}
                    style={{ accentColor: "#10B981", width: "16px", height: "16px" }}
                  />
                  <span>
                    <strong>Daily Safe-to-Spend Velocity Nudges</strong>
                    <div style={{ fontSize: "10px", color: "#94A3B8" }}>Provides instant notifications when spending drifts off pace.</div>
                  </span>
                </label>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#CBD5E1", fontWeight: 700, marginBottom: "6px" }}>
                  Optional Device Lock PIN (4-6 Digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="e.g. 1234 (Leave blank for no PIN lock)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  style={{
                    width: "100%",
                    background: "#08090E",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    letterSpacing: "4px",
                  }}
                />
                <span style={{ fontSize: "10px", color: "#94A3B8", marginTop: "4px", display: "block" }}>
                  Protects your financial ledger from anyone who picks up or borrows your phone.
                </span>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "14px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#CBD5E1",
                padding: "8px 18px",
                borderRadius: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                border: "none",
                color: "#000000",
                padding: "8px 22px",
                borderRadius: "12px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.35)",
              }}
            >
              Save & Activate Private Vault
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
