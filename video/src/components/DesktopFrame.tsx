import React from "react";

interface DesktopFrameProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  title?: string;
}

export const DesktopFrame: React.FC<DesktopFrameProps> = ({
  children,
  width = 1520,
  height = 860,
  title = "PulseLedger Workstation — http://localhost:5173",
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: "16px",
        background: "#051F20",
        border: "1px solid rgba(218, 241, 222, 0.2)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.8), 0 0 50px rgba(142, 182, 155, 0.12)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Window Titlebar */}
      <div
        style={{
          height: "40px",
          background: "#0B2B26",
          borderBottom: "1px solid rgba(218, 241, 222, 0.12)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          justifyContent: "space-between",
          fontSize: "13px",
          color: "rgba(218, 241, 222, 0.7)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F56" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27C93F" }} />
          <span style={{ marginLeft: "12px", color: "#DAF1DE", fontWeight: 600 }}>PulseLedger</span>
        </div>
        <div
          style={{
            background: "rgba(5, 31, 32, 0.8)",
            padding: "4px 24px",
            borderRadius: "6px",
            fontSize: "12px",
            border: "1px solid rgba(218, 241, 222, 0.1)",
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
          <span style={{ color: "#8EB69B" }}>● Live Localhost</span>
        </div>
      </div>

      {/* Frame Body */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          background: "#051F20",
          display: "flex",
        }}
      >
        {children}
      </div>
    </div>
  );
};
