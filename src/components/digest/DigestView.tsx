'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Flag,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Zap,
  Calendar,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { ChatModal } from '@/components/ui/ChatModal';

export function DigestView() {
  const { sourceItems, dataReleases, thesis, currentDigest, addDigest } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tldr: true,
    market: true,
    data: true,
    narratives: true,
    thesis: false,
    threads: false,
  });
  const [chatItem, setChatItem] = useState<{
    title: string;
    content: string;
    source?: string;
  } | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const generateDigest = async () => {
    setIsGenerating(true);
    try {
      const recentItems = sourceItems.slice(0, 20).map((item) => ({
        source: item.author || 'Unknown',
        content: item.content,
        url: item.url,
      }));

      const dataWithValues = dataReleases
        .filter((d) => d.lastValue || d.trend)
        .map((d) => ({
          name: d.name,
          value: d.lastValue,
          trend: d.trend,
        }));

      const response = await fetch('/api/digest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: recentItems,
          dataReleases: dataWithValues,
          thesis: thesis
            ? { summary: thesis.summary, keyMonitors: thesis.keyMonitors }
            : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data.digest);

        addDigest({
          date: new Date().toISOString().split('T')[0],
          type: 'daily',
          sections: [],
          marketActivity: 'moderate',
          generatedAt: new Date().toISOString(),
          readingTimeMinutes: 15,
        });
      }
    } catch (error) {
      console.error('Error generating digest:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero Header */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-indigo-400">
                Daily Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Macro Digest
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {today}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span className="flex items-center gap-1">
                <BarChart3 size={14} />
                {sourceItems.length} sources analyzed
              </span>
            </div>
          </div>
          <button
            onClick={generateDigest}
            disabled={isGenerating}
            className="btn-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
            {isGenerating ? 'Generating...' : 'Generate Digest'}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/5 p-4 backdrop-blur">
            <p className="text-xs font-medium text-slate-400">New Content</p>
            <p className="mt-1 text-2xl font-bold text-white">{sourceItems.length}</p>
            <p className="text-xs text-indigo-400">+12 from yesterday</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 backdrop-blur">
            <p className="text-xs font-medium text-slate-400">Data Releases</p>
            <p className="mt-1 text-2xl font-bold text-white">{dataReleases.length}</p>
            <p className="text-xs text-slate-400">Tracked indicators</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 backdrop-blur">
            <p className="text-xs font-medium text-slate-400">Thesis Status</p>
            <p className="mt-1 text-2xl font-bold text-indigo-400">Active</p>
            <p className="text-xs text-slate-400">3 signals watching</p>
          </div>
        </div>
      </div>

      {/* Generated Content */}
      {generatedContent && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {generatedContent.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return (
                  <h2 key={i} className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={i} className="mt-4 text-md font-medium text-slate-800 dark:text-slate-200">
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <li key={i} className="ml-4 text-slate-600 dark:text-slate-400">
                    {line.replace('- ', '')}
                  </li>
                );
              }
              if (line.trim()) {
                return (
                  <p key={i} className="text-slate-600 dark:text-slate-400">
                    {line}
                  </p>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Recent Items */}
      <DigestSection
        title="Recent Content"
        description="Latest items from your sources"
        icon={<MessageSquare size={16} />}
        isExpanded={expandedSections.data}
        onToggle={() => toggleSection('data')}
        count={sourceItems.length}
      >
        {sourceItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <AlertCircle size={24} className="text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
              No content yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Add content using the button above or fetch from RSS feeds
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sourceItems.slice(0, 10).map((item) => (
              <SourceItemCard
                key={item.id}
                item={item}
                onDiscuss={() =>
                  setChatItem({
                    title: item.title,
                    content: item.content,
                    source: item.author,
                  })
                }
              />
            ))}
          </div>
        )}
      </DigestSection>

      {/* Data Releases */}
      <DigestSection
        title="Data Releases"
        description="Key economic indicators and their status"
        icon={<BarChart3 size={16} />}
        isExpanded={expandedSections.market}
        onToggle={() => toggleSection('market')}
        count={dataReleases.length}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {dataReleases.slice(0, 8).map((release) => (
            <DataReleaseCard key={release.id} release={release} />
          ))}
        </div>
      </DigestSection>

      {/* Thesis Check-in */}
      {thesis && (
        <DigestSection
          title="Thesis Check-in"
          description="Current investment thesis and signals"
          icon={<TrendingUp size={16} />}
          isExpanded={expandedSections.thesis}
          onToggle={() => toggleSection('thesis')}
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-4 dark:from-indigo-500/20 dark:to-violet-500/20">
              <h4 className="font-semibold text-slate-900 dark:text-white">{thesis.name}</h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{thesis.summary}</p>
            </div>

            <div>
              <h5 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Scenarios
              </h5>
              <div className="space-y-2">
                {thesis.scenarios.map((scenario, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {scenario.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                          style={{ width: `${scenario.probability}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {scenario.probability}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Turning Point Signals
              </h5>
              <div className="space-y-2">
                {thesis.turningPointSignals.map((signal, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        Phase {signal.phase}: {signal.name}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          signal.status === 'triggered'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : signal.status === 'watching'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {signal.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {signal.indicators.join(' • ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DigestSection>
      )}

      {/* Chat Modal */}
      {chatItem && (
        <ChatModal item={chatItem} onClose={() => setChatItem(null)} />
      )}
    </div>
  );
}

interface DigestSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  count?: number;
}

function DigestSection({
  title,
  description,
  icon,
  isExpanded,
  onToggle,
  children,
  count,
}: DigestSectionProps) {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:from-indigo-500/20 dark:to-violet-500/20 dark:text-indigo-400">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {count !== undefined && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {count}
            </span>
          )}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-slate-100 p-5 dark:border-slate-800">
          {children}
        </div>
      )}
    </div>
  );
}

interface SourceItemCardProps {
  item: {
    id: string;
    title: string;
    content: string;
    author?: string;
    url?: string;
    publishedAt: string;
    isFlagged: boolean;
    userRating?: 'up' | 'down';
  };
  onDiscuss: () => void;
}

function SourceItemCard({ item, onDiscuss }: SourceItemCardProps) {
  const { rateSourceItem, flagSourceItem } = useAppStore();

  return (
    <div className="card-hover group rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-white leading-tight">
            {item.title}
          </h4>
          {item.author && (
            <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              @{item.author}
            </p>
          )}
        </div>
        <span className="ml-4 flex-shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
          {new Date(item.publishedAt).toLocaleDateString()}
        </span>
      </div>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
        {item.content}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onDiscuss}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-violet-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:from-indigo-500/20 hover:to-violet-500/20 dark:text-indigo-400"
        >
          <MessageSquare size={12} />
          Discuss
        </button>
        <button
          onClick={() => flagSourceItem(item.id, !item.isFlagged)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            item.isFlagged
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
          }`}
        >
          <Flag size={12} />
          {item.isFlagged ? 'Flagged' : 'Flag'}
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => rateSourceItem(item.id, 'up')}
            className={`rounded-lg p-1.5 transition-all ${
              item.userRating === 'up'
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <ThumbsUp size={14} />
          </button>
          <button
            onClick={() => rateSourceItem(item.id, 'down')}
            className={`rounded-lg p-1.5 transition-all ${
              item.userRating === 'down'
                ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <ThumbsDown size={14} />
          </button>
        </div>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}

interface DataReleaseCardProps {
  release: {
    id: string;
    name: string;
    tier: string;
    lastValue?: string;
    trend?: string;
    thesisConnection: string;
  };
}

function DataReleaseCard({ release }: DataReleaseCardProps) {
  const TrendIcon =
    release.trend === 'up'
      ? TrendingUp
      : release.trend === 'down'
      ? TrendingDown
      : Minus;
  const trendColor =
    release.trend === 'up'
      ? 'text-emerald-500'
      : release.trend === 'down'
      ? 'text-red-500'
      : 'text-slate-400';
  const trendBg =
    release.trend === 'up'
      ? 'bg-emerald-50 dark:bg-emerald-500/10'
      : release.trend === 'down'
      ? 'bg-red-50 dark:bg-red-500/10'
      : 'bg-slate-50 dark:bg-slate-800';

  return (
    <div className="card-hover rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            {release.name}
          </h4>
          <p className="mt-1 text-xs text-slate-500">{release.thesisConnection}</p>
        </div>
        <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${trendBg}`}>
          {release.lastValue && (
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {release.lastValue}
            </span>
          )}
          <TrendIcon size={14} className={trendColor} />
        </div>
      </div>
      <div className="mt-3">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            release.tier === 'tier1'
              ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-700 dark:from-indigo-500/20 dark:to-violet-500/20 dark:text-indigo-400'
              : release.tier === 'tier2'
              ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
          }`}
        >
          {release.tier.replace('tier', 'Tier ')}
        </span>
      </div>
    </div>
  );
}
