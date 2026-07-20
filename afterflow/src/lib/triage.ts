// ─── AfterFlow Triage Scoring Engine ───
// Implements the 8-factor weighted priority matrix from the research doc.
// Max raw score: 165 → clamped to 100.

export type TriageClassification = "P1_EMERGENCY" | "P3_ROUTINE" | "P4_SALES";

export interface TriageInput {
  /** 0–45: Vulnerable occupant risk (elderly, infant, medical condition) */
  vulnerableOccupant: number;
  /** 0–30: Active health symptoms (heat exhaustion, dizziness, etc.) */
  healthSymptoms: number;
  /** 0–20: System status — 20=total failure, 15=partial, 5=degraded, 0=working */
  systemStatus: number;
  /** 0–35: Inventory/business impact (food spoilage, revenue loss) */
  inventoryImpact: number;
  /** 0–5: Time-of-day penalty (after-hours, weekend, overnight) */
  timeOfDay: number;
  /** 0–20: Service history / SLA premium (commercial plan, maintenance agreement) */
  serviceHistory: number;
  /** 0–10: Weather context (heat advisory, extreme temps) */
  weatherContext: number;
  /** Qualitative: caller flexibility — used to confirm non-emergency classification */
  callerFlexible: boolean;
}

export interface TriageResult {
  /** Raw sum of all factor scores (capped at 100) */
  priorityScore: number;
  /** Classification based on score thresholds */
  classification: TriageClassification;
  /** Human-readable label */
  label: string;
  /** Dispatch target (human-readable) */
  dispatchTarget: string;
  /** Color for UI badges */
  color: "red" | "green" | "blue";
  /** Individual factor breakdown */
  factors: Record<string, number>;
}

const CLASSIFICATION_THRESHOLDS: { minScore: number; classification: TriageClassification; label: string; dispatchTarget: string; color: "red" | "green" | "blue" }[] = [
  { minScore: 50, classification: "P1_EMERGENCY", label: "🔴 P1 – Emergency", dispatchTarget: "< 60 minutes", color: "red" },
  { minScore: 11, classification: "P3_ROUTINE", label: "🟢 P3 – Routine", dispatchTarget: "Standard scheduling window", color: "green" },
  { minScore: 0, classification: "P4_SALES", label: "🔵 P4 – Sales Consultation", dispatchTarget: "Comfort Advisor calendar", color: "blue" },
];

const FACTOR_MAXES: Record<string, number> = {
  vulnerableOccupant: 45,
  healthSymptoms: 30,
  systemStatus: 20,
  inventoryImpact: 35,
  timeOfDay: 5,
  serviceHistory: 20,
  weatherContext: 10,
};

/**
 * Clamp a value to [0, max].
 */
function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(value, max));
}

/**
 * Score a single triage input and return full classification.
 *
 * Each of the 7 scored factors is clamped to its documented max, then
 * summed directly. The raw total is capped at 100 — exceeding 100 means
 * the situation is so severe it maxes the scale.
 *
 * Caller flexibility is a qualitative factor used to confirm or override
 * classification for borderline cases.
 */
export function triage(input: TriageInput): TriageResult {
  const factors: Record<string, number> = {};

  for (const [key, max] of Object.entries(FACTOR_MAXES)) {
    const value = (input as unknown as Record<string, number>)[key] ?? 0;
    factors[key] = clamp(value, max);
  }

  // Direct sum of weighted factors → capped at 100
  const rawSum = Object.values(factors).reduce((a, b) => a + b, 0);
  let score = Math.min(100, rawSum);

  // Caller flexibility: can demote a borderline-P3 score (20-35) to P4
  // when the caller is explicitly flexible about timing
  if (input.callerFlexible && score >= 20 && score <= 35) {
    score = Math.max(0, score - 6); // pushes below P3 threshold
  }

  // Find the matching classification (thresholds are evaluated in order)
  const match = CLASSIFICATION_THRESHOLDS.find((t) => score >= t.minScore)!;

  return {
    priorityScore: score,
    classification: match.classification,
    label: match.label,
    dispatchTarget: match.dispatchTarget,
    color: match.color,
    factors,
  };
}

/**
 * Pre-built scenario inputs matching the 5 scenarios from the research doc.
 */
export const SCENARIOS: Record<string, { input: TriageInput; expectedScore: number; expectedClassification: TriageClassification }> = {
  emergency1_elderly: {
    input: {
      vulnerableOccupant: 40,
      healthSymptoms: 30,
      systemStatus: 20,
      inventoryImpact: 0,
      timeOfDay: 5,
      serviceHistory: 0,
      weatherContext: 10,
      callerFlexible: false,
    },
    expectedScore: 100, // raw 105, capped
    expectedClassification: "P1_EMERGENCY",
  },
  emergency2_restaurant: {
    input: {
      vulnerableOccupant: 0,
      healthSymptoms: 0,
      systemStatus: 15,
      inventoryImpact: 35,
      timeOfDay: 2,
      serviceHistory: 20,
      weatherContext: 8,
      callerFlexible: false,
    },
    expectedScore: 80,
    expectedClassification: "P1_EMERGENCY",
  },
  emergency3_infant: {
    input: {
      vulnerableOccupant: 45,
      healthSymptoms: 20,
      systemStatus: 15,
      inventoryImpact: 0,
      timeOfDay: 5,
      serviceHistory: 0,
      weatherContext: 10,
      callerFlexible: false,
    },
    expectedScore: 95,
    expectedClassification: "P1_EMERGENCY",
  },
  routine1_tuneup: {
    input: {
      vulnerableOccupant: 0,
      healthSymptoms: 0,
      systemStatus: 0,
      inventoryImpact: 0,
      timeOfDay: 0,
      serviceHistory: 10,
      weatherContext: 5,
      callerFlexible: true,
    },
    expectedScore: 15,
    expectedClassification: "P3_ROUTINE",
  },
  routine2_quote: {
    input: {
      vulnerableOccupant: 0,
      healthSymptoms: 0,
      systemStatus: 5,
      inventoryImpact: 0,
      timeOfDay: 0,
      serviceHistory: 0,
      weatherContext: 5,
      callerFlexible: true,
    },
    expectedScore: 10,
    expectedClassification: "P4_SALES",
  },
};
