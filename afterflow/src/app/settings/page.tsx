export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure integrations, business rules, and API credentials</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Twilio */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span>📱</span> Twilio Configuration
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Account SID</label>
              <input
                type="text"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50"
                defaultValue=""
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Auth Token</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50"
                defaultValue=""
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">From Phone Number</label>
              <input
                type="text"
                placeholder="+16025550100"
                className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50"
                defaultValue=""
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs text-slate-500">Mock mode — no real credentials required</span>
            </div>
          </div>
        </div>

        {/* ServiceTitan */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔧</span> ServiceTitan Integration
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">ST App Key</label>
              <input
                type="text"
                placeholder="st-app-key-xxxxxxxxxxxx"
                className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50"
                defaultValue=""
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">ST Tenant ID</label>
              <input
                type="text"
                placeholder="1234567"
                className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50"
                defaultValue=""
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">API Base URL</label>
              <select className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50">
                <option>https://api.sandbox.servicetitan.com</option>
                <option>https://api.servicetitan.com</option>
              </select>
            </div>
          </div>
        </div>

        {/* Business Rules */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span>🕐</span> Business Hours & Rules
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Business Hours Start</label>
                <input type="time" defaultValue="07:00" className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Business Hours End</label>
                <input type="time" defaultValue="17:00" className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">After-Hours Mode</label>
              <select className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50">
                <option>AI Dispatcher Only (no human backup)</option>
                <option>AI First, Escalate P1 to On-Call Tech</option>
                <option>AI Triage, Human Dispatcher Reviews</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Emergency Threshold (priority score)</label>
              <input type="number" defaultValue="50" min="0" max="100" className="w-24 bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50" />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
            Save Settings
          </button>
          <span className="text-xs text-slate-600">Settings are stored locally. API integration coming in Phase 2.</span>
        </div>
      </div>
    </div>
  );
}
