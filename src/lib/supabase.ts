import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema SQL for reference - run this in Supabase dashboard
export const SCHEMA_SQL = `
-- Sources table
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL,
  name TEXT NOT NULL,
  focus TEXT,
  style TEXT,
  tier TEXT NOT NULL DEFAULT 'tier2',
  weight FLOAT DEFAULT 1.0,
  platform TEXT NOT NULL DEFAULT 'twitter',
  rss_url TEXT,
  last_fetched TIMESTAMPTZ,
  rating FLOAT,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Source items table
CREATE TABLE IF NOT EXISTS source_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id),
  title TEXT,
  content TEXT NOT NULL,
  url TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  user_rating TEXT,
  thesis_relevance TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data releases table
CREATE TABLE IF NOT EXISTS data_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'tier2',
  thesis_connection TEXT,
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  thesis_impact TEXT,
  key_insights TEXT[],
  conclusion TEXT,
  catalyst_to_watch TEXT,
  source_ref TEXT,
  status TEXT DEFAULT 'open',
  related_item_ids UUID[],
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  source TEXT NOT NULL,
  prediction TEXT NOT NULL,
  timeframe TEXT,
  confidence TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  outcome TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digests table
CREATE TABLE IF NOT EXISTS digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  type TEXT DEFAULT 'daily',
  sections JSONB,
  market_activity TEXT DEFAULT 'moderate',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  reading_time_minutes INTEGER
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  context_type TEXT,
  context_id UUID,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Source audits table
CREATE TABLE IF NOT EXISTS source_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id),
  period_start DATE,
  period_end DATE,
  claims JSONB,
  topics_covered JSONB,
  ratings JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thesis table
CREATE TABLE IF NOT EXISTS thesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  summary TEXT,
  scenarios JSONB,
  key_monitors TEXT[],
  turning_point_signals JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_source_items_source_id ON source_items(source_id);
CREATE INDEX IF NOT EXISTS idx_source_items_published_at ON source_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_items_is_flagged ON source_items(is_flagged);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_tags ON knowledge_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_digests_date ON digests(date DESC);
`;
