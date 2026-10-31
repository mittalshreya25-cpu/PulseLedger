/**
 * Formats integer paise into Indian Rupee currency with Indian digit grouping.
 * e.g. 123456 paise -> "₹1,234.56", 70000 paise -> "₹700"
 */
export function formatINR(paise: number, showDecimals: boolean = false): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = absPaise / 100;

  const hasFraction = absPaise % 100 !== 0;
  const fractionDigits = showDecimals || hasFraction ? 2 : 0;

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(rupees);

  return `${isNegative ? "-" : ""}₹${formatted}`;
}

export function formatRupeesText(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = absPaise / 100;
  const hasFraction = absPaise % 100 !== 0;

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);

  return `${isNegative ? "-" : ""}Rs ${formatted}`;
}

/**
 * Formats ISO date string (YYYY-MM-DD) into readable format, e.g. "31 Oct 2026" or "Oct 31".
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

