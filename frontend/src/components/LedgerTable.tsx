import React, { useState, useMemo, useRef, useEffect } from "react";
import { Transaction } from "../api";
import { formatINR, formatDate } from "../utils/format";
import { getCategoryMeta, CATEGORY_PALETTE } from "../utils/categories";
import {
  IconSearch,
  IconDownload,
  IconSparkles,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconTag,
  IconChevronDown,
  IconCheck,
  IconEye,
  IconCalendar,
  IconVault,
} from "./Icons";

interface LedgerTableProps {
  transactions: Transaction[];
  categories: string[];
  onCategoryChange: (transactionId: number, newCategory: string) => Promise<void>;
  onOpenRuleSheet: (transaction: Transaction) => void;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  transactions,
  categories,
  onCategoryChange,
  onOpenRuleSheet,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDirection, setSelectedDirection] = useState<"ALL" | "DEBIT" | "CREDIT">("ALL");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [activeDropdownTxId, setActiveDropdownTxId] = useState<number | null>(null);
  const [inspectingTx, setInspectingTx] = useState<Transaction | null>(null);

  // Close dropdown on outside click
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownTxId(null);
      }
    };
    if (activeDropdownTxId !== null) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [activeDropdownTxId]);

  // Compute category counts for quick-filter tabs
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tx of transactions) {
      const cat = tx.category || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [transactions]);

  // Compute running balance for each transaction
  // If tx has balance_paise, respect it; otherwise calculate based on latest known balance
  const transactionsWithBalance = useMemo(() => {
    // Sort chronologically for running balance computation
    const chronological = [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
    let runningBalance: number = 0;
    
    // Find latest known anchor balance
    const knownAnchor = [...chronological].reverse().find((t) => t.balance_paise != null);
    if (knownAnchor && knownAnchor.balance_paise != null) {
      runningBalance = knownAnchor.balance_paise;
    } else {
      runningBalance = 2500000; // Baseline ₹25,000.00
    }

    const balanceMap = new Map<number, number>();
    for (const tx of chronological) {
      if (tx.balance_paise != null) {
        runningBalance = tx.balance_paise;
      } else {
        const delta = (tx.direction || "DEBIT").toUpperCase() === "CREDIT" ? tx.amount_paise : -tx.amount_paise;
        runningBalance += delta;
      }
      balanceMap.set(tx.id, runningBalance);
    }

    return transactions.map((tx) => ({
      ...tx,
      computedBalancePaise: balanceMap.get(tx.id) ?? tx.balance_paise ?? 0,
    }));
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactionsWithBalance
      .filter((tx) => {
        // Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const merchantMatch = (tx.merchant || "").toLowerCase().includes(term);
          const catMatch = (tx.category || "").toLowerCase().includes(term);
          const refMatch = (tx.ref_no || "").toLowerCase().includes(term);
          const amtMatch = (tx.amount_paise / 100).toString().includes(term);
          if (!merchantMatch && !catMatch && !refMatch && !amtMatch) return false;
        }

        // Category filter
        if (selectedCategory !== "ALL") {
          const currentCat = tx.category || "Uncategorized";
          if (currentCat !== selectedCategory) return false;
        }

        // Direction filter
        if (selectedDirection !== "ALL") {
          if ((tx.direction || "DEBIT").toUpperCase() !== selectedDirection) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date_desc") return b.date.localeCompare(a.date) || b.id - a.id;
        if (sortBy === "date_asc") return a.date.localeCompare(b.date) || a.id - b.id;
        if (sortBy === "amount_desc") return b.amount_paise - a.amount_paise;
        if (sortBy === "amount_asc") return a.amount_paise - b.amount_paise;
        return 0;
      });
  }, [transactionsWithBalance, searchTerm, selectedCategory, selectedDirection, sortBy]);

  // Aggregate metrics
  const { totalDebits, totalCredits, netCashFlow } = useMemo(() => {
    let debits = 0;
    let credits = 0;
    for (const tx of filteredTransactions) {
      if ((tx.direction || "DEBIT").toUpperCase() === "DEBIT") {
        debits += tx.amount_paise;
      } else {
        credits += tx.amount_paise;
      }
    }
    return {
      totalDebits: debits,
      totalCredits: credits,
      netCashFlow: credits - debits,
    };
  }, [filteredTransactions]);

  // Category select handler
  const handleSelectCategory = async (txId: number, newCat: string) => {
    setUpdatingId(txId);
    setActiveDropdownTxId(null);
    try {
      await onCategoryChange(txId, newCat);
    } finally {
      setUpdatingId(null);
    }
  };

  // Export to standard Ledger CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = [
      "Transaction_ID",
      "Date",
      "Merchant_Payee",
      "Type",
      "Category",
      "Amount_INR",
      "Running_Balance_INR",
      "Channel_Source",
      "UPI_Ref_No",
    ];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.date,
      `"${(tx.merchant || "Unknown").replace(/"/g, '""')}"`,
      tx.direction || "DEBIT",
      `"${(tx.category || "Uncategorized").replace(/"/g, '""')}"`,
      ((tx.direction || "DEBIT") === "DEBIT" ? -tx.amount_paise / 100 : tx.amount_paise / 100).toFixed(2),
      (tx.computedBalancePaise / 100).toFixed(2),
      tx.source || "sms",
      tx.ref_no || "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pulseledger_general_ledger_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ledger-table-container">
      {/* -------------------- MASTER WORKSTATION BANNER -------------------- */}
      <div className="ledger-master-header">
        <div className="ledger-title-area">
          <div className="ledger-badge-row">
            <span className="live-pulse-dot" />
            <span className="ledger-tag-pill">AUDITED DOUBLE-ENTRY REGISTER</span>
            <span className="ledger-count-pill">{transactions.length} Records</span>
          </div>
          <h2 className="ledger-main-heading">Financial Transaction Ledger</h2>
          <p className="ledger-sub-heading">
            Reconciled bank & UPI cash movements strictly stored in integer paise with automatic merchant categorization.
          </p>
        </div>

        {/* -------------------- EXECUTIVE KPI STRIP -------------------- */}
        <div className="ledger-kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Ledger Volume</span>
            <span className="kpi-value money">{filteredTransactions.length}</span>
            <span className="kpi-sub">Total Movements</span>
          </div>

          <div className="kpi-card debit">
            <span className="kpi-label">Total Outflows (Dr.)</span>
            <span className="kpi-value money" style={{ color: "var(--persimmon)" }}>
              -{formatINR(totalDebits)}
            </span>
            <span className="kpi-sub">Debited to vendors</span>
          </div>

          <div className="kpi-card credit">
            <span className="kpi-label">Total Inflows (Cr.)</span>
            <span className="kpi-value money" style={{ color: "var(--tide)" }}>
              +{formatINR(totalCredits)}
            </span>
            <span className="kpi-sub">Allowance & Credits</span>
          </div>

          <div className="kpi-card net">
            <span className="kpi-label">Net Movement</span>
            <span
              className="kpi-value money"
              style={{ color: netCashFlow >= 0 ? "var(--tide)" : "var(--persimmon)" }}
            >
              {netCashFlow >= 0 ? "+" : ""}
              {formatINR(netCashFlow)}
            </span>
            <span className="kpi-sub">{netCashFlow >= 0 ? "Net Positive" : "Deficit Burn"}</span>
          </div>
        </div>
      </div>

      {/* -------------------- QUICK CATEGORY FILTER CHIPS -------------------- */}
      <div className="category-chips-strip" aria-label="Category quick filters">
        <button
          type="button"
          className={`cat-chip-btn ${selectedCategory === "ALL" ? "active" : ""}`}
          onClick={() => setSelectedCategory("ALL")}
        >
          <span>All Categories</span>
          <span className="chip-count">{transactions.length}</span>
        </button>

        {Object.entries(CATEGORY_PALETTE).map(([catKey, meta]) => {
          const count = categoryCounts[catKey] || 0;
          if (count === 0 && catKey !== "Allowance" && catKey !== "Food" && catKey !== "Education") return null;
          const isSelected = selectedCategory === catKey;

          return (
            <button
              key={catKey}
              type="button"
              className={`cat-chip-btn ${isSelected ? "active" : ""}`}
              onClick={() => setSelectedCategory(isSelected ? "ALL" : catKey)}
              style={{
                borderColor: isSelected ? meta.color : undefined,
                backgroundColor: isSelected ? meta.bg : undefined,
              }}
            >
              <span className="cat-chip-icon">{meta.icon}</span>
              <span style={{ color: isSelected ? meta.color : undefined }}>{catKey}</span>
              <span
                className="chip-count"
                style={{
                  background: isSelected ? meta.color : undefined,
                  color: isSelected ? "#0D1417" : undefined,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* -------------------- SEARCH & ADVANCED FILTER TOOLBAR -------------------- */}
      <div className="ledger-toolbar">
        {/* Search Input */}
        <div className="ledger-search-box">
          <IconSearch size={16} color="var(--slate)" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search payee, ref #, amount, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Toolbar Selects */}
        <div className="ledger-filters-group">
          {/* Category Dropdown Filter */}
          <div className="select-wrapper">
            <IconTag size={15} color="var(--slate)" className="select-icon" />
            <select
              className="toolbar-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              title="Filter by category"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c} ({categoryCounts[c] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Direction Filter */}
          <select
            className="toolbar-select"
            value={selectedDirection}
            onChange={(e) => setSelectedDirection(e.target.value as any)}
            title="Filter by direction"
          >
            <option value="ALL">All Types (Dr. & Cr.)</option>
            <option value="DEBIT">Debits Only (-)</option>
            <option value="CREDIT">Credits / Inflow Only (+)</option>
          </select>

          {/* Sort By */}
          <select
            className="toolbar-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            title="Sort transactions"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>

          {/* Export CSV Button */}
          <button
            type="button"
            className="btn-secondary export-btn"
            onClick={handleExportCSV}
            title="Export filtered transactions as audited CSV"
          >
            <IconDownload size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* -------------------- TABULAR FINANCIAL LEDGER TABLE -------------------- */}
      <div className="table-responsive-wrapper">
        <table className="fintech-ledger-table" aria-label="Financial Transactions Ledger">
          <thead>
            <tr>
              <th scope="col" style={{ minWidth: "110px", width: "13%" }}>
                <span className="th-content">
                  <IconCalendar size={13} />
                  <span>Date & Time</span>
                </span>
              </th>
              <th scope="col" style={{ minWidth: "170px", width: "20%" }}>
                <span className="th-content">Payee & Details</span>
              </th>
              <th scope="col" style={{ minWidth: "170px", width: "20%" }}>
                <span className="th-content">
                  <IconTag size={13} />
                  <span>Category (Click Dropdown to Edit)</span>
                </span>
              </th>
              <th scope="col" style={{ minWidth: "100px", width: "11%", textAlign: "center" }}>
                <span className="th-content" style={{ justifyContent: "center" }}>Flow Type</span>
              </th>
              <th scope="col" style={{ minWidth: "110px", width: "12%", textAlign: "right" }}>
                <span className="th-content" style={{ justifyContent: "flex-end" }}>Amount (INR)</span>
              </th>
              <th scope="col" style={{ minWidth: "120px", width: "13%", textAlign: "right" }}>
                <span className="th-content" style={{ justifyContent: "flex-end" }}>
                  <IconVault size={13} />
                  <span>Running Balance</span>
                </span>
              </th>
              <th scope="col" style={{ minWidth: "100px", width: "11%", textAlign: "center" }}>
                <span className="th-content" style={{ justifyContent: "center" }}>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="ledger-empty-cell">
                  <div className="empty-state-title">No transactions match your search</div>
                  <div className="empty-state-desc">
                    Try resetting category filters, clearing your search keyword, or adding a transaction via Quick Add.
                  </div>
                  {(searchTerm || selectedCategory !== "ALL" || selectedDirection !== "ALL") && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("ALL");
                        setSelectedDirection("ALL");
                      }}
                      style={{ marginTop: "12px", minHeight: "34px", padding: "4px 14px", fontSize: "0.85rem" }}
                    >
                      Reset All Filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isDebit = (tx.direction || "DEBIT").toUpperCase() === "DEBIT";
                const catMeta = getCategoryMeta(tx.category);
                const merchantName = tx.merchant || "Unknown Payee";
                const avatarInitial = merchantName.charAt(0).toUpperCase();
                const isDropdownOpen = activeDropdownTxId === tx.id;
                const isUpdating = updatingId === tx.id;

                return (
                  <tr key={tx.id} className="ledger-row">
                    {/* 1. Date */}
                    <td className="cell-date">
                      <span className="date-main">{formatDate(tx.date)}</span>
                      <span className="date-sub">{tx.date}</span>
                    </td>

                    {/* 2. Merchant & Details */}
                    <td className="cell-merchant">
                      <div className="merchant-details-wrapper">
                        <div
                          className="merchant-avatar"
                          style={{
                            background: `linear-gradient(135deg, ${catMeta.color}33, ${catMeta.color}11)`,
                            border: `1.5px solid ${catMeta.color}77`,
                            color: catMeta.color,
                          }}
                        >
                          {avatarInitial}
                        </div>
                        <div className="merchant-text-group">
                          <span className="merchant-name" title={merchantName}>
                            {merchantName}
                          </span>
                          <div className="merchant-meta-tags">
                            <span className="source-pill" title={`Data Source: ${tx.source || "sms"}`}>
                              {(tx.source || "sms").toUpperCase()}
                            </span>
                            {tx.ref_no && (
                              <span className="ref-pill" title={`Ref: ${tx.ref_no}`}>
                                #{tx.ref_no.slice(-6)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Category Column with Interactive Dropdown Menu */}
                    <td className="cell-category">
                      <div className="category-dropdown-container">
                        {/* The Category Badge Button that opens dropdown */}
                        <button
                          type="button"
                          className="category-badge-trigger"
                          onClick={() => setActiveDropdownTxId(isDropdownOpen ? null : tx.id)}
                          style={{
                            backgroundColor: catMeta.bg,
                            borderColor: catMeta.border,
                            color: catMeta.color,
                          }}
                          title="Click to change category"
                        >
                          <span className="cat-icon">{catMeta.icon}</span>
                          <span className="cat-name-label">{tx.category || "Uncategorized"}</span>
                          <IconChevronDown
                            size={14}
                            color={catMeta.color}
                            className={`cat-chevron ${isDropdownOpen ? "rotated" : ""}`}
                          />
                        </button>

                        {/* Saving Spinner Indicator */}
                        {isUpdating && <span className="cat-saving-pulse" title="Saving category..." />}

                        {/* Floating Custom Category Dropdown Menu */}
                        {isDropdownOpen && (
                          <div className="category-floating-menu" ref={dropdownRef}>
                            <div className="category-menu-header">
                              <span>Select Expense / Income Category</span>
                            </div>
                            <div className="category-menu-list">
                              {categories.map((c) => {
                                const optMeta = getCategoryMeta(c);
                                const isSelected = (tx.category || "Uncategorized") === c;

                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    className={`category-menu-item ${isSelected ? "selected" : ""}`}
                                    onClick={() => handleSelectCategory(tx.id, c)}
                                    style={{
                                      borderLeftColor: isSelected ? optMeta.color : "transparent",
                                    }}
                                  >
                                    <span
                                      className="item-icon-badge"
                                      style={{
                                        backgroundColor: optMeta.bg,
                                        borderColor: optMeta.border,
                                        color: optMeta.color,
                                      }}
                                    >
                                      {optMeta.icon}
                                    </span>
                                    <div className="item-details">
                                      <span className="item-name" style={{ color: isSelected ? optMeta.color : "var(--ink)" }}>
                                        {c}
                                      </span>
                                      {optMeta.description && (
                                        <span className="item-desc">{optMeta.description}</span>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <IconCheck size={16} color={optMeta.color} className="item-check" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 4. Type / Direction */}
                    <td className="cell-type" style={{ textAlign: "center" }}>
                      <span className={`direction-pill ${isDebit ? "debit" : "credit"}`}>
                        {isDebit ? (
                          <>
                            <IconArrowDownLeft size={13} />
                            <span>DEBIT</span>
                          </>
                        ) : (
                          <>
                            <IconArrowUpRight size={13} />
                            <span>CREDIT</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* 5. Amount */}
                    <td className="cell-amount" style={{ textAlign: "right" }}>
                      <span className={`amount-value money ${isDebit ? "debit" : "credit"}`}>
                        {isDebit ? "-" : "+"}
                        {formatINR(tx.amount_paise)}
                      </span>
                    </td>

                    {/* 6. Running Balance */}
                    <td className="cell-balance" style={{ textAlign: "right" }}>
                      <span className="balance-value money">
                        {formatINR(tx.computedBalancePaise)}
                      </span>
                      {tx.balance_paise != null && (
                        <span className="balance-verified-tag" title="Bank-verified balance from SMS">
                          Verified
                        </span>
                      )}
                    </td>

                    {/* 7. Actions */}
                    <td className="cell-action" style={{ textAlign: "center" }}>
                      <div className="action-button-group">
                        <button
                          type="button"
                          className="teach-rule-btn"
                          onClick={() => onOpenRuleSheet(tx)}
                          title="Teach categorization rule for this payee & auto-update history"
                        >
                          <IconSparkles size={14} color="var(--tide)" />
                          <span>Rule</span>
                        </button>

                        <button
                          type="button"
                          className="inspect-btn"
                          onClick={() => setInspectingTx(tx)}
                          title="Inspect raw transaction details & forensics"
                        >
                          <IconEye size={14} color="var(--slate)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------- TRANSACTION FORENSIC MODAL -------------------- */}
      {inspectingTx && (
        <div className="modal-backdrop" onClick={() => setInspectingTx(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Transaction Forensics</h3>
                <span className="modal-subtitle">ID #{inspectingTx.id} • {formatDate(inspectingTx.date)}</span>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setInspectingTx(null)}
              >
                ×
              </button>
            </div>

            <div className="forensic-body">
              <div className="forensic-grid">
                <div className="forensic-item">
                  <span className="forensic-lbl">Merchant / Counterparty</span>
                  <span className="forensic-val">{inspectingTx.merchant || "Unknown"}</span>
                </div>

                <div className="forensic-item">
                  <span className="forensic-lbl">Amount & Direction</span>
                  <span
                    className="forensic-val money"
                    style={{
                      color:
                        (inspectingTx.direction || "DEBIT") === "DEBIT"
                          ? "var(--persimmon)"
                          : "var(--tide)",
                    }}
                  >
                    {(inspectingTx.direction || "DEBIT") === "DEBIT" ? "-" : "+"}
                    {formatINR(inspectingTx.amount_paise)} ({(inspectingTx.direction || "DEBIT")})
                  </span>
                </div>

                <div className="forensic-item">
                  <span className="forensic-lbl">Assigned Category</span>
                  <span className="forensic-val">
                    {getCategoryMeta(inspectingTx.category).icon} {inspectingTx.category || "Uncategorized"}
                  </span>
                </div>

                <div className="forensic-item">
                  <span className="forensic-lbl">Data Source Channel</span>
                  <span className="forensic-val">{inspectingTx.source || "sms"}</span>
                </div>

                <div className="forensic-item">
                  <span className="forensic-lbl">UPI / Bank Ref No.</span>
                  <span className="forensic-val font-mono">{inspectingTx.ref_no || "N/A"}</span>
                </div>

                <div className="forensic-item">
                  <span className="forensic-lbl">Reconciled Paytm ID</span>
                  <span className="forensic-val">{inspectingTx.matched_paytm_id ?? "None"}</span>
                </div>

                <div className="forensic-item">
                  <span className="forensic-lbl">Deduplication Key</span>
                  <span className="forensic-val font-mono text-xs">{inspectingTx.dedupe_key || "N/A"}</span>
                </div>

                <div className="forensic-item">
                  <span className="forensic-lbl">Account Balance After Spend</span>
                  <span className="forensic-val money">
                    {inspectingTx.balance_paise != null
                      ? formatINR(inspectingTx.balance_paise)
                      : "Calculated from chain"}
                  </span>
                </div>
              </div>

              <div className="forensic-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const tx = inspectingTx;
                    setInspectingTx(null);
                    onOpenRuleSheet(tx);
                  }}
                >
                  <IconSparkles size={16} />
                  <span>Teach Rule for {inspectingTx.merchant}</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setInspectingTx(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
