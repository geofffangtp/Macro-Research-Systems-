'use client';

import { useEffect } from 'react';
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
  const { activeView, sidebarOpen, initializeData } = useAppStore();

  useEffect(() => {
    initializeData();
  }, [initializeData]);

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <Header />
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'pl-64' : 'pl-16'
        }`}
      >
        <div className="p-6">{renderView()}</div>
      </main>
    </div>
  );
}
