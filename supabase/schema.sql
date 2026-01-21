-- Macro Research System - Supabase Schema
-- Run this in Supabase SQL Editor to set up all tables

-- Sources table
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY,
  handle TEXT NOT NULL,
  name TEXT NOT NULL,
  focus TEXT,
  style TEXT,
  tier TEXT NOT NULL,
  weight DECIMAL DEFAULT 1.0,
  platform TEXT NOT NULL,
  rss_url TEXT,
  last_fetched TIMESTAMPTZ,
  rating DECIMAL,
  total_ratings INTEGER,
  metrics JSONB,
  muted_until TIMESTAMPTZ,
  suggested_weight DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Source items table
CREATE TABLE IF NOT EXISTS source_items (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  user_rating TEXT,
  thesis_relevance TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data releases table
CREATE TABLE IF NOT EXISTS data_releases (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  tier TEXT NOT NULL,
  thesis_connection TEXT,
  fred_series_id TEXT,
  last_value TEXT,
  previous_value TEXT,
  release_date TIMESTAMPTZ,
  next_release_date TIMESTAMPTZ,
  trend TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge entries table
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id UUID PRIMARY KEY,
  topic TEXT NOT NULL,
  date_created TIMESTAMPTZ NOT NULL,
  thesis_impact TEXT,
  key_insights JSONB,
  conclusion TEXT,
  catalyst_to_watch TEXT,
  source_ref TEXT,
  status TEXT DEFAULT 'open',
  related_item_ids JSONB,
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL,
  source TEXT,
  prediction TEXT NOT NULL,
  timeframe TEXT,
  confidence TEXT,
  status TEXT DEFAULT 'pending',
  outcome TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digests table (stores full digest content)
CREATE TABLE IF NOT EXISTS digests (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT DEFAULT 'daily',
  sections JSONB,
  market_activity TEXT,
  generated_at TIMESTAMPTZ NOT NULL,
  reading_time_minutes INTEGER,
  raw_content TEXT, -- Full markdown content
  thesis_flags JSONB,
  open_threads JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  context_type TEXT,
  context_id UUID,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thesis table (single row)
CREATE TABLE IF NOT EXISTS thesis (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  summary TEXT,
  scenarios JSONB,
  key_monitors JSONB,
  turning_point_signals JSONB,
  last_updated TIMESTAMPTZ,
  history JSONB
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_source_items_source_id ON source_items(source_id);
CREATE INDEX IF NOT EXISTS idx_source_items_created_at ON source_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digests_date ON digests(date DESC);
CREATE INDEX IF NOT EXISTS idx_digests_generated_at ON digests(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_status ON knowledge_entries(status);

-- Enable Row Level Security (optional but recommended)
-- ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE source_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE data_releases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE digests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE thesis ENABLE ROW LEVEL SECURITY;
