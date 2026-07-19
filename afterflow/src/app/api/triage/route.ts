import { NextRequest, NextResponse } from "next/server";
import { triage, TriageInput } from "@/lib/triage";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const input: TriageInput = {
    vulnerableOccupant: body.vulnerableOccupant ?? 0,
    healthSymptoms: body.healthSymptoms ?? 0,
    systemStatus: body.systemStatus ?? 0,
    inventoryImpact: body.inventoryImpact ?? 0,
    timeOfDay: body.timeOfDay ?? 0,
    serviceHistory: body.serviceHistory ?? 0,
    weatherContext: body.weatherContext ?? 0,
    callerFlexible: body.callerFlexible ?? false,
  };

  const result = triage(input);

  return NextResponse.json({
    priorityScore: result.priorityScore,
    classification: result.classification,
    label: result.label,
    dispatchTarget: result.dispatchTarget,
    color: result.color,
    factors: result.factors,
  });
}
