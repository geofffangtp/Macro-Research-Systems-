// Core types for Macro Research System

export type SourceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export interface Source {
  id: string;
  handle: string;
  name: string;
  focus: string;
  style: string;
  tier: SourceTier;
  weight: number;
  platform: 'twitter' | 'substack' | 'data' | 'manual';
  rssUrl?: string;
  lastFetched?: string;
  rating?: number;
  totalRatings?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SourceItem {
  id: string;
  sourceId: string;
  source?: Source;
  title: string;
  content: string;
  url?: string;
  author?: string;
  publishedAt: string;
  fetchedAt: string;
  isRead: boolean;
  isFlagged: boolean;
  userRating?: 'up' | 'down';
  thesisRelevance?: string;
  category?: string;
  createdAt: string;
}

export interface DataRelease {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  tier: 'tier1' | 'tier2' | 'tier3';
  thesisConnection: string;
  lastValue?: string;
  previousValue?: string;
  releaseDate?: string;
  nextReleaseDate?: string;
  trend?: 'up' | 'down' | 'flat';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeEntry {
  id: string;
  topic: string;
  dateCreated: string;
  thesisImpact: string;
  keyInsights: string[];
  conclusion: string;
  catalystToWatch?: string;
  sourceRef?: string;
  status: 'open' | 'closed' | 'watching';
  relatedItemIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Prediction {
  id: string;
  date: string;
  source: string;
  prediction: string;
  timeframe: string;
  confidence: 'low' | 'medium' | 'high';
  status: 'pending' | 'correct' | 'incorrect' | 'partial';
  outcome?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface DigestSection {
  id: string;
  type: 'tldr' | 'market' | 'data' | 'narratives' | 'thesis' | 'threads' | 'actions';
  title: string;
  content: string;
  items?: DigestItem[];
  isExpanded: boolean;
}

export interface DigestItem {
  id: string;
  sectionType: string;
  content: string;
  source?: string;
  sourceUrl?: string;
  stance?: 'bull' | 'bear' | 'neutral' | 'contrarian';
  thesisConnection?: string;
  isFlagged: boolean;
  userRating?: 'up' | 'down';
}

export interface Digest {
  id: string;
  date: string;
  type: 'daily' | 'weekly';
  sections: DigestSection[];
  marketActivity: 'quiet' | 'moderate' | 'active';
  generatedAt: string;
  readingTimeMinutes: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  contextItem?: {
    type: string;
    title: string;
    content: string;
  };
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  contextType?: 'digest_item' | 'knowledge_entry' | 'source_item' | 'general';
  contextId?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ThesisScenario {
  name: string;
  probability: number;
  description: string;
}

export interface ThesisSignal {
  phase: 1 | 2 | 3;
  name: string;
  indicators: string[];
  status: 'not_triggered' | 'watching' | 'triggered';
}

export interface Thesis {
  id: string;
  name: string;
  summary: string;
  scenarios: ThesisScenario[];
  keyMonitors: string[];
  turningPointSignals: ThesisSignal[];
  lastUpdated: string;
}

export interface SourceAudit {
  id: string;
  sourceId: string;
  source?: Source;
  periodStart: string;
  periodEnd: string;
  claims: {
    claim: string;
    date: string;
    status: 'verified' | 'correct' | 'incorrect' | 'pending';
  }[];
  topicsCovered: { topic: string; percentage: number }[];
  ratings: {
    signalQuality: number;
    accuracy: number;
    originality: number;
    relevance: number;
    blindSpotValue: number;
  };
  notes?: string;
  createdAt: string;
}

export interface ManualInput {
  type: 'tweet' | 'article' | 'thought' | 'note';
  content: string;
  url?: string;
  author?: string;
  source?: string;
  tags?: string[];
}
