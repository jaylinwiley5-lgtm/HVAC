"use client";

import { useState } from "react";
import { SCENARIOS, triage } from "@/lib/triage";

const scenarioMeta: Record<string, { title: string; description: string; caller: string; context: string }> = {
  emergency1_elderly: {
    title: "Emergency 1 – Elderly Resident, Total AC Failure",
    description: "78-year-old widow, total system failure, heat exhaustion symptoms, 9:42 PM Saturday, 109°F.",
    caller: "Margaret Kowalski",
    context: "Phoenix, AZ · Saturday 9:42 PM · 109°F · Heat Advisory",
  },
  emergency2_restaurant: {
    title: "Emergency 2 – Restaurant Walk-In Freezer Down",
    description: "Commercial freezer failure, $8K inventory at risk, Sunday brunch prep, 6:15 AM.",
    caller: "Diego Ramirez",
    context: "Phoenix, AZ · Sunday 6:15 AM · 93°F rising to 116°F",
  },
  emergency3_infant: {
    title: "Emergency 3 – Family With Infant, AC Blowing Hot",
    description: "4-month-old infant, AC blowing warm air, 88°F indoors, 2:30 AM.",
    caller: "James & Alicia Chen",
    context: "Phoenix, AZ · Monday 2:30 AM · 96°F overnight",
  },
  routine1_tuneup: {
    title: "Routine 1 – AC Preventative Maintenance",
    description: "Working AC, longer run cycles, seasonal tune-up requested, flexible timing.",
    caller: "Robert Tanaka",
    context: "Phoenix, AZ · Tuesday 11:30 AM · 111°F",
  },
  routine2_quote: {
    title: "Routine 2 – System Replacement Quote",
    description: "18-year-old AC unit, new homeowner, wants replacement quote, flexible timing.",
    caller: "Sarah Okonkwo",
    context: "Phoenix, AZ · Wednesday 7:45 PM · 108°F",
  },
};

export default function ScenariosPage() {
  const [results, setResults] = useState<Record<string, ReturnType<typeof triage>>>({});

  const runScenario = (key: string) => {
    const scenario = SCENARIOS[key];
    if (!scenario) return;
    const result = triage(scenario.input);
    setResults((prev) => ({ ...prev, [key]: result }));
  };

  const runAll = () => {
    const all: Record<string, ReturnType<typeof triage>> = {};
    for (const key of Object.keys(SCENARIOS)) {
      const scenario = SCENARIOS[key];
      all[key] = triage(scenario.input);
    }
    setResults(all);
  };

  const colorMap = { red: "text-red-400", green: "text-green-400", blue: "text-blue-400" };
  const bgMap = { red: "bg-red-500/20 border-red-500/30", green: "bg-green-500/20 border-green-500/30", blue: "bg-blue-500/20 border-blue-500/30" };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Scenario Simulator</h1>
          <p className="text-slate-400 text-sm mt-1">Replay the 5 call scenarios to validate triage classification</p>
        </div>
        <button
          onClick={runAll}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Run All Scenarios
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(scenarioMeta).map(([key, meta]) => {
          const result = results[key];
          const scenario = SCENARIOS[key];

          return (
            <div key={key} className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
              <div className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">{meta.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{meta.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-600">Caller: {meta.caller}</span>
                    <span className="text-[10px] text-slate-600">{meta.context}</span>
                  </div>
                </div>
                <button
                  onClick={() => runScenario(key)}
                  className="px-3 py-1.5 text-xs font-medium bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded-lg transition-colors shrink-0"
                >
                  ▶ Run
                </button>
              </div>

              {result && (
                <div className="px-5 py-4 border-t border-[#1e293b] bg-[#0a0f1a]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${bgMap[result.color]} ${colorMap[result.color]}`}>
                      {result.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      Score: <span className={`font-mono font-bold ${colorMap[result.color]}`}>{result.priorityScore}</span>/100
                    </span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-400">Dispatch: {result.dispatchTarget}</span>
                    {scenario && (
                      <span className="text-xs text-slate-500">
                        · Expected: {scenario.expectedScore}/100 ({scenario.expectedClassification})
                      </span>
                    )}
                  </div>
                  {/* Factor breakdown */}
                  <details className="mt-3">
                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">Factor breakdown</summary>
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
