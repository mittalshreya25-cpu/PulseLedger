import React from "react";
import { formatINR } from "../utils/format";
import { SafeToSpendData } from "../api";
import { IconShield, IconTrendingUp, IconRepeat, IconAlert } from "./Icons";

interface KpiStatCardsProps {
  safeData: SafeToSpendData | null;
  onQuickAction?: () => void;
}

export const KpiStatCards: React.FC<KpiStatCardsProps> = ({ safeData, onQuickAction }) => {
  const remainingToday = safeData?.remaining_today_paise ?? 12000;
  const liquidPaise = safeData?.liquid_paise ?? 2488000;
  const dailyTargetPaise = safeData?.daily_paise ?? 42000;
  const commitmentsPaise = safeData?.commitments_paise ?? 1200000;
  const isOvercommitted = safeData?.status === "overcommitted";

  return (
    <div className="kpi-grid">
      {/* KPI 1: Safe to Spend Today */}
      <div className="kpi-card highlight-kpi">
        <div className="kpi-header">
          <span className="kpi-label">Safe to spend today</span>
          <span className="kpi-badge-sage">
            ▲ {formatINR(dailyTargetPaise)}/day
          </span>
        </div>
        <div className="kpi-value-row">
          <span className={`kpi-big-number money ${isOvercommitted ? "overcommitted" : ""}`}>
            {formatINR(remainingToday)}
          </span>
        </div>
        <div className="kpi-footer">
          <span className="kpi-sub">
            {isOvercommitted
              ? "Overcommitted until next income"
              : `Free cash pool: ${formatINR(safeData?.segments?.free ?? 588000)}`}
          </span>
        </div>
      </div>

      {/* KPI 2: Liquid Cash Runway */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-label">Liquid Runway Pool</span>
          <span className="kpi-badge-neutral">
            {safeData?.horizon_days ?? 14}d Horizon
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-big-number money">{formatINR(liquidPaise)}</span>
        </div>
        <div className="kpi-footer">
          <span className="kpi-sub">Bank balance across 2 accounts</span>
        </div>
      </div>

      {/* KPI 3: Goal Momentum */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-label">MacBook Fund</span>
          <span className="kpi-badge-sage">71% On Track</span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-big-number money">71%</span>
        </div>
        <div className="kpi-footer">
          <div className="kpi-progress-bar">
            <div className="kpi-progress-fill" style={{ width: "71%" }} />
          </div>
          <span className="kpi-sub" style={{ marginTop: "4px" }}>
            Target: ₹60,000 (Target: Jun 2027)
          </span>
        </div>
      </div>

      {/* KPI 4: Recurring Commitments */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-label">Fixed Commitments</span>
          <span className="kpi-badge-neutral">2 Subscriptions</span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-big-number money">{formatINR(commitmentsPaise)}</span>
        </div>
        <div className="kpi-footer">
          <span className="kpi-sub">Rent + Netflix + Spotify due in horizon</span>
        </div>
      </div>
    </div>
  );
};

