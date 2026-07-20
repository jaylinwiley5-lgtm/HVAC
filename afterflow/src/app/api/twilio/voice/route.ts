import { NextRequest, NextResponse } from "next/server";
import {
  createCallContext,
  getNextState,
  generateTwiML,
  detectSafetyFlags,
  type VoiceState,
  type CallContext,
} from "@/lib/voice-flow";

// ─── In-memory call state store (keyed by CallSid) ───
const callStates = new Map<string, CallContext>();

/**
 * Extract state from query params (Twilio <Redirect> pattern).
 * Valid states only — anything else maps to GREETING.
 */
function parseState(param: string | null): VoiceState {
  const validStates: VoiceState[] = [
    "GREETING",
    "EMERGENCY_CHECK",
    "TRIAGE_QUESTIONS",
    "SAFETY_CHECK",
    "CONFIRMATION",
    "CLOSING",
  ];
  if (param && validStates.includes(param as VoiceState)) {
    return param as VoiceState;
  }
  return "GREETING";
}

/**
 * POST /api/twilio/voice
 *
 * Handles both the initial Twilio webhook (no state param) and
 * subsequent <Gather>/<Redirect> callbacks (with ?state= param).
 *
 * Twilio sends form-encoded data: CallSid, From, CallStatus, and
 * either SpeechResult (for speech) or Digits (for keypad input).
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const stateParam = url.searchParams.get("state");

  // Parse Twilio webhook form data
  let callSid: string;
  let from: string;
  let userInput: string;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    callSid = formData.get("CallSid")?.toString() ?? `call_${Date.now()}`;
    from = formData.get("From")?.toString() ?? "unknown";
    userInput = formData.get("SpeechResult")?.toString()
      ?? formData.get("Digits")?.toString()
      ?? "";
  } else {
    // Fallback for JSON (useful for testing)
    const body = await request.json().catch(() => ({}));
    callSid = body.CallSid ?? `call_${Date.now()}`;
    from = body.From ?? "unknown";
    userInput = body.SpeechResult ?? body.Digits ?? "";
  }

  // Determine the target state
  const targetState = parseState(stateParam);

  // Get or create call context
  let context = callStates.get(callSid);
  if (!context) {
    context = createCallContext(callSid, from);
    callStates.set(callSid, context);
  }

  // Update context with user input
  if (userInput) {
    context.lastInput = userInput;
  }

  // If this is a state transition (not initial call), advance the state machine
  if (targetState !== context.state || stateParam !== null) {
    // Transition to target state
    context.state = targetState;

    // If we're at a gateway state (has Gather), process input and determine next
    if (userInput || targetState === "GREETING") {
      const nextState = getNextState(targetState, context);
      context.state = nextState;

      // For TRIAGE_QUESTIONS → SAFETY_CHECK, detect safety flags from input
      if (nextState === "SAFETY_CHECK" && userInput) {
        const safetyFlags = detectSafetyFlags(userInput);
        if (safetyFlags.gasSmell) context.emergencyType = "gas_smell";
        else if (safetyFlags.electricalBurning) context.emergencyType = "electrical_burning";
        else if (safetyFlags.heatExhaustion) context.emergencyType = "heat_exhaustion";
      }
    }
  }

  // Build base URL for Redirect targets
  const baseUrl = `${url.origin}/api/twilio/voice`;

  // Generate TwiML for current state
  const twiml = generateTwiML(context.state, context, baseUrl);

  // Clean up terminal states to prevent memory leak
  if (context.state === "CLOSING") {
    callStates.delete(callSid);
  }

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

/**
 * GET /api/twilio/voice — also works for <Redirect> GET requests.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
