export interface CategoryMeta {
  color: string;
  bg: string;
  border: string;
  icon: string;
  isIncome?: boolean;
  label?: string;
  description?: string;
}

export const CATEGORY_PALETTE: Record<string, CategoryMeta> = {
  Allowance: {
    color: "#8EB69B",
    bg: "rgba(142, 182, 155, 0.15)",
    border: "rgba(142, 182, 155, 0.35)",
    icon: "💵",
    isIncome: true,
    label: "Allowance (Income)",
    description: "Parental allowance, stipend, or recurring salary credit",
  },
  "Allowance (income)": {
    color: "#8EB69B",
    bg: "rgba(142, 182, 155, 0.15)",
    border: "rgba(142, 182, 155, 0.35)",
    icon: "💵",
    isIncome: true,
    label: "Allowance (Income)",
    description: "Parental allowance, stipend, or recurring salary credit",
  },
  Food: {
    color: "#8EB69B",
    bg: "rgba(142, 182, 155, 0.12)",
    border: "rgba(142, 182, 155, 0.25)",
    icon: "🍔",
    isIncome: false,
    label: "Food & Dining",
    description: "Swiggy, Zomato, groceries, dining, coffee, snacks",
  },
  Education: {
    color: "#6FA38F",
    bg: "rgba(111, 163, 143, 0.12)",
    border: "rgba(111, 163, 143, 0.25)",
    icon: "🎓",
    isIncome: false,
    label: "Education & Learning",
    description: "Tuition, books, courses, exam fees, tech subscriptions",
  },
  Entertainment: {
    color: "#E9A159",
    bg: "rgba(233, 161, 89, 0.12)",
    border: "rgba(233, 161, 89, 0.25)",
    icon: "🎬",
    isIncome: false,
    label: "Entertainment",
    description: "Netflix, Spotify, movies, gaming, events, hobbies",
  },
  Transport: {
    color: "#4E7A6E",
    bg: "rgba(78, 122, 110, 0.12)",
    border: "rgba(78, 122, 110, 0.25)",
    icon: "🚕",
    isIncome: false,
    label: "Transport & Commute",
    description: "Uber, Rapido, metro, fuel, train, auto fare",
  },
  Services: {
    color: "#8EB69B",
    bg: "rgba(142, 182, 155, 0.12)",
    border: "rgba(142, 182, 155, 0.25)",
    icon: "⚡",
    isIncome: false,
    label: "Services & Utilities",
    description: "Electricity, mobile recharges, WiFi, laundry, cloud tools",
  },
  "Investments & Savings": {
    color: "#8EB69B",
    bg: "rgba(142, 182, 155, 0.15)",
    border: "rgba(142, 182, 155, 0.35)",
    icon: "📈",
    isIncome: false,
    label: "Investments & Savings",
    description: "Mutual funds, SIPs, emergency fund, fixed deposits",
  },
  "Hostel & Mess": {
    color: "#3A6055",
    bg: "rgba(58, 96, 85, 0.15)",
    border: "rgba(58, 96, 85, 0.3)",
    icon: "🏢",
    isIncome: false,
    label: "Hostel & Mess",
    description: "Hostel fee, room rent, campus dining mess subscription",
  },
  "Money Transfer": {
    color: "#6FA38F",
    bg: "rgba(111, 163, 143, 0.12)",
    border: "rgba(111, 163, 143, 0.25)",
    icon: "🔁",
    isIncome: false,
    label: "Money Transfer (P2P)",
    description: "Peer-to-peer UPI payments to friends or family",
  },
  "Bank charges": {
    color: "#E56B6F",
    bg: "rgba(229, 107, 111, 0.12)",
    border: "rgba(229, 107, 111, 0.25)",
    icon: "🏦",
    isIncome: false,
    label: "Bank Charges & Taxes",
    description: "SMS alert charges, debit card annual fees, penalties",
  },
  Miscellaneous: {
    color: "#8EB69B",
    bg: "rgba(142, 182, 155, 0.10)",
    border: "rgba(142, 182, 155, 0.2)",
    icon: "📦",
    isIncome: false,
    label: "Miscellaneous",
    description: "General shopping, stationery, minor unplanned expenses",
  },
  Uncategorized: {
    color: "#E9A159",
    bg: "rgba(233, 161, 89, 0.15)",
    border: "rgba(233, 161, 89, 0.3)",
    icon: "❓",
    isIncome: false,
    label: "Uncategorized",
    description: "Needs category classification or merchant attribution",
  },
};

export function getCategoryMeta(category?: string | null): CategoryMeta {
  if (!category) return CATEGORY_PALETTE["Uncategorized"];
  return (
    CATEGORY_PALETTE[category] || {
      color: "#8EB69B",
      bg: "rgba(142, 182, 155, 0.12)",
      border: "rgba(142, 182, 155, 0.25)",
      icon: "🏷️",
      isIncome: false,
      label: category,
      description: "Custom transaction category",
    }
  );
}

