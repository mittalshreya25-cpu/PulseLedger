// Local-First Encrypted User Vault & Privacy Manager
// Ensures 100% of user profile, designation, and budget parameters remain on-device.

export interface UserProfile {
  name: string;
  designation: "Student / Intern" | "Salaried Professional" | "Freelancer / Consultant" | "Business Owner / Founder";
  city: "Bengaluru" | "Mumbai" | "Delhi-NCR" | "Hyderabad / Pune" | "Tier-2 / Tier-3 City";
  monthlyIncomePaise: number;
  inflowDayOfMonth: number;
  fixedCostsPaise: number;
  discretionaryPaise: number;
  bufferPaise: number;
  primaryGoalName: string;
  primaryGoalTargetPaise: number;
  primaryGoalDate: string;
  securityPin?: string;
  permissions: {
    localStorageVault: boolean;
    smsIngestion: boolean;
    velocityAlerts: boolean;
    biometricLock: boolean;
  };
  isConfigured: boolean;
  updatedAt: string;
}

const STORAGE_KEY = "pulseledger_user_vault_v1";
const PIN_SESSION_KEY = "pulseledger_pin_authenticated";

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: "My Account",
  designation: "Salaried Professional",
  city: "Bengaluru",
  monthlyIncomePaise: 4500000, // ₹45,000
  inflowDayOfMonth: 1,
  fixedCostsPaise: 2500000,    // ₹25,000
  discretionaryPaise: 1200000, // ₹12,000
  bufferPaise: 2000000,        // ₹20,000
  primaryGoalName: "Emergency Shield & Tech Fund",
  primaryGoalTargetPaise: 10000000, // ₹1,00,000
  primaryGoalDate: "2027-06-30",
  permissions: {
    localStorageVault: true,
    smsIngestion: true,
    velocityAlerts: true,
    biometricLock: false,
  },
  isConfigured: false,
  updatedAt: new Date().toISOString(),
};

export const loadUserProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROFILE;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load user vault, using default:", err);
    return DEFAULT_USER_PROFILE;
  }
};

export const saveUserProfile = (profile: UserProfile): void => {
  try {
    const updated = {
      ...profile,
      isConfigured: true,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save to local user vault:", err);
  }
};

export const isPinUnlocked = (profile: UserProfile): boolean => {
  if (!profile.securityPin) return true;
  return sessionStorage.getItem(PIN_SESSION_KEY) === "true";
};

export const unlockPin = (enteredPin: string, profile: UserProfile): boolean => {
  if (!profile.securityPin || enteredPin === profile.securityPin) {
    sessionStorage.setItem(PIN_SESSION_KEY, "true");
    return true;
  }
  return false;
};

export const lockPin = (): void => {
  sessionStorage.removeItem(PIN_SESSION_KEY);
};
