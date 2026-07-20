// ─── AfterFlow SMS Template Library ───
// Typed template functions generating SMS messages based on triage classification.
// Content and tone match the research doc scenarios: elderly, restaurant, infant,
// routine tune-up, and system replacement consultation.

export type SmsType = "emergency" | "confirmation" | "consultation" | "nurture" | "survey";

// ─── Data Interfaces ───

export interface EmergencyDispatchData {
  customerName: string;
  address: string;
  trackingUrl: string;
  eta: string;
  technicianName: string;
  technicianBio: string;
  /** e.g. "elderly", "infant", "commercial", undefined */
  occupantType?: string;
  /** Extra safety guidance specific to the occupant */
  occupantSafetyTips?: string[];
  /** Any access notes (gate code, red door, etc.) */
  accessNotes?: string;
}

export interface AppointmentConfirmData {
  customerName: string;
  serviceType: string;
  dateTime: string;
  timeWindow: string;
  address: string;
  price?: string;
  serviceIncludes: string[];
}

export interface ConsultationData {
  customerName: string;
  advisorName: string;
  advisorBio: string;
  dateTime: string;
  duration: string;
  address: string;
  surveyUrl?: string;
  topics: string[];
}

export interface FollowUpNurtureData {
  customerName: string;
  /** Phone number they called from */
  phoneNumber: string;
  promoCode?: string;
}

export interface PostServiceSurveyData {
  customerName: string;
  jobDescription: string;
  surveyUrl: string;
}

// ─── Template Functions ───

/**
 * emergencyDispatched – "Technician on the way" SMS with tracking link,
 * ETA, tech name, and safety tips.  Mirrors the Margaret/Diego/James examples.
 */
export function emergencyDispatched(data: EmergencyDispatchData): string {
  const lines: string[] = [];

  lines.push("🚨 EMERGENCY CONFIRMED");
  lines.push("");
  lines.push(
    `Hi ${data.customerName}, a technician is on the way to:`,
  );
  lines.push(data.address);
  lines.push("");
  lines.push(`📍 Track your tech: ${data.trackingUrl}`);
  lines.push(`⏱ Estimated arrival: ${data.eta}`);
  lines.push("");
  lines.push(`Technician: ${data.technicianName} (${data.technicianBio})`);
  lines.push("");
  lines.push("💡 While you wait:");

  // Generic safety tips
  lines.push(" • Stay in the coolest room");
  lines.push(" • Drink cool water (small sips)");
  lines.push(" • Have someone stay with you if possible");

  // Occupant-specific safety tips (from research doc)
  if (data.occupantType === "infant") {
    lines.push("");
    lines.push("🍼 For baby:");
    lines.push(" • Keep in the coolest room with a fan");
    lines.push(" • Offer bottle frequently");
    lines.push(" • Dress in light cotton (onesie only)");
    lines.push(" • Cool (not cold) damp cloth on forehead OK");
  }

  if (data.occupantType === "elderly") {
    lines.push("");
    lines.push("👴 For your safety:");
    lines.push(" • Sit down — avoid standing/walking");
    lines.push(" • Have a neighbor stay with you");
    lines.push(" • Take small sips of cool water");
  }

  if (data.occupantType === "commercial") {
    lines.push("");
    lines.push("⚠️ IMPORTANT:");
    lines.push(" • Keep freezer door CLOSED");
    lines.push(" • Do not attempt to restart the unit");
    lines.push(" • Product may still be salvageable");
  }

  if (data.occupantSafetyTips && data.occupantSafetyTips.length > 0) {
    for (const tip of data.occupantSafetyTips) {
      lines.push(` • ${tip}`);
    }
  }

  if (data.accessNotes) {
    lines.push("");
    lines.push(`🔑 Access note: ${data.accessNotes}`);
  }

  // Safety-critical content — always include for emergencies
  lines.push("");
  lines.push(
    "⚠️ If symptoms worsen (confusion, stop sweating, throbbing headache), call 911.",
  );
  lines.push("");
  lines.push("Reply HELP for assistance or STOP to opt out.");

  return lines.join("\n");
}

/**
 * appointmentConfirmed – Routine booking with service details, date/time,
 * and prep instructions.  Matches the Robert (tune-up) scenario.
 */
export function appointmentConfirmed(data: AppointmentConfirmData): string {
  const lines: string[] = [];

  lines.push("✅ APPOINTMENT CONFIRMED");
  lines.push("");
  lines.push(`Hi ${data.customerName},`);
  lines.push("");
  lines.push(`What: ${data.serviceType}${data.price ? ` (${data.price})` : ""}`);
  lines.push(`When: ${data.dateTime} — ${data.timeWindow}`);
  lines.push(`Where: ${data.address}`);
  lines.push("");

  if (data.serviceIncludes.length > 0) {
    lines.push("🔧 Service includes:");
    for (const item of data.serviceIncludes) {
      lines.push(` • ${item}`);
    }
    lines.push("");
  }

  lines.push("📅 We'll remind you the morning of your appointment.");
  lines.push("The technician will call ~30 min before arrival.");
  lines.push("");
  lines.push(
    "💡 Pro tip: many of our customers save 15% by joining our Comfort Club maintenance plan — includes 2 tune-ups/year + priority scheduling. Reply INFO for details.",
  );
  lines.push("");
  lines.push("Need to reschedule? Reply CHANGE.");

  return lines.join("\n");
}

/**
 * consultationScheduled – Sales consultation with advisor name, what to expect,
 * and pre-visit survey link.  Matches the Sarah (system replacement) scenario.
 */
export function consultationScheduled(data: ConsultationData): string {
  const lines: string[] = [];

  lines.push("✅ CONSULTATION CONFIRMED");
  lines.push("");
  lines.push(`What: ${data.topics[0] ?? "In-Home Comfort Consultation"}`);
  lines.push(`When: ${data.dateTime} (${data.duration})`);
  lines.push(`Where: ${data.address}`);
  lines.push("");
  lines.push(
    `Your Comfort Advisor: ${data.advisorName} (${data.advisorBio})`,
  );

  if (data.surveyUrl) {
    lines.push("");
    lines.push("📋 Before your appointment, fill out this home comfort survey:");
    lines.push(data.surveyUrl);
  }

  lines.push("");
  lines.push("🏠 What we'll cover:");
  for (const topic of data.topics) {
    lines.push(` • ${topic}`);
  }

  lines.push("");
  lines.push(
    "💰 Federal tax credits up to $2,000 for qualifying heat pump installations.",
  );

  if (data.customerName) {
    lines.push("");
    lines.push(
      `Congrats on the new home, ${data.customerName}! We look forward to helping you make it comfortable.`,
    );
  }

  return lines.join("\n");
}

/**
 * followUpNurture – Nurturing SMS for unbooked leads.
 * Day 1: "sorry we missed you"
 * Day 3: "still need help?"
 * Day 7: "last chance, here's a $25 promo code"
 */
export function followUpNurture(
  data: FollowUpNurtureData,
  day: 1 | 3 | 7,
): string {
  const promo = data.promoCode ?? "AFTERFLOW25";

  switch (day) {
    case 1: {
      // Day 1: "Sorry we missed you" with a friendly nudge
      return [
        `Hi ${data.customerName},`,
        "",
        "We noticed we missed your call to CoolAir HVAC yesterday. We're sorry we couldn't connect — during peak season our lines get busy, but we don't want to leave you hanging.",
        "",
        "Is there still an issue with your cooling or heating? We have technicians available today and would love to help.",
        "",
        `📞 Call us back at ${data.phoneNumber} or reply to this text.`,
        "",
        "Stay cool! ❄️",
      ].join("\n");
    }
    case 3: {
      // Day 3: "Still need help?" with urgency
      return [
        `Hi ${data.customerName},`,
        "",
        "Just checking in — are you still experiencing issues with your HVAC system? We have open appointments this week and our technicians are ready to help.",
        "",
        "Don't let a small problem become a big (and expensive) one. Phoenix heat is no joke!",
        "",
        `📞 Call us at ${data.phoneNumber} or reply to schedule.`,
        "",
        "We're here when you need us.",
      ].join("\n");
    }
    case 7: {
      // Day 7: "Last chance" with promo code
      return [
        `Hi ${data.customerName},`,
        "",
        "We haven't heard back and wanted to reach out one last time. If you're still dealing with an HVAC issue, we'd love to earn your business.",
        "",
        `As a thank you for considering CoolAir HVAC, here's a $25 credit toward any service: use code **${promo}** when you book.`,
        "",
        `📞 Call us at ${data.phoneNumber} or reply to claim your credit.`,
        "",
        "No pressure — just want to make sure you and your family stay comfortable.",
      ].join("\n");
    }
    default:
      return "";
  }
}

/**
 * postServiceSurvey – After job completion: satisfaction survey link and review request.
 */
export function postServiceSurvey(data: PostServiceSurveyData): string {
  return [
    `Hi ${data.customerName},`,
    "",
    `Thanks for choosing CoolAir HVAC for your recent ${data.jobDescription}. We hope everything is running perfectly!`,
    "",
    "We'd love your feedback — it takes less than 2 minutes and helps us serve you better:",
    data.surveyUrl,
    "",
    "⭐ If you were happy with our service, leaving a Google review helps other Phoenix families find us during emergencies.",
    "",
    "Thank you for trusting CoolAir HVAC!",
    "",
    "Reply STOP to opt out of survey messages.",
  ].join("\n");
}
