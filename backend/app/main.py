from contextlib import asynccontextmanager
import sqlite3
from typing import Any, Dict, List, Optional, Union
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from app.database import get_connection, init_db
    from app.parsers.canara_sms import parse_many
    from engines.ingest import ingest_paytm_records, ingest_sms_records
    from engines.integrity import check_balance_chain
    from engines.profile import get_profile, save_profile, set_manual_balance
    from engines.reconciliation import get_match_rate
    from engines.rules import apply_rule, get_rules, preview_rule, undo_rule
    from engines.spend import compute_safe_to_spend
    from engines.transactions import (
        create_quick_transaction,
        get_needs_merchant_transactions,
        update_transaction_merchant,
    )
    from engines.recurring import detect_recurring_series
    from engines.simulate import run_monte_carlo_simulation, compute_goal_ripple
    from engines.solver import solve_required_ctc, solve_cliff_partition
    from engines.guardrails import check_intent_firewall, validate_model_output, get_asset_class_scenarios
    from engines.nudges import calculate_category_nudges
    from engines.report import generate_monthly_review
    from engines.coach import generate_grounded_coach_reply, get_ai_coach_reply
except ImportError:
    from backend.app.database import get_connection, init_db
    from backend.app.parsers.canara_sms import parse_many
    from backend.engines.ingest import ingest_paytm_records, ingest_sms_records
    from backend.engines.integrity import check_balance_chain
    from backend.engines.profile import get_profile, save_profile, set_manual_balance
    from backend.engines.reconciliation import get_match_rate
    from backend.engines.rules import apply_rule, get_rules, preview_rule, undo_rule
    from backend.engines.spend import compute_safe_to_spend
    from backend.engines.transactions import (
        create_quick_transaction,
        get_needs_merchant_transactions,
        update_transaction_merchant,
    )
    from backend.engines.recurring import detect_recurring_series
    from backend.engines.simulate import run_monte_carlo_simulation, compute_goal_ripple
    from backend.engines.solver import solve_required_ctc, solve_cliff_partition
    from backend.engines.guardrails import check_intent_firewall, validate_model_output, get_asset_class_scenarios
    from backend.engines.nudges import calculate_category_nudges
    from backend.engines.report import generate_monthly_review
    from backend.engines.coach import generate_grounded_coach_reply, get_ai_coach_reply


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is initialized on startup
    init_db()
    yield


app = FastAPI(
    title="PulseLedger API",
    description="Deterministic financial ledger API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SMSIngestRequest(BaseModel):
    text: Optional[str] = None
    blob: Optional[str] = None
    raw_text: Optional[str] = None
    received_at: Optional[str] = None

    @property
    def payload_text(self) -> str:
        return self.text or self.blob or self.raw_text or ""


class PaytmIngestRequest(BaseModel):
    csv_text: Optional[str] = None
    text: Optional[str] = None
    rows: Optional[List[Dict[str, Any]]] = None

    @property
    def payload_content(self) -> Union[str, List[Dict[str, Any]]]:
        if self.rows is not None:
            return self.rows
        return self.csv_text or self.text or ""


class QuickTransactionRequest(BaseModel):
    amount_paise: int = Field(gt=0, description="Amount in integer paise")
    direction: str = Field(description="Transaction direction: debit or credit")
    merchant: str = Field(description="Merchant or counterparty name")
    category: Optional[str] = None
    date: Optional[str] = None
    ref_no: Optional[str] = None
    raw_text: Optional[str] = None


class SetMerchantRequest(BaseModel):
    merchant: str = Field(min_length=1, description="Merchant name")


class SetCategoryRequest(BaseModel):
    category: str = Field(min_length=1, description="Category name")


class RulePreviewRequest(BaseModel):
    transaction_id: int
    scope: str = Field(description="'payee_always' or 'payee_in_band'")
    category: str
    amount_min: Optional[int] = None
    amount_max: Optional[int] = None


class RuleApplyRequest(BaseModel):
    transaction_id: int
    scope: str = Field(description="'payee_always' or 'payee_in_band'")
    category: str
    amount_min: Optional[int] = None
    amount_max: Optional[int] = None


class RuleUndoRequest(BaseModel):
    rule_id: Optional[int] = None


class IncomeStream(BaseModel):
    name: str
    amount_paise: int = Field(ge=0)
    cadence: str = "monthly"
    next_date: Optional[str] = None
    end_date: Optional[str] = None


class FixedCost(BaseModel):
    name: str
    amount_paise: int = Field(ge=0)
    due_day: int = Field(ge=1, le=31)


class GoalItem(BaseModel):
    title: str
    name: Optional[str] = None
    target_paise: int = Field(ge=0)
    saved_paise: int = Field(default=0, ge=0)
    target_date: Optional[str] = None
    monthly_alloc_paise: int = Field(default=0, ge=0)


class ProfilePayload(BaseModel):
    income_streams: List[IncomeStream] = Field(default_factory=list)
    fixed_costs: List[FixedCost] = Field(default_factory=list)
    goals: List[GoalItem] = Field(default_factory=list)
    buffer_paise: int = Field(default=20000, ge=0)
    many_small_inflows: bool = False


class BalancePayload(BaseModel):
    balance_paise: int = Field(ge=0, description="Manual balance override in integer paise")


@app.get("/")
def read_root():
    return {
        "name": "PulseLedger API",
        "status": "healthy",
        "version": "0.1.0",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/ingest/sms")
def ingest_sms(
    payload: SMSIngestRequest,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Ingests raw SMS text blob, parsing transactions with parse_many and storing status=='parsed'."""
    text_to_parse = payload.payload_text
    if not text_to_parse:
        return {
            "inserted": [],
            "duplicates_skipped": [],
            "ignored": [],
            "unparsed": [],
        }

    return ingest_sms_records(
        conn=conn,
        raw_blob=text_to_parse,
        received_at=payload.received_at,
    )


@app.post("/ingest/paytm")
def ingest_paytm(
    payload: PaytmIngestRequest,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Ingests Paytm transactions from CSV text or row dictionaries."""
    content = payload.payload_content
    return ingest_paytm_records(conn=conn, data=content)


@app.get("/transactions/needs-merchant")
def list_needs_merchant(
    conn: sqlite3.Connection = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Lists transactions where needs_merchant is True, newest first."""
    return get_needs_merchant_transactions(conn)


@app.get("/transactions")
def list_transactions(
    limit: int = 100,
    conn: sqlite3.Connection = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Lists transactions newest first."""
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM transactions 
        ORDER BY date DESC, id DESC 
        LIMIT ?
        """,
        (limit,),
    )
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, r)) for r in cursor.fetchall()]


@app.post("/transactions/{id}/merchant")
def set_merchant(
    id: int,
    payload: SetMerchantRequest,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Sets merchant and clears needs_merchant flag for transaction id."""
    tx = update_transaction_merchant(conn, transaction_id=id, merchant=payload.merchant)
    if tx is None:
        raise HTTPException(status_code=404, detail=f"Transaction with id {id} not found")
    return tx


@app.post("/transactions/{id}/category")
def set_category(
    id: int,
    payload: SetCategoryRequest,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Sets category for transaction id directly."""
    cursor = conn.cursor()
    cursor.execute("UPDATE transactions SET category = ? WHERE id = ?", (payload.category, id))
    conn.commit()
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Transaction with id {id} not found")
    cols = [c[0] for c in cursor.description]
    return dict(zip(cols, row))


@app.post("/transactions/quick", status_code=201)
def quick_transaction(
    payload: QuickTransactionRequest,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Creates a manual quick transaction entry."""
    try:
        tx = create_quick_transaction(
            conn=conn,
            amount_paise=payload.amount_paise,
            direction=payload.direction,
            merchant=payload.merchant,
            category=payload.category,
            date=payload.date,
            ref_no=payload.ref_no,
            raw_text=payload.raw_text,
        )
        return tx
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/integrity/balance-chain")
def get_balance_chain(
    conn: sqlite3.Connection = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Checks balance chain for each SMS debit row and lists rows that fail."""
    return check_balance_chain(conn)


@app.get("/integrity/match-rate")
def match_rate(
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, int]:
    """Returns matched, ambiguous, and unmatched counts for SMS transactions."""
    return get_match_rate(conn)


@app.get("/categories")
def list_categories(
    conn: sqlite3.Connection = Depends(get_db),
) -> List[str]:
    """Lists all seeded categories."""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM categories ORDER BY id ASC")
    return [r[0] for r in cursor.fetchall()]


@app.get("/rules/preview")
def preview_rule_get(
    transaction_id: int,
    scope: str,
    category: str,
    amount_min: Optional[int] = None,
    amount_max: Optional[int] = None,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Previews rule effects without changing anything (GET with query params)."""
    try:
        return preview_rule(
            conn=conn,
            transaction_id=transaction_id,
            scope=scope,
            category=category,
            amount_min=amount_min,
            amount_max=amount_max,
        )
    except ValueError as e:
        status = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status, detail=str(e))


@app.post("/rules/preview")
def preview_rule_post(
    payload: RulePreviewRequest,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Previews rule effects without changing anything (POST with JSON body)."""
    try:
        return preview_rule(
            conn=conn,
            transaction_id=payload.transaction_id,
            scope=payload.scope,
            category=payload.category,
            amount_min=payload.amount_min,
            amount_max=payload.amount_max,
        )
    except ValueError as e:
        status = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status, detail=str(e))


@app.post("/rules/apply")
def apply_rule_route(
    payload: RuleApplyRequest,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Saves the rule, updates all matching past rows in one DB transaction,
    writes rule_audit rows, recomputes totals, and returns counts.
    """
    try:
        return apply_rule(
            conn=conn,
            transaction_id=payload.transaction_id,
            scope=payload.scope,
            category=payload.category,
            amount_min=payload.amount_min,
            amount_max=payload.amount_max,
        )
    except ValueError as e:
        status = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status, detail=str(e))


@app.post("/rules/undo")
def undo_rule_post(
    payload: RuleUndoRequest,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Restores every row exactly from rule_audit and deactivates the rule (POST with body)."""
    if payload.rule_id is None:
        raise HTTPException(status_code=400, detail="Missing rule_id")
    try:
        return undo_rule(conn=conn, rule_id=payload.rule_id)
    except ValueError as e:
        status = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status, detail=str(e))


@app.post("/rules/undo/{rule_id}")
def undo_rule_path(
    rule_id: int,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Restores every row exactly from rule_audit and deactivates the rule (POST with path param)."""
    try:
        return undo_rule(conn=conn, rule_id=rule_id)
    except ValueError as e:
        status = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status, detail=str(e))


@app.get("/rules")
def list_rules(
    active_only: bool = True,
    conn: sqlite3.Connection = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Lists rules ordered by specificity DESC, id DESC."""
    return get_rules(conn, active_only=active_only)


@app.get("/profile")
def get_profile_endpoint(
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Returns the user profile with income streams, fixed costs, goals, buffer, and inflow settings."""
    return get_profile(conn)


@app.put("/profile")
def update_profile_endpoint(
    payload: ProfilePayload,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Updates and persists the user profile in SQLite."""
    data = payload.model_dump()
    for g in data.get("goals", []):
        if not g.get("name") and g.get("title"):
            g["name"] = g["title"]
        elif not g.get("title") and g.get("name"):
            g["title"] = g["name"]
    return save_profile(conn, data)


@app.get("/safe-to-spend")
def safe_to_spend_endpoint(
    today: Optional[str] = None,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Computes Safe-to-Spend for a given date (defaults to today)."""
    try:
        return compute_safe_to_spend(conn=conn, today=today)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/balance")
def set_balance_endpoint(
    payload: BalancePayload,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Sets a manual balance override."""
    try:
        val = set_manual_balance(conn, payload.balance_paise)
        return {"balance_paise": val, "status": "ok"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------- RECURRING & SUBSCRIPTIONS --------------------

@app.get("/recurring/subscriptions")
def recurring_subscriptions(
    conn: sqlite3.Connection = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Detects recurring subscription cadences and price change alerts."""
    return detect_recurring_series(conn)


# -------------------- MONTE CARLO SIMULATOR & RIPPLE --------------------

class SimulateRequest(BaseModel):
    horizon_days: int = 365
    num_runs: int = 1000
    scenario_multipliers: Optional[Dict[str, float]] = None
    fixed_cost_delta_paise: int = 0
    one_time_expense_paise: int = 0
    one_time_expense_day: int = 0
    income_delta_paise: int = 0


class RippleRequest(BaseModel):
    amount_paise: int = Field(gt=0, description="Transaction amount in paise")


@app.post("/simulate")
def simulate_monte_carlo(
    payload: SimulateRequest,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Runs vectorized Monte Carlo simulation with Common Random Numbers."""
    return run_monte_carlo_simulation(
        conn=conn,
        horizon_days=payload.horizon_days,
        num_runs=payload.num_runs,
        scenario_multipliers=payload.scenario_multipliers,
        fixed_cost_delta_paise=payload.fixed_cost_delta_paise,
        one_time_expense_paise=payload.one_time_expense_paise,
        one_time_expense_day=payload.one_time_expense_day,
        income_delta_paise=payload.income_delta_paise,
    )


@app.post("/simulate/ripple")
def simulate_ripple(
    payload: RippleRequest,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Calculates Goal Ripple: exact days a transaction delays primary goal."""
    return compute_goal_ripple(
        conn=conn,
        transaction_amount_paise=payload.amount_paise,
    )


# -------------------- SOLVERS (REVERSE INCOME & CLIFF) --------------------

class ReverseIncomeRequest(BaseModel):
    personal_fixed_monthly_paise: int = Field(ge=0)
    personal_discretionary_monthly_paise: int = Field(ge=0)
    family_support_monthly_paise: int = Field(default=0, ge=0)
    monthly_goal_savings_paise: int = Field(default=0, ge=0)
    city: str = "Bengaluru"
    slack_ratio: float = 0.10


class CliffRequest(BaseModel):
    remaining_stipend_payments: int = Field(ge=1)
    monthly_stipend_paise: int = Field(gt=0)
    post_stipend_gap_months: int = Field(ge=0)
    current_living_cost_paise: int = Field(gt=0)
    current_liquid_savings_paise: int = Field(default=0, ge=0)


@app.post("/solver/reverse-income")
def solve_reverse_income(
    payload: ReverseIncomeRequest,
) -> Dict[str, Any]:
    """Solves required in-hand and gross CTC via bisection."""
    return solve_required_ctc(
        personal_fixed_monthly_paise=payload.personal_fixed_monthly_paise,
        personal_discretionary_monthly_paise=payload.personal_discretionary_monthly_paise,
        family_support_monthly_paise=payload.family_support_monthly_paise,
        monthly_goal_savings_paise=payload.monthly_goal_savings_paise,
        city=payload.city,
        slack_ratio=payload.slack_ratio,
    )


@app.post("/solver/cliff")
def solve_cliff(
    payload: CliffRequest,
) -> Dict[str, Any]:
    """Solves internship cliff withholding schedule."""
    return solve_cliff_partition(
        remaining_stipend_payments=payload.remaining_stipend_payments,
        monthly_stipend_paise=payload.monthly_stipend_paise,
        post_stipend_gap_months=payload.post_stipend_gap_months,
        current_living_cost_paise=payload.current_living_cost_paise,
        current_liquid_savings_paise=payload.current_liquid_savings_paise,
    )


# -------------------- NUDGES & REVIEW REPORT --------------------

@app.get("/nudges")
def get_nudges(
    conn: sqlite3.Connection = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Returns category velocity nudges and self-healing daily caps."""
    return calculate_category_nudges(conn)


@app.get("/report/monthly")
def get_monthly_report(
    month: Optional[str] = None,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Returns deterministic monthly review report with plan vs actual."""
    return generate_monthly_review(conn=conn, month=month)


# -------------------- GUARDED COACH CHAT --------------------

class CoachChatRequest(BaseModel):
    message: str = Field(min_length=1)


@app.post("/coach/chat")
def coach_chat(
    payload: CoachChatRequest,
    conn: sqlite3.Connection = Depends(get_db),
) -> Dict[str, Any]:
    """Guarded AI Coach chat with 3-layer guardrail firewall and asset-class educational pivot."""
    user_msg = payload.message.strip()

    # Layer 1: Firewall
    is_blocked, reason, pivot = check_intent_firewall(user_msg)
    if is_blocked:
        scenarios = get_asset_class_scenarios()
        return {
            "status": "blocked",
            "reason": reason,
            "message": (
                "PulseLedger adheres to strict compliance: we never recommend specific securities, stocks, "
                "or speculative assets. We can help you model your cash flow allocation across broad, educational asset classes below."
            ),
            "suggested_scenarios": scenarios,
        }

    # Grounded factual response based on user's live financial model (via Gemini with Python fallback)
    raw_reply = get_ai_coach_reply(conn=conn, user_msg=user_msg)

    # Layer 3: Output Validator
    _, clean_reply = validate_model_output(raw_reply)

    return {
        "status": "ok",
        "message": clean_reply,
        "suggested_scenarios": [],
    }

