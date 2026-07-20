import { describe, it, expect } from "vitest";
import { triage, SCENARIOS, TriageInput } from "./triage";

describe("triage engine", () => {
  it("classifies emergency scenario 1 (elderly, total AC failure) as P1", () => {
    const result = triage(SCENARIOS.emergency1_elderly.input);
    expect(result.classification).toBe("P1_EMERGENCY");
    expect(result.priorityScore).toBeGreaterThanOrEqual(50);
    expect(result.color).toBe("red");
  });

  it("classifies emergency scenario 2 (restaurant freezer) as P1", () => {
    const result = triage(SCENARIOS.emergency2_restaurant.input);
    expect(result.classification).toBe("P1_EMERGENCY");
    expect(result.priorityScore).toBeGreaterThanOrEqual(50);
  });

  it("classifies emergency scenario 3 (infant, warm air) as P1", () => {
    const result = triage(SCENARIOS.emergency3_infant.input);
    expect(result.classification).toBe("P1_EMERGENCY");
    expect(result.priorityScore).toBeGreaterThanOrEqual(50);
  });

  it("classifies routine scenario 1 (tune-up) as P3", () => {
    const result = triage(SCENARIOS.routine1_tuneup.input);
    expect(result.classification).toBe("P3_ROUTINE");
    expect(result.priorityScore).toBeLessThan(50);
    expect(result.priorityScore).toBeGreaterThanOrEqual(11);
    expect(result.color).toBe("green");
  });

  it("classifies routine scenario 2 (system quote) as P4", () => {
    const result = triage(SCENARIOS.routine2_quote.input);
    expect(result.classification).toBe("P4_SALES");
    expect(result.priorityScore).toBeLessThan(11);
    expect(result.color).toBe("blue");
  });

  it("all five scenarios score matches expected values (±5 tolerance)", () => {
    for (const [name, scenario] of Object.entries(SCENARIOS)) {
      const result = triage(scenario.input);
      expect(result.priorityScore).toBeGreaterThanOrEqual(scenario.expectedScore - 5);
      expect(result.priorityScore).toBeLessThanOrEqual(scenario.expectedScore + 5);
      expect(result.classification).toBe(scenario.expectedClassification);
    }
  });

  it("scores are clamped to 0–100", () => {
    const maxInput: TriageInput = {
      vulnerableOccupant: 45,
      healthSymptoms: 30,
      systemStatus: 20,
      inventoryImpact: 35,
      timeOfDay: 5,
      serviceHistory: 20,
      weatherContext: 10,
      callerFlexible: false,
    };
    const result = triage(maxInput);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    const zeroInput: TriageInput = {
      vulnerableOccupant: 0,
      healthSymptoms: 0,
      systemStatus: 0,
      inventoryImpact: 0,
      timeOfDay: 0,
      serviceHistory: 0,
      weatherContext: 0,
      callerFlexible: true,
    };
    const zeroResult = triage(zeroInput);
    expect(zeroResult.priorityScore).toBeGreaterThanOrEqual(0);
  });

  it("caller flexibility reduces borderline P3 scores (20–35 range)", () => {
    // Score of 25 is in the 20–35 borderline range
    const flexibleInput: TriageInput = {
      vulnerableOccupant: 5,
      healthSymptoms: 5,
      systemStatus: 5,
      inventoryImpact: 0,
      timeOfDay: 2,
      serviceHistory: 5,
      weatherContext: 3,
      callerFlexible: true,
    };
    const flexible = triage(flexibleInput);

    const inflexibleInput: TriageInput = { ...flexibleInput, callerFlexible: false };
    const inflexible = triage(inflexibleInput);

    // Flexible should score lower (25 - 6 = 19 vs 25)
    expect(flexible.priorityScore).toBeLessThan(inflexible.priorityScore);
    // The reduction should be exactly 6
    expect(inflexible.priorityScore - flexible.priorityScore).toBe(6);
  });

  it("caller flexibility does not affect scores outside the 20–35 range", () => {
    // Score 15 is below the flexibility range
    const lowInput: TriageInput = {
      vulnerableOccupant: 0,
      healthSymptoms: 0,
      systemStatus: 0,
      inventoryImpact: 0,
      timeOfDay: 0,
      serviceHistory: 10,
      weatherContext: 5,
      callerFlexible: true,
    };
    const lowFlex = triage(lowInput);
    const lowNoFlex = triage({ ...lowInput, callerFlexible: false });
    expect(lowFlex.priorityScore).toBe(lowNoFlex.priorityScore);

    // Score 80 is above the flexibility range
    const highInput = SCENARIOS.emergency2_restaurant.input; // score 80
    const highFlex = triage({ ...highInput, callerFlexible: true });
    const highNoFlex = triage(highInput);
    expect(highFlex.priorityScore).toBe(highNoFlex.priorityScore);
  });

  it("returns all factor breakdowns", () => {
    const result = triage(SCENARIOS.emergency1_elderly.input);
    expect(result.factors).toBeDefined();
    expect(result.factors.vulnerableOccupant).toBe(40);
    expect(result.factors.healthSymptoms).toBe(30);
    expect(result.factors.systemStatus).toBe(20);
  });

  it("dispatch targets are set correctly", () => {
    expect(triage(SCENARIOS.emergency1_elderly.input).dispatchTarget).toBe("< 60 minutes");
    expect(triage(SCENARIOS.routine1_tuneup.input).dispatchTarget).toBe("Standard scheduling window");
    expect(triage(SCENARIOS.routine2_quote.input).dispatchTarget).toBe("Comfort Advisor calendar");
  });
});
