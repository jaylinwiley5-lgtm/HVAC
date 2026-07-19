import { NextRequest, NextResponse } from "next/server";
import { createTwilioClient } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body = formData.get("Body")?.toString() ?? "";

  const client = createTwilioClient();
  const result = await client.handleInboundSms({
    messageSid: `SM${Date.now()}`,
    from: formData.get("From")?.toString() ?? "unknown",
    to: "+16025550100",
    body,
  });

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${result.response}</Message>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
