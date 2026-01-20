'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Source,
  SourceItem,
  DataRelease,
  KnowledgeEntry,
  Prediction,
  Digest,
  ChatSession,
  ChatMessage,
  Thesis,
  ThesisHistoryEntry,
  OpenThread,
  IntlMarketData,
} from '@/types';
import { initialSources, initialDataReleases, initialThesis } from '@/lib/initial-data';
import * as db from '@/lib/supabase-service';

function generateId(): string {
  return crypto.randomUUID();
}

interface AppState {
  // Sources
  sources: Source[];
  sourceItems: SourceItem[];
  addSource: (source: Omit<Source, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSource: (id: string, updates: Partial<Source>) => void;
  deleteSource: (id: string) => void;
  addSourceItem: (item: Omit<SourceItem, 'id' | 'createdAt'>) => void;
  updateSourceItem: (id: string, updates: Partial<SourceItem>) => void;
  rateSourceItem: (id: string, rating: 'up' | 'down') => void;
  flagSourceItem: (id: string, flagged: boolean) => void;
  // Source intelligence
  muteSourceForToday: (sourceId: string) => void;
  unmuteSource: (sourceId: string) => void;
  incrementSourceCitation: (sourceId: string) => void;
  calculateSuggestedWeights: () => void;
  getActiveSourceItems: () => SourceItem[]; // Excludes muted sources

  // Data Releases
  dataReleases: DataRelease[];
  updateDataRelease: (id: string, updates: Partial<DataRelease>) => void;

  // Knowledge Base
  knowledgeEntries: KnowledgeEntry[];
  addKnowledgeEntry: (entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateKnowledgeEntry: (id: string, updates: Partial<KnowledgeEntry>) => void;
  deleteKnowledgeEntry: (id: string) => void;

  // Predictions
  predictions: Prediction[];
  addPrediction: (prediction: Omit<Prediction, 'id' | 'createdAt'>) => void;
  updatePrediction: (id: string, updates: Partial<Prediction>) => void;

  // Digests
  digests: Digest[];
  currentDigest: Digest | null;
  addDigest: (digest: Omit<Digest, 'id'>) => void;
  setCurrentDigest: (digest: Digest | null) => void;
  // Open threads
  getRecentOpenThreads: (days?: number) => OpenThread[];
  resolveThread: (threadId: string, resolvedBy?: string) => void;
  addOpenThreadsToDigest: (digestId: string, threads: Omit<OpenThread, 'id'>[]) => void;

  // Chat
  chatSessions: ChatSession[];
  activeChatSession: ChatSession | null;
  createChatSession: (title: string, contextType?: string, contextId?: string) => ChatSession;
  addMessageToSession: (sessionId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  setActiveChatSession: (session: ChatSession | null) => void;

  // Thesis
  thesis: Thesis | null;
  updateThesis: (updates: Partial<Thesis>) => void;
  addThesisHistoryEntry: (entry: Omit<ThesisHistoryEntry, 'id' | 'date'>) => void;
  updateThesisSignalStatus: (phase: number, status: 'not_triggered' | 'watching' | 'triggered', triggeredBy?: string) => void;
  updateScenarioProbability: (scenarioName: string, probability: number, triggeredBy?: string) => void;

  // International Market Data
  intlMarketData: IntlMarketData;
  setIntlMarketData: (data: Partial<IntlMarketData>) => void;
  clearIntlMarketData: () => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: 'digest' | 'knowledge' | 'sources' | 'data' | 'predictions' | 'settings';
  setActiveView: (view: AppState['activeView']) => void;

  // Data loading
  isLoading: boolean;
  isSupabaseConnected: boolean;
  loadFromSupabase: () => Promise<void>;
  initializeData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      sources: [],
      sourceItems: [],
      dataReleases: [],
      knowledgeEntries: [],
      predictions: [],
      digests: [],
      currentDigest: null,
      chatSessions: [],
      activeChatSession: null,
      thesis: null,
      intlMarketData: {},
      sidebarOpen: true,
      activeView: 'digest',
      isLoading: false,
      isSupabaseConnected: false,

      // Load data from Supabase
      loadFromSupabase: async () => {
        if (!db.isSupabaseConfigured()) {
          console.log('Supabase not configured, using localStorage');
          return;
        }

        set({ isLoading: true });

        try {
          const data = await db.loadAllData();

          // Only update state if we got data from Supabase
          const hasData = data.sources.length > 0 ||
                          data.dataReleases.length > 0 ||
                          data.thesis !== null;

          if (hasData) {
            set({
              sources: data.sources,
              sourceItems: data.sourceItems,
              dataReleases: data.dataReleases,
              knowledgeEntries: data.knowledgeEntries,
              predictions: data.predictions,
              digests: data.digests,
              chatSessions: data.chatSessions,
              thesis: data.thesis,
              isSupabaseConnected: true,
            });
            console.log('Loaded data from Supabase');
          } else {
            // No data in Supabase, initialize with defaults and save to Supabase
            console.log('No data in Supabase, initializing with defaults');
            get().initializeData();
            set({ isSupabaseConnected: true });

            // Save initial data to Supabase
            const state = get();
            await Promise.all([
              ...state.sources.map((s) => db.saveSource(s)),
              ...state.dataReleases.map((d) => db.saveDataRelease(d)),
              state.thesis ? db.saveThesis(state.thesis) : Promise.resolve(),
            ]);
            console.log('Saved initial data to Supabase');
          }
        } catch (error) {
          console.error('Error loading from Supabase:', error);
          set({ isSupabaseConnected: false });
        } finally {
          set({ isLoading: false });
        }
      },

      // Source actions
      addSource: (source) => {
        const newSource: Source = {
          ...source,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ sources: [...state.sources, newSource] }));

        // Sync to Supabase
        if (get().isSupabaseConnected) {
          db.saveSource(newSource).catch((err) => console.error('Failed to save source:', err));
        }
      },

      updateSource: (id, updates) => {
        let updatedSource: Source | undefined;
        set((state) => {
          const sources = state.sources.map((s) => {
            if (s.id === id) {
              updatedSource = { ...s, ...updates, updatedAt: new Date().toISOString() };
              return updatedSource;
            }
            return s;
          });
          return { sources };
        });

        // Sync to Supabase
        if (get().isSupabaseConnected && updatedSource) {
          db.saveSource(updatedSource).catch((err) => console.error('Failed to update source:', err));
        }
      },

      deleteSource: (id) => {
        set((state) => ({
          sources: state.sources.filter((s) => s.id !== id),
          sourceItems: state.sourceItems.filter((i) => i.sourceId !== id),
        }));

        // Sync to Supabase
        if (get().isSupabaseConnected) {
          db.deleteSourceFromDb(id).catch((err) => console.error('Failed to delete source:', err));
          db.deleteSourceItemsForSource(id).catch((err) => console.error('Failed to delete source items:', err));
        }
      },

      addSourceItem: (item) => {
        const newItem: SourceItem = {
          ...item,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ sourceItems: [newItem, ...state.sourceItems] }));

        // Sync to Supabase
        if (get().isSupabaseConnected) {
          db.saveSourceItem(newItem).catch((err) => console.error('Failed to save source item:', err));
        }
      },

      updateSourceItem: (id, updates) => {
        let updatedItem: SourceItem | undefined;
        set((state) => {
          const sourceItems = state.sourceItems.map((i) => {
            if (i.id === id) {
              updatedItem = { ...i, ...updates };
              return updatedItem;
            }
            return i;
          });
          return { sourceItems };
        });

        // Sync to Supabase
        if (get().isSupabaseConnected && updatedItem) {
          db.saveSourceItem(updatedItem).catch((err) => console.error('Failed to update source item:', err));
        }
      },

      rateSourceItem: (id, rating) => {
        let updatedItem: SourceItem | undefined;
        set((state) => {
          const sourceItems = state.sourceItems.map((i) => {
            if (i.id === id) {
              updatedItem = { ...i, userRating: i.userRating === rating ? undefined : rating };
              return updatedItem;
            }
            return i;
          });
          return { sourceItems };
        });

        // Also update source weight based on rating
        const item = get().sourceItems.find((i) => i.id === id);
        if (item?.sourceId) {
          const source = get().sources.find((s) => s.id === item.sourceId);
          if (source) {
            const weightDelta = rating === 'up' ? 0.05 : -0.05;
            get().updateSource(source.id, {
              weight: Math.max(0.1, Math.min(2.0, source.weight + weightDelta)),
            });
          }
        }

        // Sync to Supabase
        if (get().isSupabaseConnected && updatedItem) {
          db.saveSourceItem(updatedItem).catch((err) => console.error('Failed to save rated item:', err));
        }
      },

      flagSourceItem: (id, flagged) => {
        let updatedItem: SourceItem | undefined;
        set((state) => {
          const sourceItems = state.sourceItems.map((i) => {
            if (i.id === id) {
              updatedItem = { ...i, isFlagged: flagged };
              return updatedItem;
            }
            return i;
          });
          return { sourceItems };
        });

        // Sync to Supabase
        if (get().isSupabaseConnected && updatedItem) {
          db.saveSourceItem(updatedItem).catch((err) => console.error('Failed to save flagged item:', err));
        }
      },

      // Source intelligence functions
      muteSourceForToday: (sourceId) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        get().updateSource(sourceId, { mutedUntil: tomorrow.toISOString() });
      },

      unmuteSource: (sourceId) => {
        get().updateSource(sourceId, { mutedUntil: undefined });
      },

      incrementSourceCitation: (sourceId) => {
        const source = get().sources.find((s) => s.id === sourceId);
        if (!source) return;

        const currentMetrics = source.metrics || { citationCount: 0, upvotes: 0, downvotes: 0 };
        get().updateSource(sourceId, {
          metrics: {
            ...currentMetrics,
            citationCount: currentMetrics.citationCount + 1,
            lastCitedDate: new Date().toISOString(),
          },
        });
      },

      calculateSuggestedWeights: () => {
        const state = get();
        const updates: { id: string; suggestedWeight: number }[] = [];

        for (const source of state.sources) {
          // Get all items from this source
          const sourceItems = state.sourceItems.filter((i) => i.sourceId === source.id);
          if (sourceItems.length === 0) continue;

          // Calculate metrics
          const upvotes = sourceItems.filter((i) => i.userRating === 'up').length;
          const downvotes = sourceItems.filter((i) => i.userRating === 'down').length;
          const totalRated = upvotes + downvotes;

          if (totalRated < 3) continue; // Need enough data

          const metrics = source.metrics || { citationCount: 0, upvotes: 0, downvotes: 0 };

          // Calculate score: (upvotes - downvotes) / total + citation bonus
          const ratingScore = (upvotes - downvotes) / totalRated; // -1 to 1
          const citationBonus = Math.min(metrics.citationCount * 0.02, 0.2); // Up to 0.2 bonus

          // Convert to weight (0.1 to 2.0)
          // Base: 1.0, adjustment: -0.5 to +0.5 from rating, +0.2 max from citations
          const suggestedWeight = Math.max(
            0.1,
            Math.min(2.0, 1.0 + ratingScore * 0.5 + citationBonus)
          );

          // Only suggest if different from current
          if (Math.abs(suggestedWeight - source.weight) > 0.1) {
            updates.push({ id: source.id, suggestedWeight });
          }

          // Update metrics
          get().updateSource(source.id, {
            metrics: {
              ...metrics,
              upvotes,
              downvotes,
              avgRelevanceScore: totalRated > 0 ? (upvotes / totalRated) * 100 : undefined,
            },
          });
        }

        // Apply suggestions
        for (const update of updates) {
          get().updateSource(update.id, { suggestedWeight: update.suggestedWeight });
        }
      },

      getActiveSourceItems: () => {
        const state = get();
        const now = new Date().toISOString();

        // Get IDs of muted sources
        const mutedSourceIds = new Set(
          state.sources
            .filter((s) => s.mutedUntil && s.mutedUntil > now)
            .map((s) => s.id)
        );

        // Filter out items from muted sources
        return state.sourceItems.filter((item) => !mutedSourceIds.has(item.sourceId));
      },

      // Data Release actions
      updateDataRelease: (id, updates) => {
        let updatedRelease: DataRelease | undefined;
        set((state) => {
          const dataReleases = state.dataReleases.map((d) => {
            if (d.id === id) {
              updatedRelease = { ...d, ...updates, updatedAt: new Date().toISOString() };
              return updatedRelease;
            }
            return d;
          });
          return { dataReleases };
        });

        // Sync to Supabase
        if (get().isSupabaseConnected && updatedRelease) {
          db.saveDataRelease(updatedRelease).catch((err) => console.error('Failed to save data release:', err));
        }
      },

      // Knowledge Base actions
      addKnowledgeEntry: (entry) => {
        const newEntry: KnowledgeEntry = {
          ...entry,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ knowledgeEntries: [...state.knowledgeEntries, newEntry] }));

        // Sync to Supabase
        if (get().isSupabaseConnected) {
          db.saveKnowledgeEntry(newEntry).catch((err) => console.error('Failed to save knowledge entry:', err));
        }
      },

      updateKnowledgeEntry: (id, updates) => {
        let updatedEntry: KnowledgeEntry | undefined;
        set((state) => {
          const knowledgeEntries = state.knowledgeEntries.map((e) => {
            if (e.id === id) {
              updatedEntry = { ...e, ...updates, updatedAt: new Date().toISOString() };
              return updatedEntry;
            }
            return e;
          });
          return { knowledgeEntries };
        });

        // Sync to Supabase
        if (get().isSupabaseConnected && updatedEntry) {
          db.saveKnowledgeEntry(updatedEntry).catch((err) => console.error('Failed to update knowledge entry:', err));
        }
      },

      deleteKnowledgeEntry: (id) => {
        set((state) => ({
          knowledgeEntries: state.knowledgeEntries.filter((e) => e.id !== id),
        }));

        // Sync to Supabase
        if (get().isSupabaseConnected) {
          db.deleteKnowledgeEntryFromDb(id).catch((err) => console.error('Failed to delete knowledge entry:', err));
        }
      },

      // Prediction actions
      addPrediction: (prediction) => {
        const newPrediction: Prediction = {
          ...prediction,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ predictions: [...state.predictions, newPrediction] }));

        // Sync to Supabase
        if (get().isSupabaseConnected) {
          db.savePrediction(newPrediction).catch((err) => console.error('Failed to save prediction:', err));
        }
      },

      updatePrediction: (id, updates) => {
        let updatedPrediction: Prediction | undefined;
        set((state) => {
          const predictions = state.predictions.map((p) => {
            if (p.id === id) {
              updatedPrediction = { ...p, ...updates };
              return updatedPrediction;
            }
            return p;
          });
          return { predictions };
        });

        // Sync to Supabase
        if (get().isSupabaseConnected && updatedPrediction) {
          db.savePrediction(updatedPrediction).catch((err) => console.error('Failed to update prediction:', err));
        }
      },

      // Digest actions
      addDigest: (digest) => {
        const newDigest: Digest = {
          ...digest,
          id: generateId(),
        };
        set((state) => ({
          digests: [newDigest, ...state.digests],
          currentDigest: newDigest,
        }));

        // Sync to Supabase
        if (get().isSupabaseConnected) {
          db.saveDigest(newDigest).catch((err) => console.error('Failed to save digest:', err));
        }
      },

      setCurrentDigest: (digest) => {
        set({ currentDigest: digest });
      },

      getRecentOpenThreads: (days = 7) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffStr = cutoffDate.toISOString();

        const state = get();
        const threads: OpenThread[] = [];

        // Collect open threads from recent digests
        for (const digest of state.digests) {
          if (digest.generatedAt < cutoffStr) continue;
          if (!digest.openThreads) continue;

          for (const thread of digest.openThreads) {
            if (thread.status === 'open') {
              threads.push(thread);
            }
          }
        }

        // Sort by creation date (most recent first) and dedupe
        return threads
          .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
          .slice(0, 10); // Limit to 10 most recent
      },

      resolveThread: (threadId, resolvedBy) => {
        let updatedDigest: Digest | undefined;

        set((state) => {
          const digests = state.digests.map((digest) => {
            if (!digest.openThreads) return digest;

            const threadIndex = digest.openThreads.findIndex((t) => t.id === threadId);
            if (threadIndex === -1) return digest;

            const updatedThreads = [...digest.openThreads];
            updatedThreads[threadIndex] = {
              ...updatedThreads[threadIndex],
              status: 'resolved',
              resolvedDate: new Date().toISOString(),
              resolvedBy,
            };

            updatedDigest = { ...digest, openThreads: updatedThreads };
            return updatedDigest;
          });

          return { digests };
        });

        if (get().isSupabaseConnected && updatedDigest) {
          db.saveDigest(updatedDigest).catch((err) => console.error('Failed to save resolved thread:', err));
        }
      },

      addOpenThreadsToDigest: (digestId, threads) => {
        let updatedDigest: Digest | undefined;

        set((state) => {
          const digests = state.digests.map((digest) => {
            if (digest.id !== digestId) return digest;

            const newThreads: OpenThread[] = threads.map((t) => ({
              ...t,
              id: generateId(),
            }));

            updatedDigest = {
              ...digest,
              openThreads: [...(digest.openThreads || []), ...newThreads],
            };
            return updatedDigest;
          });

          return {
            digests,
            currentDigest: state.currentDigest?.id === digestId ? updatedDigest : state.currentDigest,
          };
        });

        if (get().isSupabaseConnected && updatedDigest) {
          db.saveDigest(updatedDigest).catch((err) => console.error('Failed to save open threads:', err));
        }
      },

      // Chat actions
      createChatSession: (title, contextType, contextId) => {
        const newSession: ChatSession = {
          id: generateId(),
          title,
          contextType: contextType as ChatSession['contextType'],
          contextId,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          chatSessions: [...state.chatSessions, newSession],
          activeChatSession: newSession,
        }));

        // Sync to Supabase
        if (get().isSupabaseConnected) {
          db.saveChatSession(newSession).catch((err) => console.error('Failed to save chat session:', err));
        }

        return newSession;
      },

      addMessageToSession: (sessionId, message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        let updatedSession: ChatSession | undefined;
        set((state) => {
          const chatSessions = state.chatSessions.map((s) => {
            if (s.id === sessionId) {
              updatedSession = {
                ...s,
                messages: [...s.messages, newMessage],
                updatedAt: new Date().toISOString()
              };
              return updatedSession;
            }
            return s;
          });

          return {
            chatSessions,
            activeChatSession:
              state.activeChatSession?.id === sessionId
                ? {
                    ...state.activeChatSession,
                    messages: [...state.activeChatSession.messages, newMessage],
                    updatedAt: new Date().toISOString(),
                  }
                : state.activeChatSession,
          };
        });

        // Sync to Supabase
        if (get().isSupabaseConnected && updatedSession) {
          db.saveChatSession(updatedSession).catch((err) => console.error('Failed to update chat session:', err));
        }
      },

      setActiveChatSession: (session) => {
        set({ activeChatSession: session });
      },

      // Thesis actions
      updateThesis: (updates) => {
        let updatedThesis: Thesis | null = null;
        set((state) => {
          if (state.thesis) {
            updatedThesis = { ...state.thesis, ...updates, lastUpdated: new Date().toISOString() };
            return { thesis: updatedThesis };
          }
          return {};
        });

        // Sync to Supabase
        if (get().isSupabaseConnected && updatedThesis) {
          db.saveThesis(updatedThesis).catch((err) => console.error('Failed to save thesis:', err));
        }
      },

      addThesisHistoryEntry: (entry) => {
        const newEntry: ThesisHistoryEntry = {
          ...entry,
          id: generateId(),
          date: new Date().toISOString(),
        };

        let updatedThesis: Thesis | null = null;
        set((state) => {
          if (state.thesis) {
            const history = state.thesis.history || [];
            updatedThesis = {
              ...state.thesis,
              history: [newEntry, ...history].slice(0, 50), // Keep last 50 entries
              lastUpdated: new Date().toISOString(),
            };
            return { thesis: updatedThesis };
          }
          return {};
        });

        if (get().isSupabaseConnected && updatedThesis) {
          db.saveThesis(updatedThesis).catch((err) => console.error('Failed to save thesis history:', err));
        }
      },

      updateThesisSignalStatus: (phase, status, triggeredBy) => {
        const state = get();
        if (!state.thesis) return;

        const signal = state.thesis.turningPointSignals.find((s) => s.phase === phase);
        if (!signal || signal.status === status) return;

        const previousStatus = signal.status;
        const updatedSignals = state.thesis.turningPointSignals.map((s) =>
          s.phase === phase ? { ...s, status } : s
        );

        get().updateThesis({ turningPointSignals: updatedSignals });
        get().addThesisHistoryEntry({
          changeType: 'signal_update',
          description: `Phase ${phase} (${signal.name}): ${previousStatus} → ${status}`,
          previousValue: previousStatus,
          newValue: status,
          triggeredBy,
        });
      },

      updateScenarioProbability: (scenarioName, probability, triggeredBy) => {
        const state = get();
        if (!state.thesis) return;

        const scenario = state.thesis.scenarios.find((s) => s.name === scenarioName);
        if (!scenario || scenario.probability === probability) return;

        const previousProbability = scenario.probability;
        const updatedScenarios = state.thesis.scenarios.map((s) =>
          s.name === scenarioName ? { ...s, probability } : s
        );

        get().updateThesis({ scenarios: updatedScenarios });
        get().addThesisHistoryEntry({
          changeType: 'scenario_update',
          description: `${scenarioName}: ${previousProbability}% → ${probability}%`,
          previousValue: `${previousProbability}%`,
          newValue: `${probability}%`,
          triggeredBy,
        });
      },

      // International market data actions
      setIntlMarketData: (data) => {
        set((state) => ({
          intlMarketData: {
            ...state.intlMarketData,
            ...data,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      clearIntlMarketData: () => {
        set({ intlMarketData: {} });
      },

      // UI actions
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setActiveView: (view) => {
        set({ activeView: view });
      },

      // Initialize with default data
      initializeData: () => {
        const state = get();
        if (state.sources.length === 0) {
          const sources: Source[] = initialSources.map((s) => ({
            ...s,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          set({ sources });
        }
        if (state.dataReleases.length === 0) {
          const releases: DataRelease[] = initialDataReleases.map((d) => ({
            ...d,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          set({ dataReleases: releases });
        }
        if (!state.thesis) {
          set({
            thesis: {
              ...initialThesis,
              id: generateId(),
            },
          });
        }
      },
    }),
    {
      name: 'macro-research-store',
      partialize: (state) => ({
        sources: state.sources,
        sourceItems: state.sourceItems,
        dataReleases: state.dataReleases,
        knowledgeEntries: state.knowledgeEntries,
        predictions: state.predictions,
        digests: state.digests,
        chatSessions: state.chatSessions,
        thesis: state.thesis,
        intlMarketData: state.intlMarketData,
      }),
    }
  )
);
