'use client';

import { useAppStore } from '@/store';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Database,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const navItems = [
  { id: 'digest' as const, label: 'Daily Digest', icon: LayoutDashboard },
  { id: 'knowledge' as const, label: 'Knowledge Base', icon: BookOpen },
  { id: 'sources' as const, label: 'Sources', icon: Users },
  { id: 'data' as const, label: 'Data Releases', icon: Database },
  { id: 'predictions' as const, label: 'Predictions', icon: Target },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

      <div className="relative flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                <TrendingUp size={18} className="text-white" />
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">
                Macro<span className="text-indigo-400">Pro</span>
              </span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 mx-auto">
              <TrendingUp size={18} className="text-white" />
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 shadow-lg transition-all hover:bg-slate-700 hover:text-white"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-6">
          {sidebarOpen && (
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Navigation
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-white shadow-lg shadow-indigo-500/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-800 group-hover:bg-slate-700'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : ''} />
                </div>
                {sidebarOpen && <span>{item.label}</span>}
                {isActive && sidebarOpen && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          {sidebarOpen ? (
            <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-3">
              <p className="text-xs font-medium text-slate-300">Current Thesis</p>
              <p className="mt-1 text-sm font-semibold text-white">Resilient Bear</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Updated Jan 2026</p>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 mx-auto">
              <div className="h-2 w-2 rounded-full bg-indigo-400" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
