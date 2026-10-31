import React from "react";
import {
  IconHome,
  IconLedger,
  IconPlan,
  IconCoach,
  IconShield,
  IconLock,
  IconZap,
  IconCheck,
} from "./Icons";

export type TabType = "home" | "ledger" | "plan" | "coach";

interface WorkstationSidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  persona: string;
}

export const WorkstationSidebar: React.FC<WorkstationSidebarProps> = ({
  currentTab,
  onSelectTab,
  persona,
}) => {
  return (
    <aside className="workstation-sidebar">
      {/* User / Persona Profile */}
      <div className="sidebar-profile">
        <div className="sidebar-avatar">
          <span>{persona.charAt(0)}</span>
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{persona}</div>
          <div className="sidebar-user-role">
            {persona === "Aarav"
              ? "Allowance Regime"
              : persona === "Rohan"
              ? "Salaried Engineer"
              : "Freelance Variable"}
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="sidebar-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search... ⌘K"
          className="sidebar-search-input"
          readOnly
          onClick={() => alert("Quick Command Palette: Press ⌘K or select tabs")}
        />
        <span className="search-shortcut">⌘K</span>
      </div>

      {/* DASHBOARDS SECTION */}
      <div className="sidebar-section-title">DASHBOARDS</div>
      <nav className="sidebar-nav">
        <button
          type="button"
          className={`sidebar-nav-item ${currentTab === "home" ? "active" : ""}`}
          onClick={() => onSelectTab("home")}
        >
          <IconHome size={18} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${currentTab === "ledger" ? "active" : ""}`}
          onClick={() => onSelectTab("ledger")}
        >
          <IconLedger size={18} />
          <span>Ledger & Subs</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${currentTab === "plan" ? "active" : ""}`}
          onClick={() => onSelectTab("plan")}
        >
          <IconPlan size={18} />
          <span>Plan & What-If</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${currentTab === "coach" ? "active" : ""}`}
          onClick={() => onSelectTab("coach")}
        >
          <IconCoach size={18} />
          <span>Coach & Review</span>
        </button>
      </nav>

      {/* SYSTEM & VAULT SECTION */}
      <div className="sidebar-section-title" style={{ marginTop: "24px" }}>
        SYSTEM & SECURITY
      </div>
      <div className="sidebar-system-list">
        <div className="sidebar-system-item">
          <div className="system-dot-pulse" />
          <div className="system-text">
            <span className="system-label">Autonomous SMS Sync</span>
            <span className="system-sub">Zero-touch active</span>
          </div>
        </div>

        <div className="sidebar-system-item">
          <IconLock size={14} color="var(--tide)" />
          <div className="system-text">
            <span className="system-label">On-Device Privacy</span>
            <span className="system-sub">Zero cloud telemetry</span>
          </div>
        </div>

        <div className="sidebar-system-item">
          <IconShield size={14} color="var(--tide)" />
          <div className="system-text">
            <span className="system-label">3-Layer Firewall</span>
            <span className="system-sub">SEBI compliant</span>
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-brand-mark">
          <IconShield size={16} color="var(--tide)" strokeWidth={2.5} />
          <span className="sidebar-brand-name">PulseLedger</span>
          <span className="sidebar-version-tag">v2.4 Pro</span>
        </div>
      </div>
    </aside>
  );
};

