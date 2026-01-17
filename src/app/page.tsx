'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DigestView } from '@/components/digest/DigestView';
import { KnowledgeView } from '@/components/knowledge/KnowledgeView';
import { SourcesView } from '@/components/sources/SourcesView';
import { DataReleasesView } from '@/components/sources/DataReleasesView';
import { PredictionsView } from '@/components/sources/PredictionsView';
import { SettingsView } from '@/components/sources/SettingsView';

export default function Home() {
  const { activeView, sidebarOpen, initializeData, loadFromSupabase, isLoading, isSupabaseConnected } = useAppStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Try to load from Supabase first
      await loadFromSupabase();
      // If Supabase didn't have data, initializeData will be called inside loadFromSupabase
      // If Supabase is not configured, fall back to localStorage
      if (!isSupabaseConnected) {
        initializeData();
      }
      setInitialized(true);
    };
    init();
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'digest':
        return <DigestView />;
      case 'knowledge':
        return <KnowledgeView />;
      case 'sources':
        return <SourcesView />;
      case 'data':
        return <DataReleasesView />;
      case 'predictions':
        return <PredictionsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DigestView />;
    }
  };

  // Show loading screen while initializing
  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your research data...</p>
          {isSupabaseConnected && (
            <p className="text-xs text-green-600 mt-2">Connected to cloud database</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      {/* Subtle grid pattern background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Gradient orbs for visual interest */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Connection status indicator */}
      {isSupabaseConnected && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-3 py-1.5 rounded-full shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Cloud Sync Active
        </div>
      )}

      <Sidebar />
      <Header />
      <main
        className={`relative pt-20 transition-all duration-300 ${
          sidebarOpen ? 'pl-64' : 'pl-16'
        }`}
      >
        <div className="px-6 pb-8">{renderView()}</div>
      </main>
    </div>
  );
}
