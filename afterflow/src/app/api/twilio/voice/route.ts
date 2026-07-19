import { NextRequest, NextResponse } from "next/server";
import { createTwilioClient } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  // Parse incoming Twilio webhook (form-encoded)
  const formData = await request.formData();
  const callSid = formData.get("CallSid")?.toString() ?? "unknown";
  const from = formData.get("From")?.toString() ?? "unknown";
  const to = formData.get("To")?.toString() ?? "unknown";

  const client = createTwilioClient();
  const twiml = client.generateVoiceTwiML({
    callSid,
    from,
    to,
    direction: "inbound",
    status: "in-progress",
  });

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
