import { describe, it, expect, beforeEach } from "vitest";
import {
  sendImmediate,
  scheduleDelayed,
  cancelScheduled,
  scheduleNurtureSequence,
  getMessagesByCallSid,
  getAllMessages,
  clearAll,
  type SmsRecord,
} from "./sms-scheduler";

beforeEach(() => {
  clearAll();
});

// ─── sendImmediate ───

describe("sendImmediate", () => {
  it("creates a record with status 'sent'", () => {
    const record = sendImmediate(
      "call_test_1",
      "+16025550143",
      "emergency",
      "Test emergency SMS content",
    );
    expect(record.status).toBe("sent");
    expect(record.sentAt).not.toBeNull();
    expect(record.scheduledFor).toBeNull();
    expect(record.callSid).toBe("call_test_1");
    expect(record.phoneNumber).toBe("+16025550143");
    expect(record.type).toBe("emergency");
    expect(record.content).toBe("Test emergency SMS content");
  });

  it("auto-generates a unique ID", () => {
    const r1 = sendImmediate("c1", "555-0001", "emergency", "msg");
    const r2 = sendImmediate("c2", "555-0002", "confirmation", "msg");
    expect(r1.id).not.toBe(r2.id);
    expect(r1.id).toContain("sms_");
  });

  it("appends records under the same callSid", () => {
    sendImmediate("call_a", "555-0001", "emergency", "msg1");
    sendImmediate("call_a", "555-0001", "confirmation", "msg2");
    const msgs = getMessagesByCallSid("call_a");
    expect(msgs).toHaveLength(2);
  });

  it("stores records under separate callSids", () => {
    sendImmediate("call_a", "555-0001", "emergency", "msg");
    sendImmediate("call_b", "555-0002", "confirmation", "msg");
    expect(getMessagesByCallSid("call_a")).toHaveLength(1);
    expect(getMessagesByCallSid("call_b")).toHaveLength(1);
  });
});

// ─── scheduleDelayed ───

describe("scheduleDelayed", () => {
  it("creates a record with status 'scheduled' and future scheduledFor", () => {
    const before = new Date();
    const record = scheduleDelayed(
      "call_test_2",
      "+16025550143",
      "nurture",
      "Follow-up message",
      30, // 30 minutes
    );
    expect(record.status).toBe("scheduled");
    expect(record.sentAt).toBeNull();
    expect(record.scheduledFor).not.toBeNull();
    expect(record.scheduledFor!.getTime()).toBeGreaterThan(before.getTime());
  });

  it("sets scheduledFor approximately delayMinutes in the future", () => {
    const record = scheduleDelayed("c1", "555", "nurture", "msg", 60);
    const diffMs = record.scheduledFor!.getTime() - record.createdAt.getTime();
    // Should be within 5 seconds of 60 minutes
    expect(Math.abs(diffMs - 60 * 60 * 1000)).toBeLessThan(5000);
  });
});

// ─── cancelScheduled ───

describe("cancelScheduled", () => {
  it("cancels all scheduled messages for a callSid", () => {
    scheduleDelayed("call_x", "555", "nurture", "day1", 1440); // day 1
    scheduleDelayed("call_x", "555", "nurture", "day3", 4320); // day 3
    scheduleDelayed("call_x", "555", "nurture", "day7", 10080); // day 7

    const cancelled = cancelScheduled("call_x");
    expect(cancelled).toBe(3);

    const msgs = getMessagesByCallSid("call_x");
    for (const msg of msgs) {
      expect(msg.status).toBe("cancelled");
    }
  });

  it("does not cancel already-sent messages", () => {
    sendImmediate("call_y", "555", "emergency", "sent msg");
    scheduleDelayed("call_y", "555", "nurture", "future", 60);

    const cancelled = cancelScheduled("call_y");
    expect(cancelled).toBe(1);

    const msgs = getMessagesByCallSid("call_y");
    const sent = msgs.find((m) => m.status === "sent");
    expect(sent).toBeDefined();
    expect(sent!.status).toBe("sent");
  });

  it("returns 0 for unknown callSid", () => {
    expect(cancelScheduled("nonexistent")).toBe(0);
  });
});

// ─── scheduleNurtureSequence ───

describe("scheduleNurtureSequence", () => {
  it("schedules exactly 3 messages (day 1, 3, 7)", () => {
    const records = scheduleNurtureSequence(
      "call_nurture_1",
      "+16025550143",
      "Day 1: sorry we missed you",
      "Day 3: still need help?",
      "Day 7: last chance with $25 off",
    );

    expect(records).toHaveLength(3);
    expect(records[0].content).toBe("Day 1: sorry we missed you");
    expect(records[1].content).toBe("Day 3: still need help?");
    expect(records[2].content).toBe("Day 7: last chance with $25 off");
  });

  it("all nurture records have status 'scheduled'", () => {
    const records = scheduleNurtureSequence(
      "call_nurture_2",
      "555",
      "d1",
      "d3",
      "d7",
    );
    for (const r of records) {
      expect(r.status).toBe("scheduled");
      expect(r.type).toBe("nurture");
    }
  });

  it("day 1 is scheduled ~1 day out, day 3 ~3 days out, day 7 ~7 days out", () => {
    const records = scheduleNurtureSequence("c1", "555", "d1", "d3", "d7");

    const day1Diff =
      records[0].scheduledFor!.getTime() - records[0].createdAt.getTime();
    const day3Diff =
      records[1].scheduledFor!.getTime() - records[1].createdAt.getTime();
    const day7Diff =
      records[2].scheduledFor!.getTime() - records[2].createdAt.getTime();

    // Within 5 seconds of expected delays
    const oneDay = 24 * 60 * 60 * 1000;
    expect(Math.abs(day1Diff - oneDay)).toBeLessThan(5000);
    expect(Math.abs(day3Diff - 3 * oneDay)).toBeLessThan(5000);
    expect(Math.abs(day7Diff - 7 * oneDay)).toBeLessThan(5000);
  });

  it("cancels any previously scheduled messages for the same callSid before scheduling new ones", () => {
    // First, schedule a nurture sequence
    scheduleNurtureSequence("call_dup", "555", "old1", "old3", "old7");

    // Schedule another with new content
    const records = scheduleNurtureSequence(
      "call_dup",
      "555",
      "new1",
      "new3",
      "new7",
    );

    // Should have 6 total records: 3 old (cancelled) + 3 new (scheduled)
    const all = getMessagesByCallSid("call_dup");
    expect(all).toHaveLength(6);

    const cancelled = all.filter((m) => m.status === "cancelled");
    const scheduled = all.filter((m) => m.status === "scheduled");
    expect(cancelled).toHaveLength(3);
    expect(scheduled).toHaveLength(3);
    expect(scheduled[0].content).toBe("new1");
  });

  it("returns records with the correct callSid and phoneNumber", () => {
    const records = scheduleNurtureSequence("c1", "555-0100", "a", "b", "c");
    for (const r of records) {
      expect(r.callSid).toBe("c1");
      expect(r.phoneNumber).toBe("555-0100");
    }
  });
});

// ─── getMessagesByCallSid ───

describe("getMessagesByCallSid", () => {
  it("returns empty array for unknown callSid", () => {
    expect(getMessagesByCallSid("unknown")).toEqual([]);
  });

  it("returns all messages for a callSid", () => {
    sendImmediate("call_z", "555", "emergency", "msg1");
    scheduleDelayed("call_z", "555", "nurture", "msg2", 60);
    expect(getMessagesByCallSid("call_z")).toHaveLength(2);
  });
});

// ─── getAllMessages ───

describe("getAllMessages", () => {
  it("returns all messages across all callSids, sorted newest first", () => {
    sendImmediate("call_a", "111", "emergency", "a1");
    sendImmediate("call_b", "222", "confirmation", "b1");
    sendImmediate("call_a", "111", "nurture", "a2");

    const all = getAllMessages();
    expect(all).toHaveLength(3);
    // Newest first
    expect(all[0].createdAt.getTime()).toBeGreaterThanOrEqual(
      all[1].createdAt.getTime(),
    );
    expect(all[1].createdAt.getTime()).toBeGreaterThanOrEqual(
      all[2].createdAt.getTime(),
    );
  });
});

// ─── clearAll ───

describe("clearAll", () => {
  it("removes all messages", () => {
    sendImmediate("c1", "555", "emergency", "test");
    expect(getAllMessages()).toHaveLength(1);
    clearAll();
    expect(getAllMessages()).toHaveLength(0);
  });
});
