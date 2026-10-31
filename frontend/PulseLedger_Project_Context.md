# PulseLedger: Living Project Context (keep this file updated after every step)

_Last updated: 31 Oct 2026, ~17:45 IST. Deadline: ~22:00 IST today._
_Purpose: anyone (or any AI tool) can read this one file and know what the project is, what is done, what is running, and what comes next._

## 1. Problem and pitch
**Hackathon problem:** "Personal finance coach with a living money model." Budgeting apps categorize and stop; they do not understand goals or adapt as life changes. Required: (R1) ingest messy PDF/CSV/SMS with auto-categorization; (R2) correction loop that learns a rule; (R3) recurring/subscription detection with change and unused alerts; (R4) persistent profile (income, fixed costs, emergency fund, goals with dates); (R5) goal planner with what-if simulation; (R6) nudges when spending drifts off plan; (R7) monthly review report; (R8) guardrails: educate and model scenarios, never recommend specific securities.

**One-line pitch:** PulseLedger tells you what you can safely spend today and shows how every rupee moves your goals, however your income looks and however it changes.

**Builder / customer zero:** solo, 2nd-year B.Tech CSE (AIML) student on a family allowance; uses Canara Bank + Paytm UPI. Must be useful for anyone (intern, salaried, gig, freelancer, homemaker), so income is one end-dated, percentile-planned stream abstraction, not five hard-coded modes.

## 2. Hard rules (also in RULES.md in the repo)
1. The LLM never does arithmetic or dates; every number comes from Python.
2. All LLM calls go through one wrapper (PII scrub, cache, schema validation, fallback). Model IDs live in `.env`, never hard-coded.
3. Never recommend specific securities/funds/crypto; guardrails wrap every LLM-facing route.
4. Money is stored as integer paise.
5. Fuzzy matches only suggest; only exact/substring/payee rules auto-apply.
6. One module per prompt; tests first; no claimed number unless a script prints it.
7. Real personal data stays local (`data/local/`, gitignored). Public/demo data is synthetic or scrubbed and labelled as such.

## 3. Tech stack (as built)
Python 3.12 (Windows), FastAPI, Pydantic v2, SQLite, pytest, uvicorn, NumPy (simulator, not yet used). Frontend planned: Vite + React + TypeScript + Tailwind + Recharts, phone-first. Coding agent: Antigravity (one session at a time). LLM: Google Gemini via AI Studio key in `.env` (optional, not yet smoke-tested). Cut: Next.js, DuckDB, NetworkX, SciPy, Groq, embeddings, PDF parsing, Local Brain (Qwen fine-tune, deferred to v2).

## 4. Data sources and what we learned
| Source | What it gives | What it lacks |
|---|---|---|
| Canara SMS (credit) | amount, date, UPI ref (UPI credits), balance (generic credits) | counterparty name for generic credits |
| Canara SMS (debit) | amount, date, balance after, footer "Dial 1930" | **no merchant, no UPI ref** |
| Canara OTP / feedback SMS | nothing | ignored by design, content never extracted |
| Paytm payment history | merchant/payee, date+time, signed amount, Paytm tag | UPI ref not visible in screenshots; self-transfers and wallet payments excluded |
| Canara PDF/CSV statement | not available (net banking blocked) | PDF path cut |

**Key design decision:** Canara SMS = bank truth (amount, date, balance); Paytm = merchant truth. They are reconciled by direction + amount + date (±1 day). Exactly one match: link and inherit merchant and tag; several matches: leave in the "what was this?" queue. A linked pair is counted once.

**Real-data validation (done):** the 30 Paytm rows transcribed from screenshots (27 in Oct 2026, 3 in Sep) reproduce Paytm's own Oct summary exactly: spent 3,319.10 (Food 1,384.26; Money Transfer 932; Entertainment 647.84; Education 200; Services 135; Miscellaneous 20) and received 4,410. Files: `paytm_real.local.csv` (real names, local only) and `paytm_scrubbed.csv` (names replaced by FRIEND_n / VENDOR_n / SOURCE_n; safe for the repo).

## 5. Architecture
```
Canara SMS paste | Paytm import | Quick Add
        -> parse (canara_sms.py, paytm_import.py) -> dedupe (ref, else date+amount+direction+balance/merchant)
        -> reconcile SMS<->Paytm -> categorize: learned rules -> merchant dictionary -> (optional LLM)
        -> recurring detector -> profile + plan -> simulator (bootstrap Monte Carlo, common random numbers)
        -> Safe-to-Spend, Goal Ripple, Reverse Income Solver -> nudges, monthly report
        -> guardrails wrap every LLM-facing endpoint
```
Folders: `backend/app/{parsers,engines,...}`, `backend/tests`, `backend/tests/fixtures`, `data/local` (private), `docs/`.

## 6. Status
### Done (49 tests passing, `pytest -q`, 31 Oct)
- P0 scaffold, SQLite schema, seed profile/goals/categories.
- P1 Canara SMS parser (credit, generic debit, OTP/feedback ignore, unparsed returned not dropped), dedupe key, balance-chain check, `/ingest/sms`, quick add, needs-merchant queue, categories.
- P2 Paytm importer (signed amounts, tag to category map, Investments & Savings category), reconciliation with SMS, single-count totals, match-rate endpoint.
- Real Paytm October data transcribed and verified against Paytm's summary (test on the scrubbed file asserts Oct debits 331910 paise, credits 441000 paise, per-category totals).
- P2.5 local loader + scrubbed-data test. P3 merchant dictionary (data/merchants.json), rules with specificity ordering, preview/apply/undo with audit, zero-LLM classification after a correction (10 tests).
- Safe-to-Spend engine written and tested outside the repo (8 tests; pure integer-paise math, `engines/safe_spend.py`); design tokens file (`tokens.css`).

### In progress / next (in order)
- P4a (now) Drop in safe_spend.py, profile endpoints, GET /safe-to-spend using the latest Canara SMS balance as liquid money.
- P4b (next) Vite + React Home screen: big Safe-to-Spend number, runway strip, Quick Add, SMS paste, "what was this?" queue with the correction sheet; then vertical-slice demo (tag `slice`).
- P5 Simulator, Goal Ripple, what-if sliders.
- P6 Recurring detector and alerts; nudges.
- P7 Guardrail with red-team and benign sets (measured block and false-positive rates).
- P8 Monthly report, seeded demo data, evaluation script, README, backup video.
- Stretch only if ahead at ~19:15: Gemini categorizer tier, natural-language what-if, Reverse Income Solver (simple, labelled estimate), P2P payback netting.

### Findings worth using in the demo
- Same payee appears as -150 then +150 within 3 days (payback): P2P netting demo.
- Several person-named payees are tagged Food by Paytm (food vendors): correction loop and payee rules matter.
- Income is lumpy (many small credits), which is exactly the case fixed-paycheck apps fail on.

## 6b. Safe-to-Spend definition (single source of truth)
pool = L + E - C - G - B; daily = pool // D; today_budget = (pool + spent_today) // D; remaining_today = today_budget - spent_today. L = latest Canara SMS balance (else manual); E counts only inflows the user declared; D = days to next declared inflow or month end (max 7 when income is many small credits). If pool < 0 the app says "You are overcommitted by X until <date>".

## 7. Risks
Debit SMS have no merchant (mitigated by Paytm reconciliation); one month of real data only (use labelled synthetic history for charts and accuracy numbers); Gemini key not yet tested; tax numbers unverified (Reverse Income Solver is an estimate); evaluation numbers must come from scripts.

## 8. How to run
```
.venv\Scripts\activate
pytest -q
uvicorn backend.app.main:app --reload
```
Checkpoints: `git tag p1`, `p2`, `slice`, `engines`, `demo`.
