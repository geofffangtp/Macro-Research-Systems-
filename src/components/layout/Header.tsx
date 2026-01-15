'use client';

import { useAppStore } from '@/store';
import { Menu, Bell, Plus } from 'lucide-react';
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

  return (
    <>
      <header
        className={`fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950 ${
          sidebarOpen ? 'left-64' : 'left-16'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            {titles[activeView]}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInputModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Content</span>
          </button>
          <button className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Bell size={20} />
          </button>
        </div>
      </header>

      <ManualInputModal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
      />
    </>
  );
}
