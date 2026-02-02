'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import {
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  Eye,
  ChevronRight,
  BookOpen,
  Lightbulb,
} from 'lucide-react';

export function KnowledgeView() {
  const { knowledgeEntries, sourceItems, addKnowledgeEntry, deleteKnowledgeEntry } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  // Get unique topics
  const topics = Array.from(new Set(knowledgeEntries.map((e) => e.topic)));

  // Get flagged items
  const flaggedItems = sourceItems.filter((item) => item.isFlagged);

  // Filter entries
  const filteredEntries = knowledgeEntries.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.conclusion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTopic = !selectedTopic || entry.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <button
          onClick={() => setShowNewEntryForm(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          New Entry
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar - Topics */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">
              Topics
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedTopic(null)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  !selectedTopic
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                <span>All Topics</span>
                <span className="text-xs">{knowledgeEntries.length}</span>
              </button>
              {topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    selectedTopic === topic
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="truncate">{topic}</span>
                  <span className="text-xs">
                    {knowledgeEntries.filter((e) => e.topic === topic).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Flagged Items */}
            {flaggedItems.length > 0 && (
              <>
                <hr className="my-4 border-zinc-200 dark:border-zinc-800" />
                <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">
                  Flagged for Review
                </h3>
                <div className="space-y-2">
                  {flaggedItems.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/20"
                    >
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        {new Date(item.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {flaggedItems.length > 5 && (
                    <p className="text-xs text-zinc-500">
                      +{flaggedItems.length - 5} more
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <BookOpen size={40} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                No entries yet
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Start building your knowledge base by flagging content or creating new entries.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <KnowledgeEntryCard
                key={entry.id}
                entry={entry}
                onDelete={() => deleteKnowledgeEntry(entry.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* New Entry Modal */}
      {showNewEntryForm && (
        <NewEntryModal
          existingTopics={topics}
          onClose={() => setShowNewEntryForm(false)}
          onSave={(entry) => {
            addKnowledgeEntry(entry);
            setShowNewEntryForm(false);
          }}
        />
      )}
    </div>
  );
}

interface KnowledgeEntryCardProps {
  entry: {
    id: string;
    topic: string;
    dateCreated: string;
    thesisImpact: string;
    keyInsights: string[];
    conclusion: string;
    catalystToWatch?: string;
    status: string;
    tags: string[];
  };
  onDelete: () => void;
}

function KnowledgeEntryCard({ entry, onDelete }: KnowledgeEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">{entry.topic}</h3>
            <p className="text-xs text-zinc-500">
              {new Date(entry.dateCreated).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              entry.status === 'open'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : entry.status === 'watching'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {entry.status}
          </span>
        </div>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{entry.thesisImpact}</p>

        <div className="mt-3 flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {isExpanded ? 'Show less' : 'Show more'}
          <ChevronRight
            size={14}
            className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
              <Lightbulb size={14} />
              Key Insights
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {entry.keyInsights.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="mb-2 text-sm font-medium text-zinc-900 dark:text-white">
              Conclusion
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{entry.conclusion}</p>
          </div>

          {entry.catalystToWatch && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-zinc-900 dark:text-white">
                Catalyst to Watch
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{entry.catalystToWatch}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button className="flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700">
              <Edit2 size={12} />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface NewEntryModalProps {
  existingTopics: string[];
  onClose: () => void;
  onSave: (entry: {
    topic: string;
    dateCreated: string;
    thesisImpact: string;
    keyInsights: string[];
    conclusion: string;
    catalystToWatch?: string;
    status: 'open' | 'closed' | 'watching';
    relatedItemIds: string[];
    tags: string[];
  }) => void;
}

function NewEntryModal({ existingTopics, onClose, onSave }: NewEntryModalProps) {
  const [topic, setTopic] = useState('');
  const [thesisImpact, setThesisImpact] = useState('');
  const [keyInsights, setKeyInsights] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [catalyst, setCatalyst] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'open' | 'closed' | 'watching'>('open');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      topic,
      dateCreated: new Date().toISOString(),
      thesisImpact,
      keyInsights: keyInsights.split('\n').filter((i) => i.trim()),
      conclusion,
      catalystToWatch: catalyst || undefined,
      status,
      relatedItemIds: [],
      tags: tags.split(',').map((t) => t.trim()).filter((t) => t),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
          New Knowledge Entry
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              list="topics"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <datalist id="topics">
              {existingTopics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Thesis Impact
            </label>
            <input
              type="text"
              value={thesisImpact}
              onChange={(e) => setThesisImpact(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Key Insights (one per line)
            </label>
            <textarea
              value={keyInsights}
              onChange={(e) => setKeyInsights(e.target.value)}
              rows={3}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Conclusion
            </label>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              rows={2}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Catalyst to Watch (optional)
            </label>
            <input
              type="text"
              value={catalyst}
              onChange={(e) => setCatalyst(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="housing, inflation, fed"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="open">Open</option>
              <option value="watching">Watching</option>
              <option value="closed">Closed</option>
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
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
