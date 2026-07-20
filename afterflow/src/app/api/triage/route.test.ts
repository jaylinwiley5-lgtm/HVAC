import { describe, it, expect } from "vitest";
import { POST } from "./route";

// Helper: build a mock NextRequest with JSON body
function mockRequest(body: Record<string, unknown>): Request {
  return new Request("https://example.com/api/triage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callApi(body: Record<string, unknown>) {
  const req = mockRequest(body);
  // NextRequest extends Request; the route handler expects NextRequest
  const res = await POST(req as unknown as Parameters<typeof POST>[0]);
  return res.json();
}

// ─── 5 Scenarios from research doc ───

describe("POST /api/triage — scenario classification", () => {
  it("E1: Elderly resident, total AC failure → P1_EMERGENCY with score ~95", async () => {
    const result = await callApi({
      symptoms: "AC completely silent, no sound, indoor temp 93°F, feeling dizzy and nauseous, dry mouth",
      occupantType: "elderly",
      systemStatus: "total_failure",
      indoorTemp: "93°F",
      timeOfDay: "after_hours",
      hasHealthSymptoms: true,
      businessImpact: "none",
      weatherSeverity: "extreme",
      callerFlexibility: false,
    });

    expect(result.classification).toBe("P1_EMERGENCY");
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.score).toBeLessThanOrEqual(105); // capped at 100 but raw may exceed
    expect(result.priority).toContain("P1");
    expect(result.dispatchWindow).toBe("< 60 minutes");
    expect(result.diagnosis).toBeTruthy();
    expect(result.factors).toBeDefined();
    expect(result.factors.vulnerableOccupant).toBe(40); // elderly
  });

  it("E2: Restaurant walk-in freezer down → P1_EMERGENCY with score ~90", async () => {
    const result = await callApi({
      symptoms: "Walk-in freezer at 38°F, compressor short-cycling, frost on evaporator, $8K food at risk",
      occupantType: "commercial",
      systemStatus: "partial_failure",
      indoorTemp: "38°F (freezer)",
      timeOfDay: "early_morning",
      hasHealthSymptoms: false,
      businessImpact: "inventory_risk",
      weatherSeverity: "extreme",
      callerFlexibility: false,
    });

    expect(result.classification).toBe("P1_EMERGENCY");
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.priority).toContain("P1");
    expect(result.dispatchWindow).toBe("< 60 minutes");
  });

  it("E3: Family with infant, AC blowing warm → P1_EMERGENCY with score ~93", async () => {
    const result = await callApi({
      symptoms: "AC blowing warm air, indoor temp 88°F, 4-month-old baby fussy sweaty flushed",
      occupantType: "infant",
      systemStatus: "partial_failure",
      indoorTemp: "88°F",
      timeOfDay: "overnight",
      hasHealthSymptoms: true,
      businessImpact: "none",
      weatherSeverity: "extreme",
      callerFlexibility: false,
    });

    expect(result.classification).toBe("P1_EMERGENCY");
    expect(result.score).toBeGreaterThanOrEqual(88);
    expect(result.priority).toContain("P1");
    expect(result.dispatchWindow).toBe("< 60 minutes");
    expect(result.factors.vulnerableOccupant).toBe(45); // infant
  });

  it("R1: AC preventative maintenance → P3_ROUTINE with score ~15", async () => {
    const result = await callApi({
      symptoms: "AC working fine but running longer cycles, energy bill higher, wants seasonal tune-up, last service over a year ago",
      occupantType: "individual",
      systemStatus: "working",
      indoorTemp: "78°F",
      timeOfDay: "business_hours",
      hasHealthSymptoms: false,
      businessImpact: "none",
      weatherSeverity: "moderate",
      callerFlexibility: true,
    });

    expect(result.classification).toBe("P3_ROUTINE");
    expect(result.score).toBeLessThan(50);
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.priority).toContain("P3");
    expect(result.dispatchWindow).toContain("Standard");
  });

  it("R2: System replacement quote → P4_SALES with score ~8", async () => {
    const result = await callApi({
      symptoms: "18-year-old AC unit, barely cools, runs constantly, wants replacement quote",
      occupantType: "individual",
      systemStatus: "degraded",
      indoorTemp: "78°F",
      timeOfDay: "evening",
      hasHealthSymptoms: false,
      businessImpact: "none",
      weatherSeverity: "moderate",
      callerFlexibility: true,
    });

    expect(result.classification).toBe("P4_SALES");
    expect(result.score).toBeLessThan(20);
    expect(result.priority).toContain("P4");
    expect(result.dispatchWindow).toContain("Comfort Advisor");
  });
});

// ─── Safety overrides ───

describe("POST /api/triage — safety overrides", () => {
  it("gas smell triggers safety actions and forces P1 classification", async () => {
    const result = await callApi({
      symptoms: "I smell gas near the furnace, it's strong",
      occupantType: "individual",
      systemStatus: "working",
      indoorTemp: "75°F",
      timeOfDay: "business_hours",
      hasHealthSymptoms: false,
      businessImpact: "none",
      weatherSeverity: "moderate",
      callerFlexibility: true,
    });

    expect(result.classification).toBe("P1_EMERGENCY");
    expect(result.safetyActions).toContain("SHUT_OFF_GAS");
    expect(result.safetyActions).toContain("EVACUATE");
    expect(result.safetyActions).toContain("CALL_911_OUTSIDE");
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it("electrical burning triggers safety actions and forces P1 classification", async () => {
    const result = await callApi({
      symptoms: "smelling electrical burning from the AC unit, there's smoke coming out",
      occupantType: "individual",
      systemStatus: "working",
      indoorTemp: "75°F",
      timeOfDay: "business_hours",
      hasHealthSymptoms: false,
      businessImpact: "none",
      weatherSeverity: "moderate",
      callerFlexibility: true,
    });

    expect(result.classification).toBe("P1_EMERGENCY");
    expect(result.safetyActions).toContain("SHUT_OFF_POWER");
    expect(result.safetyActions).toContain("DO_NOT_TOUCH_UNIT");
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it("gas smell safety override works even for otherwise low-priority inputs", async () => {
    // This would normally be P4 sales, but gas smell overrides
    const result = await callApi({
      symptoms: "I want a quote for a new system and also I smell gas",
      occupantType: "individual",
      systemStatus: "working",
      indoorTemp: "72°F",
      timeOfDay: "business_hours",
      hasHealthSymptoms: false,
      businessImpact: "none",
      weatherSeverity: "normal",
      callerFlexibility: true,
    });

    expect(result.classification).toBe("P1_EMERGENCY");
    expect(result.safetyActions.length).toBeGreaterThan(0);
    expect(result.dispatchWindow).toBe("< 60 minutes");
  });
});

// ─── Field mapping ───

describe("POST /api/triage — field mapping", () => {
  it("maps occupantType 'infant' to vulnerableOccupant 45", async () => {
    const result = await callApi({
      symptoms: "AC not cooling",
      occupantType: "infant",
      systemStatus: "partial_failure",
      indoorTemp: "85°F",
      timeOfDay: "after_hours",
      hasHealthSymptoms: false,
      businessImpact: "none",
      weatherSeverity: "moderate",
      callerFlexibility: false,
    });

    expect(result.factors.vulnerableOccupant).toBe(45);
  });

  it("maps occupantType 'elderly' to vulnerableOccupant 40", async () => {
    const result = await callApi({
      symptoms: "AC broken",
      occupantType: "elderly",
      systemStatus: "total_failure",
      indoorTemp: "90°F",
      timeOfDay: "after_hours",
      hasHealthSymptoms: false,
      businessImpact: "none",
      weatherSeverity: "moderate",
      callerFlexibility: false,
    });

    expect(result.factors.vulnerableOccupant).toBe(40);
  });

  it("maps businessImpact 'inventory_risk' to inventoryImpact 35", async () => {
    const result = await callApi({
      symptoms: "freezer down",
      occupantType: "commercial",
      systemStatus: "partial_failure",
      indoorTemp: "40°F",
      timeOfDay: "early_morning",
      hasHealthSymptoms: false,
      businessImpact: "inventory_risk",
      weatherSeverity: "moderate",
      callerFlexibility: false,
    });

    expect(result.factors.inventoryImpact).toBe(35);
  });

  it("maps weatherSeverity 'extreme' to weatherContext 10", async () => {
    const result = await callApi({
      symptoms: "AC broken",
      occupantType: "individual",
      systemStatus: "total_failure",
      indoorTemp: "90°F",
      timeOfDay: "after_hours",
      hasHealthSymptoms: false,
      businessImpact: "none",
      weatherSeverity: "extreme",
      callerFlexibility: false,
    });

    expect(result.factors.weatherContext).toBe(10);
  });

  it("caller flexibility reduces score for borderline cases", async () => {
    // Same payload twice, once flexible once not
    const payload = {
      symptoms: "AC running long",
      occupantType: "individual" as const,
      systemStatus: "degraded" as const,
      indoorTemp: "78°F",
      timeOfDay: "business_hours" as const,
      hasHealthSymptoms: false,
      businessImpact: "none" as const,
      weatherSeverity: "moderate" as const,
    };

    const flexible = await callApi({ ...payload, callerFlexibility: true });
    const inflexible = await callApi({ ...payload, callerFlexibility: false });

    // With flexibility, the score may be equal or lower (flexibility only kicks in at 20-35 range)
    expect(flexible.score).toBeLessThanOrEqual(inflexible.score);
  });
});

// ─── Response structure ───

describe("POST /api/triage — response structure", () => {
  it("returns all required fields", async () => {
    const result = await callApi({
      symptoms: "AC broken, it's hot",
      occupantType: "individual",
      systemStatus: "total_failure",
      indoorTemp: "90°F",
      timeOfDay: "after_hours",
      hasHealthSymptoms: false,
      businessImpact: "none",
      weatherSeverity: "moderate",
      callerFlexibility: false,
    });

    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("classification");
    expect(result).toHaveProperty("priority");
    expect(result).toHaveProperty("dispatchWindow");
    expect(result).toHaveProperty("diagnosis");
    expect(result).toHaveProperty("safetyActions");
    expect(result).toHaveProperty("factors");
    expect(Array.isArray(result.safetyActions)).toBe(true);
    expect(typeof result.score).toBe("number");
  });

  it("diagnosis is a non-empty string", async () => {
    const result = await callApi({
      symptoms: "AC completely silent, no sound",
      occupantType: "elderly",
      systemStatus: "total_failure",
      indoorTemp: "93°F",
      timeOfDay: "after_hours",
      hasHealthSymptoms: true,
      businessImpact: "none",
      weatherSeverity: "extreme",
      callerFlexibility: false,
    });

    expect(typeof result.diagnosis).toBe("string");
    expect(result.diagnosis.length).toBeGreaterThan(0);
  });
});
