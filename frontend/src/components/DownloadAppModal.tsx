import React, { useState } from "react";

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerPwaInstall: () => void;
  canPwaInstall: boolean;
  isIOS: boolean;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
  onTriggerPwaInstall,
  canPwaInstall,
  isIOS,
}) => {
  const [tab, setTab] = useState<"phone" | "apk" | "desktop">("phone");

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(4, 5, 8, 0.85)",
        backdropFilter: "blur(12px)",
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
          border: "1px solid rgba(255, 255, 255, 0.16)",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "540px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.15)",
          color: "#FFFFFF",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 900,
                color: "#000",
              }}
            >
              ⚡
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#FFFFFF" }}>
                Download & Install PulseLedger
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8" }}>
                Native Mobile App & Local-First Workstation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              fontSize: "22px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            padding: "8px 16px",
            background: "#0B0C14",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            gap: "8px",
          }}
        >
          <button
            type="button"
            onClick={() => setTab("phone")}
            style={{
              background: tab === "phone" ? "#1E202E" : "transparent",
              border: tab === "phone" ? "1px solid #10B981" : "1px solid transparent",
              color: tab === "phone" ? "#10B981" : "#94A3B8",
              borderRadius: "10px",
              padding: "8px 6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            📱 Phone App
          </button>
          <button
            type="button"
            onClick={() => setTab("apk")}
            style={{
              background: tab === "apk" ? "#1E202E" : "transparent",
              border: tab === "apk" ? "1px solid #10B981" : "1px solid transparent",
              color: tab === "apk" ? "#10B981" : "#94A3B8",
              borderRadius: "10px",
              padding: "8px 6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            🤖 Android APK
          </button>
          <button
            type="button"
            onClick={() => setTab("desktop")}
            style={{
              background: tab === "desktop" ? "#1E202E" : "transparent",
              border: tab === "desktop" ? "1px solid #10B981" : "1px solid transparent",
              color: tab === "desktop" ? "#10B981" : "#94A3B8",
              borderRadius: "10px",
              padding: "8px 6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            💻 1-Click Desktop
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {tab === "phone" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: "#E2E8F0",
                }}
              >
                ✨ <strong>Fastest Way to Get the App on Your Phone:</strong>
                <br />
                PulseLedger is built with modern Progressive Web App (PWA) architecture. You can install it
                directly from your browser without needing to download untrusted APK files.
              </div>

              {/* Action Button */}
              {canPwaInstall ? (
                <button
                  type="button"
                  onClick={() => {
                    onTriggerPwaInstall();
                    onClose();
                  }}
                  style={{
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    color: "#000000",
                    border: "none",
                    borderRadius: "14px",
                    padding: "14px",
                    fontSize: "15px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  <span>📲</span>
                  <span>Install App on this Device Now</span>
                </button>
              ) : isIOS ? (
                <div
                  style={{
                    background: "#161824",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#38BDF8", marginBottom: "8px" }}>
                    🍎 How to install on iPhone / iPad (Safari):
                  </div>
                  <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#CBD5E1", lineHeight: 1.6 }}>
                    <li>Open <strong>https://pulse-ledger-kappa.vercel.app</strong> in Safari.</li>
                    <li>Tap the <strong>Share</strong> button <span style={{ color: "#38BDF8" }}>[↑]</span> at the bottom.</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                    <li>Tap <strong>Add</strong>. PulseLedger will launch full-screen from your home screen!</li>
                  </ol>
                </div>
              ) : (
                <div
                  style={{
                    background: "#161824",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#10B981", marginBottom: "8px" }}>
                    📱 How to install on Android (Chrome / Brave / Edge):
                  </div>
                  <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#CBD5E1", lineHeight: 1.6 }}>
                    <li>Open <strong>https://pulse-ledger-kappa.vercel.app</strong> on your mobile browser.</li>
                    <li>Tap the <strong>three dots (⋮)</strong> menu in the top right corner.</li>
                    <li>Tap <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</li>
                    <li>The app will install directly with icon, splash screen, and offline support.</li>
                  </ol>
                </div>
              )}

              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "12px", fontSize: "12px", color: "#94A3B8" }}>
                🔒 <strong>100% Zero-Cloud Storage:</strong> All profile data, bank SMS, and budgeting numbers remain inside your phone's sandbox. No data ever leaves your device.
              </div>
            </div>
          )}

          {tab === "apk" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  background: "rgba(56, 189, 248, 0.08)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: "#E2E8F0",
                }}
              >
                🤖 <strong>Native Android Project (Capacitor & Gradle):</strong>
                <br />
                The repository includes a complete native Android application in <code>frontend/android/</code> with package name <code>com.pulseledger.app</code>.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <a
                  href="https://github.com/mittalshreya25-cpu/PulseLedger/actions"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#1E202E",
                    border: "1px solid #10B981",
                    color: "#10B981",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    fontSize: "13px",
                    fontWeight: 800,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>📦 Download Built APK from GitHub Actions</span>
                  <span>↗</span>
                </a>

                <div
                  style={{
                    background: "#161824",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    padding: "14px",
                    fontSize: "12px",
                    color: "#CBD5E1",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                    🛠️ Or Build Directly on Your Machine:
                  </div>
                  <pre
                    style={{
                      background: "#0A0B10",
                      padding: "10px",
                      borderRadius: "8px",
                      overflowX: "auto",
                      color: "#A7F3D0",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      margin: 0,
                    }}
                  >
{`git clone https://github.com/mittalshreya25-cpu/PulseLedger.git
cd PulseLedger/frontend/android
./gradlew assembleDebug`}
                  </pre>
                  <div style={{ marginTop: "6px", fontSize: "11px", color: "#94A3B8" }}>
                    Output APK will be at: <code>app/build/outputs/apk/debug/app-debug.apk</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "desktop" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  background: "rgba(168, 85, 247, 0.08)",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: "#E2E8F0",
                }}
              >
                💻 <strong>1-Click Desktop Workstation:</strong>
                <br />
                Launch PulseLedger locally with full double-entry Python backend & React dashboard in one double-click.
              </div>

              <div
                style={{
                  background: "#161824",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "13px",
                  color: "#CBD5E1",
                }}
              >
                <div style={{ fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>
                  🪟 Windows Users:
                </div>
                <div style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  Simply double-click <strong><code>Launch-PulseLedger.bat</code></strong> in the root of the repository. It auto-creates the Python venv, starts FastAPI on port 8000, and opens the frontend.
                </div>

                <div style={{ fontWeight: 700, color: "#FFFFFF", marginTop: "14px", marginBottom: "8px" }}>
                  🍎 Mac & Linux Users:
                </div>
                <div style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  Run <strong><code>./launch-pulseledger.sh</code></strong> from terminal.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            background: "#0E101A",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🔒</span>
            <span>Zero-Leak Local Vault</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#1E202E",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              padding: "8px 18px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
