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
      className={`fixed left-0 top-0 z-40 h-screen bg-zinc-900 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
          {sidebarOpen && (
            <h1 className="text-lg font-semibold text-white">Macro Research</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-4">
          {sidebarOpen && (
            <p className="text-xs text-zinc-500">
              Resilient Bear Thesis
              <br />
              Last updated: Jan 2026
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
