// ─── AfterFlow Voice Call Flow Engine ───
// Conversation state machine that drives Twilio voice calls.
//
// States: GREETING → EMERGENCY_CHECK → TRIAGE_QUESTIONS → SAFETY_CHECK → CONFIRMATION → CLOSING
//
// The flow uses Twilio's <Gather>/<Redirect> pattern:
//   Each state returns TwiML with <Gather> pointing back to the voice endpoint
//   with a `state` query param. The handler processes speech/digits and advances.
//
// Emergency path:    GREETING → EMERGENCY_CHECK → TRIAGE_QUESTIONS → SAFETY_CHECK → CONFIRMATION → CLOSING
// Routine path:      GREETING → EMERGENCY_CHECK → TRIAGE_QUESTIONS → CONFIRMATION → CLOSING

export type VoiceState =
  | "GREETING"
  | "EMERGENCY_CHECK"
  | "TRIAGE_QUESTIONS"
  | "SAFETY_CHECK"
  | "CONFIRMATION"
  | "CLOSING";

export type EmergencyType =
  | "none"
  | "general"
  | "gas_smell"
  | "electrical_burning"
  | "heat_exhaustion";

export interface CallContext {
  callSid: string;
  from: string;
  state: VoiceState;
  isEmergency: boolean;
  emergencyType: EmergencyType;
  /** Accumulated speech/digits from the current gather */
  lastInput: string;
  /** Caller info collected during the flow */
  callerInfo: {
    name?: string;
    address?: string;
    phone?: string;
    accessNotes?: string;
  };
  /** Triage-relevant fields collected */
  triageData: {
    symptoms: string;
    occupantType: string;
    systemStatus: string;
    indoorTemp: string;
    hasHealthSymptoms: boolean;
  };
}

/** Create a fresh call context for a new incoming call */
export function createCallContext(callSid: string, from: string): CallContext {
  return {
    callSid,
    from,
    state: "GREETING",
    isEmergency: false,
    emergencyType: "none",
    lastInput: "",
    callerInfo: {},
    triageData: {
      symptoms: "",
      occupantType: "",
      systemStatus: "",
      indoorTemp: "",
      hasHealthSymptoms: false,
    },
  };
}

/** Determine the next state given the current state and user input */
export function getNextState(
  currentState: VoiceState,
  context: CallContext,
): VoiceState {
  const input = context.lastInput.toLowerCase();

  switch (currentState) {
    case "GREETING":
      return "EMERGENCY_CHECK";

    case "EMERGENCY_CHECK": {
      // Classify the response: emergency keywords or routine
      const emergencyKeywords = [
        "emergency", "urgent", "broken", "not working",
        "hot", "sick", "baby", "freezer", "down", "immediately",
        "right now", "tonight", "heat", "smell",
      ];
      context.isEmergency = emergencyKeywords.some((kw) => input.includes(kw));
      return "TRIAGE_QUESTIONS";
    }

    case "TRIAGE_QUESTIONS":
      // After diagnostic questions, branch based on emergency flag
      return context.isEmergency ? "SAFETY_CHECK" : "CONFIRMATION";

    case "SAFETY_CHECK":
      return "CONFIRMATION";

    case "CONFIRMATION":
      return "CLOSING";

    case "CLOSING":
      return "CLOSING"; // Terminal state

    default:
      return "GREETING";
  }
}

/**
 * Generate TwiML for a given state and context.
 * Returns valid Twilio Markup Language (XML string).
 */
export function generateTwiML(
  state: VoiceState,
  context: CallContext,
  baseUrl: string,
): string {
  switch (state) {
    case "GREETING":
      return greetingTwiML(baseUrl);
    case "EMERGENCY_CHECK":
      return emergencyCheckTwiML(baseUrl);
    case "TRIAGE_QUESTIONS":
      return triageQuestionsTwiML(context, baseUrl);
    case "SAFETY_CHECK":
      return safetyCheckTwiML(context, baseUrl);
    case "CONFIRMATION":
      return confirmationTwiML(context, baseUrl);
    case "CLOSING":
      return closingTwiML(context);
    default:
      return greetingTwiML(baseUrl);
  }
}

// ─── Individual State TwiML Generators ───

function greetingTwiML(baseUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling CoolAir HVAC. This is the automated after-hours assistant.</Say>
  <Redirect>${escapeXml(baseUrl)}?state=EMERGENCY_CHECK</Redirect>
</Response>`;
}

function emergencyCheckTwiML(baseUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" speechTimeout="auto" action="${escapeXml(baseUrl)}?state=TRIAGE_QUESTIONS" timeout="5">
    <Say voice="alice">Are you calling about a heating or cooling emergency, or would you like to schedule a routine service appointment?</Say>
  </Gather>
  <Say voice="alice">I didn't catch that. Let me try again.</Say>
  <Redirect>${escapeXml(baseUrl)}?state=EMERGENCY_CHECK</Redirect>
</Response>`;
}

function triageQuestionsTwiML(context: CallContext, baseUrl: string): string {
  const nextState = context.isEmergency ? "SAFETY_CHECK" : "CONFIRMATION";

  if (context.isEmergency) {
    // Emergency triage: ask about system behavior and any hazards
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" speechTimeout="auto" action="${escapeXml(baseUrl)}?state=${nextState}" timeout="5">
    <Say voice="alice">I understand this is an emergency. I have a few quick questions for the technician. Is your system completely silent, or is it making any noise? Do you smell gas, burning, or anything unusual?</Say>
  </Gather>
  <Redirect>${escapeXml(baseUrl)}?state=${nextState}</Redirect>
</Response>`;
  }

  // Routine triage: ask about service needs and timing
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" speechTimeout="auto" action="${escapeXml(baseUrl)}?state=${nextState}" timeout="5">
    <Say voice="alice">Great, I can help schedule that. Can you tell me what type of service you need — a tune-up, a repair, or a system replacement estimate? And do you have any preferred days or times?</Say>
  </Gather>
  <Redirect>${escapeXml(baseUrl)}?state=${nextState}</Redirect>
</Response>`;
}

function safetyCheckTwiML(context: CallContext, baseUrl: string): string {
  const input = context.lastInput.toLowerCase();

  // Detect safety hazards in the user's response
  const hasGasSmell = input.includes("gas") && (input.includes("smell") || input.includes("odor") || input.includes("leak"));
  const hasElectricalBurning = (input.includes("burning") || input.includes("spark")) && (input.includes("electrical") || input.includes("smoke") || input.includes("outlet"));
  const hasHeatExhaustion = input.includes("dizzy") || input.includes("nausea") || input.includes("sick") || input.includes("faint") || input.includes("heat");

  let safetyMessage = "";

  if (hasGasSmell) {
    context.emergencyType = "gas_smell";
    safetyMessage += " I need you to take immediate safety precautions. If you smell gas, turn off the gas supply if you can safely reach the valve, and evacuate the home immediately. Do not use any electrical switches or phones inside. Call 911 once you are outside. ";
  } else if (hasElectricalBurning) {
    context.emergencyType = "electrical_burning";
    safetyMessage += " For your safety, if you smell electrical burning or see sparks, turn off power to the unit at the circuit breaker if you can safely reach it. Do not touch the unit. If you see flames or heavy smoke, evacuate and call 911. ";
  }

  if (hasHeatExhaustion) {
    context.emergencyType = context.emergencyType === "none" ? "heat_exhaustion" : context.emergencyType;
    safetyMessage += " It sounds like someone may be experiencing heat exhaustion. While we dispatch a technician, please move to the coolest room, use fans, and drink cool water in small sips. If symptoms worsen — confusion, throbbing headache, or if the person stops sweating — call 911 immediately. ";
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(safetyMessage || "I'm dispatching a technician now. Let me confirm your details.")}</Say>
  <Redirect>${escapeXml(baseUrl)}?state=CONFIRMATION</Redirect>
</Response>`;
}

function confirmationTwiML(context: CallContext, baseUrl: string): string {
  const isEmergency = context.isEmergency;

  if (isEmergency) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" speechTimeout="auto" action="${escapeXml(baseUrl)}?state=CLOSING" timeout="5">
    <Say voice="alice">I'm confirming your details now. Please say or enter the service address, including street, city and zip code. And your best callback number.</Say>
  </Gather>
  <Redirect>${escapeXml(baseUrl)}?state=CLOSING</Redirect>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" speechTimeout="auto" action="${escapeXml(baseUrl)}?state=CLOSING" timeout="5">
    <Say voice="alice">Let me confirm your details. Please say your service address and a good callback number. We'll send you a confirmation text with all the details.</Say>
  </Gather>
  <Redirect>${escapeXml(baseUrl)}?state=CLOSING</Redirect>
</Response>`;
}

function closingTwiML(context: CallContext): string {
  if (context.isEmergency) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">A technician is being dispatched to your location now. You'll receive a text message with a tracking link so you can see their estimated arrival. If this is a medical emergency, please hang up and dial 9-1-1. Thank you for calling CoolAir HVAC. Help is on the way.</Say>
  <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">You're all set. You'll receive a text confirmation with your appointment details. A technician will call you about 30 minutes before arrival. Thank you for calling CoolAir HVAC. Stay cool!</Say>
  <Hangup/>
</Response>`;
}

// ─── Safety Protocol Detection ───

export interface SafetyFlags {
  gasSmell: boolean;
  electricalBurning: boolean;
  heatExhaustion: boolean;
  /** Safety actions that should be communicated to the caller */
  actions: string[];
}

/**
 * Parse caller's spoken input to detect safety hazards.
 * These override normal triage flow and trigger immediate safety responses.
 */
export function detectSafetyFlags(input: string): SafetyFlags {
  const lower = input.toLowerCase();

  const gasSmell =
    lower.includes("propane") ||
    (lower.includes("gas") &&
      (lower.includes("smell") || lower.includes("odor") || lower.includes("leak")));

  const electricalBurning =
    (lower.includes("burning") || lower.includes("spark") || lower.includes("smoke") || lower.includes("fire")) &&
    (lower.includes("electrical") || lower.includes("outlet") || lower.includes("wire") || lower.includes("breaker") || lower.includes("panel"));

  const heatExhaustion =
    lower.includes("dizzy") || lower.includes("nausea") ||
    lower.includes("sick") || lower.includes("faint") ||
    (lower.includes("heat") && (lower.includes("exhaust") || lower.includes("stroke"))) ||
    lower.includes("confused") || lower.includes("dry mouth");

  const actions: string[] = [];

  if (gasSmell) {
    actions.push("SHUT_OFF_GAS");
    actions.push("EVACUATE");
    actions.push("CALL_911_OUTSIDE");
  }

  if (electricalBurning) {
    actions.push("SHUT_OFF_POWER");
    actions.push("DO_NOT_TOUCH_UNIT");
    if (!gasSmell) actions.push("EVACUATE_IF_FLAMES");
  }

  if (heatExhaustion) {
    actions.push("MOVE_TO_COOLEST_ROOM");
    actions.push("DRINK_COOL_WATER_SIPS");
    actions.push("USE_FANS");
    actions.push("MONITOR_FOR_HEAT_STROKE");
    actions.push("CALL_911_IF_WORSENS");
  }

  return { gasSmell, electricalBurning, heatExhaustion, actions };
}

// ─── Helpers ───

function escapeXml(unsafe: string): string {
  return unsafe.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
