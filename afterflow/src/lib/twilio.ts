// ─── Twilio Client Stub ───
// Mock Twilio client for voice and SMS. Replace with twilio SDK in production.

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface CallData {
  callSid: string;
  from: string;
  to: string;
  direction: "inbound" | "outbound";
  status: string;
  transcription?: string;
}

export interface SmsData {
  messageSid: string;
  from: string;
  to: string;
  body: string;
}

/**
 * Mock Twilio client. All methods return realistic stub responses.
 */
export class TwilioClient {
  private config: TwilioConfig;

  constructor(config: TwilioConfig) {
    this.config = config;
  }

  /** Generate TwiML for an incoming voice call */
  generateVoiceTwiML(callData: CallData): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling AfterFlow HVAC. This is the automated scheduling assistant.</Say>
  <Gather input="speech" action="/api/twilio/voice/respond" timeout="5">
    <Say>Are you calling about a heating or cooling emergency, or would you like to schedule a service appointment?</Say>
  </Gather>
  <Say>I didn't catch that. Please stay on the line and a dispatcher will be with you shortly.</Say>
</Response>`;
  }

  /** Handle SMS inbound message */
  async handleInboundSms(smsData: SmsData): Promise<{ response: string }> {
    return {
      response: `Thanks for your message. We received: "${smsData.body}". A team member will respond shortly. For emergencies, please call ${this.config.fromNumber}.`,
    };
  }

  /** Send an outbound SMS (e.g., dispatch confirmation) */
  async sendSms(to: string, body: string): Promise<{ sid: string; status: string }> {
    return {
      sid: `SM${Date.now().toString(36).toUpperCase()}`,
      status: "queued",
    };
  }

  /** Look up call by SID */
  async getCall(callSid: string): Promise<CallData> {
    return {
      callSid,
      from: "+16025550143",
      to: this.config.fromNumber,
      direction: "inbound",
      status: "completed",
    };
  }
}

export function createTwilioClient(config?: Partial<TwilioConfig>): TwilioClient {
  return new TwilioClient({
    accountSid: config?.accountSid ?? "mock-account-sid",
    authToken: config?.authToken ?? "mock-auth-token",
    fromNumber: config?.fromNumber ?? "+16025550100",
  });
}
