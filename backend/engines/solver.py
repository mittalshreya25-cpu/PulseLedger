import math
from typing import Any, Dict, List, Optional

CITY_MULTIPLIERS = {
    "Bengaluru": 1.25,
    "Mumbai": 1.35,
    "Delhi NCR": 1.20,
    "Hyderabad": 1.15,
    "Pune": 1.15,
    "Chennai": 1.10,
    "Tier 2 / Remote": 1.00,
}


def calculate_in_hand_from_ctc(ctc_annual_paise: int) -> int:
    """Calculates annual net in-hand salary from gross CTC using Indian New Tax Regime (FY 24-25 / 25-26 rules).
    
    Includes:
    - Standard deduction: ₹75,000 (7,500,000 paise)
    - Employee Provident Fund (EPF): 12% of Basic (Basic approx 40-50% of CTC)
    - Professional Tax: ₹2,400/year (240,000 paise)
    - New Tax Regime income tax slabs & Section 87A rebate for income up to ₹7,00,000
    All calculations in integer paise.
    """
    if ctc_annual_paise <= 0:
        return 0

    std_deduction = 7500000  # ₹75,000
    prof_tax = 240000        # ₹2,400

    # Basic salary estimate: 45% of CTC
    basic = int(round(ctc_annual_paise * 0.45))
    epf_deduction = int(round(basic * 0.12))

    taxable_income = max(0, ctc_annual_paise - std_deduction - epf_deduction)

    # New Tax Regime Slabs:
    # 0 - 3,00,000 : 0%
    # 3,00,001 - 7,00,000 : 5%
    # 7,00,001 - 10,00,000 : 10%
    # 10,00,001 - 12,00,000 : 15%
    # 12,00,001 - 15,00,000 : 20%
    # Above 15,00,000 : 30%
    income_tax = 0
    if taxable_income > 70000000:  # If taxable income > ₹7,00,000 (Section 87A rebate applies if <= ₹7,00,000)
        rem = taxable_income
        # Slab 1: 0 - 3L
        rem = max(0, rem - 30000000)
        # Slab 2: 3L - 7L @ 5%
        slab2 = min(40000000, rem)
        income_tax += int(slab2 * 0.05)
        rem -= slab2
        # Slab 3: 7L - 10L @ 10%
        slab3 = min(30000000, rem)
        income_tax += int(slab3 * 0.10)
        rem -= slab3
        # Slab 4: 10L - 12L @ 15%
        slab4 = min(20000000, rem)
        income_tax += int(slab4 * 0.15)
        rem -= slab4
        # Slab 5: 12L - 15L @ 20%
        slab5 = min(30000000, rem)
        income_tax += int(slab5 * 0.20)
        rem -= slab5
        # Slab 6: Above 15L @ 30%
        if rem > 0:
            income_tax += int(rem * 0.30)

        # 4% Health and Education Cess
        income_tax = int(round(income_tax * 1.04))

    net_annual_in_hand = max(0, ctc_annual_paise - epf_deduction - prof_tax - income_tax)
    return net_annual_in_hand


def solve_required_ctc(
    personal_fixed_monthly_paise: int,
    personal_discretionary_monthly_paise: int,
    family_support_monthly_paise: int,
    monthly_goal_savings_paise: int,
    city: str = "Bengaluru",
    slack_ratio: float = 0.10,
) -> Dict[str, Any]:
    """Solves the Reverse Income problem: given required life obligations,
    determines the exact monthly in-hand and gross CTC required via bisection.
    """
    city_multiplier = CITY_MULTIPLIERS.get(city, 1.20)

    # Core monthly requirements scaled by city living cost
    scaled_fixed = int(round(personal_fixed_monthly_paise * city_multiplier))
    scaled_discretionary = int(round(personal_discretionary_monthly_paise * city_multiplier))

    core_monthly_paise = scaled_fixed + scaled_discretionary + family_support_monthly_paise + monthly_goal_savings_paise

    # Target net in-hand monthly includes slack buffer
    target_monthly_in_hand = int(round(core_monthly_paise / (1.0 - slack_ratio)))
    target_annual_in_hand = target_monthly_in_hand * 12

    # Bisection search to find required CTC
    low = target_annual_in_hand
    high = target_annual_in_hand * 2

    # Expand high if needed
    while calculate_in_hand_from_ctc(high) < target_annual_in_hand:
        high *= 2

    for _ in range(50):  # Bisection convergence
        mid = (low + high) // 2
        in_hand_est = calculate_in_hand_from_ctc(mid)
        if in_hand_est < target_annual_in_hand:
            low = mid + 1
        else:
            high = mid

    required_ctc_annual_paise = low

    # Sensitivity: effect of sending an additional ₹5,000/month home
    base_ctc = required_ctc_annual_paise
    sens_target_monthly = int(round((core_monthly_paise + 500000) / (1.0 - slack_ratio)))
    sens_annual = sens_target_monthly * 12
    s_low, s_high = sens_annual, sens_annual * 2
    while calculate_in_hand_from_ctc(s_high) < sens_annual:
        s_high *= 2
    for _ in range(50):
        mid = (s_low + s_high) // 2
        if calculate_in_hand_from_ctc(mid) < sens_annual:
            s_low = mid + 1
        else:
            s_high = mid

    ctc_delta_for_5k = s_low - base_ctc

    return {
        "city": city,
        "city_multiplier": city_multiplier,
        "core_monthly_paise": core_monthly_paise,
        "target_monthly_in_hand_paise": target_monthly_in_hand,
        "target_annual_in_hand_paise": target_annual_in_hand,
        "required_annual_ctc_paise": required_ctc_annual_paise,
        "required_monthly_ctc_paise": required_ctc_annual_paise // 12,
        "sensitivity_delta_paise_for_5k": ctc_delta_for_5k,
        "breakdown": {
            "scaled_fixed_paise": scaled_fixed,
            "scaled_discretionary_paise": scaled_discretionary,
            "family_support_paise": family_support_monthly_paise,
            "goal_savings_paise": monthly_goal_savings_paise,
            "slack_cushion_paise": target_monthly_in_hand - core_monthly_paise,
        },
    }


def solve_cliff_partition(
    remaining_stipend_payments: int,
    monthly_stipend_paise: int,
    post_stipend_gap_months: int,
    current_living_cost_paise: int,
    current_liquid_savings_paise: int,
) -> Dict[str, Any]:
    """Calculates Cliff Partitioning for internships or time-limited contracts.
    
    Determines how much to withhold from each remaining stipend payment to survive the post-internship gap.
    """
    m = max(1, remaining_stipend_payments)
    g = max(0, post_stipend_gap_months)
    K = current_living_cost_paise
    S0 = current_liquid_savings_paise

    total_gap_cost = g * K
    needed_buffer = max(0, total_gap_cost - S0)
    withhold_per_payment = math.ceil(needed_buffer / m)

    # Feasibility check
    discretionary_after_withholding = monthly_stipend_paise - K - withhold_per_payment
    is_feasible = discretionary_after_withholding >= 0
    shortfall_paise = max(0, -discretionary_after_withholding)

    levers = []
    if not is_feasible:
        # Actionable recommendations
        reduced_gap = math.floor((S0 + m * (monthly_stipend_paise - K)) / K) if K > 0 else 0
        levers.append(f"Shorten gap window from {g} months to {max(0, reduced_gap)} months.")
        levers.append(f"Reduce current monthly living expenses by ₹{shortfall_paise/100:.2f}.")

    return {
        "remaining_payments": m,
        "gap_months": g,
        "needed_buffer_paise": needed_buffer,
        "withhold_per_payment_paise": withhold_per_payment,
        "discretionary_left_paise": max(0, discretionary_after_withholding),
        "is_feasible": is_feasible,
        "shortfall_paise": shortfall_paise,
        "actionable_levers": levers,
    }

