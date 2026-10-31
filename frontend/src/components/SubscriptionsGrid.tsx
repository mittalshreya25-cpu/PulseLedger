import React from "react";
import { RecurringSeries } from "../api";
import { formatINR, formatDate } from "../utils/format";
import { IconRepeat, IconAlert, IconTrendingUp } from "./Icons";

interface SubscriptionsGridProps {
  subscriptions: RecurringSeries[];
}

export const SubscriptionsGrid: React.FC<SubscriptionsGridProps> = ({ subscriptions }) => {
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="subscriptions-card card">
        <div className="section-title">
          <IconRepeat size={20} color="var(--tide)" />
          <span>Recurring Subscriptions (0)</span>
        </div>
        <p style={{ margin: 0, color: "var(--slate)", fontSize: "0.9rem" }}>
          No recurring subscriptions detected yet. When 3+ payments occur on a cadence, PulseLedger automatically tracks them here.
        </p>
      </div>
    );
  }

  const totalMonthlyCost = subscriptions.reduce((sum, s) => sum + s.monthly_cost_paise, 0);
  const totalAnnualCost = subscriptions.reduce((sum, s) => sum + s.estimated_annual_paise, 0);
  const alertsCount = subscriptions.reduce((sum, s) => sum + (s.alerts?.length || 0), 0);

  return (
    <div className="subscriptions-section card">
      {/* Header & Metrics Strip */}
      <div className="subs-header-row">
        <div>
          <h2 className="section-title">
            <IconRepeat size={20} color="var(--tide)" />
            <span>Recurring Subscriptions ({subscriptions.length})</span>
          </h2>
          <span style={{ fontSize: "0.82rem", color: "var(--slate)" }}>
            Automatically monitored via median-interval cadence detection
          </span>
        </div>

        <div className="subs-metrics-badge-group">
          <div className="metric-pill">
            <span className="metric-lbl">Monthly Burn:</span>
            <span className="metric-val money" style={{ color: "var(--persimmon)" }}>
              {formatINR(totalMonthlyCost)}/mo
            </span>
          </div>
          <div className="metric-pill">
            <span className="metric-lbl">Annualized:</span>
            <span className="metric-val money">
              {formatINR(totalAnnualCost)}/yr
            </span>
          </div>
          {alertsCount > 0 && (
            <div className="metric-pill alert">
              <IconAlert size={14} color="var(--saffron)" />
              <span className="metric-val">{alertsCount} Alert{alertsCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div className="subs-grid">
        {subscriptions.map((sub, idx) => {
          const merchant = sub.merchant;
          const initial = merchant.charAt(0).toUpperCase();
          const hasAlert = sub.alerts && sub.alerts.length > 0;
          const isNetflix = merchant.toLowerCase().includes("netflix");
          const isSpotify = merchant.toLowerCase().includes("spotify");

          const brandColor = isNetflix ? "#E50914" : isSpotify ? "#1DB954" : "var(--tide)";

          return (
            <div key={idx} className={`sub-card ${hasAlert ? "has-alert" : ""}`}>
              <div className="sub-card-top">
                <div className="sub-brand-group">
                  <div
                    className="sub-avatar"
                    style={{
                      background: `linear-gradient(135deg, ${brandColor}22, ${brandColor}44)`,
                      border: `1.5px solid ${brandColor}`,
                      color: brandColor,
                    }}
                  >
                    {initial}
                  </div>
                  <div>
                    <div className="sub-merchant-name">{merchant}</div>
                    <div className="sub-cadence-tags">
                      <span className="cadence-pill">{sub.cadence.toUpperCase()}</span>
                      <span className="sub-category-tag">{sub.category}</span>
                    </div>
                  </div>
                </div>

                <div className="sub-amount-group">
                  <div className="money sub-price">{formatINR(sub.latest_amount_paise)}</div>
                  <div className="sub-annual-cost">{formatINR(sub.estimated_annual_paise)} / year</div>
                </div>
              </div>

              {/* Next Due Countdown */}
              <div className="sub-billing-info">
                <span>Next Billing: <strong>{formatDate(sub.next_expected)}</strong></span>
                <span className="sub-interval-text">{sub.interval_days}d interval • {sub.occurrences} charges</span>
              </div>

              {/* Alert Callout if Price Hike Detected */}
              {hasAlert && (
                <div className="sub-alert-banner">
                  <IconAlert size={16} color="var(--persimmon)" className="sub-alert-icon" />
                  <div className="sub-alert-text">
                    <strong>Price Change Alert:</strong> {sub.alerts[0].message}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

