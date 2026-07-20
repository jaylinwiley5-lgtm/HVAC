export default function DashboardPage() {
  const metrics = [
    { label: "Calls Answered Today", value: "47", change: "+12%", sub: "vs. yesterday", color: "text-blue-400" },
    { label: "Jobs Booked", value: "31", change: "+8%", sub: "from inbound calls", color: "text-emerald-400" },
    { label: "Revenue Recovered", value: "$4,285", change: "+22%", sub: "est. from missed calls", color: "text-amber-400" },
    { label: "Answer Rate", value: "96.4%", change: "+2.1%", sub: "target: >95%", color: "text-violet-400" },
  ];

  const recentCalls = [
    { id: 1, from: "+16025550143", name: "Margaret K.", status: "P1 Emergency", time: "9:42 PM", triage: "Elderly, total AC failure" },
    { id: 2, from: "+14805550287", name: "Diego R.", status: "P1 Emergency", time: "6:15 AM", triage: "Restaurant freezer down" },
    { id: 3, from: "+16025550912", name: "James C.", status: "P1 Emergency", time: "2:30 AM", triage: "Infant, AC blowing warm" },
    { id: 4, from: "+16025550367", name: "Robert T.", status: "P3 Routine", time: "11:30 AM", triage: "AC tune-up" },
    { id: 5, from: "+14805550519", name: "Sarah O.", status: "P4 Sales", time: "7:45 PM", triage: "System replacement quote" },
  ];

  const statusColors: Record<string, string> = {
    "P1 Emergency": "bg-red-500/20 text-red-400 border-red-500/30",
    "P3 Routine": "bg-green-500/20 text-green-400 border-green-500/30",
    "P4 Sales": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Phoenix, AZ · Heat Advisory in Effect · 109°F</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{m.label}</p>
            <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{m.change}</span>
              <span className="text-xs text-slate-600">{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Calls */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e293b] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Calls</h2>
          <a href="/calls" className="text-xs text-blue-400 hover:text-blue-300">View all →</a>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Caller</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium hidden md:table-cell">Triage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {recentCalls.map((call) => (
              <tr key={call.id} className="hover:bg-[#1e293b]/50 transition-colors">
                <td className="px-5 py-3 text-slate-200 font-medium">{call.name}</td>
                <td className="px-5 py-3 text-slate-400 font-mono text-xs">{call.from}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[call.status]}`}>
                    {call.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400">{call.time}</td>
                <td className="px-5 py-3 text-slate-500 text-xs hidden md:table-cell">{call.triage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
        <div className="metric-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Twilio Voice</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-slate-300">Connected</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">Webhook: /api/twilio/voice</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">ServiceTitan</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-slate-300">Sandbox Mode</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">API: sandbox.servicetitan.com</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Triage Engine</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-slate-300">Operational</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">8-factor matrix · v1.0</p>
        </div>
      </div>
    </div>
  );
}
