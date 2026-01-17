'use client';

import { supabase } from './supabase';
import {
  Source,
  SourceItem,
  DataRelease,
  KnowledgeEntry,
  Prediction,
  Digest,
  ChatSession,
  Thesis,
} from '@/types';

// Helper to convert snake_case to camelCase
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// Helper to convert camelCase to snake_case
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

// ============ SOURCES ============

export async function loadSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading sources:', error);
    return [];
  }

  return (data || []).map((item) => toCamelCase(item) as unknown as Source);
}

export async function saveSource(source: Source): Promise<void> {
  const dbSource = toSnakeCase(source as unknown as Record<string, unknown>);
  const { error } = await supabase
    .from('sources')
    .upsert(dbSource, { onConflict: 'id' });

  if (error) {
    console.error('Error saving source:', error);
  }
}

export async function deleteSourceFromDb(id: string): Promise<void> {
  const { error } = await supabase
    .from('sources')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting source:', error);
  }
}

// ============ SOURCE ITEMS ============

export async function loadSourceItems(): Promise<SourceItem[]> {
  const { data, error } = await supabase
    .from('source_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading source items:', error);
    return [];
  }

  return (data || []).map((item) => toCamelCase(item) as unknown as SourceItem);
}

export async function saveSourceItem(item: SourceItem): Promise<void> {
  const dbItem = toSnakeCase(item as unknown as Record<string, unknown>);
  const { error } = await supabase
    .from('source_items')
    .upsert(dbItem, { onConflict: 'id' });

  if (error) {
    console.error('Error saving source item:', error);
  }
}

export async function deleteSourceItemsForSource(sourceId: string): Promise<void> {
  const { error } = await supabase
    .from('source_items')
    .delete()
    .eq('source_id', sourceId);

  if (error) {
    console.error('Error deleting source items:', error);
  }
}

// ============ DATA RELEASES ============

export async function loadDataReleases(): Promise<DataRelease[]> {
  const { data, error } = await supabase
    .from('data_releases')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading data releases:', error);
    return [];
  }

  return (data || []).map((item) => toCamelCase(item) as unknown as DataRelease);
}

export async function saveDataRelease(release: DataRelease): Promise<void> {
  const dbRelease = toSnakeCase(release as unknown as Record<string, unknown>);
  const { error } = await supabase
    .from('data_releases')
    .upsert(dbRelease, { onConflict: 'id' });

  if (error) {
    console.error('Error saving data release:', error);
  }
}

// ============ KNOWLEDGE ENTRIES ============

export async function loadKnowledgeEntries(): Promise<KnowledgeEntry[]> {
  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading knowledge entries:', error);
    return [];
  }

  return (data || []).map((item) => toCamelCase(item) as unknown as KnowledgeEntry);
}

export async function saveKnowledgeEntry(entry: KnowledgeEntry): Promise<void> {
  const dbEntry = toSnakeCase(entry as unknown as Record<string, unknown>);
  const { error } = await supabase
    .from('knowledge_entries')
    .upsert(dbEntry, { onConflict: 'id' });

  if (error) {
    console.error('Error saving knowledge entry:', error);
  }
}

export async function deleteKnowledgeEntryFromDb(id: string): Promise<void> {
  const { error } = await supabase
    .from('knowledge_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting knowledge entry:', error);
  }
}

// ============ PREDICTIONS ============

export async function loadPredictions(): Promise<Prediction[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading predictions:', error);
    return [];
  }

  return (data || []).map((item) => toCamelCase(item) as unknown as Prediction);
}

export async function savePrediction(prediction: Prediction): Promise<void> {
  const dbPrediction = toSnakeCase(prediction as unknown as Record<string, unknown>);
  const { error } = await supabase
    .from('predictions')
    .upsert(dbPrediction, { onConflict: 'id' });

  if (error) {
    console.error('Error saving prediction:', error);
  }
}

// ============ DIGESTS ============

export async function loadDigests(): Promise<Digest[]> {
  const { data, error } = await supabase
    .from('digests')
    .select('*')
    .order('generated_at', { ascending: false });

  if (error) {
    console.error('Error loading digests:', error);
    return [];
  }

  return (data || []).map((item) => toCamelCase(item) as unknown as Digest);
}

export async function saveDigest(digest: Digest): Promise<void> {
  const dbDigest = toSnakeCase(digest as unknown as Record<string, unknown>);
  const { error } = await supabase
    .from('digests')
    .upsert(dbDigest, { onConflict: 'id' });

  if (error) {
    console.error('Error saving digest:', error);
  }
}

// ============ CHAT SESSIONS ============

export async function loadChatSessions(): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading chat sessions:', error);
    return [];
  }

  return (data || []).map((item) => toCamelCase(item) as unknown as ChatSession);
}

export async function saveChatSession(session: ChatSession): Promise<void> {
  const dbSession = toSnakeCase(session as unknown as Record<string, unknown>);
  const { error } = await supabase
    .from('chat_sessions')
    .upsert(dbSession, { onConflict: 'id' });

  if (error) {
    console.error('Error saving chat session:', error);
  }
}

// ============ THESIS ============

export async function loadThesis(): Promise<Thesis | null> {
  const { data, error } = await supabase
    .from('thesis')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found - this is okay
      return null;
    }
    console.error('Error loading thesis:', error);
    return null;
  }

  return data ? toCamelCase(data) as unknown as Thesis : null;
}

export async function saveThesis(thesis: Thesis): Promise<void> {
  const dbThesis = toSnakeCase(thesis as unknown as Record<string, unknown>);
  const { error } = await supabase
    .from('thesis')
    .upsert(dbThesis, { onConflict: 'id' });

  if (error) {
    console.error('Error saving thesis:', error);
  }
}

// ============ LOAD ALL DATA ============

export interface AllData {
  sources: Source[];
  sourceItems: SourceItem[];
  dataReleases: DataRelease[];
  knowledgeEntries: KnowledgeEntry[];
  predictions: Prediction[];
  digests: Digest[];
  chatSessions: ChatSession[];
  thesis: Thesis | null;
}

export async function loadAllData(): Promise<AllData> {
  const [
    sources,
    sourceItems,
    dataReleases,
    knowledgeEntries,
    predictions,
    digests,
    chatSessions,
    thesis,
  ] = await Promise.all([
    loadSources(),
    loadSourceItems(),
    loadDataReleases(),
    loadKnowledgeEntries(),
    loadPredictions(),
    loadDigests(),
    loadChatSessions(),
    loadThesis(),
  ]);

  return {
    sources,
    sourceItems,
    dataReleases,
    knowledgeEntries,
    predictions,
    digests,
    chatSessions,
    thesis,
  };
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.length > 0 && key.length > 0);
}
