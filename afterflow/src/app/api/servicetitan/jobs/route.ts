import { NextRequest, NextResponse } from "next/server";
import { createServiceTitanClient } from "@/lib/servicetitan";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const client = createServiceTitanClient();

  // Mock: always create a job successfully
  const result = await client.bookJob({
    customerName: body.customerName ?? "Unknown Caller",
    customerType: body.customerType ?? "Residential",
    phone: body.phone ?? "+16025550143",
    address: {
      street: body.address?.street ?? "123 Main St",
      city: body.address?.city ?? "Phoenix",
      state: body.address?.state ?? "AZ",
      zip: body.address?.zip ?? "85001",
    },
    jobTypeId: body.jobTypeId ?? 1,
    businessUnitId: body.businessUnitId ?? 1,
    priority: body.priority ?? "Normal",
    summary: body.summary ?? "AC Service Call",
    description: body.description ?? "Call booked via AfterFlow AI dispatcher",
  });

  return NextResponse.json({
    success: true,
    jobId: result.job.id,
    appointmentId: result.appointment.id,
    steps: result.steps,
    status: "Scheduled",
  });
}
