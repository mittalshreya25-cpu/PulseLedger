import React from "react";

interface PhoneMockupProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  scale?: number;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  children,
  width = 380,
  height = 760,
  scale = 1,
}) => {
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        width,
        height,
        borderRadius: "44px",
        background: "#051F20",
        border: "12px solid #163832",
        boxShadow: "0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(142, 182, 155, 0.15)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Dynamic Island / Speaker Notch */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "110px",
          height: "24px",
          background: "#020E0E",
          borderRadius: "20px",
          zIndex: 100,
        }}
      />

      {/* Screen Content */}
      <div
        style={{
          flex: 1,
          padding: "36px 16px 20px 16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: "#DAF1DE",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {children}
      </div>

      {/* Home Indicator Bar */}
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "130px",
          height: "4px",
          background: "rgba(218, 241, 222, 0.4)",
          borderRadius: "3px",
        }}
      />
    </div>
  );
};
