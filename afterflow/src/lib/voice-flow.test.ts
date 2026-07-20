import { describe, it, expect } from "vitest";
import {
  createCallContext,
  getNextState,
  generateTwiML,
  detectSafetyFlags,
  type CallContext,
} from "./voice-flow";

const BASE_URL = "https://example.com/api/twilio/voice";

function makeCtx(overrides?: Partial<CallContext>): CallContext {
  const base = createCallContext("call_test_1", "+16025550143");
  return { ...base, ...overrides };
}

// ─── State machine transitions ───

describe("voice flow state machine", () => {
  it("GREETING always transitions to EMERGENCY_CHECK", () => {
    const ctx = makeCtx({ state: "GREETING" });
    const next = getNextState("GREETING", ctx);
    expect(next).toBe("EMERGENCY_CHECK");
  });

  it("EMERGENCY_CHECK sets isEmergency=true for emergency keywords", () => {
    const ctx = makeCtx({ state: "EMERGENCY_CHECK", lastInput: "it's an emergency, my AC is broken" });
    getNextState("EMERGENCY_CHECK", ctx);
    expect(ctx.isEmergency).toBe(true);
  });

  it("EMERGENCY_CHECK sets isEmergency=true when caller mentions 'baby'", () => {
    const ctx = makeCtx({ state: "EMERGENCY_CHECK", lastInput: "my baby is overheating" });
    getNextState("EMERGENCY_CHECK", ctx);
    expect(ctx.isEmergency).toBe(true);
  });

  it("EMERGENCY_CHECK sets isEmergency=true when caller mentions 'hot'", () => {
    const ctx = makeCtx({ state: "EMERGENCY_CHECK", lastInput: "it's so hot inside" });
    getNextState("EMERGENCY_CHECK", ctx);
    expect(ctx.isEmergency).toBe(true);
  });

  it("EMERGENCY_CHECK sets isEmergency=false for routine requests", () => {
    const ctx = makeCtx({ state: "EMERGENCY_CHECK", lastInput: "I want to schedule a tune-up" });
    getNextState("EMERGENCY_CHECK", ctx);
    expect(ctx.isEmergency).toBe(false);
  });

  it("EMERGENCY_CHECK sets isEmergency=false for quote requests", () => {
    const ctx = makeCtx({ state: "EMERGENCY_CHECK", lastInput: "I'd like a replacement quote" });
    getNextState("EMERGENCY_CHECK", ctx);
    expect(ctx.isEmergency).toBe(false);
  });

  it("TRIAGE_QUESTIONS routes to SAFETY_CHECK for emergencies", () => {
    const ctx = makeCtx({ state: "TRIAGE_QUESTIONS", isEmergency: true });
    const next = getNextState("TRIAGE_QUESTIONS", ctx);
    expect(next).toBe("SAFETY_CHECK");
  });

  it("TRIAGE_QUESTIONS routes to CONFIRMATION for routine calls", () => {
    const ctx = makeCtx({ state: "TRIAGE_QUESTIONS", isEmergency: false });
    const next = getNextState("TRIAGE_QUESTIONS", ctx);
    expect(next).toBe("CONFIRMATION");
  });

  it("SAFETY_CHECK always transitions to CONFIRMATION", () => {
    const ctx = makeCtx({ state: "SAFETY_CHECK" });
    const next = getNextState("SAFETY_CHECK", ctx);
    expect(next).toBe("CONFIRMATION");
  });

  it("CONFIRMATION always transitions to CLOSING", () => {
    const ctx = makeCtx({ state: "CONFIRMATION" });
    const next = getNextState("CONFIRMATION", ctx);
    expect(next).toBe("CLOSING");
  });

  it("CLOSING is terminal (stays at CLOSING)", () => {
    const ctx = makeCtx({ state: "CLOSING" });
    const next = getNextState("CLOSING", ctx);
    expect(next).toBe("CLOSING");
  });
});

// ─── TwiML generation ───

describe("TwiML generation", () => {
  it("GREETING TwiML includes welcome message and redirect", () => {
    const ctx = makeCtx({ state: "GREETING" });
    const twiml = generateTwiML("GREETING", ctx, BASE_URL);
    expect(twiml).toContain("<Response>");
    expect(twiml).toContain("<Say");
    expect(twiml).toContain("Thank you for calling");
    expect(twiml).toContain("<Redirect>");
    expect(twiml).toContain("EMERGENCY_CHECK");
  });

  it("EMERGENCY_CHECK TwiML includes Gather for speech input", () => {
    const ctx = makeCtx({ state: "EMERGENCY_CHECK" });
    const twiml = generateTwiML("EMERGENCY_CHECK", ctx, BASE_URL);
    expect(twiml).toContain("<Gather");
    expect(twiml).toContain('input="speech"');
    expect(twiml).toContain("emergency");
  });

  it("TRIAGE_QUESTIONS for emergency uses emergency diagnostic prompt", () => {
    const ctx = makeCtx({ state: "TRIAGE_QUESTIONS", isEmergency: true });
    const twiml = generateTwiML("TRIAGE_QUESTIONS", ctx, BASE_URL);
    expect(twiml).toContain("emergency");
    expect(twiml).toContain("SAFETY_CHECK");
  });

  it("TRIAGE_QUESTIONS for routine uses scheduling prompt", () => {
    const ctx = makeCtx({ state: "TRIAGE_QUESTIONS", isEmergency: false });
    const twiml = generateTwiML("TRIAGE_QUESTIONS", ctx, BASE_URL);
    expect(twiml).toContain("schedule");
    expect(twiml).toContain("CONFIRMATION");
  });

  it("CLOSING for emergency includes dispatch message and Hangup", () => {
    const ctx = makeCtx({ state: "CLOSING", isEmergency: true });
    const twiml = generateTwiML("CLOSING", ctx, BASE_URL);
    expect(twiml).toContain("dispatched");
    expect(twiml).toContain("tracking link");
    expect(twiml).toContain("<Hangup/>");
  });

  it("CLOSING for routine includes appointment confirmation and Hangup", () => {
    const ctx = makeCtx({ state: "CLOSING", isEmergency: false });
    const twiml = generateTwiML("CLOSING", ctx, BASE_URL);
    expect(twiml).toContain("confirmation");
    expect(twiml).toContain("<Hangup/>");
  });

  it("all TwiML responses are valid XML", () => {
    const states = ["GREETING", "EMERGENCY_CHECK", "TRIAGE_QUESTIONS", "SAFETY_CHECK", "CONFIRMATION", "CLOSING"] as const;
    for (const state of states) {
      const ctx = makeCtx({ state, isEmergency: state !== "GREETING" });
      const twiml = generateTwiML(state, ctx, BASE_URL);

      // Basic XML validity: starts with declaration or Response, has closing tag
      expect(twiml).toContain("<?xml");
      expect(twiml).toContain("<Response>");
      expect(twiml).toContain("</Response>");
    }
  });

  it("XML special characters are escaped in URLs", () => {
    const ctx = makeCtx({ state: "GREETING" });
    const twiml = generateTwiML("GREETING", ctx, "https://example.com/api?foo=bar&baz=qux");
    // & should be escaped to &amp; in XML
    expect(twiml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
  });
});

// ─── Safety detection ───

describe("safety flag detection", () => {
  it("detects gas smell and triggers SHUT_OFF_GAS + EVACUATE", () => {
    const flags = detectSafetyFlags("I smell gas near the furnace");
    expect(flags.gasSmell).toBe(true);
    expect(flags.actions).toContain("SHUT_OFF_GAS");
    expect(flags.actions).toContain("EVACUATE");
    expect(flags.actions).toContain("CALL_911_OUTSIDE");
  });

  it("detects gas odor", () => {
    const flags = detectSafetyFlags("there's a strong gas odor in the kitchen");
    expect(flags.gasSmell).toBe(true);
  });

  it("detects gas leak", () => {
    const flags = detectSafetyFlags("I think there's a gas leak from the water heater");
    expect(flags.gasSmell).toBe(true);
  });

  it("detects propane smell", () => {
    const flags = detectSafetyFlags("smells like propane");
    expect(flags.gasSmell).toBe(true);
  });

  it("detects electrical burning and triggers SHUT_OFF_POWER", () => {
    const flags = detectSafetyFlags("I smell electrical burning from the AC unit, and there's smoke");
    expect(flags.electricalBurning).toBe(true);
    expect(flags.actions).toContain("SHUT_OFF_POWER");
    expect(flags.actions).toContain("DO_NOT_TOUCH_UNIT");
  });

  it("detects sparks from electrical panel", () => {
    const flags = detectSafetyFlags("there are sparks coming from the breaker panel");
    expect(flags.electricalBurning).toBe(true);
  });

  it("detects heat exhaustion symptoms", () => {
    const flags = detectSafetyFlags("I feel dizzy and nauseous, my mouth is very dry");
    expect(flags.heatExhaustion).toBe(true);
    expect(flags.actions).toContain("MOVE_TO_COOLEST_ROOM");
    expect(flags.actions).toContain("DRINK_COOL_WATER_SIPS");
  });

  it("detects heat stroke warning signs", () => {
    const flags = detectSafetyFlags("my husband is confused and has heat stroke symptoms");
    expect(flags.heatExhaustion).toBe(true);
    expect(flags.actions).toContain("CALL_911_IF_WORSENS");
  });

  it("does not trigger false positives for normal conversation", () => {
    const flags = detectSafetyFlags("my AC is blowing warm air and I want to schedule a tune-up");
    expect(flags.gasSmell).toBe(false);
    expect(flags.electricalBurning).toBe(false);
    expect(flags.heatExhaustion).toBe(false);
    expect(flags.actions).toHaveLength(0);
  });

  it("detects multiple hazards simultaneously (gas + heat exhaustion)", () => {
    const flags = detectSafetyFlags("I smell gas and I feel dizzy and nauseous");
    expect(flags.gasSmell).toBe(true);
    expect(flags.heatExhaustion).toBe(true);
    // Should include actions from both
    expect(flags.actions).toContain("SHUT_OFF_GAS");
    expect(flags.actions).toContain("DRINK_COOL_WATER_SIPS");
  });
});

// ─── Call context creation ───

describe("createCallContext", () => {
  it("initializes with GREETING state and empty triage data", () => {
    const ctx = createCallContext("sid_123", "+15551234567");
    expect(ctx.callSid).toBe("sid_123");
    expect(ctx.from).toBe("+15551234567");
    expect(ctx.state).toBe("GREETING");
    expect(ctx.isEmergency).toBe(false);
    expect(ctx.emergencyType).toBe("none");
    expect(ctx.triageData.symptoms).toBe("");
  });
});

// ─── Safety screen routing ───

describe("emergency vs routine branching", () => {
  it("emergency calls get the SAFETY_CHECK screen", () => {
    const ctx = makeCtx({ state: "EMERGENCY_CHECK", lastInput: "emergency, my AC is completely dead and it's 95 inside" });
    getNextState("EMERGENCY_CHECK", ctx); // sets isEmergency=true, advances to TRIAGE_QUESTIONS
    ctx.state = "TRIAGE_QUESTIONS";
    const next = getNextState("TRIAGE_QUESTIONS", ctx);
    expect(next).toBe("SAFETY_CHECK");
  });

  it("routine calls skip the SAFETY_CHECK screen", () => {
    const ctx = makeCtx({ state: "EMERGENCY_CHECK", lastInput: "schedule a maintenance tune-up" });
    getNextState("EMERGENCY_CHECK", ctx); // sets isEmergency=false, advances to TRIAGE_QUESTIONS
    ctx.state = "TRIAGE_QUESTIONS";
    const next = getNextState("TRIAGE_QUESTIONS", ctx);
    expect(next).toBe("CONFIRMATION");
  });
});
