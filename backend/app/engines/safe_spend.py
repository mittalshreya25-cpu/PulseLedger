# Re-export pure safe_spend functions
try:
    from engines.safe_spend import SafeToSpend, choose_horizon, safe_to_spend
except ImportError:
    from backend.engines.safe_spend import SafeToSpend, choose_horizon, safe_to_spend

__all__ = ["SafeToSpend", "choose_horizon", "safe_to_spend"]

