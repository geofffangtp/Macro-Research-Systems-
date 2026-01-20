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
  Edit3,
  History,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GitBranch,
  Plus,
  Check,
  Clock,
  FileText,
  X,
  ChevronLeft,
} from 'lucide-react';
import { InternationalDataInput } from '@/components/ui/InternationalDataInput';

// Helper to dispatch discuss event to the chat panel
function dispatchDiscussEvent(item: { title: string; content: string; source?: string }) {
  const event = new CustomEvent('discuss-item', {
    detail: {
      prompt: `Let's discuss: "${item.title}"\n\n${item.content.slice(0, 500)}${item.content.length > 500 ? '...' : ''}`,
    },
  });
  window.dispatchEvent(event);
}

// Helper function to extract open threads from digest content
function extractOpenThreads(content: string): string[] {
  const threads: string[] = [];

  // Look for "OPEN QUESTIONS" or "Open Questions" section
  const openQuestionsMatch = content.match(/##\s*OPEN QUESTIONS[\s\S]*?(?=##|$)/i);
  if (openQuestionsMatch) {
    const section = openQuestionsMatch[0];
    // Extract bullet points
    const bullets = section.match(/[-•]\s*[^\n]+/g);
    if (bullets) {
      bullets.forEach((bullet) => {
        const cleaned = bullet.replace(/^[-•]\s*/, '').trim();
        if (cleaned.length > 10 && cleaned.length < 500) {
          threads.push(cleaned);
        }
      });
    }
  }

  // Also look for "OPEN THREADS" section
  const openThreadsMatch = content.match(/##\s*OPEN THREADS[\s\S]*?(?=##|$)/i);
  if (openThreadsMatch) {
    const section = openThreadsMatch[0];
    const bullets = section.match(/[-•]\s*[^\n]+/g);
    if (bullets) {
      bullets.forEach((bullet) => {
        const cleaned = bullet.replace(/^[-•]\s*/, '').trim();
        if (cleaned.length > 10 && cleaned.length < 500 && !threads.includes(cleaned)) {
          threads.push(cleaned);
        }
      });
    }
  }

  return threads.slice(0, 5); // Limit to 5 threads per digest
}

// Helper function to extract source citations from digest content
function extractSourceCitations(content: string): string[] {
  const citations = new Set<string>();

  // Match @SourceName patterns
  const matches = content.matchAll(/@([A-Za-z0-9_]+)/g);
  for (const match of matches) {
    citations.add(match[1]);
  }

  return Array.from(citations);
}

export function DigestView() {
  const {
    sources,
    sourceItems,
    dataReleases,
    thesis,
    knowledgeEntries,
    currentDigest,
    digests,
    addDigest,
    updateThesis,
    updateThesisSignalStatus,
    updateScenarioProbability,
    addThesisHistoryEntry,
    getActiveSourceItems,
    getRecentOpenThreads,
    resolveThread,
    addOpenThreadsToDigest,
    incrementSourceCitation,
    intlMarketData,
  } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tldr: true,
    market: true,
    data: true,
    narratives: true,
    thesis: false,
    threads: false,
    history: false,
  });
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [showThesisEditor, setShowThesisEditor] = useState(false);
  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [scenarioProbInput, setScenarioProbInput] = useState<number>(0);
  const [newThreadInput, setNewThreadInput] = useState<string>('');
  const [showAddThread, setShowAddThread] = useState(false);
  const [showDigestHistory, setShowDigestHistory] = useState(false);
  const [selectedHistoryDigest, setSelectedHistoryDigest] = useState<string | null>(null);

  // Get open threads for display
  const recentOpenThreads = getRecentOpenThreads(7);

  // Get selected digest content for history view
  const historyDigest = selectedHistoryDigest
    ? digests.find((d) => d.id === selectedHistoryDigest)
    : null;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const generateDigest = async () => {
    setIsGenerating(true);
    try {
      // Get active items (excludes muted sources)
      const activeItems = getActiveSourceItems();

      // Get recent items with better source attribution
      const recentItems = activeItems.slice(0, 30).map((item) => {
        // Try to get a good source name
        const source = item.source?.name || item.author || 'Unknown';
        return {
          source,
          content: item.content,
          url: item.url,
          title: item.title,
        };
      });

      // Build full thesis context including scenarios and turning point signals
      const thesisPayload = thesis
        ? {
            name: thesis.name,
            summary: thesis.summary,
            keyMonitors: thesis.keyMonitors,
            scenarios: thesis.scenarios,
            turningPointSignals: thesis.turningPointSignals,
          }
        : null;

      // Prepare knowledge base context - prioritize recent and relevant entries
      const recentKnowledge = knowledgeEntries
        .filter((e) => e.status !== 'closed') // Only active entries
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10) // Last 10 relevant entries
        .map((e) => ({
          topic: e.topic,
          conclusion: e.conclusion,
          dateCreated: e.dateCreated,
          thesisImpact: e.thesisImpact,
          status: e.status,
          catalystToWatch: e.catalystToWatch,
        }));

      // Get recent open threads for continuity
      const openThreads = getRecentOpenThreads(7).map((t) => ({
        content: t.content,
        createdDate: t.createdDate,
        status: t.status,
      }));

      const response = await fetch('/api/digest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: recentItems,
          thesis: thesisPayload,
          knowledgeEntries: recentKnowledge,
          recentOpenThreads: openThreads,
          intlMarketData: intlMarketData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data.digest);

        // Log market data for debugging
        if (data.marketData) {
          console.log('Market data used:', data.marketData);
        }

        // Extract open threads from the generated content
        const extractedThreads = extractOpenThreads(data.digest);

        // Extract source citations for tracking
        const citedSources = extractSourceCitations(data.digest);
        citedSources.forEach((sourceName) => {
          const source = sources.find(
            (s) => s.name.toLowerCase() === sourceName.toLowerCase() ||
                   s.handle.toLowerCase() === sourceName.toLowerCase()
          );
          if (source) {
            incrementSourceCitation(source.id);
          }
        });

        const newDigest = {
          date: new Date().toISOString().split('T')[0],
          type: 'daily' as const,
          sections: [],
          marketActivity: 'moderate' as const,
          generatedAt: new Date().toISOString(),
          readingTimeMinutes: 15,
          rawContent: data.digest,
          openThreads: extractedThreads.map((content) => ({
            id: crypto.randomUUID(),
            content,
            createdDate: new Date().toISOString(),
            status: 'open' as const,
          })),
        };

        addDigest(newDigest);
      } else {
        const errorData = await response.json();
        console.error('Digest generation failed:', errorData.error);
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
    <div className="mx-auto max-w-4xl px-4 sm:px-0">
      {/* Hero Header */}
      <div className="mb-4 sm:mb-6 overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                <Zap size={14} className="text-white sm:hidden" />
                <Zap size={16} className="text-white hidden sm:block" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-indigo-400">
                Daily Intelligence
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Macro Digest
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="sm:hidden" />
                <Calendar size={14} className="hidden sm:block" />
                <span className="hidden sm:inline">{today}</span>
                <span className="sm:hidden">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span className="flex items-center gap-1">
                <BarChart3 size={12} className="sm:hidden" />
                <BarChart3 size={14} className="hidden sm:block" />
                {sourceItems.length} sources
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {digests.length > 0 && (
              <button
                onClick={() => setShowDigestHistory(true)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-white/10 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-white/20"
              >
                <Clock size={14} className="sm:hidden" />
                <Clock size={16} className="hidden sm:block" />
                <span className="hidden sm:inline">History ({digests.length})</span>
                <span className="sm:hidden">{digests.length}</span>
              </button>
            )}
            <button
              onClick={generateDigest}
              disabled={isGenerating}
              className="btn-gradient flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white disabled:opacity-50"
            >
              <RefreshCw size={14} className={`sm:hidden ${isGenerating ? 'animate-spin' : ''}`} />
              <RefreshCw size={16} className={`hidden sm:block ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* International Market Data Input */}
        <div className="mt-4 sm:mt-6">
          <InternationalDataInput />
        </div>

        {/* Quick Stats */}
        <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="rounded-lg sm:rounded-xl bg-white/5 p-2.5 sm:p-4 backdrop-blur">
            <p className="text-[10px] sm:text-xs font-medium text-slate-400">Content</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold text-white">{sourceItems.length}</p>
            <p className="text-[10px] sm:text-xs text-indigo-400 hidden sm:block">+12 from yesterday</p>
          </div>
          <div className="rounded-lg sm:rounded-xl bg-white/5 p-2.5 sm:p-4 backdrop-blur">
            <p className="text-[10px] sm:text-xs font-medium text-slate-400">Releases</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold text-white">{dataReleases.length}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Tracked indicators</p>
          </div>
          <div className="rounded-lg sm:rounded-xl bg-white/5 p-2.5 sm:p-4 backdrop-blur">
            <p className="text-[10px] sm:text-xs font-medium text-slate-400">Thesis</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold text-indigo-400">Active</p>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">3 signals watching</p>
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
                  dispatchDiscussEvent({
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
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">{thesis.name}</h4>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{thesis.summary}</p>
                </div>
                <button
                  onClick={() => setShowThesisEditor(!showThesisEditor)}
                  className="ml-4 rounded-lg p-2 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                  title="Edit thesis"
                >
                  <Edit3 size={16} />
                </button>
              </div>
              {thesis.lastUpdated && (
                <p className="mt-2 text-xs text-slate-500">
                  Last updated: {new Date(thesis.lastUpdated).toLocaleDateString()}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Scenarios
                </h5>
                {showThesisEditor && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400">Click probabilities to edit</span>
                )}
              </div>
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
                      {showThesisEditor && editingScenario === scenario.name ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={scenarioProbInput}
                            onChange={(e) => setScenarioProbInput(Number(e.target.value))}
                            className="w-14 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700"
                          />
                          <button
                            onClick={() => {
                              updateScenarioProbability(scenario.name, scenarioProbInput, `Digest update ${new Date().toLocaleDateString()}`);
                              setEditingScenario(null);
                            }}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => setEditingScenario(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (showThesisEditor) {
                              setEditingScenario(scenario.name);
                              setScenarioProbInput(scenario.probability);
                            }
                          }}
                          className={`text-sm font-bold text-slate-900 dark:text-white ${showThesisEditor ? 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400' : ''}`}
                        >
                          {scenario.probability}%
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Turning Point Signals
                </h5>
                {showThesisEditor && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400">Click status to update</span>
                )}
              </div>
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
                      {showThesisEditor ? (
                        <div className="flex gap-1">
                          {(['not_triggered', 'watching', 'triggered'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => updateThesisSignalStatus(signal.phase, status, `Digest update ${new Date().toLocaleDateString()}`)}
                              className={`rounded-full px-2 py-1 text-xs font-semibold transition-all ${
                                signal.status === status
                                  ? status === 'triggered'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : status === 'watching'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700'
                              }`}
                            >
                              {status === 'not_triggered' ? '⚪' : status === 'watching' ? '🟡' : '🟢'}
                            </button>
                          ))}
                        </div>
                      ) : (
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
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {signal.indicators.join(' • ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Thesis History */}
            {thesis.history && thesis.history.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('history')}
                  className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <History size={14} />
                  Change History ({thesis.history.length})
                  {expandedSections.history ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedSections.history && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {thesis.history.slice(0, 10).map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {entry.changeType.replace('_', ' ')}
                          </span>
                          <span className="text-slate-500">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-600 dark:text-slate-400">{entry.description}</p>
                        {entry.triggeredBy && (
                          <p className="mt-1 text-slate-400 text-[10px]">via {entry.triggeredBy}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DigestSection>
      )}

      {/* Open Threads */}
      <DigestSection
        title="Open Threads"
        description="Questions and developments worth tracking"
        icon={<GitBranch size={16} />}
        isExpanded={expandedSections.threads}
        onToggle={() => toggleSection('threads')}
        count={recentOpenThreads.length}
      >
        <div className="space-y-3">
          {recentOpenThreads.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No open threads. Threads from your digests will appear here.
            </p>
          ) : (
            recentOpenThreads.map((thread) => (
              <div
                key={thread.id}
                className="flex items-start justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700"
              >
                <div className="flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{thread.content}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Opened {new Date(thread.createdDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => resolveThread(thread.id, `Manual resolution ${new Date().toLocaleDateString()}`)}
                  className="ml-3 flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30"
                >
                  <Check size={12} />
                  Resolve
                </button>
              </div>
            ))
          )}

          {/* Add new thread */}
          {showAddThread ? (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-800 dark:bg-indigo-500/10">
              <input
                type="text"
                value={newThreadInput}
                onChange={(e) => setNewThreadInput(e.target.value)}
                placeholder="What's worth tracking?"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAddThread(false);
                    setNewThreadInput('');
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newThreadInput.trim() && currentDigest) {
                      addOpenThreadsToDigest(currentDigest.id, [{
                        content: newThreadInput.trim(),
                        createdDate: new Date().toISOString(),
                        status: 'open',
                      }]);
                      setNewThreadInput('');
                      setShowAddThread(false);
                    }
                  }}
                  disabled={!newThreadInput.trim() || !currentDigest}
                  className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                  Add Thread
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddThread(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            >
              <Plus size={16} />
              Add Open Thread
            </button>
          )}
        </div>
      </DigestSection>

      {/* Digest History Modal */}
      {showDigestHistory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex h-[90vh] sm:h-[80vh] w-full sm:max-w-5xl flex-col sm:flex-row overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            {/* Sidebar - Digest List */}
            <div className={`${selectedHistoryDigest ? 'hidden sm:block' : 'block'} w-full sm:w-72 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700`}>
              <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <History size={18} />
                  Digest History
                </h3>
                <button
                  onClick={() => {
                    setShowDigestHistory(false);
                    setSelectedHistoryDigest(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="h-full overflow-y-auto p-2">
                {digests.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">No digests yet</p>
                ) : (
                  <div className="space-y-1">
                    {digests.map((digest) => (
                      <button
                        key={digest.id}
                        onClick={() => setSelectedHistoryDigest(digest.id)}
                        className={`w-full rounded-xl p-3 text-left transition-all ${
                          selectedHistoryDigest === digest.id
                            ? 'bg-indigo-50 dark:bg-indigo-500/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {new Date(digest.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>{digest.type}</span>
                          {digest.openThreads && digest.openThreads.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{digest.openThreads.filter((t) => t.status === 'open').length} open threads</span>
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content - Selected Digest */}
            <div className={`${selectedHistoryDigest ? 'block' : 'hidden sm:block'} flex-1 overflow-y-auto`}>
              {!selectedHistoryDigest ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-400">
                  <FileText size={48} className="mb-4 opacity-50" />
                  <p>Select a digest to view</p>
                </div>
              ) : historyDigest ? (
                <div className="p-4 sm:p-6">
                  <div className="mb-4 sm:mb-6 flex items-center gap-3">
                    {/* Back button for mobile */}
                    <button
                      onClick={() => setSelectedHistoryDigest(null)}
                      className="sm:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        {new Date(historyDigest.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Generated at {new Date(historyDigest.generatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Open Threads from this digest */}
                  {historyDigest.openThreads && historyDigest.openThreads.length > 0 && (
                    <div className="mb-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <GitBranch size={14} />
                        Threads from this digest
                      </h4>
                      <div className="space-y-2">
                        {historyDigest.openThreads.map((thread) => (
                          <div
                            key={thread.id}
                            className={`flex items-start gap-2 rounded-lg p-2 text-sm ${
                              thread.status === 'resolved'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {thread.status === 'resolved' ? (
                              <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                            )}
                            <span>{thread.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Content */}
                  {historyDigest.rawContent ? (
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      {historyDigest.rawContent.split('\n').map((line, i) => {
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
                  ) : (
                    <p className="text-sm text-slate-500">
                      No content saved for this digest.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
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
