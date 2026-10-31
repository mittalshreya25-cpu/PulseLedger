from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Union


def to_paise(rupees: Optional[Union[float, int, str]]) -> Optional[int]:
    """Converts a rupee value into integer paise deterministically."""
    if rupees is None:
        return None
    d = Decimal(str(rupees))
    return int((d * 100).to_integral_value(rounding=ROUND_HALF_UP))


def to_rupees(paise: Optional[int]) -> Optional[float]:
    """Converts integer paise into rupees as float for display purposes."""
    if paise is None:
        return None
    return float(Decimal(paise) / Decimal(100))

