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
          db.saveSource(newSource);
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
          db.saveSource(updatedSource);
        }
      },

      deleteSource: (id) => {
        set((state) => ({
          sources: state.sources.filter((s) => s.id !== id),
          sourceItems: state.sourceItems.filter((i) => i.sourceId !== id),
        }));

        // Sync to Supabase
        if (get().isSupabaseConnected) {
          db.deleteSourceFromDb(id);
          db.deleteSourceItemsForSource(id);
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
          db.saveSourceItem(newItem);
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
          db.saveSourceItem(updatedItem);
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
          db.saveSourceItem(updatedItem);
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
          db.saveSourceItem(updatedItem);
        }
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
          db.saveDataRelease(updatedRelease);
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
          db.saveKnowledgeEntry(newEntry);
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
          db.saveKnowledgeEntry(updatedEntry);
        }
      },

      deleteKnowledgeEntry: (id) => {
        set((state) => ({
          knowledgeEntries: state.knowledgeEntries.filter((e) => e.id !== id),
        }));

        // Sync to Supabase
        if (get().isSupabaseConnected) {
          db.deleteKnowledgeEntryFromDb(id);
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
          db.savePrediction(newPrediction);
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
          db.savePrediction(updatedPrediction);
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
          db.saveDigest(newDigest);
        }
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

        // Sync to Supabase
        if (get().isSupabaseConnected) {
          db.saveChatSession(newSession);
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
          db.saveChatSession(updatedSession);
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
          db.saveThesis(updatedThesis);
        }
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
