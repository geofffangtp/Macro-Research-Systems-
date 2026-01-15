'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import {
  Plus,
  Twitter,
  Rss,
  Database,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Star,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export function SourcesView() {
  const { sources, addSource, updateSource, deleteSource, addSourceItem } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [fetchingRss, setFetchingRss] = useState<string | null>(null);

  const twitterSources = sources.filter((s) => s.platform === 'twitter');
  const rssSources = sources.filter((s) => s.platform === 'substack');

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

  const tierColors = {
    tier1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    tier2: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
    tier3: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    tier4: 'bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500',
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Source Management
          </h2>
          <p className="text-sm text-zinc-500">
            {sources.length} sources tracked
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Source
        </button>
      </div>

      {/* Twitter Sources */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Twitter size={18} className="text-zinc-500" />
          <h3 className="font-medium text-zinc-900 dark:text-white">Twitter/X Accounts</h3>
          <span className="text-sm text-zinc-500">({twitterSources.length})</span>
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

      {/* RSS/Substack Sources */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Rss size={18} className="text-zinc-500" />
          <h3 className="font-medium text-zinc-900 dark:text-white">Substacks & RSS Feeds</h3>
          <span className="text-sm text-zinc-500">({rssSources.length})</span>
        </div>
        {rssSources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <Rss size={32} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500">No RSS feeds added yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Add a Substack
            </button>
          </div>
        ) : (
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
        )}
      </div>

      {/* Weight Legend */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 font-medium text-zinc-900 dark:text-white">Source Tiers</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${tierColors.tier1}`}>
              Tier 1
            </span>
            <p className="mt-1 text-xs text-zinc-500">Core Signal - Always included</p>
          </div>
          <div>
            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${tierColors.tier2}`}>
              Tier 2
            </span>
            <p className="mt-1 text-xs text-zinc-500">Rotate by Relevance</p>
          </div>
          <div>
            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${tierColors.tier3}`}>
              Tier 3
            </span>
            <p className="mt-1 text-xs text-zinc-500">Contrarian/Discovery</p>
          </div>
          <div>
            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${tierColors.tier4}`}>
              Tier 4
            </span>
            <p className="mt-1 text-xs text-zinc-500">Discovery - New sources</p>
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-zinc-900 dark:text-white">{source.name}</h4>
          <p className="text-sm text-zinc-500">@{source.handle}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tierColors[source.tier]}`}>
          {source.tier.replace('tier', 'T')}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{source.focus}</p>

      {/* Weight indicator */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-zinc-500">Weight:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateWeight(Math.max(0.1, source.weight - 0.1))}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <TrendingDown size={12} />
          </button>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {source.weight.toFixed(1)}x
          </span>
          <button
            onClick={() => onUpdateWeight(Math.min(2.0, source.weight + 0.1))}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <TrendingUp size={12} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        {source.platform === 'twitter' && (
          <a
            href={`https://twitter.com/${source.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            <ExternalLink size={12} />
            View
          </a>
        )}
        {source.rssUrl && onFetchRss && (
          <button
            onClick={onFetchRss}
            disabled={isFetching}
            className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? 'Fetching...' : 'Fetch'}
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
        >
          <Trash2 size={12} />
          Remove
        </button>
      </div>

      {source.lastFetched && (
        <p className="mt-2 text-xs text-zinc-400">
          Last fetched: {new Date(source.lastFetched).toLocaleString()}
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
    platform: 'twitter' | 'substack';
    rssUrl?: string;
  }) => void;
}

function AddSourceModal({ onClose, onSave }: AddSourceModalProps) {
  const [platform, setPlatform] = useState<'twitter' | 'substack'>('twitter');
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
      rssUrl: platform === 'substack' ? rssUrl : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
          Add Source
        </h3>

        {/* Platform selector */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setPlatform('twitter')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              platform === 'twitter'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Twitter size={16} />
            Twitter/X
          </button>
          <button
            type="button"
            onClick={() => setPlatform('substack')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              platform === 'substack'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Rss size={16} />
            Substack
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {platform === 'twitter' ? 'Handle' : 'Name'}
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={platform === 'twitter' ? '@username' : 'Newsletter name'}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {platform === 'substack' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                RSS URL
              </label>
              <input
                type="url"
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
                placeholder="https://example.substack.com/feed"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Display Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Focus/Topics
            </label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Macro, housing, Fed policy..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as typeof tier)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
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
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Source
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
