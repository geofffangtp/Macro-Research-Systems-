'use client';

import { useAppStore } from '@/store';
import { Menu, Bell, Plus, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ManualInputModal } from '@/components/ui/ManualInputModal';

export function Header() {
  const { sidebarOpen, setSidebarOpen, activeView } = useAppStore();
  const [showInputModal, setShowInputModal] = useState(false);

  const titles: Record<string, string> = {
    digest: 'Daily Digest',
    knowledge: 'Knowledge Base',
    sources: 'Sources',
    data: 'Data Releases',
    predictions: 'Prediction Ledger',
    settings: 'Settings',
  };

  const descriptions: Record<string, string> = {
    digest: 'Your personalized market intelligence',
    knowledge: 'Curated insights and research',
    sources: 'Track your information sources',
    data: 'Economic indicators and releases',
    predictions: 'Track and validate predictions',
    settings: 'Customize your experience',
  };

  return (
    <>
      <header
        className={`fixed right-0 top-0 z-30 flex h-16 items-center justify-between px-6 transition-all duration-300 ${
          sidebarOpen ? 'left-64' : 'left-16'
        }`}
        style={{
          background: 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              {titles[activeView]}
            </h2>
            <p className="text-xs text-slate-500">{descriptions[activeView]}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-slate-500">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search..."
              className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {/* Add Content Button */}
          <button
            onClick={() => setShowInputModal(true)}
            className="btn-gradient flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Content</span>
          </button>

          {/* AI Assistant */}
          <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/50">
            <Sparkles size={16} />
          </button>

          {/* Notifications */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200">
            <Bell size={18} />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>
        </div>
      </header>

      {/* Dark mode header styles */}
      <style jsx>{`
        @media (prefers-color-scheme: dark) {
          header {
            background: rgba(3, 7, 18, 0.8) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          }
        }
      `}</style>

      <ManualInputModal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
      />
    </>
  );
}
