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
      // Get recent items
      const recentItems = sourceItems.slice(0, 20).map((item) => ({
        source: item.author || 'Unknown',
        content: item.content,
        url: item.url,
      }));

      // Get data releases with values
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

        // Save digest
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
      {/* Header */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              MACRO DIGEST
            </h1>
            <p className="text-sm text-zinc-500">{today}</p>
          </div>
          <button
            onClick={generateDigest}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
            {isGenerating ? 'Generating...' : 'Generate Digest'}
          </button>
        </div>
      </div>

      {/* Generated Content */}
      {generatedContent && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {generatedContent.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return (
                  <h2 key={i} className="mt-6 text-lg font-semibold text-zinc-900 dark:text-white">
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={i} className="mt-4 text-md font-medium text-zinc-800 dark:text-zinc-200">
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <li key={i} className="ml-4 text-zinc-700 dark:text-zinc-300">
                    {line.replace('- ', '')}
                  </li>
                );
              }
              if (line.trim()) {
                return (
                  <p key={i} className="text-zinc-700 dark:text-zinc-300">
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
        title="RECENT CONTENT"
        description="Latest items from your sources"
        isExpanded={expandedSections.data}
        onToggle={() => toggleSection('data')}
      >
        {sourceItems.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No content yet. Add content using the button above or fetch from RSS feeds.
          </p>
        ) : (
          <div className="space-y-4">
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
        title="DATA RELEASES"
        description="Key economic indicators and their status"
        isExpanded={expandedSections.market}
        onToggle={() => toggleSection('market')}
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
          title="THESIS CHECK-IN"
          description="Current investment thesis and signals"
          isExpanded={expandedSections.thesis}
          onToggle={() => toggleSection('thesis')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-zinc-900 dark:text-white">{thesis.name}</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{thesis.summary}</p>
            </div>
            <div>
              <h5 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Scenarios
              </h5>
              <div className="space-y-2">
                {thesis.scenarios.map((scenario, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800"
                  >
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {scenario.name}
                    </span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {scenario.probability}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Turning Point Signals
              </h5>
              <div className="space-y-2">
                {thesis.turningPointSignals.map((signal, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        Phase {signal.phase}: {signal.name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          signal.status === 'triggered'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : signal.status === 'watching'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {signal.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
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
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function DigestSection({
  title,
  description,
  isExpanded,
  onToggle,
  children,
}: DigestSectionProps) {
  return (
    <div className="mb-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4"
      >
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-zinc-500" />
        ) : (
          <ChevronDown size={20} className="text-zinc-500" />
        )}
      </button>
      {isExpanded && (
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
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
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h4 className="font-medium text-zinc-900 dark:text-white">{item.title}</h4>
          {item.author && (
            <p className="text-xs text-zinc-500">@{item.author}</p>
          )}
        </div>
        <span className="text-xs text-zinc-400">
          {new Date(item.publishedAt).toLocaleDateString()}
        </span>
      </div>
      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
        {item.content}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onDiscuss}
          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
        >
          <MessageSquare size={12} />
          Discuss
        </button>
        <button
          onClick={() => flagSourceItem(item.id, !item.isFlagged)}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
            item.isFlagged
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          <Flag size={12} />
          {item.isFlagged ? 'Flagged' : 'Flag'}
        </button>
        <button
          onClick={() => rateSourceItem(item.id, 'up')}
          className={`rounded-lg p-1 ${
            item.userRating === 'up'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ThumbsUp size={14} />
        </button>
        <button
          onClick={() => rateSourceItem(item.id, 'down')}
          className={`rounded-lg p-1 ${
            item.userRating === 'down'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ThumbsDown size={14} />
        </button>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
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
      ? 'text-green-600'
      : release.trend === 'down'
      ? 'text-red-600'
      : 'text-zinc-400';

  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium text-zinc-900 dark:text-white">
            {release.name}
          </h4>
          <p className="text-xs text-zinc-500">{release.thesisConnection}</p>
        </div>
        <div className="flex items-center gap-1">
          {release.lastValue && (
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {release.lastValue}
            </span>
          )}
          <TrendIcon size={14} className={trendColor} />
        </div>
      </div>
      <div className="mt-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            release.tier === 'tier1'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : release.tier === 'tier2'
              ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
              : 'bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500'
          }`}
        >
          {release.tier.replace('tier', 'Tier ')}
        </span>
      </div>
    </div>
  );
}
