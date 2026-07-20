// ─── AfterFlow SMS Scheduler ───
// In-memory scheduler that queues SMS messages with delayed delivery.
// Supports immediate sends, delayed scheduling, cancellation, and
// automatic 7-day nurture sequence for unbooked calls.

import type { SmsType } from "./sms-templates";

export type SmsStatus = "sent" | "scheduled" | "cancelled";

export interface SmsRecord {
  id: string;
  callSid: string;
  phoneNumber: string;
  type: SmsType;
  content: string;
  status: SmsStatus;
  scheduledFor: Date | null;
  sentAt: Date | null;
  createdAt: Date;
}

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `sms_${Date.now()}_${idCounter.toString(36)}`;
}

// In-memory store keyed by callSid, then by record id
const store = new Map<string, SmsRecord[]>();

/**
 * Create and "send" an SMS immediately.
 * In production this would call Twilio; here it returns the record.
 */
export function sendImmediate(
  callSid: string,
  phoneNumber: string,
  type: SmsType,
  content: string,
): SmsRecord {
  const record: SmsRecord = {
    id: generateId(),
    callSid,
    phoneNumber,
    type,
    content,
    status: "sent",
    scheduledFor: null,
    sentAt: new Date(),
    createdAt: new Date(),
  };

  const existing = store.get(callSid) ?? [];
  existing.push(record);
  store.set(callSid, existing);

  return record;
}

/**
 * Schedule an SMS for delayed delivery.
 * Returns the record with status "scheduled".
 */
export function scheduleDelayed(
  callSid: string,
  phoneNumber: string,
  type: SmsType,
  content: string,
  delayMinutes: number,
): SmsRecord {
  const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);

  const record: SmsRecord = {
    id: generateId(),
    callSid,
    phoneNumber,
    type,
    content,
    status: "scheduled",
    scheduledFor,
    sentAt: null,
    createdAt: new Date(),
  };

  const existing = store.get(callSid) ?? [];
  existing.push(record);
  store.set(callSid, existing);

  return record;
}

/**
 * Cancel all scheduled messages for a given callSid.
 * Returns the number of records cancelled.
 */
export function cancelScheduled(callSid: string): number {
  const records = store.get(callSid);
  if (!records) return 0;

  let cancelled = 0;
  for (const record of records) {
    if (record.status === "scheduled") {
      record.status = "cancelled";
      cancelled += 1;
    }
  }
  return cancelled;
}

/**
 * Auto-schedule the 7-day nurture sequence (day 1, 3, 7) for an unbooked call.
 * Returns the three scheduled records.
 *
 * @param callSid - The call SID from the original inbound call
 * @param phoneNumber - Customer's phone number
 * @param type - Must be "nurture"
 * @param day1Content - Content for day 1 follow-up
 * @param day3Content - Content for day 3 follow-up
 * @param day7Content - Content for day 7 follow-up
 */
export function scheduleNurtureSequence(
  callSid: string,
  phoneNumber: string,
  day1Content: string,
  day3Content: string,
  day7Content: string,
): SmsRecord[] {
  // Cancel any existing nurture for this call to avoid duplicates
  cancelScheduled(callSid);

  const day1 = scheduleDelayed(
    callSid,
    phoneNumber,
    "nurture",
    day1Content,
    24 * 60, // 1 day in minutes
  );

  const day3 = scheduleDelayed(
    callSid,
    phoneNumber,
    "nurture",
    day3Content,
    3 * 24 * 60, // 3 days in minutes
  );

  const day7 = scheduleDelayed(
    callSid,
    phoneNumber,
    "nurture",
    day7Content,
    7 * 24 * 60, // 7 days in minutes
  );

  return [day1, day3, day7];
}

/**
 * Get all messages for a specific callSid.
 */
export function getMessagesByCallSid(callSid: string): SmsRecord[] {
  return store.get(callSid) ?? [];
}

/**
 * Get all messages across all calls, sorted by createdAt descending.
 */
export function getAllMessages(): SmsRecord[] {
  const all: SmsRecord[] = [];
  for (const records of store.values()) {
    all.push(...records);
  }
  all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return all;
}

/**
 * Clear all messages (for testing).
 */
export function clearAll(): void {
  store.clear();
  idCounter = 0;
}
