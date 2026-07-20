"use client";

import { useEffect, useState } from "react";

interface SmsRecord {
  id: string;
  callSid: string;
  phoneNumber: string;
  type: "emergency" | "confirmation" | "consultation" | "nurture" | "survey";
  content: string;
  status: "sent" | "scheduled" | "cancelled";
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
}

const typeLabels: Record<string, { label: string; color: string; bg: string }> =
  {
    emergency: {
      label: "🚨 Emergency",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    confirmation: {
      label: "✅ Confirmation",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    consultation: {
      label: "📋 Consultation",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    nurture: {
      label: "🌱 Nurture",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    survey: {
      label: "⭐ Survey",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  };

const statusStyles: Record<string, string> = {
  sent: "text-green-400 bg-green-500/10",
  scheduled: "text-yellow-400 bg-yellow-500/10",
  cancelled: "text-slate-500 bg-slate-500/10",
};

export default function SmsLogPage() {
  const [messages, setMessages] = useState<SmsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch("/api/twilio/sms");
        if (!res.ok) throw new Error("Failed to load messages");
        const data = await res.json();
        setMessages(data.messages ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-400 font-medium">Error loading messages</p>
        <p className="text-slate-400 text-sm mt-1">{error}</p>
      </div>
    );
  }

  // Generate mock data on first load if empty
  const displayMessages =
    messages.length > 0 ? messages : generateMockMessages();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">SMS Log</h2>
          <p className="text-slate-400 text-sm mt-1">
            All sent and scheduled SMS messages
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-slate-400">Sent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-slate-400">Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-400">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {(["emergency", "confirmation", "consultation", "nurture"] as const).map(
          (type) => {
            const count = displayMessages.filter((m) => m.type === type).length;
            const cfg = typeLabels[type];
            return (
              <div
                key={type}
                className="rounded-lg border border-[#1e293b] bg-[#0f172a] p-4"
              >
                <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
                <p className="text-xs text-slate-400 mt-1">{cfg.label}</p>
              </div>
            );
          },
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#1e293b] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e293b] bg-[#0f172a]">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Phone
                </th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Preview
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {displayMessages.map((msg) => {
                const typeCfg = typeLabels[msg.type] ?? typeLabels.confirmation;
                const statusClass =
                  statusStyles[msg.status] ?? statusStyles.scheduled;
                const preview =
                  msg.content.length > 80
                    ? msg.content.slice(0, 80).replace(/\n/g, " ") + "…"
                    : msg.content.replace(/\n/g, " ");
                const isExpanded = expandedId === msg.id;

                return (
                  <tr
                    key={msg.id}
                    className="hover:bg-[#1e293b]/50 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : msg.id)
                    }
                  >
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap font-mono text-xs">
                      {new Date(msg.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap font-mono text-xs">
                      {msg.phoneNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeCfg.color} ${typeCfg.bg}`}
                      >
                        {typeCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                      >
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">
                      {preview}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded message detail */}
      {expandedId && (
        <div className="rounded-lg border border-[#1e293b] bg-[#0f172a] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">
              Message Detail
            </h3>
            <button
              className="text-slate-500 hover:text-slate-300 text-xs"
              onClick={() => setExpandedId(null)}
            >
              ✕ Close
            </button>
          </div>
          <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap bg-[#020617] rounded-lg p-4 border border-[#1e293b]">
            {displayMessages.find((m) => m.id === expandedId)?.content ??
              "Message not found"}
          </pre>
        </div>
      )}

      {/* Empty state */}
      {displayMessages.length === 0 && (
        <div className="rounded-lg border border-[#1e293b] bg-[#0f172a] p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-300 font-medium">No SMS messages yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Messages sent via the SMS API will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

/** Generate mock messages for demo/preview when the store is empty */
function generateMockMessages(): SmsRecord[] {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  return [
    {
      id: "mock_1",
      callSid: "call_margaret_1",
      phoneNumber: "602-555-0143",
      type: "emergency",
      status: "sent",
      scheduledFor: null,
      sentAt: new Date(now - 2 * hour).toISOString(),
      createdAt: new Date(now - 2 * hour).toISOString(),
      content:
        "🚨 EMERGENCY CONFIRMED\n\nHi Margaret, a technician is on the way to:\n2841 W Rose Garden Ln, Phoenix, AZ 85027\n\n📍 Track your tech: https://coolair.co/t/MK782\n⏱ Estimated arrival: 10:25 PM – 10:40 PM\n\nTechnician: Carlos R. (10 yrs exp, AC specialist)\n\n💡 While you wait:\n • Stay in the coolest room\n • Drink cool water (small sips)\n • Have a neighbor stay with you if possible\n\n⚠️ If symptoms worsen (confusion, stop sweating, throbbing headache), call 911.\n\nReply HELP for assistance or STOP to opt out.",
    },
    {
      id: "mock_2",
      callSid: "call_diego_1",
      phoneNumber: "480-555-0287",
      type: "emergency",
      status: "sent",
      scheduledFor: null,
      sentAt: new Date(now - 1.5 * hour).toISOString(),
      createdAt: new Date(now - 1.5 * hour).toISOString(),
      content:
        "🚨 PRIORITY 1 – TECHNICIAN DISPATCHED\n\nDiego, a commercial refrigeration specialist is on the way to:\nTaqueria El Sol\n4510 E Thomas Rd, Phoenix, AZ 85018\n\n📍 Track your tech: https://coolair.co/t/MK783\n⏱ ETA: 7:00 AM – 7:15 AM\n\nTechnician: Maria G. (commercial refrigeration specialist, 12 yrs experience)\n\n⚠️ IMPORTANT:\n • Keep freezer door CLOSED\n • Do not attempt to restart the unit\n • Temp at dispatch: 38°F — product may still be salvageable\n\nYour Commercial Priority SLA is active. No after-hours dispatch fee.\nEstimated inventory at risk: ~$8,000",
    },
    {
      id: "mock_3",
      callSid: "call_robert_1",
      phoneNumber: "602-555-0367",
      type: "confirmation",
      status: "sent",
      scheduledFor: null,
      sentAt: new Date(now - 3 * hour).toISOString(),
      createdAt: new Date(now - 3 * hour).toISOString(),
      content:
        "✅ APPOINTMENT CONFIRMED\n\nWhat: AC Seasonal Tune-Up ($129 summer special)\nWhen: Thursday, July 23 — 1:00 PM to 3:00 PM\nWhere: 7238 S 19th Ave, Phoenix, AZ 85041\n\n🔧 Service includes:\n • Coil cleaning (condenser + evaporator)\n • Refrigerant level check\n • Capacitor & contactor testing\n • Ductwork inspection\n • Air filter replacement\n\n📅 We'll remind you the morning of your appointment.\nThe technician will call ~30 min before arrival.\n\n💡 Pro tip: many of our customers save 15% by joining our Comfort Club maintenance plan — includes 2 tune-ups/year + priority scheduling. Reply INFO for details.\n\nNeed to reschedule? Reply CHANGE.",
    },
    {
      id: "mock_4",
      callSid: "call_sarah_1",
      phoneNumber: "480-555-0519",
      type: "consultation",
      status: "sent",
      scheduledFor: null,
      sentAt: new Date(now - 4 * hour).toISOString(),
      createdAt: new Date(now - 4 * hour).toISOString(),
      content:
        "✅ CONSULTATION CONFIRMED\n\nWhat: Free In-Home System Replacement Estimate\nWhen: Wednesday, July 29 — 9:00 AM (60–90 min)\nWhere: 1318 E Pierson St, Phoenix, AZ 85014\n\nYour Comfort Advisor: Michael T. (15 yrs HVAC design experience)\n\n📋 Before your appointment, fill out this home comfort survey:\nhttps://coolair.co/survey/SOK1318\n\n🏠 What we'll cover:\n • Professional load calculation (Manual J)\n • AC-only vs. heat pump options & tax credits\n • Ductwork assessment & electrical review\n • 0% financing options available\n\n💰 Federal tax credits up to $2,000 for qualifying heat pump installations.\n\nCongrats on the new home, Sarah! We look forward to helping you make it comfortable.",
    },
    {
      id: "mock_5",
      callSid: "call_unbooked_1",
      phoneNumber: "602-555-0101",
      type: "nurture",
      status: "scheduled",
      scheduledFor: new Date(now + day).toISOString(),
      sentAt: null,
      createdAt: new Date(now - 1 * hour).toISOString(),
      content:
        "Hi Pat, we noticed we missed your call to CoolAir HVAC yesterday. We're sorry we couldn't connect — during peak season our lines get busy, but we don't want to leave you hanging. Is there still an issue with your cooling or heating? We have technicians available today and would love to help. Call us back at 602-555-0100 or reply to this text. Stay cool! ❄️",
    },
  ];
}
