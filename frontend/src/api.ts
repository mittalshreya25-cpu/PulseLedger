const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "0.0.0.0");

// In production (e.g. Vercel), use relative URL to avoid Mixed Content HTTP/HTTPS blocks
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ?? (isLocalhost ? "http://localhost:8000" : "");

let isOfflineMode = false;
export const getOfflineStatus = () => isOfflineMode;

const MOCK_DATA: Record<string, any> = {
  "/safe-to-spend": {
    horizon_days: 14,
    pool_paise: 588000,
    daily_paise: 42000,
    today_budget_paise: 42000,
    remaining_today_paise: 42000,
    overcommitted_paise: 0,
    segments: {
      free: 588000,
      commitments: 1200000,
      goals: 500000,
      buffer: 200000,
    },
    status: "ok",
    liquid_paise: 2488000,
    inflows_paise: 0,
    commitments_paise: 1200000,
    goal_alloc_paise: 500000,
    buffer_paise: 200000,
    spent_today_paise: 0,
    needs_balance: false,
    locked_items: [
      { name: "Hostel Rent", amount_paise: 1200000, due_date: "2026-11-05" },
    ],
  },
  "/transactions": [
    { id: 1, date: "2026-10-31", amount_paise: 14000, direction: "DEBIT", merchant: "Swiggy", category: "Food", source: "sms" },
    { id: 2, date: "2026-10-30", amount_paise: 64900, direction: "DEBIT", merchant: "Netflix", category: "Entertainment", source: "sms" },
    { id: 3, date: "2026-10-29", amount_paise: 25000, direction: "DEBIT", merchant: "Chaayos", category: "Food", source: "sms" },
    { id: 4, date: "2026-10-28", amount_paise: 500000, direction: "CREDIT", merchant: "Allowance", category: "Allowance", source: "sms" },
    { id: 5, date: "2026-10-27", amount_paise: 4500, direction: "DEBIT", merchant: "Rapido", category: "Transport", source: "sms" },
    { id: 6, date: "2026-10-26", amount_paise: 11900, direction: "DEBIT", merchant: "Spotify", category: "Entertainment", source: "sms" },
    { id: 7, date: "2026-10-25", amount_paise: 35000, direction: "DEBIT", merchant: "Zomato", category: "Food", source: "sms" },
  ],
  "/transactions/needs-merchant": [
    { id: 8, date: "2026-10-31", amount_paise: 2000, direction: "DEBIT", merchant: "", category: "Uncategorized", source: "sms", needs_merchant: 1 },
  ],
  "/categories": [
    "Food", "Money Transfer", "Entertainment", "Education", "Services",
    "Miscellaneous", "Hostel & Mess", "Transport", "Bank charges",
    "Uncategorized", "Allowance", "Investments & Savings"
  ],
  "/recurring/subscriptions": [
    {
      merchant: "Netflix",
      category: "Entertainment",
      cadence: "monthly",
      interval_days: 30,
      occurrences: 4,
      last_date: "2026-10-30",
      next_expected: "2026-11-29",
      latest_amount_paise: 64900,
      median_amount_paise: 49900,
      monthly_cost_paise: 49900,
      estimated_annual_paise: 598800,
      alerts: [
        {
          kind: "price_change",
          old_amount_paise: 49900,
          new_amount_paise: 64900,
          percentage_change: 30.1,
          message: "Netflix changed from ₹499.00 to ₹649.00 (+30.1%). Cancelling brings laptop goal 11 days closer.",
        }
      ]
    },
    {
      merchant: "Spotify",
      category: "Entertainment",
      cadence: "monthly",
      interval_days: 30,
      occurrences: 3,
      last_date: "2026-10-26",
      next_expected: "2026-11-25",
      latest_amount_paise: 11900,
      median_amount_paise: 11900,
      monthly_cost_paise: 11900,
      estimated_annual_paise: 142800,
      alerts: []
    }
  ],
  "/nudges": [
    {
      category: "Food",
      month: "2026-10",
      spent_so_far_paise: 138426,
      monthly_budget_paise: 150000,
      velocity: 1.34,
      status: "caution",
      daily_cap_paise: 24000,
      days_remaining: 12,
      message: "Food spending is running at 1.34x velocity. Keep remaining food spend under ₹240.00/day to stay on budget.",
    }
  ],
  "/report/monthly": {
    month: "2026-10",
    total_debits_paise: 331910,
    total_credits_paise: 441000,
    net_cash_flow_paise: 109090,
    savings_rate_pct: 24.7,
    total_transactions: 34,
    by_category: [
      { category: "Food", amount_paise: 138426, percentage: 41.7, transaction_count: 14 },
      { category: "Money Transfer", amount_paise: 93200, percentage: 28.1, transaction_count: 5 },
      { category: "Entertainment", amount_paise: 64784, percentage: 19.5, transaction_count: 6 },
      { category: "Education", amount_paise: 20000, percentage: 6.0, transaction_count: 2 },
      { category: "Services", amount_paise: 13500, percentage: 4.1, transaction_count: 4 },
      { category: "Miscellaneous", amount_paise: 2000, percentage: 0.6, transaction_count: 3 },
    ],
    spend_by_category: [
      { category: "Food", amount_paise: 138426, percentage: 41.7, transaction_count: 14 },
      { category: "Money Transfer", amount_paise: 93200, percentage: 28.1, transaction_count: 5 },
      { category: "Entertainment", amount_paise: 64784, percentage: 19.5, transaction_count: 6 },
      { category: "Education", amount_paise: 20000, percentage: 6.0, transaction_count: 2 },
      { category: "Services", amount_paise: 13500, percentage: 4.1, transaction_count: 4 },
      { category: "Miscellaneous", amount_paise: 2000, percentage: 0.6, transaction_count: 3 },
    ],
    recurring_subscriptions_count: 2,
    total_recurring_monthly_paise: 61800,
    narrative: "In 2026-10, you logged 34 transactions totaling ₹3,319.10 in debits and ₹4,410.00 in inflows, yielding a 24.7% savings rate. Your rulebook has 8 active learned rules keeping your ledger clean without manual effort.",
    grounding_verified: true,
  }
};

function getMockFallback<T>(endpoint: string, options?: RequestInit): T {
  const cleanPath = endpoint.split("?")[0];
  if (MOCK_DATA[cleanPath]) {
    return JSON.parse(JSON.stringify(MOCK_DATA[cleanPath])) as T;
  }

  // Dynamic Mocks for POST endpoints
  if (cleanPath === "/simulate") {
    let mult = 1.0;
    let rentDeltaPaise = 0;
    if (options?.body) {
      try {
        const bodyObj = JSON.parse(options.body as string);
        if (bodyObj.scenario_multipliers?.Food != null) {
          mult = Number(bodyObj.scenario_multipliers.Food);
        }
        if (bodyObj.fixed_cost_delta_paise != null) {
          rentDeltaPaise = Number(bodyObj.fixed_cost_delta_paise);
        }
      } catch {}
    }

    const today = new Date();
    const percentiles = [];
    const baseBalance = 2750000;
    // Monthly delta from sliders:
    // Cutting dining (mult < 1.0) saves up to ₹4,000/mo (400,000 paise).
    // Rent change adds/subtracts rentDeltaPaise directly.
    const monthlySaving = Math.round((1.0 - mult) * 450000) - rentDeltaPaise;

    for (let i = 0; i <= 12; i++) {
      const d = new Date(today.getTime() + i * 30 * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const deltaAccum = i * monthlySaving;
      const baseTrend = baseBalance + i * 120000;
      const p50 = Math.max(100000, baseTrend + deltaAccum);
      const fanSpread = Math.max(20000, i * 40000);

      percentiles.push({
        day: i * 30,
        date: dateStr,
        p10: Math.max(20000, p50 - fanSpread * 1.6),
        p25: Math.max(30000, p50 - fanSpread * 0.8),
        p50: p50,
        p75: p50 + fanSpread * 0.8,
        p90: p50 + fanSpread * 1.6,
      });
    }

    const shortfallProb = Math.max(0.01, Math.min(0.35, 0.08 - (monthlySaving / 8000000)));
    const bufferBreachProb = Math.max(0.02, Math.min(0.45, 0.15 - (monthlySaving / 6000000)));

    return {
      horizon_days: 365,
      num_runs: 1000,
      starting_balance_paise: baseBalance,
      goal_achievement_day: monthlySaving > 0 ? 120 : 210,
      goal_achievement_date: "2027-04-30",
      shortfall_probability: Math.round(shortfallProb * 1000) / 1000,
      buffer_breach_probability: Math.round(bufferBreachProb * 1000) / 1000,
      percentiles_over_time: percentiles,
      median_ending_balance_paise: percentiles[percentiles.length - 1].p50,
    } as T;
  }

  if (cleanPath === "/simulate/ripple") {
    let amt = 250000;
    if (options?.body) {
      try {
        const parsed = JSON.parse(options.body as string);
        amt = parsed.amount_paise || amt;
      } catch {}
    }
    const days = Math.max(1, Math.round(amt / 100000));
    return {
      transaction_amount_paise: amt,
      baseline_day: 180,
      new_day: 180 + days,
      days_delayed: days,
      ripple_message: `This ₹${(amt / 100).toFixed(2)} spend shifts your MacBook goal completion by approximately ${days} day${days !== 1 ? "s" : ""}.`,
    } as T;
  }

  if (cleanPath === "/solver/reverse-income") {
    let fixed = 2500000;
    let disc = 1200000;
    let fam = 800000;
    let goal = 1000000;
    let city = "Bengaluru";
    if (options?.body) {
      try {
        const parsed = JSON.parse(options.body as string);
        fixed = parsed.personal_fixed_monthly_paise ?? fixed;
        disc = parsed.personal_discretionary_monthly_paise ?? disc;
        fam = parsed.family_support_monthly_paise ?? fam;
        goal = parsed.monthly_goal_savings_paise ?? goal;
        city = parsed.city || city;
      } catch {}
    }
    const mult = city === "Mumbai" ? 1.35 : city === "Bengaluru" ? 1.25 : 1.15;
    const core = Math.round((fixed + disc) * mult) + fam + goal;
    const inHand = Math.round(core / 0.9);
    const ctcAnnual = Math.round(inHand * 12 * 1.18);
    return {
      city,
      city_multiplier: mult,
      core_monthly_paise: core,
      target_monthly_in_hand_paise: inHand,
      target_annual_in_hand_paise: inHand * 12,
      required_annual_ctc_paise: ctcAnnual,
      required_monthly_ctc_paise: Math.round(ctcAnnual / 12),
      sensitivity_delta_paise_for_5k: 8472000,
      breakdown: {
        scaled_fixed_paise: Math.round(fixed * mult),
        scaled_discretionary_paise: Math.round(disc * mult),
        family_support_paise: fam,
        goal_savings_paise: goal,
        slack_cushion_paise: inHand - core,
      },
    } as T;
  }

  if (cleanPath === "/solver/cliff") {
    return {
      remaining_payments: 3,
      gap_months: 4,
      needed_buffer_paise: 11200000,
      withhold_per_payment_paise: 3733334,
      discretionary_left_paise: 1266666,
      is_feasible: true,
      shortfall_paise: 0,
      actionable_levers: [],
    } as T;
  }

  if (cleanPath === "/coach/chat") {
    let msg = "";
    if (options?.body) {
      try {
        const parsed = JSON.parse(options.body as string);
        msg = (parsed.message || "").toLowerCase();
      } catch {}
    }
    const isBad = ["stock", "share", "crypto", "reliance", "tata", "fund", "invest in", "multibagger", "nifty"].some((k) => msg.includes(k));
    if (isBad) {
      return {
        status: "blocked",
        reason: "Direct mention of regulated security or speculative asset recommendation",
        message: "PulseLedger complies with SEBI regulations: we never recommend specific securities, stocks, or speculative crypto assets. You can explore our educational cash-flow allocation across generic asset classes below.",
        suggested_scenarios: [
          {
            name: "Emergency Buffer / High-Yield Savings",
            nominal_return_range: "3.5% - 7.0%",
            liquidity: "Immediate (T+0)",
            volatility: "Very Low",
            role_in_plan: "Covers unpredicted shocks without disrupting goal timelines.",
          },
          {
            name: "Fixed Deposits / Short-Term Debt",
            nominal_return_range: "6.5% - 7.5%",
            liquidity: "High (penalty on early break)",
            volatility: "Low",
            role_in_plan: "Ideal for goals with fixed horizons under 3 years.",
          },
          {
            name: "Broad Market Index / Long-Term Equity (Generic)",
            nominal_return_range: "10.0% - 13.0%",
            liquidity: "Medium (T+2)",
            volatility: "High short-term; smooths over 7+ years",
            role_in_plan: "For long-term horizon goals (5+ years) where inflation beat is required.",
          },
        ],
      } as T;
    }
    return {
      status: "ok",
      message: "Your Safe-to-Spend limit today is ₹420.00. Based on your cash flow model, you have ₹5,880.00 free cash flow across the 14-day horizon. You can safely afford this purchase without disrupting your MacBook goal.",
      suggested_scenarios: [],
    } as T;
  }

  if (cleanPath === "/transactions/quick") {
    return {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      amount_paise: 25000,
      direction: "DEBIT",
      merchant: "Quick spend",
      category: "Food",
      source: "manual",
    } as T;
  }

  if (cleanPath.startsWith("/transactions/") && cleanPath.endsWith("/category")) {
    const parts = cleanPath.split("/");
    const id = parseInt(parts[2], 10);
    let newCat = "Food";
    if (options?.body) {
      try {
        const parsed = JSON.parse(options.body as string);
        newCat = parsed.category || newCat;
      } catch {}
    }
    const txList = (MOCK_DATA["/transactions"] || []) as any[];
    const found = txList.find((t) => t.id === id);
    if (found) {
      found.category = newCat;
      return found as T;
    }
    return { id, category: newCat } as T;
  }

  return {} as T;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = API_BASE ? `${API_BASE}${endpoint}` : endpoint;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Error ${res.status}: ${res.statusText}`;
      try {
        const json = JSON.parse(errText);
        errMsg = json.detail || json.message || errMsg;
      } catch {
        if (errText) errMsg = errText;
      }
      throw new Error(errMsg);
    }
    isOfflineMode = false;
    return await res.json();
  } catch (err: any) {
    // Retry with relative URL through Vite dev proxy or same origin
    if (API_BASE && url.startsWith(API_BASE)) {
      try {
        const fallbackRes = await fetch(endpoint, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options?.headers || {}),
          },
        });
        if (fallbackRes.ok) {
          isOfflineMode = false;
          return await fallbackRes.json();
        }
      } catch {
        // Fallback to offline demo data if backend server is not running
      }
    }

    // Activate smooth offline demo mode
    isOfflineMode = true;
    return getMockFallback<T>(endpoint, options);
  }
}

export interface SafeToSpendData {
  horizon_days: number;
  pool_paise: number;
  daily_paise: number;
  today_budget_paise: number;
  remaining_today_paise: number;
  overcommitted_paise: number;
  segments: {
    free: number;
    commitments: number;
    goals: number;
    buffer: number;
  };
  status: "ok" | "tight" | "overcommitted";
  liquid_paise: number;
  inflows_paise: number;
  commitments_paise: number;
  goal_alloc_paise: number;
  buffer_paise: number;
  spent_today_paise: number;
  needs_balance: boolean;
  locked_items: Array<{ name: string; amount_paise: number; due_date: string }>;
  sentence?: string;
  overcommitted_sentence?: string;
}

export interface Transaction {
  id: number;
  date: string;
  amount_paise: number;
  direction: string;
  merchant?: string;
  category?: string;
  source?: string;
  ref_no?: string;
  balance_paise?: number | null;
  dedupe_key?: string;
  matched_paytm_id?: number | null;
  needs_merchant?: number | boolean;
}

export interface IngestSmsResponse {
  inserted: any[];
  duplicates_skipped: any[];
  ignored: any[];
  unparsed: any[];
}

export interface RulePreviewResponse {
  count: number;
  total_paise: number;
  total: number;
  examples: Transaction[];
  scope: string;
  payee: string;
  category: string;
}

export interface RuleApplyResponse {
  rule_id: number;
  count: number;
  updated_count: number;
  total_paise: number;
  total: number;
  total_spend: number;
}

export interface RecurringSeries {
  merchant: string;
  category: string;
  cadence: string;
  interval_days: number;
  occurrences: number;
  last_date: string;
  next_expected: string;
  latest_amount_paise: number;
  median_amount_paise: number;
  monthly_cost_paise: number;
  estimated_annual_paise: number;
  alerts: Array<{
    kind: string;
    old_amount_paise?: number;
    new_amount_paise?: number;
    percentage_change?: number;
    message: string;
  }>;
}

export interface SimulationResult {
  horizon_days: number;
  num_runs: number;
  starting_balance_paise: number;
  goal_achievement_day?: number;
  goal_achievement_date?: string;
  shortfall_probability: number;
  buffer_breach_probability: number;
  percentiles_over_time: Array<{
    day: number;
    date: string;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  }>;
  median_ending_balance_paise: number;
}

export interface RippleResult {
  transaction_amount_paise: number;
  baseline_day: number;
  new_day: number;
  days_delayed: number;
  ripple_message: string;
}

export interface ReverseIncomeResult {
  city: string;
  city_multiplier: number;
  core_monthly_paise: number;
  target_monthly_in_hand_paise: number;
  target_annual_in_hand_paise: number;
  required_annual_ctc_paise: number;
  required_monthly_ctc_paise: number;
  sensitivity_delta_paise_for_5k: number;
  breakdown: {
    scaled_fixed_paise: number;
    scaled_discretionary_paise: number;
    family_support_paise: number;
    goal_savings_paise: number;
    slack_cushion_paise: number;
  };
}

export interface CliffResult {
  remaining_payments: number;
  gap_months: number;
  needed_buffer_paise: number;
  withhold_per_payment_paise: number;
  discretionary_left_paise: number;
  is_feasible: boolean;
  shortfall_paise: number;
  actionable_levers: string[];
}

export interface NudgeItem {
  category: string;
  month: string;
  spent_so_far_paise: number;
  monthly_budget_paise: number;
  velocity: number;
  status: "caution" | "critical";
  daily_cap_paise: number;
  days_remaining: number;
  message: string;
}

export interface MonthlyReportData {
  month: string;
  total_debits_paise: number;
  total_credits_paise: number;
  net_cash_flow_paise: number;
  savings_rate_pct: number;
  total_transactions: number;
  by_category: Array<{
    category: string;
    amount_paise: number;
    percentage: number;
    transaction_count: number;
  }>;
  recurring_subscriptions_count: number;
  total_recurring_monthly_paise: number;
  narrative: string;
}

export interface CoachChatResponse {
  status: "ok" | "blocked";
  reason?: string;
  message: string;
  suggested_scenarios?: Array<{
    name: string;
    nominal_return_range: string;
    liquidity: string;
    volatility: string;
    role_in_plan: string;
  }>;
}

export interface ProfileData {
  income_streams: Array<{
    name: string;
    amount_paise: number;
    cadence: string;
    next_date?: string;
    end_date?: string;
  }>;
  fixed_costs: Array<{
    name: string;
    amount_paise: number;
    due_day: number;
  }>;
  goals: Array<{
    title?: string;
    name?: string;
    target_paise: number;
    saved_paise: number;
    target_date?: string;
    monthly_alloc_paise: number;
  }>;
  buffer_paise: number;
  many_small_inflows: boolean;
}

export const api = {
  getOfflineStatus: () => isOfflineMode,

  getSafeToSpend: (today?: string) =>
    request<SafeToSpendData>(`/safe-to-spend${today ? `?today=${today}` : ""}`),

  getTransactions: (limit: number = 50) =>
    request<Transaction[]>(`/transactions?limit=${limit}`),

  getNeedsMerchant: () =>
    request<Transaction[]>("/transactions/needs-merchant"),

  setMerchant: (id: number, merchant: string) =>
    request<Transaction>(`/transactions/${id}/merchant`, {
      method: "POST",
      body: JSON.stringify({ merchant }),
    }),

  setTransactionCategory: (id: number, category: string) =>
    request<Transaction>(`/transactions/${id}/category`, {
      method: "POST",
      body: JSON.stringify({ category }),
    }),

  quickTransaction: (payload: {
    amount_paise: number;
    direction: string;
    merchant: string;
    category?: string;
  }) =>
    request<Transaction>("/transactions/quick", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  ingestSms: (text: string) =>
    request<IngestSmsResponse>("/ingest/sms", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  getCategories: () => request<string[]>("/categories"),

  previewRule: (payload: { transaction_id: number; scope: string; category: string }) =>
    request<RulePreviewResponse>("/rules/preview", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  applyRule: (payload: { transaction_id: number; scope: string; category: string }) =>
    request<RuleApplyResponse>("/rules/apply", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  undoRule: (rule_id: number) =>
    request<{ rule_id: number; restored_count: number; active: number }>("/rules/undo", {
      method: "POST",
      body: JSON.stringify({ rule_id }),
    }),

  getSubscriptions: () =>
    request<RecurringSeries[]>("/recurring/subscriptions"),

  simulate: (payload: {
    horizon_days?: number;
    num_runs?: number;
    scenario_multipliers?: Record<string, number>;
    fixed_cost_delta_paise?: number;
    one_time_expense_paise?: number;
    one_time_expense_day?: number;
    income_delta_paise?: number;
  }) =>
    request<SimulationResult>("/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  simulateRipple: (amount_paise: number) =>
    request<RippleResult>("/simulate/ripple", {
      method: "POST",
      body: JSON.stringify({ amount_paise }),
    }),

  solveReverseIncome: (payload: {
    personal_fixed_monthly_paise: number;
    personal_discretionary_monthly_paise: number;
    family_support_monthly_paise?: number;
    monthly_goal_savings_paise?: number;
    city?: string;
    slack_ratio?: number;
  }) =>
    request<ReverseIncomeResult>("/solver/reverse-income", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  solveCliff: (payload: {
    remaining_stipend_payments: number;
    monthly_stipend_paise: number;
    post_stipend_gap_months: number;
    current_living_cost_paise: number;
    current_liquid_savings_paise?: number;
  }) =>
    request<CliffResult>("/solver/cliff", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getNudges: () =>
    request<NudgeItem[]>("/nudges"),

  getMonthlyReport: (month?: string) =>
    request<MonthlyReportData>(`/report/monthly${month ? `?month=${month}` : ""}`),

  coachChat: (message: string) =>
    request<CoachChatResponse>("/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  getProfile: () =>
    request<ProfileData>("/profile"),

  updateProfile: (profile: ProfileData) =>
    request<ProfileData>("/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }),

  setBalance: (balance_paise: number) =>
    request<{ balance_paise: number; status: string }>("/balance", {
      method: "POST",
      body: JSON.stringify({ balance_paise }),
    }),
};

