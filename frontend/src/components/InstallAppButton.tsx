import React, { useEffect, useState } from "react";
import { DownloadAppModal } from "./DownloadAppModal";

export const InstallAppButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showModal, setShowModal] = useState(false);

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

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      setShowModal(true);
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
        onClick={() => setShowModal(true)}
        title="Download or install PulseLedger on your phone as a mobile app"
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
        <span>Download App</span>
      </button>

      <DownloadAppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTriggerPwaInstall={handlePwaInstall}
        canPwaInstall={!!deferredPrompt}
        isIOS={isIOS}
      />
    </>
  );
};
