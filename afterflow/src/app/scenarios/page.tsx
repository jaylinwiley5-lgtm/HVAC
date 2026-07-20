"use client";

import { useState } from "react";

// ─── Scenario metadata ───
interface ScenarioMeta {
  title: string;
  description: string;
  caller: string;
  context: string;
  /** The API payload to send to POST /api/triage */
  payload: Record<string, unknown>;
  /** Expected values from the research doc */
  expectedScore: number;
  expectedClassification: string;
  smsMessage: string;
}

const scenarios: Record<string, ScenarioMeta> = {
  emergency1_elderly: {
    title: "Emergency 1 – Elderly Resident, Total AC Failure",
    description: "78-year-old widow, total system failure, heat exhaustion symptoms, 9:42 PM Saturday, 109°F.",
    caller: "Margaret Kowalski",
    context: "Phoenix, AZ · Saturday 9:42 PM · 109°F · Heat Advisory",
    payload: {
      symptoms: "AC completely silent, no sound at all, indoor temp 93°F, feeling dizzy and nauseous, dry mouth",
      occupantType: "elderly",
      systemStatus: "total_failure",
      indoorTemp: "93°F",
      timeOfDay: "after_hours",
      hasHealthSymptoms: true,
      businessImpact: "none",
      weatherSeverity: "extreme",
      callerFlexibility: false,
    },
    expectedScore: 95,
    expectedClassification: "P1_EMERGENCY",
    smsMessage: `🚨 EMERGENCY CONFIRMED

Hi Margaret, a technician is on the way to:
2841 W Rose Garden Ln, Phoenix, AZ 85027

📍 Track your tech: https://coolair.co/t/MK782
⏱ Estimated arrival: 10:25 PM – 10:40 PM

Technician: Carlos R. (10 yrs exp, AC specialist)

💡 While you wait:
 • Stay in the coolest room
 • Drink cool water (small sips)
 • Have a neighbor stay with you if possible

If your symptoms worsen (confusion, stop sweating, throbbing headache), call 911.`,
  },
  emergency2_restaurant: {
    title: "Emergency 2 – Restaurant Walk-In Freezer Down",
    description: "Commercial freezer failure, $8K inventory at risk, Sunday brunch prep, 6:15 AM.",
    caller: "Diego Ramirez",
    context: "Phoenix, AZ · Sunday 6:15 AM · 93°F rising to 116°F",
    payload: {
      symptoms: "Walk-in freezer at 38°F, compressor short-cycling, frost on evaporator coil, $8K food inventory at risk",
      occupantType: "commercial",
      systemStatus: "partial_failure",
      indoorTemp: "38°F (freezer)",
      timeOfDay: "early_morning",
      hasHealthSymptoms: false,
      businessImpact: "inventory_risk",
      weatherSeverity: "extreme",
      callerFlexibility: false,
    },
    expectedScore: 90,
    expectedClassification: "P1_EMERGENCY",
    smsMessage: `🚨 PRIORITY 1 – TECHNICIAN DISPATCHED

Diego, a commercial refrigeration specialist is on the way to:
Taqueria El Sol
4510 E Thomas Rd, Phoenix, AZ 85018

📍 Track your tech: https://coolair.co/t/MK783
⏱ ETA: 7:00 AM – 7:15 AM

Technician: Maria G. (commercial refrigeration specialist, 12 yrs experience)

⚠️ IMPORTANT:
 • Keep freezer door CLOSED
 • Do not attempt to restart the unit
 • Temp at dispatch: 38°F — product may still be salvageable

Your Commercial Priority SLA is active. No after-hours dispatch fee.
Estimated inventory at risk: ~$8,000`,
  },
  emergency3_infant: {
    title: "Emergency 3 – Family With Infant, AC Blowing Hot",
    description: "4-month-old infant, AC blowing warm air, 88°F indoors, 2:30 AM.",
    caller: "James & Alicia Chen",
    context: "Phoenix, AZ · Monday 2:30 AM · 96°F overnight",
    payload: {
      symptoms: "AC blowing warm air, indoor temp 88°F, 4-month-old baby fussy sweaty, flushed, can't sleep",
      occupantType: "infant",
      systemStatus: "partial_failure",
      indoorTemp: "88°F",
      timeOfDay: "overnight",
      hasHealthSymptoms: true,
      businessImpact: "none",
      weatherSeverity: "extreme",
      callerFlexibility: false,
    },
    expectedScore: 93,
    expectedClassification: "P1_EMERGENCY",
    smsMessage: `🚨 EMERGENCY – TECHNICIAN ON THE WAY

James, a technician is headed to:
15342 N 32nd St, Phoenix, AZ 85032

📍 Track your tech: https://coolair.co/t/MK784
⏱ ETA: 3:10 AM – 3:25 AM

Technician: David K. (8 yrs, residential AC specialist, refrigerant leak certified)

🍼 For baby Emma:
 • Keep her in the coolest room with a fan
 • Offer the bottle frequently
 • Dress in light cotton (onesie only)
 • Cool (not cold) damp cloth on forehead OK

⚠️ If she becomes hard to wake, stops feeding, or her skin feels hot and dry → call 911.

You're doing everything right. Help is coming.`,
  },
  routine1_tuneup: {
    title: "Routine 1 – AC Preventative Maintenance",
    description: "Working AC, longer run cycles, seasonal tune-up requested, flexible timing.",
    caller: "Robert Tanaka",
    context: "Phoenix, AZ · Tuesday 11:30 AM · 111°F",
    payload: {
      symptoms: "AC working fine but running longer cycles, energy bill higher, wants seasonal tune-up",
      occupantType: "individual",
      systemStatus: "degraded",
      indoorTemp: "78°F",
      timeOfDay: "business_hours",
      hasHealthSymptoms: false,
      businessImpact: "none",
      weatherSeverity: "moderate",
      callerFlexibility: true,
    },
    expectedScore: 15,
    expectedClassification: "P3_ROUTINE",
    smsMessage: `✅ APPOINTMENT CONFIRMED

What: AC Seasonal Tune-Up ($129 summer special)
When: Thursday, July 23 — 1:00 PM to 3:00 PM
Where: 7238 S 19th Ave, Phoenix, AZ 85041

🔧 Service includes:
 • Coil cleaning (condenser + evaporator)
 • Refrigerant level check
 • Capacitor & contactor testing
 • Ductwork inspection
 • Air filter replacement

📅 We'll remind you the morning of your appointment.
The technician will call ~30 min before arrival.

💡 Pro tip: many of our customers save 15% by joining our Comfort Club maintenance plan — includes 2 tune-ups/year + priority scheduling. Reply INFO for details.

Need to reschedule? Reply CHANGE.`,
  },
  routine2_quote: {
    title: "Routine 2 – System Replacement Quote",
    description: "18-year-old AC unit, new homeowner, wants replacement quote, flexible timing.",
    caller: "Sarah Okonkwo",
    context: "Phoenix, AZ · Wednesday 7:45 PM · 108°F",
    payload: {
      symptoms: "18-year-old AC unit, barely cools, runs constantly, house won't go below 78°F, wants replacement quote",
      occupantType: "individual",
      systemStatus: "degraded",
      indoorTemp: "78°F",
      timeOfDay: "evening",
      hasHealthSymptoms: false,
      businessImpact: "none",
      weatherSeverity: "moderate",
      callerFlexibility: true,
    },
    expectedScore: 8,
    expectedClassification: "P4_SALES",
    smsMessage: `✅ CONSULTATION CONFIRMED

What: Free In-Home System Replacement Estimate
When: Wednesday, July 29 — 9:00 AM (60–90 min)
Where: 1318 E Pierson St, Phoenix, AZ 85014

Your Comfort Advisor: Michael T. (15 yrs HVAC design experience)

📋 Before your appointment, fill out this home comfort survey:
https://coolair.co/survey/SOK1318

🏠 What we'll cover:
 • Professional load calculation (Manual J)
 • AC-only vs. heat pump options & tax credits
 • Ductwork assessment & electrical review
 • 0% financing options available

💰 Federal tax credits up to $2,000 for qualifying heat pump installations.

Congrats on the new home, Sarah! We look forward to helping you make it comfortable.`,
  },
};

// ─── API result type ───
interface TriageApiResult {
  score: number;
  classification: string;
  priority: string;
  dispatchWindow: string;
  diagnosis: string;
  safetyActions: string[];
  factors: Record<string, number>;
}

export default function ScenariosPage() {
  const [results, setResults] = useState<Record<string, TriageApiResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const runScenario = async (key: string) => {
    const scenario = scenarios[key];
    if (!scenario) return;

    setLoading((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: "" }));

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario.payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: TriageApiResult = await res.json();
      setResults((prev) => ({ ...prev, [key]: data }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [key]: err instanceof Error ? err.message : "Unknown error",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const runAll = async () => {
    const keys = Object.keys(scenarios);
    for (const key of keys) {
      await runScenario(key);
    }
  };

  const colorMap: Record<string, string> = {
    P1_EMERGENCY: "text-red-400",
    P3_ROUTINE: "text-green-400",
    P4_SALES: "text-blue-400",
  };

  const bgMap: Record<string, string> = {
    P1_EMERGENCY: "bg-red-500/20 border-red-500/30",
    P3_ROUTINE: "bg-green-500/20 border-green-500/30",
    P4_SALES: "bg-blue-500/20 border-blue-500/30",
  };

  const priorityBgMap: Record<string, string> = {
    P1_EMERGENCY: "bg-red-500/15 border-red-400/30",
    P3_ROUTINE: "bg-green-500/15 border-green-400/30",
    P4_SALES: "bg-blue-500/15 border-blue-400/30",
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Scenario Simulator</h1>
          <p className="text-slate-400 text-sm mt-1">
            Replay the 5 call scenarios through the triage API to validate classification
          </p>
        </div>
        <button
          onClick={runAll}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          disabled={Object.values(loading).some(Boolean)}
        >
          {Object.values(loading).some(Boolean) ? "Running..." : "Run All Scenarios"}
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(scenarios).map(([key, meta]) => {
          const result = results[key];
          const isLoading = loading[key];
          const error = errors[key];

          return (
            <div key={key} className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">{meta.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{meta.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-600">Caller: {meta.caller}</span>
                    <span className="text-[10px] text-slate-600">{meta.context}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-500">
                    Expected: {meta.expectedClassification.replace("_", " ")} / {meta.expectedScore}
                  </span>
                  <button
                    onClick={() => runScenario(key)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-medium bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "⏳" : "▶ Run"}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="px-5 py-3 border-t border-red-500/30 bg-red-500/10">
                  <span className="text-xs text-red-400">Error: {error}</span>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="border-t border-[#1e293b] bg-[#0a0f1a]">
                  {/* Triage summary row */}
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${bgMap[result.classification] ?? "bg-slate-500/20 border-slate-500/30"} ${colorMap[result.classification] ?? "text-slate-400"}`}
                      >
                        {result.priority}
                      </span>
                      <span className="text-xs text-slate-400">
                        Score:{" "}
                        <span className={`font-mono font-bold ${colorMap[result.classification] ?? "text-slate-400"}`}>
                          {result.score}
                        </span>
                        /100
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-400">Dispatch: {result.dispatchWindow}</span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className={`text-xs font-mono ${result.classification === meta.expectedClassification ? "text-green-400" : "text-red-400"}`}>
                        {result.classification === meta.expectedClassification ? "✓ Match" : "✗ Mismatch"}
                      </span>
                    </div>

                    {/* Diagnosis */}
                    <div className="mt-3">
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">Diagnosis</span>
                      <p className="text-xs text-slate-300 mt-1">{result.diagnosis}</p>
                    </div>

                    {/* Safety Actions (if any) */}
                    {result.safetyActions.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] uppercase tracking-wider text-red-500">Safety Actions</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.safetyActions.map((action) => (
                            <span
                              key={action}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20 font-mono"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Factor breakdown */}
                    <details className="mt-3">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                        Factor breakdown
                      </summary>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                        {Object.entries(result.factors).map(([factor, value]) => (
                          <div key={factor} className="text-xs">
                            <span className="text-slate-500">{factor}: </span>
                            <span className="text-slate-300 font-mono">{value}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>

                  {/* SMS Preview */}
                  <div className="px-5 py-4 border-t border-[#1e293b] bg-[#060b14]">
                    <span className="text-[10px] uppercase tracking-wider text-slate-600">
                      SMS Follow-Up
                    </span>
                    <pre className="text-xs text-slate-300 mt-1 whitespace-pre-wrap font-mono leading-relaxed bg-[#0a0f18] p-3 rounded-lg border border-[#1e293b] max-h-64 overflow-y-auto">
                      {meta.smsMessage}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
