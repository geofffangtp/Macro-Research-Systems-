'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import {
  Plus,
  Twitter,
  Rss,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Check,
} from 'lucide-react';

export function SourcesView() {
  const { sources, addSource, updateSource, deleteSource, addSourceItem } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [fetchingRss, setFetchingRss] = useState<string | null>(null);
  const [fetchingAll, setFetchingAll] = useState(false);

  const twitterSources = sources.filter((s) => s.platform === 'twitter' && !s.rssUrl);
  const rssSources = sources.filter((s) => s.rssUrl);

  const fetchRssFeed = async (source: typeof sources[0]) => {
    if (!source.rssUrl) return;
    setFetchingRss(source.id);
    try {
      const response = await fetch('/api/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: source.rssUrl }),
      });
      if (response.ok) {
        const data = await response.json();
        for (const item of data.items.slice(0, 5)) {
          addSourceItem({
            sourceId: source.id,
            title: item.title,
            content: item.content,
            url: item.link,
            author: item.author || source.name,
            publishedAt: item.pubDate,
            fetchedAt: new Date().toISOString(),
            isRead: false,
            isFlagged: false,
          });
        }
        updateSource(source.id, { lastFetched: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Error fetching RSS:', error);
    } finally {
      setFetchingRss(null);
    }
  };

  const fetchAllRss = async () => {
    setFetchingAll(true);
    for (const source of rssSources) {
      await fetchRssFeed(source);
    }
    setFetchingAll(false);
  };

  const tierColors = {
    tier1: 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-700 dark:text-indigo-400',
    tier2: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    tier3: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    tier4: 'bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500',
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                <Users size={16} className="text-white" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-indigo-400">
                Information Sources
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Source Management
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {sources.length} sources tracked • {rssSources.length} with RSS feeds
            </p>
          </div>
          <div className="flex items-center gap-2">
            {rssSources.length > 0 && (
              <button
                onClick={fetchAllRss}
                disabled={fetchingAll}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
              >
                <RefreshCw size={16} className={fetchingAll ? 'animate-spin' : ''} />
                {fetchingAll ? 'Fetching...' : 'Fetch All RSS'}
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-gradient flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Add Source
            </button>
          </div>
        </div>
      </div>

      {/* RSS/Substack Sources */}
      {rssSources.length > 0 && (
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
              <Rss size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                RSS & Newsletter Sources
              </h3>
              <p className="text-xs text-slate-500">
                {rssSources.length} sources with auto-fetch capability
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rssSources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                tierColors={tierColors}
                onDelete={() => deleteSource(source.id)}
                onUpdateWeight={(weight) => updateSource(source.id, { weight })}
                onFetchRss={() => fetchRssFeed(source)}
                isFetching={fetchingRss === source.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Twitter Sources */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
            <Twitter size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Twitter/X Accounts
            </h3>
            <p className="text-xs text-slate-500">
              {twitterSources.length} accounts (manual content input)
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {twitterSources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              tierColors={tierColors}
              onDelete={() => deleteSource(source.id)}
              onUpdateWeight={(weight) => updateSource(source.id, { weight })}
            />
          ))}
        </div>
      </div>

      {/* Weight Legend */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Zap size={16} className="text-indigo-500" />
          Source Tier System
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tierColors.tier1}`}>
              Tier 1
            </span>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Core Signal - Always included in digest
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tierColors.tier2}`}>
              Tier 2
            </span>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Rotate by Relevance - Context dependent
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tierColors.tier3}`}>
              Tier 3
            </span>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Contrarian/Discovery - Use with skepticism
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tierColors.tier4}`}>
              Tier 4
            </span>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Discovery - New/unproven sources
            </p>
          </div>
        </div>
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <AddSourceModal
          onClose={() => setShowAddModal(false)}
          onSave={(source) => {
            addSource(source);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

interface SourceCardProps {
  source: {
    id: string;
    handle: string;
    name: string;
    focus: string;
    tier: string;
    weight: number;
    platform: string;
    rssUrl?: string;
    lastFetched?: string;
  };
  tierColors: Record<string, string>;
  onDelete: () => void;
  onUpdateWeight: (weight: number) => void;
  onFetchRss?: () => void;
  isFetching?: boolean;
}

function SourceCard({
  source,
  tierColors,
  onDelete,
  onUpdateWeight,
  onFetchRss,
  isFetching,
}: SourceCardProps) {
  return (
    <div className="card-hover rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-white truncate">{source.name}</h4>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">@{source.handle}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierColors[source.tier]}`}>
          {source.tier.replace('tier', 'T')}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500 line-clamp-2">{source.focus}</p>

      {/* Weight indicator */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-slate-500">Weight:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateWeight(Math.max(0.1, source.weight - 0.1))}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <TrendingDown size={12} />
          </button>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {source.weight.toFixed(1)}x
          </span>
          <button
            onClick={() => onUpdateWeight(Math.min(2.0, source.weight + 0.1))}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <TrendingUp size={12} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        {source.platform === 'twitter' && !source.rssUrl && (
          <a
            href={`https://twitter.com/${source.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
          >
            <ExternalLink size={12} />
            View
          </a>
        )}
        {source.rssUrl && onFetchRss && (
          <button
            onClick={onFetchRss}
            disabled={isFetching}
            className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/30"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? 'Fetching...' : 'Fetch'}
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {source.lastFetched && (
        <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
          <Check size={10} />
          Fetched {new Date(source.lastFetched).toLocaleString()}
        </p>
      )}
    </div>
  );
}

interface AddSourceModalProps {
  onClose: () => void;
  onSave: (source: {
    handle: string;
    name: string;
    focus: string;
    style: string;
    tier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
    weight: number;
    platform: 'twitter' | 'substack' | 'rss';
    rssUrl?: string;
  }) => void;
}

function AddSourceModal({ onClose, onSave }: AddSourceModalProps) {
  const [platform, setPlatform] = useState<'twitter' | 'substack' | 'rss'>('twitter');
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [focus, setFocus] = useState('');
  const [tier, setTier] = useState<'tier1' | 'tier2' | 'tier3' | 'tier4'>('tier2');
  const [rssUrl, setRssUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      handle: handle.replace('@', ''),
      name: name || handle,
      focus,
      style: '',
      tier,
      weight: tier === 'tier1' ? 1.0 : tier === 'tier2' ? 0.7 : 0.4,
      platform,
      rssUrl: platform !== 'twitter' ? rssUrl : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Add Source
        </h3>

        {/* Platform selector */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setPlatform('twitter')}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              platform === 'twitter'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Twitter size={16} />
            Twitter/X
          </button>
          <button
            type="button"
            onClick={() => setPlatform('substack')}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              platform === 'substack'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Rss size={16} />
            Substack
          </button>
          <button
            type="button"
            onClick={() => setPlatform('rss')}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              platform === 'rss'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Rss size={16} />
            RSS
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              {platform === 'twitter' ? 'Handle' : 'Name'}
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={platform === 'twitter' ? '@username' : 'Newsletter name'}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {platform !== 'twitter' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                RSS URL
              </label>
              <input
                type="url"
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
                placeholder="https://example.substack.com/feed"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Display Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Focus/Topics
            </label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Macro, housing, Fed policy..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as typeof tier)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="tier1">Tier 1 - Core Signal</option>
              <option value="tier2">Tier 2 - Rotate by Relevance</option>
              <option value="tier3">Tier 3 - Contrarian</option>
              <option value="tier4">Tier 4 - Discovery</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gradient rounded-xl px-4 py-2 text-sm font-medium text-white"
            >
              Add Source
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
