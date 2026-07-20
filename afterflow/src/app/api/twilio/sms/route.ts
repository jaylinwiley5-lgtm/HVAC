import { NextRequest, NextResponse } from "next/server";
import type { TriageClassification, TriageResult } from "@/lib/triage";
import {
  emergencyDispatched,
  appointmentConfirmed,
  consultationScheduled,
  followUpNurture,
  postServiceSurvey,
  type EmergencyDispatchData,
  type AppointmentConfirmData,
  type ConsultationData,
  type FollowUpNurtureData,
  type PostServiceSurveyData,
} from "@/lib/sms-templates";
import {
  sendImmediate,
  scheduleNurtureSequence,
  getAllMessages,
  getMessagesByCallSid,
} from "@/lib/sms-scheduler";

// ─── Request Type ───

interface SmsDispatchRequest {
  callSid: string;
  phoneNumber: string;
  triageResult: TriageResult;
  /** Optional metadata for SMS personalization */
  metadata?: {
    customerName?: string;
    address?: string;
    trackingUrl?: string;
    eta?: string;
    technicianName?: string;
    technicianBio?: string;
    occupantType?: string;
    serviceType?: string;
    dateTime?: string;
    timeWindow?: string;
    price?: string;
    serviceIncludes?: string[];
    advisorName?: string;
    advisorBio?: string;
    duration?: string;
    surveyUrl?: string;
    topics?: string[];
    promoCode?: string;
    jobDescription?: string;
    /** Whether the job was successfully booked */
    booked?: boolean;
  };
}

interface SmsDispatchResponse {
  smsId: string;
  callSid: string;
  phoneNumber: string;
  content: string;
  type: string;
  status: string;
  scheduledNurture?: boolean;
  nurtureIds?: string[];
}

// ─── Dispatch Logic ───

function buildEmergencySms(
  callSid: string,
  phoneNumber: string,
  metadata: SmsDispatchRequest["metadata"],
): SmsDispatchResponse {
  const data: EmergencyDispatchData = {
    customerName: metadata?.customerName ?? "Customer",
    address: metadata?.address ?? "your location",
    trackingUrl: metadata?.trackingUrl ?? "https://coolair.co/track/placeholder",
    eta: metadata?.eta ?? "45–60 minutes",
    technicianName: metadata?.technicianName ?? "Technician",
    technicianBio: metadata?.technicianBio ?? "HVAC specialist",
    occupantType: metadata?.occupantType,
    accessNotes: undefined,
  };

  const content = emergencyDispatched(data);
  const record = sendImmediate(callSid, phoneNumber, "emergency", content);

  return {
    smsId: record.id,
    callSid,
    phoneNumber,
    content,
    type: "emergency",
    status: record.status,
  };
}

function buildConfirmationSms(
  callSid: string,
  phoneNumber: string,
  metadata: SmsDispatchRequest["metadata"],
): SmsDispatchResponse {
  const data: AppointmentConfirmData = {
    customerName: metadata?.customerName ?? "Customer",
    serviceType: metadata?.serviceType ?? "HVAC service",
    dateTime: metadata?.dateTime ?? "upcoming appointment",
    timeWindow: metadata?.timeWindow ?? "scheduled window",
    address: metadata?.address ?? "your location",
    price: metadata?.price,
    serviceIncludes: metadata?.serviceIncludes ?? [],
  };

  const content = appointmentConfirmed(data);
  const record = sendImmediate(callSid, phoneNumber, "confirmation", content);

  return {
    smsId: record.id,
    callSid,
    phoneNumber,
    content,
    type: "confirmation",
    status: record.status,
  };
}

function buildConsultationSms(
  callSid: string,
  phoneNumber: string,
  metadata: SmsDispatchRequest["metadata"],
): SmsDispatchResponse {
  const data: ConsultationData = {
    customerName: metadata?.customerName ?? "Customer",
    advisorName: metadata?.advisorName ?? "your Comfort Advisor",
    advisorBio: metadata?.advisorBio ?? "HVAC design specialist",
    dateTime: metadata?.dateTime ?? "upcoming consultation",
    duration: metadata?.duration ?? "60–90 min",
    address: metadata?.address ?? "your location",
    surveyUrl: metadata?.surveyUrl,
    topics: metadata?.topics ?? ["Professional load calculation", "Equipment options & tax credits"],
  };

  const content = consultationScheduled(data);
  const record = sendImmediate(callSid, phoneNumber, "consultation", content);

  return {
    smsId: record.id,
    callSid,
    phoneNumber,
    content,
    type: "consultation",
    status: record.status,
  };
}

function buildNurtureSequence(
  callSid: string,
  phoneNumber: string,
  metadata: SmsDispatchRequest["metadata"],
): SmsResponse {
  const name = metadata?.customerName ?? "Customer";
  const promo = metadata?.promoCode ?? "AFTERFLOW25";

  const nurtureData: FollowUpNurtureData = {
    customerName: name,
    phoneNumber,
    promoCode: promo,
  };

  const day1Content = followUpNurture(nurtureData, 1);
  const day3Content = followUpNurture(nurtureData, 3);
  const day7Content = followUpNurture(nurtureData, 7);

  const records = scheduleNurtureSequence(
    callSid,
    phoneNumber,
    day1Content,
    day3Content,
    day7Content,
  );

  // Return the day 1 content as the "immediate" response
  return {
    smsId: records[0].id,
    callSid,
    phoneNumber,
    content: day1Content,
    type: "nurture",
    status: "scheduled",
    scheduledNurture: true,
    nurtureIds: records.map((r) => r.id),
  };
}

interface SmsResponse {
  smsId: string;
  callSid: string;
  phoneNumber: string;
  content: string;
  type: string;
  status: string;
  scheduledNurture?: boolean;
  nurtureIds?: string[];
}

// ─── Route Handler ───

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: SmsDispatchRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { callSid, phoneNumber, triageResult, metadata } = body;

  if (!callSid || !phoneNumber || !triageResult) {
    return NextResponse.json(
      { error: "Missing required fields: callSid, phoneNumber, triageResult" },
      { status: 400 },
    );
  }

  const classification: TriageClassification = triageResult.classification;
  const booked = metadata?.booked ?? true;
  let response: SmsResponse;

  switch (classification) {
    case "P1_EMERGENCY": {
      if (!booked) {
        // Emergency wasn't booked (caller hung up, no availability)
        // Send emergency text AND auto-schedule 7-day nurture
        const emergencyResp = buildEmergencySms(callSid, phoneNumber, metadata);
        const nurtureResp = buildNurtureSequence(callSid, phoneNumber, metadata);
        response = {
          ...emergencyResp,
          scheduledNurture: true,
          nurtureIds: nurtureResp.nurtureIds,
        };
      } else {
        response = buildEmergencySms(callSid, phoneNumber, metadata);
      }
      break;
    }
    case "P3_ROUTINE": {
      response = buildConfirmationSms(callSid, phoneNumber, metadata);
      break;
    }
    case "P4_SALES": {
      response = buildConsultationSms(callSid, phoneNumber, metadata);
      break;
    }
    default: {
      return NextResponse.json(
        { error: `Unknown classification: ${triageResult.classification}` },
        { status: 400 },
      );
    }
  }

  return NextResponse.json(response);
}

/**
 * GET: Return all SMS messages (for the /sms page and debugging).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const callSid = searchParams.get("callSid");

  if (callSid) {
    return NextResponse.json({ messages: getMessagesByCallSid(callSid) });
  }

  return NextResponse.json({ messages: getAllMessages() });
}
