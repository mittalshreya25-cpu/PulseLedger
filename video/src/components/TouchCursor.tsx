import React from "react";

interface TouchCursorProps {
  x: number;
  y: number;
  isTapping?: boolean;
  visible?: boolean;
}

export const TouchCursor: React.FC<TouchCursorProps> = ({
  x,
  y,
  isTapping = false,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 9999,
        transition: "left 0.25s cubic-bezier(0.16, 1, 0.3, 1), top 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Outer Haptic Ripple Ring (when tapping) */}
      {isTapping && (
        <div
          style={{
            position: "absolute",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            border: "2px solid rgba(16, 185, 129, 0.6)",
            transform: "translate(-50%, -50%) scale(1.4)",
            animation: "hapticRipple 0.4s ease-out forwards",
            left: "50%",
            top: "50%",
          }}
        />
      )}

      {/* Main Touch Pointer */}
      <div
        style={{
          width: isTapping ? "28px" : "34px",
          height: isTapping ? "28px" : "34px",
          borderRadius: "50%",
          background: isTapping
            ? "radial-gradient(circle, rgba(16, 185, 129, 0.8) 0%, rgba(16, 185, 129, 0.4) 100%)"
            : "radial-gradient(circle, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.25) 100%)",
          border: isTapping ? "2px solid #10B981" : "2px solid rgba(255, 255, 255, 0.8)",
          boxShadow: isTapping
            ? "0 0 20px rgba(16, 185, 129, 0.8)"
            : "0 6px 16px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(6px)",
          transition: "all 0.15s ease",
        }}
      />
    </div>
  );
};
