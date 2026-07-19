export default function CallsPage() {
  const calls = [
    { id: 1, sid: "CA8923a1b", from: "+16025550143", name: "Margaret Kowalski", time: "2026-07-19 21:42", duration: "4m 12s", status: "P1 Emergency", score: 95, triage: "Elderly, total AC failure, heat exhaustion symptoms", outcome: "Dispatched · ETA 45 min" },
    { id: 2, sid: "CA8923c2d", from: "+14805550287", name: "Diego Ramirez", time: "2026-07-20 06:15", duration: "3m 08s", status: "P1 Emergency", score: 90, triage: "Restaurant walk-in freezer down, $8K inventory at risk", outcome: "Dispatched · ETA 50 min" },
    { id: 3, sid: "CA8923e3f", from: "+16025550912", name: "James Chen", time: "2026-07-21 02:30", duration: "4m 45s", status: "P1 Emergency", score: 93, triage: "Infant in household, AC blowing warm, 88°F indoors", outcome: "Dispatched · ETA 40 min" },
    { id: 4, sid: "CA8923g4h", from: "+16025550367", name: "Robert Tanaka", time: "2026-07-21 11:30", duration: "2m 55s", status: "P3 Routine", score: 15, triage: "Seasonal AC tune-up, no active failure", outcome: "Booked · Thu 1-3 PM" },
    { id: 5, sid: "CA8923i5j", from: "+14805550519", name: "Sarah Okonkwo", time: "2026-07-22 19:45", duration: "3m 30s", status: "P4 Sales", score: 8, triage: "System replacement consultation, 18yr old unit", outcome: "Booked · Wed 9 AM" },
    { id: 6, sid: "CA8923k6l", from: "+16025550189", name: "Tom Baker", time: "2026-07-22 14:20", duration: "1m 10s", status: "P3 Routine", score: 22, triage: "Duct cleaning inquiry", outcome: "Booked · Fri 10 AM" },
    { id: 7, sid: "CA8923m7n", from: "+14805550234", name: "Lisa Park", time: "2026-07-23 08:05", duration: "6m 20s", status: "P1 Emergency", score: 88, triage: "Commercial office AC failure, 25 employees", outcome: "Dispatched · ETA 60 min" },
    { id: 8, sid: "CA8923o8p", from: "+16025550456", name: "Mike Johnson", time: "2026-07-23 16:45", duration: "0m 45s", status: "P4 Sales", score: 5, triage: "Thermostat upgrade quote", outcome: "Callback scheduled" },
    { id: 9, sid: "CA8923q9r", from: "+14805550789", name: "Ana Martinez", time: "2026-07-24 01:15", duration: "5m 02s", status: "P1 Emergency", score: 91, triage: "No AC, asthmatic child, 94°F indoors", outcome: "Dispatched · ETA 35 min" },
    { id: 10, sid: "CA8923s0t", from: "+16025550222", name: "David Kim", time: "2026-07-24 10:00", duration: "2m 15s", status: "P3 Routine", score: 18, triage: "Annual maintenance, existing customer", outcome: "Booked · Mon 8 AM" },
  ];

  const statusColors: Record<string, string> = {
    "P1 Emergency": "bg-red-500/20 text-red-400 border-red-500/30",
    "P3 Routine": "bg-green-500/20 text-green-400 border-green-500/30",
    "P4 Sales": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Call Log</h1>
        <p className="text-slate-400 text-sm mt-1">All inbound calls processed by AfterFlow AI</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="metric-card !p-3">
          <p className="text-[10px] text-slate-500 uppercase">Total Calls</p>
          <p className="text-xl font-bold text-white">10</p>
        </div>
        <div className="metric-card !p-3">
          <p className="text-[10px] text-slate-500 uppercase">Emergencies</p>
          <p className="text-xl font-bold text-red-400">5</p>
        </div>
        <div className="metric-card !p-3">
          <p className="text-[10px] text-slate-500 uppercase">Routine</p>
          <p className="text-xl font-bold text-green-400">3</p>
        </div>
        <div className="metric-card !p-3">
          <p className="text-[10px] text-slate-500 uppercase">Sales</p>
          <p className="text-xl font-bold text-blue-400">2</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Caller</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Time</th>
              <th className="px-4 py-3 font-medium hidden xl:table-cell">Triage Notes</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {calls.map((call) => (
              <tr key={call.id} className="hover:bg-[#1e293b]/50 transition-colors">
                <td className="px-4 py-3 text-slate-200 font-medium">
                  {call.name}
                  <div className="text-[10px] text-slate-500 md:hidden">{call.time}</div>
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden md:table-cell">{call.from}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${statusColors[call.status]}`}>
                    {call.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono font-bold ${
                    call.score >= 50 ? "text-red-400" : call.score >= 20 ? "text-green-400" : "text-blue-400"
                  }`}>
                    {call.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">{call.time}</td>
                <td className="px-4 py-3 text-slate-500 text-xs hidden xl:table-cell max-w-xs truncate">{call.triage}</td>
                <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{call.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
