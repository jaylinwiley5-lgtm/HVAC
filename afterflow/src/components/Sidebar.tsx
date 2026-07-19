"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/calls", label: "Call Log", icon: "📞" },
  { href: "/scenarios", label: "Scenarios", icon: "🧪" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-[#0f172a] border-r border-[#1e293b] flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[#1e293b]">
        <h1 className="text-lg font-bold tracking-tight text-white">
          <span className="text-blue-500">After</span>Flow
        </h1>
        <p className="text-[10px] text-slate-500 mt-0.5 tracking-widest uppercase">AI Virtual Dispatcher</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1e293b]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-500">System Online</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">v0.1.0 · Phoenix, AZ</p>
      </div>
    </aside>
  );
}
