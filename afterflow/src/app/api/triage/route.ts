import { NextRequest, NextResponse } from "next/server";
import { triage, type TriageInput } from "@/lib/triage";
import { detectSafetyFlags } from "@/lib/voice-flow";

// ─── Input type: simplified field names from the caller-facing API ───
interface TriageApiInput {
  /** Free-text symptom description */
  symptoms?: string;
  /** Occupant type: "elderly", "infant", "family", "commercial", "individual" */
  occupantType?: string;
  /** System status: "total_failure", "partial_failure", "degraded", "working" */
  systemStatus?: string;
  /** Indoor temperature (numeric or string like "93°F") */
  indoorTemp?: string;
  /** "after_hours", "weekend", "overnight", "business_hours" */
  timeOfDay?: string;
  /** Whether the caller reports health symptoms */
  hasHealthSymptoms?: boolean;
  /** Business impact: "inventory_risk", "revenue_loss", "none" */
  businessImpact?: string;
  /** "heat_advisory", "extreme", "moderate", "normal" */
  weatherSeverity?: string;
  /** Whether the caller is flexible on timing */
  callerFlexibility?: boolean;
}

// ─── Output type ───
interface TriageApiOutput {
  score: number;
  classification: string;
  priority: string;
  dispatchWindow: string;
  diagnosis: string;
  safetyActions: string[];
  factors: Record<string, number>;
}

// ─── Mapping: occupant type → vulnerableOccupant score ───
function mapOccupantType(type: string | undefined): number {
  switch (type?.toLowerCase()) {
    case "infant":
    case "baby":
    case "newborn":
      return 45;
    case "elderly":
    case "senior":
      return 40;
    case "medical":
    case "disabled":
      return 35;
    default:
      return 0;
  }
}

// ─── Mapping: system status → systemStatus score ───
function mapSystemStatus(status: string | undefined): number {
  switch (status?.toLowerCase()) {
    case "total_failure":
    case "total failure":
    case "not working":
      return 20;
    case "partial_failure":
    case "partial failure":
    case "blowing warm":
    case "running but not cooling":
      return 15;
    case "degraded":
    case "running long":
    case "intermittent":
      return 5;
    default:
      return 0;
  }
}

// ─── Mapping: time of day → timeOfDay score ───
function mapTimeOfDay(tod: string | undefined): number {
  switch (tod?.toLowerCase()) {
    case "overnight":
      return 5;
    case "after_hours":
    case "after hours":
    case "weekend":
      return 5;
    case "early_morning":
    case "early morning":
      return 2;
    case "evening":
    default:
      return 0;
  }
}

// ─── Mapping: business impact → inventoryImpact score ───
function mapBusinessImpact(impact: string | undefined): number {
  switch (impact?.toLowerCase()) {
    case "inventory_risk":
    case "inventory risk":
    case "food spoilage":
      return 35;
    case "revenue_loss":
    case "revenue loss":
    case "business_closed":
      return 25;
    case "minor":
      return 10;
    default:
      return 0;
  }
}

// ─── Mapping: weather severity → weatherContext score ───
function mapWeatherSeverity(weather: string | undefined): number {
  switch (weather?.toLowerCase()) {
    case "heat_advisory":
    case "heat advisory":
    case "extreme":
      return 10;
    case "very_hot":
    case "hot":
      return 8;
    case "moderate":
      return 5;
    default:
      return 0;
  }
}

// ─── Health symptom score ───
function mapHealthSymptoms(has: boolean, symptoms: string | undefined): number {
  if (!has) return 0;
  const s = (symptoms ?? "").toLowerCase();
  // Heat exhaustion indicators → higher score
  if (s.includes("dizzy") || s.includes("nausea") || s.includes("confus") || s.includes("faint")) {
    return 30;
  }
  if (s.includes("headache") || s.includes("fatigue") || s.includes("weak")) {
    return 20;
  }
  // General health concern → moderate
  return 15;
}

// ─── Service history mapping (from occupant type, business impact, and symptoms) ───
function mapServiceHistory(
  occupantType: string | undefined,
  businessImpact: string | undefined,
  symptoms: string | undefined,
): number {
  if (businessImpact && businessImpact !== "none") return 20; // commercial SLA
  // Detect maintenance relationship from symptoms
  const s = (symptoms ?? "").toLowerCase();
  if (s.includes("tune-up") || s.includes("tune up") || s.includes("maintenance") ||
      s.includes("annual service") || s.includes("seasonal service") || s.includes("comfort club")) {
    return 10; // existing customer, overdue maintenance
  }
  return 0;
}

// ─── Diagnosis generation ───
function generateDiagnosis(
  systemStatus: string | undefined,
  symptoms: string | undefined,
  safetyActions: string[],
): string {
  const s = (systemStatus ?? "").toLowerCase();
  const desc = (symptoms ?? "").toLowerCase();

  if (safetyActions.includes("SHUT_OFF_GAS")) {
    return "Possible gas leak detected. Evacuate immediately. Do not operate electrical devices.";
  }
  if (safetyActions.includes("SHUT_OFF_POWER")) {
    return "Possible electrical fault or burning component. Shut off power to the unit immediately.";
  }

  if (s.includes("total") || s.includes("silent") || s.includes("not working")) {
    if (desc.includes("silent") || desc.includes("no sound")) {
      return "Likely capacitor failure, compressor failure, or electrical disconnect. Requires parts and diagnostic equipment.";
    }
    return "Total system failure. Requires on-site diagnosis. Possible compressor or electrical issue.";
  }

  if (s.includes("partial") || s.includes("warm") || s.includes("not cooling")) {
    if (desc.includes("frost") || desc.includes("ice")) {
      return "Possible defrost system failure or refrigerant issue. Short-cycling compressor indicates start component or control board problem.";
    }
    return "Likely low refrigerant (R-410A). Compressor and fan are running but insufficient cooling. Repairable with refrigerant recharge and leak detection.";
  }

  if (s.includes("degraded") || s.includes("running long")) {
    return "Reduced system efficiency, likely due to dirty coils, low refrigerant, or aging components. Seasonable tune-up recommended.";
  }

  return "No active failure. Routine service or system evaluation.";
}

export async function POST(request: NextRequest) {
  const body: TriageApiInput = await request.json().catch(() => ({}));

  // Map simplified input fields to TriageInput weights
  const occupantType = body.occupantType ?? "";
  const systemStatus = body.systemStatus ?? "";
  const businessImpact = body.businessImpact ?? "";
  const hasHealth = body.hasHealthSymptoms ?? false;

  const triageInput: TriageInput = {
    vulnerableOccupant: mapOccupantType(occupantType),
    healthSymptoms: mapHealthSymptoms(hasHealth, body.symptoms),
    systemStatus: mapSystemStatus(systemStatus),
    inventoryImpact: mapBusinessImpact(businessImpact),
    timeOfDay: mapTimeOfDay(body.timeOfDay),
    serviceHistory: mapServiceHistory(occupantType, businessImpact, body.symptoms),
    weatherContext: mapWeatherSeverity(body.weatherSeverity),
    callerFlexible: body.callerFlexibility ?? false,
  };

  // Detect safety flags from symptoms text
  const safety = detectSafetyFlags(body.symptoms ?? "");

  // Run triage
  const result = triage(triageInput);

  // Override: if safety flags detected, ensure emergency classification
  let classification = result.classification;
  let score = result.priorityScore;
  if ((safety.gasSmell || safety.electricalBurning) && classification !== "P1_EMERGENCY") {
    classification = "P1_EMERGENCY";
    score = Math.max(score, 50); // push into P1 territory
  }

  // Map priority to human-readable
  const priorityMap: Record<string, string> = {
    P1_EMERGENCY: "P1 – Emergency",
    P3_ROUTINE: "P3 – Routine",
    P4_SALES: "P4 – Sales Consultation",
  };

  // Build dispatch window
  let dispatchWindow: string;
  if (classification === "P1_EMERGENCY") {
    dispatchWindow = "< 60 minutes";
  } else if (classification === "P3_ROUTINE") {
    dispatchWindow = "Standard scheduling window (1–3 days)";
  } else {
    dispatchWindow = "Comfort Advisor calendar (3–7 days)";
  }

  const diagnosis = generateDiagnosis(systemStatus, body.symptoms, safety.actions);

  const output: TriageApiOutput = {
    score,
    classification,
    priority: priorityMap[classification] ?? classification,
    dispatchWindow,
    diagnosis,
    safetyActions: safety.actions,
    factors: result.factors,
  };

  return NextResponse.json(output);
}
