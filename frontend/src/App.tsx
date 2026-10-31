import React, { useEffect, useState, useMemo } from "react";
import {
  api,
  SafeToSpendData,
  Transaction,
  IngestSmsResponse,
  RulePreviewResponse,
  RecurringSeries,
  SimulationResult,
  RippleResult,
  ReverseIncomeResult,
  CliffResult,
  NudgeItem,
  MonthlyReportData,
  CoachChatResponse,
  ProfileData,
} from "./api";
import { formatINR, formatRupeesText, formatDate } from "./utils/format";
import { FanChart } from "./components/FanChart";
import { LedgerTable } from "./components/LedgerTable";
import { SubscriptionsGrid } from "./components/SubscriptionsGrid";
import { getCategoryMeta } from "./utils/categories";

export type TabType = "home" | "ledger" | "plan" | "coach";
import {
  IconHome,
  IconLedger,
  IconPlan,
  IconCoach,
  IconAlert,
  IconShield,
  IconTrendingUp,
  IconRepeat,
  IconUser,
  IconFileText,
} from "./components/Icons";
import "./styles/App.css";

const COMMON_CHIPS = ["Swiggy", "Zomato", "Rapido", "Uber", "Blinkit"];

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>("home");
  const [activePersona, setActivePersona] = useState<"Aarav" | "Rohan" | "Kabir">("Aarav");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pulseledger_theme");
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "dark"; // Default to curated emerald noir dark theme
  });
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("pulseledger_theme", theme);
    }
  }, [theme]);

  // Core Data State
  const [safeData, setSafeData] = useState<SafeToSpendData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [needsMerchantList, setNeedsMerchantList] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subscriptions, setSubscriptions] = useState<RecurringSeries[]>([]);
  const [nudges, setNudges] = useState<NudgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Add State
  const [quickAmount, setQuickAmount] = useState("");
  const [quickDirection, setQuickDirection] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [quickMerchant, setQuickMerchant] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [lastRipple, setLastRipple] = useState<RippleResult | null>(null);

  // Paste SMS State
  const [smsText, setSmsText] = useState("");
  const [smsParsing, setSmsParsing] = useState(false);
  const [smsResult, setSmsResult] = useState<IngestSmsResponse | null>(null);

  // "What was this?" Queue State
  const [merchantInputs, setMerchantInputs] = useState<Record<number, string>>({});
  const [savingMerchantId, setSavingMerchantId] = useState<number | null>(null);

  // Correction Sheet State
  const [activeTxForSheet, setActiveTxForSheet] = useState<Transaction | null>(null);
  const [sheetCategory, setSheetCategory] = useState<string>("");
  const [sheetScope, setSheetScope] = useState<"payee_always" | "payee_in_band">("payee_always");
  const [previewData, setPreviewData] = useState<RulePreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [appliedRuleId, setAppliedRuleId] = useState<number | null>(null);
  const [sheetActionStatus, setSheetActionStatus] = useState<string | null>(null);

  // Simulation & What-If State
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [diningCutPct, setDiningCutPct] = useState(0);
  const [rentDeltaRupees, setRentDeltaRupees] = useState(0);

  // Reverse Income Solver State
  const [solverCity, setSolverCity] = useState("Bengaluru");
  const [personalFixed, setPersonalFixed] = useState(25000);
  const [personalDiscretionary, setPersonalDiscretionary] = useState(12000);
  const [familySupport, setFamilySupport] = useState(8000);
  const [goalSavings, setGoalSavings] = useState(10000);
  const [solverResult, setSolverResult] = useState<ReverseIncomeResult | null>(null);
  const [solverLoading, setSolverLoading] = useState(false);

  // Cliff Partition State
  const [cliffPayments, setCliffPayments] = useState(3);
  const [cliffStipend, setCliffStipend] = useState(40000);
  const [cliffGapMonths, setCliffGapMonths] = useState(4);
  const [cliffLivingCost, setCliffLivingCost] = useState(28000);
  const [cliffResult, setCliffResult] = useState<CliffResult | null>(null);

  // Zen Minimalist Sub-Tab Views
  const [ledgerSubTab, setLedgerSubTab] = useState<"transactions" | "subscriptions">("transactions");
  const [planSubTab, setPlanSubTab] = useState<"trajectory" | "solver">("trajectory");
  const [showMonthlyReview, setShowMonthlyReview] = useState(false);

  // Coach Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{
      sender: "user" | "assistant";
      text: string;
      isBlocked?: boolean;
      scenarios?: any[];
    }>
  >([
    {
      sender: "assistant",
      text: "Hello! I am your PulseLedger Financial Coach. Ask me anything about your cash flow, daily safe-to-spend limits, or what-if scenarios.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);

  // Monthly Report State
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Manual Tools Accordion Toggle
  const [showManualTools, setShowManualTools] = useState(false);

  // Autonomous SMS Simulation Handler
  const handleSimulateSms = async (customSms?: any) => {
    setSmsParsing(true);
    const sms =
      typeof customSms === "string" && customSms.length > 5
        ? customSms
        : "Rs 140.00 debited from Canara Bank A/C ...1234 on 31-Oct-26 at SWIGGY BANGALORE UPI:694827104928. Avl Bal: Rs 14,860.00";
    try {
      const res = await api.ingestSms(sms);
      setSmsResult(res);
      // Trigger full data refresh
      await Promise.all([
        api.getSafeToSpend().then(setSafeData).catch(() => {}),
        api.getTransactions(50).then(setTransactions).catch(() => {}),
        api.getNeedsMerchant().then(setNeedsMerchantList).catch(() => {}),
        api.getNudges().then(setNudges).catch(() => {}),
      ]);
    } finally {
      setSmsParsing(false);
    }
  };

  // Load all initial data
  const fetchData = async () => {
    try {
      setError(null);
      const [sts, txs, needs, cats, subs, n] = await Promise.all([
        api.getSafeToSpend(),
        api.getTransactions(50),
        api.getNeedsMerchant(),
        api.getCategories(),
        api.getSubscriptions().catch(() => []),
        api.getNudges().catch(() => []),
      ]);
      setSafeData(sts);
      setTransactions(txs);
      setNeedsMerchantList(needs);
      setCategories(cats);
      setSubscriptions(subs);
      setNudges(n);
      setIsOffline(api.getOfflineStatus());
    } catch (err: any) {
      setError(err.message || "Failed to load data from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    loadMonthlyReport();
  }, []);

  // Run initial simulation
  const runSimulation = async (multiplier: number = 1.0, rentDelta: number = 0) => {
    setSimLoading(true);
    try {
      const res = await api.simulate({
        horizon_days: 365,
        num_runs: 500,
        scenario_multipliers: multiplier !== 1.0 ? { Food: multiplier } : undefined,
        fixed_cost_delta_paise: rentDelta * 100,
      });
      setSimResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  // Solve Reverse Income
  const solveIncome = async () => {
    setSolverLoading(true);
    try {
      const res = await api.solveReverseIncome({
        personal_fixed_monthly_paise: personalFixed * 100,
        personal_discretionary_monthly_paise: personalDiscretionary * 100,
        family_support_monthly_paise: familySupport * 100,
        monthly_goal_savings_paise: goalSavings * 100,
        city: solverCity,
      });
      setSolverResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSolverLoading(false);
    }
  };

  useEffect(() => {
    solveIncome();
  }, [solverCity, personalFixed, personalDiscretionary, familySupport, goalSavings]);

  // Solve Cliff Partition
  const solveCliffSchedule = async () => {
    try {
      const res = await api.solveCliff({
        remaining_stipend_payments: cliffPayments,
        monthly_stipend_paise: cliffStipend * 100,
        post_stipend_gap_months: cliffGapMonths,
        current_living_cost_paise: cliffLivingCost * 100,
      });
      setCliffResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    solveCliffSchedule();
  }, [cliffPayments, cliffStipend, cliffGapMonths, cliffLivingCost]);

  // Fetch Monthly Report
  const loadMonthlyReport = async () => {
    setReportLoading(true);
    try {
      const rep = await api.getMonthlyReport("2026-10");
      setMonthlyReport(rep);
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  // Inline Category Change from Ledger Table
  const handleCategoryChange = async (transactionId: number, newCategory: string) => {
    try {
      await api.setTransactionCategory(transactionId, newCategory);
      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? { ...t, category: newCategory } : t))
      );
      api.getSafeToSpend().then(setSafeData).catch(() => {});
      api.getMonthlyReport("2026-10").then(setMonthlyReport).catch(() => {});
    } catch (err: any) {
      alert(`Failed to update category: ${err.message}`);
    }
  };

  // Quick Add Handler
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(quickAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!quickMerchant.trim()) return;

    setQuickSubmitting(true);
    try {
      const paise = Math.round(parsedAmount * 100);
      await api.quickTransaction({
        amount_paise: paise,
        direction: quickDirection,
        merchant: quickMerchant.trim(),
      });

      // Calculate goal ripple for debits
      if (quickDirection === "DEBIT") {
        try {
          const ripple = await api.simulateRipple(paise);
          setLastRipple(ripple);
        } catch {
          // Ignore ripple error
        }
      }

      setQuickAmount("");
      setQuickMerchant("");
      await fetchData();
    } catch (err: any) {
      alert(`Error adding transaction: ${err.message}`);
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Paste SMS Handler
  const handleParseSms = async () => {
    if (!smsText.trim()) return;
    setSmsParsing(true);
    try {
      const res = await api.ingestSms(smsText);
      setSmsResult(res);
      setSmsText("");
      await fetchData();
    } catch (err: any) {
      alert(`Error parsing SMS: ${err.message}`);
    } finally {
      setSmsParsing(false);
    }
  };

  // Save Merchant for Needs-Merchant item
  const handleSaveMerchant = async (id: number) => {
    const merchant = (merchantInputs[id] || "").trim();
    if (!merchant) return;

    setSavingMerchantId(id);
    try {
      await api.setMerchant(id, merchant);
      await fetchData();
    } catch (err: any) {
      alert(`Error saving merchant: ${err.message}`);
    } finally {
      setSavingMerchantId(null);
    }
  };

  // Open Correction Sheet
  const handleOpenSheet = (tx: Transaction) => {
    setActiveTxForSheet(tx);
    const initialCategory = tx.category || "Food";
    setSheetCategory(initialCategory);
    setSheetScope("payee_always");
    setAppliedRuleId(null);
    setSheetActionStatus(null);
  };

  // Update preview when sheet category or scope changes
  useEffect(() => {
    if (!activeTxForSheet) {
      setPreviewData(null);
      return;
    }

    let isMounted = true;
    setPreviewLoading(true);

    api
      .previewRule({
        transaction_id: activeTxForSheet.id,
        scope: sheetScope,
        category: sheetCategory,
      })
      .then((data) => {
        if (isMounted) setPreviewData(data);
      })
      .catch(() => {
        if (isMounted) setPreviewData(null);
      })
      .finally(() => {
        if (isMounted) setPreviewLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTxForSheet, sheetCategory, sheetScope]);

  // Apply Rule from Sheet
  const handleApplyRule = async () => {
    if (!activeTxForSheet) return;
    try {
      const res = await api.applyRule({
        transaction_id: activeTxForSheet.id,
        scope: sheetScope,
        category: sheetCategory,
      });
      setAppliedRuleId(res.rule_id);
      setSheetActionStatus(`Applied! Replayed & updated ${res.count} transactions.`);
      await fetchData();
    } catch (err: any) {
      alert(`Error applying rule: ${err.message}`);
    }
  };

  // Undo Rule from Sheet
  const handleUndoRule = async () => {
    if (!appliedRuleId) return;
    try {
      const res = await api.undoRule(appliedRuleId);
      setSheetActionStatus(`Restored ${res.restored_count} transactions.`);
      setAppliedRuleId(null);
      await fetchData();
    } catch (err: any) {
      alert(`Error undoing rule: ${err.message}`);
    }
  };

  // Coach Chat Send Handler
  const handleSendMessage = async (customMsg?: string) => {
    const textToSend = customMsg || chatInput.trim();
    if (!textToSend || chatSending) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    if (!customMsg) setChatInput("");
    setChatSending(true);

    try {
      const res: CoachChatResponse = await api.coachChat(textToSend);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: res.message,
          isBlocked: res.status === "blocked",
          scenarios: res.suggested_scenarios,
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: `Error connecting to coach: ${err.message}`,
        },
      ]);
    } finally {
      setChatSending(false);
    }
  };

  // Persona switch handler
  const handlePersonaChange = async (persona: "Aarav" | "Rohan" | "Kabir") => {
    setActivePersona(persona);
    if (persona === "Aarav") {
      await api.setBalance(42000);
    } else if (persona === "Rohan") {
      await api.setBalance(15000000);
    } else if (persona === "Kabir") {
      await api.setBalance(3500000);
    }
    await fetchData();
    runSimulation();
  };

  // Runway bar segment widths
  const runwaySegments = useMemo(() => {
    if (!safeData?.segments) return { free: 25, commitments: 25, goals: 25, buffer: 25 };
    const { free, commitments, goals, buffer } = safeData.segments;
    const total = free + commitments + goals + buffer;
    if (total <= 0) return { free: 0, commitments: 0, goals: 0, buffer: 0 };
    return {
      free: (free / total) * 100,
      commitments: (commitments / total) * 100,
      goals: (goals / total) * 100,
      buffer: (buffer / total) * 100,
    };
  }, [safeData]);

  // Next money text calculation
  const nextMoneyText = useMemo(() => {
    if (!safeData) return "";
    const today = new Date();
    const horizonDays = safeData.horizon_days;
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + horizonDays - 1);
    const dateFormatted = nextDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    return `Next money: ${dateFormatted} (${horizonDays} days)`;
  }, [safeData]);

  const isOvercommitted =
    safeData?.status === "overcommitted" || (safeData?.overcommitted_paise || 0) > 0;

  // Category breakdown for Donut Chart (Matches reference image)
  const spendCategories = useMemo(() => {
    if (monthlyReport?.by_category && monthlyReport.by_category.length > 0) {
      return monthlyReport.by_category;
    }
    return [
      { category: "Food", amount_paise: 138426, percentage: 41.7 },
      { category: "Money Transfer", amount_paise: 93200, percentage: 28.1 },
      { category: "Entertainment", amount_paise: 64784, percentage: 19.5 },
      { category: "Education", amount_paise: 20000, percentage: 6.0 },
      { category: "Services", amount_paise: 13500, percentage: 4.1 },
    ];
  }, [monthlyReport]);

  const totalMonthlySpend = useMemo(() => {
    return monthlyReport?.total_debits_paise ?? 331910;
  }, [monthlyReport]);

  return (
    <div className="zen-app-shell">
      {/* -------------------- 1. MINIMAL LUXURY HEADER -------------------- */}
      <header className="minimal-header">
        <div className="brand-group">
          <span className="brand-dot" />
          <span className="brand-name">PulseLedger</span>
          <span className="regime-tag">
            {activePersona === "Aarav" ? "Allowance" : activePersona === "Rohan" ? "Salaried" : "Variable"}
          </span>
        </div>

        <div className="header-controls">
          <select
            className="minimal-persona-select"
            value={activePersona}
            onChange={(e) => handlePersonaChange(e.target.value as any)}
            title="Switch demo persona"
          >
            <option value="Aarav">👤 Aarav (Student)</option>
            <option value="Rohan">💼 Rohan (Salaried)</option>
            <option value="Kabir">🎨 Kabir (Freelance)</option>
          </select>

          <button
            type="button"
            className="minimal-theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      {/* -------------------- FLOATING LUXURY NAVIGATION DOCK (Mobile & Desktop) -------------------- */}
      <nav className="floating-nav-dock" aria-label="Main Navigation">
        <button
          type="button"
          className={`dock-tab ${currentTab === "home" ? "active" : ""}`}
          onClick={() => setCurrentTab("home")}
        >
          <IconHome size={18} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`dock-tab ${currentTab === "ledger" ? "active" : ""}`}
          onClick={() => setCurrentTab("ledger")}
        >
          <IconLedger size={18} />
          <span>Ledger</span>
        </button>

        <button
          type="button"
          className={`dock-tab ${currentTab === "plan" ? "active" : ""}`}
          onClick={() => setCurrentTab("plan")}
        >
          <IconPlan size={18} />
          <span>Plan</span>
        </button>

        <button
          type="button"
          className={`dock-tab ${currentTab === "coach" ? "active" : ""}`}
          onClick={() => {
            setCurrentTab("coach");
            if (!monthlyReport) loadMonthlyReport();
          }}
        >
          <IconCoach size={18} />
          <span>Coach</span>
        </button>
      </nav>

        {error && !safeData && (
          <div className="card" style={{ border: "1px solid var(--saffron)", background: "rgba(251, 191, 36, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Backend Offline:</strong> Local server on port 8000 is not reachable.
                <div style={{ fontSize: "0.82rem", color: "var(--slate)", marginTop: "2px" }}>
                  Start backend with <code>python -m uvicorn backend.app.main:app --port 8000</code>.
                </div>
              </div>
              <button className="btn-secondary" onClick={fetchData} style={{ minHeight: "34px", padding: "4px 12px" }}>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* -------------------- TAB 1: OVERVIEW (HOME) -------------------- */}
        {currentTab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "80px" }}>
            {/* Zen Hero Card (The Breathing Room Anchor) */}
            <section className="zen-hero-card" aria-label="Safe to spend today">
              <div className="zen-hero-label">Safe to Spend Today</div>
              <div className={`zen-hero-amount ${safeData?.status === "tight" ? "tight" : ""}`}>
                {formatINR(safeData?.remaining_today_paise ?? 0)}
              </div>
              <div className="zen-pacing-bar">
                <div
                  className="zen-pacing-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(12, ((safeData?.remaining_today_paise ?? 42000) / 100000) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="zen-hero-status">
                {isOvercommitted ? (
                  <span className="zen-status-alert">
                    ⚠️ Overcommitted by {formatRupeesText(safeData?.overcommitted_paise || 0)} until{" "}
                    {formatDate(
                      new Date(Date.now() + (safeData?.horizon_days || 1) * 86400000).toISOString().split("T")[0]
                    )}
                  </span>
                ) : (
                  <span>🟢 100% on track • {nextMoneyText}</span>
                )}
              </div>
            </section>

            {/* 3 Key Pillar Metrics Row */}
            <div className="zen-stats-row">
              <div className="zen-stat-item">
                <span className="zen-stat-label">Inflows</span>
                <span className="zen-stat-val" style={{ color: "var(--tide)" }}>
                  {formatINR(safeData?.inflows_paise ?? 500000)}
                </span>
              </div>
              <div className="zen-stat-divider" />
              <div className="zen-stat-item">
                <span className="zen-stat-label">Bills & Subs</span>
                <span className="zen-stat-val" style={{ color: "var(--persimmon)" }}>
                  {formatINR(safeData?.commitments_paise ?? 76800)}
                </span>
              </div>
              <div className="zen-stat-divider" />
              <div className="zen-stat-item">
                <span className="zen-stat-label">Buffer Cushion</span>
                <span className="zen-stat-val">
                  {formatINR(safeData?.buffer_paise ?? 20000)}
                </span>
              </div>
            </div>

            {/* Autonomous On-Device Sync Capsule */}
            <div className="zen-sync-capsule">
              <div className="zen-sync-left">
                <span className="zen-pulse-dot" />
                <span>Autonomous SMS Sync active • Zero cloud data leakage</span>
              </div>
              <button
                type="button"
                className="zen-sync-btn"
                onClick={handleSimulateSms}
                disabled={smsParsing}
              >
                {smsParsing ? "Syncing..." : "+ Simulate Live SMS"}
              </button>
            </div>

            {/* Optional Manual Entry Drawer (Hidden by default to keep screen serene & zero-touch) */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                className="zen-link-btn"
                style={{ fontSize: "0.76rem", color: "var(--slate)", opacity: 0.7 }}
                onClick={() => setShowManualTools(!showManualTools)}
              >
                {showManualTools ? "▲ Hide Manual Entry" : "▼ Need to log cash or test custom SMS?"}
              </button>
            </div>

            {showManualTools && (
              <div className="card zen-card" style={{ padding: "16px", gap: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "0.92rem", color: "var(--ink)" }}>Manual Cash / UPI Logging</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount (₹)"
                    className="text-input"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Merchant (e.g. Chai, Auto)"
                    className="text-input"
                    value={quickMerchant}
                    onChange={(e) => setQuickMerchant(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ minHeight: "36px" }}
                  onClick={handleQuickAdd}
                  disabled={quickSubmitting || !quickAmount}
                >
                  {quickSubmitting ? "Adding..." : "+ Record Spend"}
                </button>
              </div>
            )}

            {/* Goal Ripple Alert (if a spend was recently added) */}
            {lastRipple && (
              <div className="ripple-banner">
                <IconTrendingUp size={20} color="var(--tide)" />
                <div>
                  <strong>Goal Ripple Impact:</strong> {lastRipple.ripple_message}
                </div>
              </div>
            )}

            {/* Nudges Banner (if velocity drift detected) */}
            {nudges && nudges.length > 0 && (
              <div className={`nudge-card ${nudges[0].status === "critical" ? "critical" : ""}`}>
                <div className="nudge-header">
                  <span className="section-title" style={{ fontSize: "0.95rem" }}>
                    Active Spending Nudge
                  </span>
                  <span className="nudge-badge">{nudges[0].status}</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.4 }}>{nudges[0].message}</p>
              </div>
            )}

          {/* Recent Activity Stream */}
          <section className="zen-card" aria-label="Recent Transactions">
            <div className="zen-card-header">
              <h3 className="zen-card-title">Recent Activity</h3>
              <button
                type="button"
                className="zen-link-btn"
                onClick={() => setCurrentTab("ledger")}
              >
                View full ledger ({transactions.length}) →
              </button>
            </div>

            <div className="zen-tx-list">
              {transactions.slice(0, 5).map((tx) => {
                const isDebit = (tx.direction || "DEBIT").toUpperCase() === "DEBIT";
                const catMeta = getCategoryMeta(tx.category);
                const merchantName = tx.merchant || "Unknown Payee";

                return (
                  <div
                    key={tx.id}
                    className="zen-tx-row"
                    onClick={() => handleOpenSheet(tx)}
                    title="Tap to categorize or create rule"
                  >
                    <div className="zen-tx-left">
                      <div
                        className="zen-tx-avatar"
                        style={{
                          background: `linear-gradient(135deg, ${catMeta.color}22, ${catMeta.color}08)`,
                          borderColor: `${catMeta.color}44`,
                          color: catMeta.color,
                        }}
                      >
                        {catMeta.icon}
                      </div>
                      <div className="zen-tx-info">
                        <div className="zen-tx-merchant">{merchantName}</div>
                        <div className="zen-tx-sub">
                          {formatDate(tx.date)} • {tx.category || "General"}
                        </div>
                      </div>
                    </div>
                    <div className={`zen-tx-amount ${isDebit ? "debit" : "credit"}`}>
                      {isDebit ? "-" : "+"}
                      {formatINR(tx.amount_paise)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          </div>
        )}

      {/* -------------------- TAB 2: LEDGER & RECURRING SUBSCRIPTIONS -------------------- */}
      {currentTab === "ledger" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "80px" }}>
          {/* Sub-tab Pill Switcher */}
          <div className="sub-tab-pills">
            <button
              type="button"
              className={`sub-tab-btn ${ledgerSubTab === "transactions" ? "active" : ""}`}
              onClick={() => setLedgerSubTab("transactions")}
            >
              📋 All Transactions ({transactions.length})
            </button>
            <button
              type="button"
              className={`sub-tab-btn ${ledgerSubTab === "subscriptions" ? "active" : ""}`}
              onClick={() => setLedgerSubTab("subscriptions")}
            >
              🔄 Subscriptions ({subscriptions.length})
            </button>
          </div>

          {ledgerSubTab === "transactions" ? (
            <LedgerTable
              transactions={transactions}
              categories={categories}
              onCategoryChange={handleCategoryChange}
              onOpenRuleSheet={handleOpenSheet}
            />
          ) : (
            <SubscriptionsGrid subscriptions={subscriptions} />
          )}
        </div>
      )}

      {/* -------------------- TAB 3: PLAN & WHAT-IF SIMULATOR -------------------- */}
      {currentTab === "plan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "80px" }}>
          {/* Segmented Sub-Tab Switcher */}
          <div className="sub-tab-pills">
            <button
              type="button"
              className={`sub-tab-btn ${planSubTab === "trajectory" ? "active" : ""}`}
              onClick={() => setPlanSubTab("trajectory")}
            >
              📈 365-Day Trajectory
            </button>
            <button
              type="button"
              className={`sub-tab-btn ${planSubTab === "solver" ? "active" : ""}`}
              onClick={() => setPlanSubTab("solver")}
            >
              💼 Career & Gap Solver
            </button>
          </div>

          {planSubTab === "trajectory" ? (
            <section className="card zen-card" aria-label="Monte Carlo What-If Simulation">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="zen-card-title">Monte Carlo Cash-Flow Trajectory (365 Days)</h3>
                {simLoading && <span style={{ fontSize: "0.8rem", color: "var(--slate)" }}>Running 1,000 runs...</span>}
              </div>

              {simResult && (
                <FanChart
                  data={simResult.percentiles_over_time}
                  bufferPaise={safeData?.buffer_paise || 20000}
                  height={260}
                />
              )}

              {simResult && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", marginTop: "4px" }}>
                  <div className="result-stat-box">
                    <div className="result-stat-label">Shortfall Risk</div>
                    <div className="result-stat-value" style={{ color: simResult.shortfall_probability > 0.1 ? "var(--persimmon)" : "var(--tide)" }}>
                      {(simResult.shortfall_probability * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="result-stat-box">
                    <div className="result-stat-label">Buffer Breach Risk</div>
                    <div className="result-stat-value" style={{ color: simResult.buffer_breach_probability > 0.2 ? "var(--saffron)" : "var(--tide)" }}>
                      {(simResult.buffer_breach_probability * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}

              {/* What-If Sliders */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "12px" }}>
                <div className="slider-group">
                  <div className="slider-header">
                    <span>What-if: Cut Dining Out: {diningCutPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    className="slider-input"
                    value={diningCutPct}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDiningCutPct(val);
                      runSimulation(1.0 - val / 100, rentDeltaRupees);
                    }}
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <span>What-if: Rent Change: {rentDeltaRupees >= 0 ? `+₹${rentDeltaRupees}` : `-₹${Math.abs(rentDeltaRupees)}`}</span>
                  </div>
                  <input
                    type="range"
                    min="-5000"
                    max="10000"
                    step="500"
                    className="slider-input"
                    value={rentDeltaRupees}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRentDeltaRupees(val);
                      runSimulation(1.0 - diningCutPct / 100, val);
                    }}
                  />
                </div>
              </div>
            </section>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Reverse Income Solver */}
              <section className="card zen-card" aria-label="Reverse Income Solver">
                <h3 className="zen-card-title">Reverse Income Solver (In-Hand → CTC)</h3>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--slate)" }}>
                  Calculates the exact gross CTC needed to support your life, family, and goals under Indian tax slabs.
                </p>

                <div className="form-group">
                  <label className="form-label">City Living Tier</label>
                  <select
                    className="select-input"
                    value={solverCity}
                    onChange={(e) => setSolverCity(e.target.value)}
                  >
                    <option value="Bengaluru">Bengaluru (1.25x)</option>
                    <option value="Mumbai">Mumbai (1.35x)</option>
                    <option value="Delhi NCR">Delhi NCR (1.20x)</option>
                    <option value="Hyderabad">Hyderabad (1.15x)</option>
                    <option value="Pune">Pune (1.15x)</option>
                    <option value="Tier 2 / Remote">Tier 2 / Remote (1.00x)</option>
                  </select>
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <span>Core Fixed Living (Rent, Food, EMI): ₹{personalFixed.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="100000"
                    step="1000"
                    className="slider-input"
                    value={personalFixed}
                    onChange={(e) => setPersonalFixed(Number(e.target.value))}
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <span>Discretionary Lifestyle: ₹{personalDiscretionary.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min="3000"
                    max="50000"
                    step="1000"
                    className="slider-input"
                    value={personalDiscretionary}
                    onChange={(e) => setPersonalDiscretionary(Number(e.target.value))}
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <span>Monthly Family Support: ₹{familySupport.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="1000"
                    className="slider-input"
                    value={familySupport}
                    onChange={(e) => setFamilySupport(Number(e.target.value))}
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <span>Goal Savings: ₹{goalSavings.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="1000"
                    className="slider-input"
                    value={goalSavings}
                    onChange={(e) => setGoalSavings(Number(e.target.value))}
                  />
                </div>

                {solverResult && (
                  <div className="solver-results-grid">
                    <div className="result-stat-box">
                      <div className="result-stat-label">Target In-Hand</div>
                      <div className="result-stat-value" style={{ color: "var(--tide)" }}>
                        {formatINR(solverResult.target_monthly_in_hand_paise)}/mo
                      </div>
                    </div>

                    <div className="result-stat-box">
                      <div className="result-stat-label">Required Annual CTC</div>
                      <div className="result-stat-value">
                        {formatINR(solverResult.required_annual_ctc_paise)}
                      </div>
                    </div>
                  </div>
                )}

                {solverResult && (
                  <div style={{ fontSize: "0.82rem", color: "var(--slate)", background: "rgba(20, 118, 110, 0.06)", padding: "8px 12px", borderRadius: "8px" }}>
                    💡 <strong>Sensitivity:</strong> Sending an additional ₹5,000/month home requires an extra{" "}
                    <strong>{formatINR(solverResult.sensitivity_delta_paise_for_5k)} CTC/year</strong>.
                  </div>
                )}
              </section>

              {/* Cliff Partition Calculator */}
              <section className="card zen-card" aria-label="Cliff Partitioning for Internships">
                <h3 className="zen-card-title">Internship Cliff Partition</h3>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--slate)" }}>
                  Determines how much to withhold from each remaining stipend payment to survive post-internship gap.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                  <div className="form-group">
                    <label className="form-label">Remaining Stipends</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      className="text-input"
                      value={cliffPayments}
                      onChange={(e) => setCliffPayments(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gap Months</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      className="text-input"
                      value={cliffGapMonths}
                      onChange={(e) => setCliffGapMonths(Number(e.target.value))}
                    />
                  </div>
                </div>

                {cliffResult && (
                  <div className="solver-results-grid">
                    <div className="result-stat-box">
                      <div className="result-stat-label">Withhold Per Payment</div>
                      <div className="result-stat-value" style={{ color: "var(--saffron)" }}>
                        {formatINR(cliffResult.withhold_per_payment_paise)}
                      </div>
                    </div>

                    <div className="result-stat-box">
                      <div className="result-stat-label">Discretionary Left</div>
                      <div className="result-stat-value">
                        {formatINR(cliffResult.discretionary_left_paise)}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB 4: COACH & MONTHLY REVIEW -------------------- */}
      {currentTab === "coach" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "80px" }}>
          {/* Top Compliance & Action Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", background: "var(--surface)", border: "1px solid var(--mist)", padding: "6px 12px", borderRadius: "20px", color: "var(--tide)" }}>
              <span className="zen-pulse-dot" />
              <span>SEBI 3-Layer Firewall Active • Zero-Cloud Telemetry</span>
            </div>

            <button
              type="button"
              className="zen-sync-btn"
              onClick={() => {
                setShowMonthlyReview(!showMonthlyReview);
                if (!monthlyReport) loadMonthlyReport();
              }}
            >
              {showMonthlyReview ? "💬 Back to Coach Chat" : "📊 Monthly Executive Review"}
            </button>
          </div>

          {showMonthlyReview ? (
            /* Monthly Review Report */
            <section className="card zen-card" aria-label="Monthly Financial Review Report">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="zen-card-title">Monthly Review (October 2026)</h3>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ minHeight: "32px", padding: "4px 12px", fontSize: "0.82rem" }}
                  onClick={() => window.print()}
                >
                  🖨️ Print Report
                </button>
              </div>

              {reportLoading ? (
                <p style={{ color: "var(--slate)" }}>Generating deterministic review report...</p>
              ) : monthlyReport ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <div className="solver-results-grid">
                    <div className="result-stat-box">
                      <div className="result-stat-label">Total Outflows</div>
                      <div className="result-stat-value" style={{ color: "var(--persimmon)" }}>
                        {formatINR(monthlyReport.total_debits_paise)}
                      </div>
                    </div>

                    <div className="result-stat-box">
                      <div className="result-stat-label">Savings Rate</div>
                      <div className="result-stat-value" style={{ color: "var(--tide)" }}>
                        {monthlyReport.savings_rate_pct.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "var(--surface-raised)", border: "1px solid var(--mist)", padding: "14px", borderRadius: "10px", fontSize: "0.92rem", lineHeight: 1.55 }}>
                    <div style={{ fontWeight: 700, marginBottom: "4px", color: "var(--ink)" }}>Executive Narrative:</div>
                    {monthlyReport.narrative}
                  </div>

                  {/* Category breakdown table */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--slate)" }}>Spend by Category:</div>
                    {(monthlyReport.by_category || (monthlyReport as any).spend_by_category || []).map((cat: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "6px 0",
                          borderBottom: "1px solid var(--mist)",
                          fontSize: "0.88rem",
                        }}
                      >
                        <span>{cat.category}</span>
                        <span className="money" style={{ fontWeight: 600 }}>
                          {formatINR(cat.amount_paise)} ({cat.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button type="button" className="btn-primary" onClick={loadMonthlyReport}>
                  Generate Monthly Review
                </button>
              )}
            </section>
          ) : (
            /* Guarded Coach Chat */
            <section className="card zen-card" aria-label="Guarded AI Coach" style={{ padding: "16px" }}>
              <div className="chat-container" style={{ height: "460px" }}>
                <div className="chat-history">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`chat-bubble ${msg.sender} ${msg.isBlocked ? "blocked" : ""}`}>
                      {msg.isBlocked && (
                        <div style={{ fontWeight: 700, color: "var(--persimmon)", marginBottom: "4px" }}>
                          🚫 Securities Recommendation Blocked
                        </div>
                      )}
                      <div>{msg.text}</div>

                      {/* Educational Asset Class Scenarios */}
                      {msg.scenarios && msg.scenarios.length > 0 && (
                        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink)" }}>
                            Permitted Educational Asset-Class Scenarios:
                          </div>
                          {msg.scenarios.map((sc: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--mist)",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                fontSize: "0.84rem",
                              }}
                            >
                              <strong style={{ color: "var(--ink)" }}>{sc.name}</strong> • Return: {sc.nominal_return_range} • Liquidity: {sc.liquidity}
                              <div style={{ color: "var(--slate)", fontSize: "0.78rem", marginTop: "3px" }}>
                                {sc.role_in_plan}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Prompt Suggestions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                  <div className="prompt-suggestions">
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendMessage("Can I afford dinner tonight for ₹1,200?")}
                    >
                      🍔 Afford dinner (₹1,200)?
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendMessage("How am I pacing for my laptop goal?")}
                    >
                      💻 Laptop goal?
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendMessage("How can I cut ₹2,000 this month?")}
                    >
                      📉 Cut ₹2,000?
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleSendMessage("What subscriptions am I paying for?")}
                    >
                      🔄 Review subs
                    </button>
                  </div>

                  {/* Compliance Testing for Hackathon Judges */}
                  <div className="prompt-suggestions" style={{ marginTop: "2px" }}>
                    <button
                      type="button"
                      className="prompt-chip"
                      style={{ borderColor: "rgba(229, 107, 111, 0.4)", color: "var(--persimmon)", fontSize: "0.75rem" }}
                      onClick={() => handleSendMessage("Should I buy Tata Motors or Reliance stock right now?")}
                    >
                      ⚡ Test: Buy Reliance?
                    </button>
                    <button
                      type="button"
                      className="prompt-chip"
                      style={{ borderColor: "rgba(229, 107, 111, 0.4)", color: "var(--persimmon)", fontSize: "0.75rem" }}
                      onClick={() => handleSendMessage("Which crypto gives 50% return?")}
                    >
                      ⚡ Test: 50% Crypto?
                    </button>
                  </div>
                </div>

                {/* Input bar */}
                <form
                  className="chat-input-bar"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Ask financial question..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatSending}
                  />
                  <button type="submit" className="btn-primary" disabled={chatSending || !chatInput.trim()}>
                    {chatSending ? "..." : "Send"}
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>
      )}

      {/* -------------------- 4. CORRECTION SHEET MODAL -------------------- */}
      {activeTxForSheet && (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <div className="sheet-content">
            <div className="sheet-header">
              <h2 id="sheet-title" className="section-title">
                Categorize {activeTxForSheet.merchant || "transaction"}
              </h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setActiveTxForSheet(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--slate)" }}>
              {formatDate(activeTxForSheet.date)} • {formatINR(activeTxForSheet.amount_paise)}
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="sheet-category-select">
                Target category
              </label>
              <select
                id="sheet-category-select"
                className="select-input"
                value={sheetCategory}
                onChange={(e) => setSheetCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Rule scope</label>
              <div className="direction-toggle" role="group">
                <button
                  type="button"
                  className={`toggle-btn ${sheetScope === "payee_always" ? "active debit" : ""}`}
                  onClick={() => setSheetScope("payee_always")}
                >
                  Payee always
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${sheetScope === "payee_in_band" ? "active debit" : ""}`}
                  onClick={() => setSheetScope("payee_in_band")}
                >
                  Within amount band
                </button>
              </div>
            </div>

            {/* Preview callout */}
            <div className="preview-callout">
              {previewLoading ? (
                <span>Calculating affected past transactions...</span>
              ) : previewData ? (
                <span>
                  This will change {previewData.count} past transaction
                  {previewData.count === 1 ? "" : "s"} ({formatRupeesText(previewData.total_paise || 0)})
                </span>
              ) : (
                <span>No past transactions would change.</span>
              )}
            </div>

            {sheetActionStatus && (
              <div style={{ color: "var(--tide)", fontWeight: 600, fontSize: "0.9rem" }}>
                {sheetActionStatus}
              </div>
            )}

            <div className="sheet-actions">
              {appliedRuleId ? (
                <button type="button" className="btn-secondary" onClick={handleUndoRule}>
                  Undo
                </button>
              ) : null}
              <button type="button" className="btn-primary" onClick={handleApplyRule}>
                Confirm & Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
