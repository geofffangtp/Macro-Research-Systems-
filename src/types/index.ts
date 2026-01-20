// Core types for Macro Research System

export type SourceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export interface SourceMetrics {
  citationCount: number; // Times cited in digests
  upvotes: number;
  downvotes: number;
  lastCitedDate?: string;
  avgRelevanceScore?: number; // Calculated from item ratings
}

export interface Source {
  id: string;
  handle: string;
  name: string;
  focus: string;
  style: string;
  tier: SourceTier;
  weight: number;
  platform: 'twitter' | 'substack' | 'data' | 'manual' | 'rss';
  rssUrl?: string;
  lastFetched?: string;
  rating?: number;
  totalRatings?: number;
  createdAt: string;
  updatedAt: string;
  // Source intelligence fields
  metrics?: SourceMetrics;
  mutedUntil?: string; // ISO date string for "mute today" feature
  suggestedWeight?: number; // AI-suggested weight based on metrics
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
  fredSeriesId?: string;  // FRED API series ID for auto-fetch
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

export interface OpenThread {
  id: string;
  content: string;
  createdDate: string;
  status: 'open' | 'resolved' | 'stale';
  resolvedDate?: string;
  resolvedBy?: string; // Reference to digest that resolved it
  relatedTopics?: string[];
}

export interface Digest {
  id: string;
  date: string;
  type: 'daily' | 'weekly';
  sections: DigestSection[];
  marketActivity: 'quiet' | 'moderate' | 'active';
  generatedAt: string;
  readingTimeMinutes: number;
  rawContent?: string; // Store full generated content
  thesisFlags?: string[]; // Items flagged for thesis review
  openThreads?: OpenThread[]; // Structured open threads for continuity
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

export interface ThesisHistoryEntry {
  id: string;
  date: string;
  changeType: 'scenario_update' | 'signal_update' | 'monitor_update' | 'summary_update';
  description: string;
  previousValue?: string;
  newValue?: string;
  triggeredBy?: string; // Digest or knowledge entry reference
}

export interface Thesis {
  id: string;
  name: string;
  summary: string;
  scenarios: ThesisScenario[];
  keyMonitors: string[];
  turningPointSignals: ThesisSignal[];
  lastUpdated: string;
  history?: ThesisHistoryEntry[];
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

// International market data for global context
export interface IntlMarketData {
  // European indices
  stoxx600?: string;      // e.g., "-1.2%"
  dax?: string;           // e.g., "-1.1%"
  ftse?: string;          // e.g., "-0.8%"

  // Asian indices
  nikkei?: string;        // e.g., "-1.0%"
  hangSeng?: string;      // e.g., "-0.5%"
  shanghai?: string;      // e.g., "+0.3%"

  // Currencies
  dxy?: string;           // e.g., "103.4"
  eurUsd?: string;        // e.g., "1.0850"
  usdJpy?: string;        // e.g., "156.20"
  usdCny?: string;        // e.g., "7.25"

  // Notable movers and events
  notableMovers?: string; // Free text: "LVMH -4.7%, Rheinmetall +1%"
  intlEvents?: string;    // Free text: "BOJ meeting Wed-Thu, EU emergency summit"

  // Metadata
  lastUpdated?: string;   // ISO date string
}
