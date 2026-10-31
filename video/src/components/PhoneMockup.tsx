import React from "react";

interface PhoneMockupProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  scale?: number;
  activeTab?: "home" | "ledger" | "plan" | "coach";
  notificationText?: string | null;
  notificationSub?: string | null;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  children,
  width = 440,
  height = 920,
  scale = 1,
  activeTab = "home",
  notificationText = null,
  notificationSub = null,
}) => {
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        width,
        height,
        borderRadius: "56px",
        background: "#000000",
        border: "14px solid #1C1D24",
        boxShadow:
          "0 30px 100px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 60px rgba(16, 185, 129, 0.12)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* Top Titanium Bezel Speaker Ear-piece */}
      <div
        style={{
          position: "absolute",
          top: "6px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60px",
          height: "4px",
          background: "#2A2B33",
          borderRadius: "4px",
          zIndex: 101,
        }}
      />

      {/* Dynamic Island / Camera Pill */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "50%",
          transform: "translateX(-50%)",
          width: notificationText ? "360px" : "124px",
          height: notificationText ? "72px" : "30px",
          background: "#000000",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          borderRadius: notificationText ? "26px" : "20px",
          zIndex: 100,
          boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          alignItems: "center",
          padding: notificationText ? "10px 16px" : "0",
          overflow: "hidden",
        }}
      >
        {notificationText ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                color: "#FFFFFF",
                boxShadow: "0 2px 10px rgba(16, 185, 129, 0.4)",
              }}
            >
              ⚡
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF", display: "flex", justifyContent: "space-between" }}>
                <span>{notificationText}</span>
                <span style={{ fontSize: "10px", color: "#10B981" }}>now</span>
              </div>
              <div style={{ fontSize: "11px", color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {notificationSub || "Parsed locally with integer-paise precision"}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#0D1117" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#161B22" }} />
          </div>
        )}
      </div>

      {/* iOS Status Bar */}
      <div
        style={{
          height: "46px",
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "13px",
          fontWeight: 600,
          color: "#FFFFFF",
          zIndex: 90,
          background: "transparent",
        }}
      >
        <span>9:41</span>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "11px" }}>
          <span>5G</span>
          <span>●●●●</span>
          <span>100%</span>
        </div>
      </div>

      {/* Screen Operating Body */}
      <div
        style={{
          flex: 1,
          background: "#090A0F",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          color: "#FFFFFF",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {children}
      </div>

      {/* Floating Bottom Luxury Navigation Dock */}
      <div
        style={{
          position: "absolute",
          bottom: "22px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(18, 19, 26, 0.94)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "36px",
          padding: "6px 12px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
          zIndex: 90,
        }}
      >
        {[
          { id: "home", label: "Overview", icon: "⊞" },
          { id: "ledger", label: "Ledger", icon: "≡" },
          { id: "plan", label: "Plan", icon: "↗" },
          { id: "coach", label: "Coach", icon: "✦" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "8px 14px",
                borderRadius: "24px",
                fontSize: "12px",
                fontWeight: isActive ? 800 : 500,
                color: isActive ? "#000000" : "#94A3B8",
                background: isActive ? "#10B981" : "transparent",
                boxShadow: isActive ? "0 2px 14px rgba(16, 185, 129, 0.45)" : "none",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <span style={{ fontSize: "13px" }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          );
        })}
      </div>

      {/* Home Gesture Bar */}
      <div
        style={{
          position: "absolute",
          bottom: "6px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "140px",
          height: "4px",
          background: "rgba(255, 255, 255, 0.4)",
          borderRadius: "2px",
          zIndex: 101,
        }}
      />
    </div>
  );
};
