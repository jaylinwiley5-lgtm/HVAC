import { describe, it, expect } from "vitest";
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
} from "./sms-templates";

// ─── emergencyDispatched ───

describe("emergencyDispatched", () => {
  const baseData: EmergencyDispatchData = {
    customerName: "Margaret",
    address: "2841 W Rose Garden Ln, Phoenix, AZ 85027",
    trackingUrl: "https://coolair.co/t/MK782",
    eta: "10:25 PM – 10:40 PM",
    technicianName: "Carlos R.",
    technicianBio: "10 yrs exp, AC specialist",
  };

  it("produces an emergency SMS with tracking link and ETA", () => {
    const sms = emergencyDispatched(baseData);
    expect(sms).toContain("🚨 EMERGENCY CONFIRMED");
    expect(sms).toContain("Margaret");
    expect(sms).toContain("2841 W Rose Garden Ln, Phoenix, AZ 85027");
    expect(sms).toContain("https://coolair.co/t/MK782");
    expect(sms).toContain("10:25 PM – 10:40 PM");
    expect(sms).toContain("Carlos R.");
    expect(sms).toContain("10 yrs exp, AC specialist");
  });

  it("includes generic safety tips", () => {
    const sms = emergencyDispatched(baseData);
    expect(sms).toContain("Stay in the coolest room");
    expect(sms).toContain("Drink cool water (small sips)");
    expect(sms).toContain("Have someone stay with you if possible");
  });

  it("includes safety-critical 911 instructions", () => {
    const sms = emergencyDispatched(baseData);
    expect(sms).toContain("If symptoms worsen");
    expect(sms).toContain("call 911");
  });

  it("includes opt-out instructions", () => {
    const sms = emergencyDispatched(baseData);
    expect(sms).toContain("Reply HELP");
    expect(sms).toContain("STOP to opt out");
  });

  it("includes infant-specific safety tips when occupantType is 'infant'", () => {
    const sms = emergencyDispatched({
      ...baseData,
      customerName: "James",
      occupantType: "infant",
    });
    expect(sms).toContain("🍼 For baby:");
    expect(sms).toContain("Keep in the coolest room with a fan");
    expect(sms).toContain("Offer bottle frequently");
    expect(sms).toContain("Dress in light cotton (onesie only)");
    expect(sms).toContain("Cool (not cold) damp cloth on forehead OK");
  });

  it("includes elderly-specific safety tips when occupantType is 'elderly'", () => {
    const sms = emergencyDispatched({
      ...baseData,
      occupantType: "elderly",
    });
    expect(sms).toContain("👴 For your safety:");
    expect(sms).toContain("Sit down — avoid standing/walking");
    expect(sms).toContain("Have a neighbor stay with you");
  });

  it("includes commercial-specific tips when occupantType is 'commercial'", () => {
    const sms = emergencyDispatched({
      ...baseData,
      customerName: "Diego",
      occupantType: "commercial",
    });
    expect(sms).toContain("⚠️ IMPORTANT:");
    expect(sms).toContain("Keep freezer door CLOSED");
    expect(sms).toContain("Do not attempt to restart the unit");
  });

  it("includes access notes when provided", () => {
    const sms = emergencyDispatched({
      ...baseData,
      accessNotes: "Tan house with red door",
    });
    expect(sms).toContain("🔑 Access note: Tan house with red door");
  });
});

// ─── appointmentConfirmed ───

describe("appointmentConfirmed", () => {
  const baseData: AppointmentConfirmData = {
    customerName: "Robert",
    serviceType: "AC Seasonal Tune-Up",
    dateTime: "Thursday, July 23",
    timeWindow: "1:00 PM to 3:00 PM",
    address: "7238 S 19th Ave, Phoenix, AZ 85041",
    price: "$129 summer special",
    serviceIncludes: [
      "Coil cleaning (condenser + evaporator)",
      "Refrigerant level check",
      "Capacitor & contactor testing",
      "Ductwork inspection",
      "Air filter replacement",
    ],
  };

  it("produces a confirmation SMS with all service details", () => {
    const sms = appointmentConfirmed(baseData);
    expect(sms).toContain("✅ APPOINTMENT CONFIRMED");
    expect(sms).toContain("Robert");
    expect(sms).toContain("AC Seasonal Tune-Up");
    expect(sms).toContain("$129 summer special");
    expect(sms).toContain("Thursday, July 23");
    expect(sms).toContain("1:00 PM to 3:00 PM");
    expect(sms).toContain("7238 S 19th Ave, Phoenix, AZ 85041");
  });

  it("lists all service includes", () => {
    const sms = appointmentConfirmed(baseData);
    expect(sms).toContain("Coil cleaning");
    expect(sms).toContain("Refrigerant level check");
    expect(sms).toContain("Capacitor & contactor testing");
  });

  it("includes reschedule instruction", () => {
    const sms = appointmentConfirmed(baseData);
    expect(sms).toContain("Need to reschedule? Reply CHANGE.");
  });

  it("includes Comfort Club upsell", () => {
    const sms = appointmentConfirmed(baseData);
    expect(sms).toContain("Comfort Club");
    expect(sms).toContain("Reply INFO for details");
  });

  it("works without price", () => {
    const sms = appointmentConfirmed({ ...baseData, price: undefined });
    expect(sms).not.toContain("$129");
    expect(sms).toContain("AC Seasonal Tune-Up");
  });

  it("works with empty serviceIncludes", () => {
    const sms = appointmentConfirmed({ ...baseData, serviceIncludes: [] });
    expect(sms).not.toContain("🔧 Service includes:");
  });
});

// ─── consultationScheduled ───

describe("consultationScheduled", () => {
  const baseData: ConsultationData = {
    customerName: "Sarah",
    advisorName: "Michael T.",
    advisorBio: "15 yrs HVAC design experience",
    dateTime: "Wednesday, July 29 — 9:00 AM",
    duration: "60–90 min",
    address: "1318 E Pierson St, Phoenix, AZ 85014",
    surveyUrl: "https://coolair.co/survey/SOK1318",
    topics: [
      "Professional load calculation (Manual J)",
      "AC-only vs. heat pump options & tax credits",
      "Ductwork assessment & electrical review",
      "0% financing options available",
    ],
  };

  it("produces a consultation SMS with advisor details", () => {
    const sms = consultationScheduled(baseData);
    expect(sms).toContain("✅ CONSULTATION CONFIRMED");
    expect(sms).toContain("Sarah");
    expect(sms).toContain("Michael T.");
    expect(sms).toContain("15 yrs HVAC design experience");
    expect(sms).toContain("Wednesday, July 29 — 9:00 AM");
    expect(sms).toContain("60–90 min");
    expect(sms).toContain("1318 E Pierson St, Phoenix, AZ 85014");
  });

  it("includes survey link", () => {
    const sms = consultationScheduled(baseData);
    expect(sms).toContain("https://coolair.co/survey/SOK1318");
    expect(sms).toContain("Before your appointment");
  });

  it("lists all topics", () => {
    const sms = consultationScheduled(baseData);
    expect(sms).toContain("Professional load calculation (Manual J)");
    expect(sms).toContain("heat pump options & tax credits");
    expect(sms).toContain("0% financing options available");
  });

  it("includes federal tax credit mention", () => {
    const sms = consultationScheduled(baseData);
    expect(sms).toContain("Federal tax credits up to $2,000");
  });

  it("includes personal congratulations", () => {
    const sms = consultationScheduled(baseData);
    expect(sms).toContain("Congrats on the new home, Sarah!");
  });

  it("works without survey URL", () => {
    const sms = consultationScheduled({ ...baseData, surveyUrl: undefined });
    expect(sms).not.toContain("Before your appointment");
  });
});

// ─── followUpNurture ───

describe("followUpNurture", () => {
  const baseData: FollowUpNurtureData = {
    customerName: "Pat",
    phoneNumber: "602-555-0100",
    promoCode: "AFTERFLOW25",
  };

  it("day 1 message says sorry we missed you", () => {
    const sms = followUpNurture(baseData, 1);
    expect(sms).toContain("Pat");
    expect(sms).toContain("missed your call");
    expect(sms).toContain("sorry");
    expect(sms).toContain("602-555-0100");
    expect(sms).toContain("Stay cool");
  });

  it("day 3 message asks if still need help", () => {
    const sms = followUpNurture(baseData, 3);
    expect(sms).toContain("Pat");
    expect(sms).toContain("still experiencing");
    expect(sms).toContain("Phoenix heat");
  });

  it("day 7 message offers promo code", () => {
    const sms = followUpNurture(baseData, 7);
    expect(sms).toContain("Pat");
    expect(sms).toContain("$25 credit");
    expect(sms).toContain("AFTERFLOW25");
    expect(sms).toContain("last time");
  });

  it("uses default promo code when not provided", () => {
    const sms = followUpNurture({ ...baseData, promoCode: undefined }, 7);
    expect(sms).toContain("AFTERFLOW25");
  });
});

// ─── postServiceSurvey ───

describe("postServiceSurvey", () => {
  const baseData: PostServiceSurveyData = {
    customerName: "Margaret",
    jobDescription: "AC emergency repair",
    surveyUrl: "https://coolair.co/survey/MK782",
  };

  it("produces a survey request SMS", () => {
    const sms = postServiceSurvey(baseData);
    expect(sms).toContain("Margaret");
    expect(sms).toContain("AC emergency repair");
    expect(sms).toContain("https://coolair.co/survey/MK782");
    expect(sms).toContain("feedback");
    expect(sms).toContain("Google review");
  });

  it("includes opt-out for survey messages", () => {
    const sms = postServiceSurvey(baseData);
    expect(sms).toContain("STOP to opt out");
  });
});

// ─── Cross-template: safety-critical content checks ───

describe("safety-critical content", () => {
  it("all emergency templates for vulnerable occupants include 911 instructions", () => {
    const elderly = emergencyDispatched({
      customerName: "Margaret",
      address: "123 Main St",
      trackingUrl: "https://track.co/1",
      eta: "30 min",
      technicianName: "Tech",
      technicianBio: "exp",
      occupantType: "elderly",
    });
    expect(elderly).toContain("call 911");

    const infant = emergencyDispatched({
      customerName: "James",
      address: "456 Oak Ave",
      trackingUrl: "https://track.co/2",
      eta: "40 min",
      technicianName: "Tech",
      technicianBio: "exp",
      occupantType: "infant",
    });
    expect(infant).toContain("call 911");
  });
});
