import React, { useEffect, useState } from "react";

export const InstallAppButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Capture standard PWA install event for Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General guidance for browsers without beforeinstallprompt
      alert("To install PulseLedger on your device: open browser settings (⋮ or ⋯) and tap 'Install App' or 'Add to Home screen'.");
    }
  };

  // If already running as an installed standalone app, display active status pill
  if (isStandalone) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid #10B981",
          color: "#10B981",
          fontSize: "11px",
          fontWeight: 700,
          padding: "4px 10px",
          borderRadius: "20px",
        }}
      >
        ● Mobile App Active
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Install PulseLedger on your phone or desktop as a native app"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          color: "#000000",
          border: "none",
          borderRadius: "20px",
          padding: "5px 14px",
          fontSize: "12px",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(16, 185, 129, 0.35)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.04)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(16, 185, 129, 0.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(16, 185, 129, 0.35)";
        }}
      >
        <span>📲</span>
        <span>Install App</span>
      </button>

      {/* iOS Safari Installation Instruction Modal */}
      {showIOSModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowIOSModal(false)}
        >
          <div
            style={{
              background: "#161824",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "380px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
              color: "#FFFFFF",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "24px" }}>📱</span>
                <span style={{ fontWeight: 800, fontSize: "16px" }}>Install on iPhone / iPad</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
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

            <p style={{ fontSize: "13px", color: "#CBD5E1", lineHeight: 1.5, margin: "0 0 16px 0" }}>
              Install <strong>PulseLedger</strong> directly to your home screen for an authentic native fullscreen app experience:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#F1F5F9" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ background: "#10B981", color: "#000", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "11px", flexShrink: 0 }}>1</span>
                <span>Tap the <strong>Share button</strong> <span style={{ color: "#38BDF8" }}>[↑]</span> at the bottom of Safari.</span>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ background: "#10B981", color: "#000", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "11px", flexShrink: 0 }}>2</span>
                <span>Scroll down and select <strong>"Add to Home Screen"</strong>.</span>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ background: "#10B981", color: "#000", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "11px", flexShrink: 0 }}>3</span>
                <span>Tap <strong>Add</strong> in the top-right corner. PulseLedger will appear as a standalone app!</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              style={{
                width: "100%",
                marginTop: "20px",
                background: "#1E202E",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#FFFFFF",
                padding: "10px",
                borderRadius: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
