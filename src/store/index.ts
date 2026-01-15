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
} from '@/types';
import { initialSources, initialDataReleases, initialThesis } from '@/lib/initial-data';

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

  // Chat
  chatSessions: ChatSession[];
  activeChatSession: ChatSession | null;
  createChatSession: (title: string, contextType?: string, contextId?: string) => ChatSession;
  addMessageToSession: (sessionId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  setActiveChatSession: (session: ChatSession | null) => void;

  // Thesis
  thesis: Thesis | null;
  updateThesis: (updates: Partial<Thesis>) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: 'digest' | 'knowledge' | 'sources' | 'data' | 'predictions' | 'settings';
  setActiveView: (view: AppState['activeView']) => void;

  // Initialize with default data
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
      sidebarOpen: true,
      activeView: 'digest',

      // Source actions
      addSource: (source) => {
        const newSource: Source = {
          ...source,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ sources: [...state.sources, newSource] }));
      },

      updateSource: (id, updates) => {
        set((state) => ({
          sources: state.sources.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        }));
      },

      deleteSource: (id) => {
        set((state) => ({
          sources: state.sources.filter((s) => s.id !== id),
          sourceItems: state.sourceItems.filter((i) => i.sourceId !== id),
        }));
      },

      addSourceItem: (item) => {
        const newItem: SourceItem = {
          ...item,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ sourceItems: [newItem, ...state.sourceItems] }));
      },

      updateSourceItem: (id, updates) => {
        set((state) => ({
          sourceItems: state.sourceItems.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
      },

      rateSourceItem: (id, rating) => {
        set((state) => ({
          sourceItems: state.sourceItems.map((i) =>
            i.id === id ? { ...i, userRating: i.userRating === rating ? undefined : rating } : i
          ),
        }));
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
      },

      flagSourceItem: (id, flagged) => {
        set((state) => ({
          sourceItems: state.sourceItems.map((i) => (i.id === id ? { ...i, isFlagged: flagged } : i)),
        }));
      },

      // Data Release actions
      updateDataRelease: (id, updates) => {
        set((state) => ({
          dataReleases: state.dataReleases.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        }));
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
      },

      updateKnowledgeEntry: (id, updates) => {
        set((state) => ({
          knowledgeEntries: state.knowledgeEntries.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        }));
      },

      deleteKnowledgeEntry: (id) => {
        set((state) => ({
          knowledgeEntries: state.knowledgeEntries.filter((e) => e.id !== id),
        }));
      },

      // Prediction actions
      addPrediction: (prediction) => {
        const newPrediction: Prediction = {
          ...prediction,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ predictions: [...state.predictions, newPrediction] }));
      },

      updatePrediction: (id, updates) => {
        set((state) => ({
          predictions: state.predictions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
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
      },

      setCurrentDigest: (digest) => {
        set({ currentDigest: digest });
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
        return newSession;
      },

      addMessageToSession: (sessionId, message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          chatSessions: state.chatSessions.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [...s.messages, newMessage], updatedAt: new Date().toISOString() }
              : s
          ),
          activeChatSession:
            state.activeChatSession?.id === sessionId
              ? {
                  ...state.activeChatSession,
                  messages: [...state.activeChatSession.messages, newMessage],
                  updatedAt: new Date().toISOString(),
                }
              : state.activeChatSession,
        }));
      },

      setActiveChatSession: (session) => {
        set({ activeChatSession: session });
      },

      // Thesis actions
      updateThesis: (updates) => {
        set((state) => ({
          thesis: state.thesis
            ? { ...state.thesis, ...updates, lastUpdated: new Date().toISOString() }
            : null,
        }));
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
      }),
    }
  )
);
