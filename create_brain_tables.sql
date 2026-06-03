-- Epoxy Brain Database Architecture
-- This migration enables the pgvector extension and creates the necessary tables for the Agent Swarm.

-- 1. Enable the vector extension for AI memory embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the core synapses table (where all agents dump data)
CREATE TABLE IF NOT EXISTS brain_synapses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_source TEXT NOT NULL, -- e.g., 'lead-gen-agent', 'marketing-agent', 'user-voice'
    content TEXT NOT NULL,      -- The actual memory, lead data, or transcript
    embedding vector(1536),     -- 1536 dimensions for OpenAI text-embedding-3-small
    metadata JSONB DEFAULT '{}'::jsonb, -- Store raw Apify data, lead URLs, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the agent commands table (so the Voice Orb can execute actions)
CREATE TABLE IF NOT EXISTS agent_commands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    command_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
    response_audio_url TEXT,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create email drafts table used by the Closer/Slack workflow
CREATE TABLE IF NOT EXISTS email_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT DEFAULT 'closer-agent' NOT NULL,
    lead_name TEXT,
    lead_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'Drafted' NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS swarm_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    event_type TEXT DEFAULT 'thought' NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Set up Row Level Security (RLS)
ALTER TABLE brain_synapses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read brain_synapses" ON brain_synapses;
DROP POLICY IF EXISTS "Allow public insert brain_synapses" ON brain_synapses;
DROP POLICY IF EXISTS "Allow public update brain_synapses" ON brain_synapses;
DROP POLICY IF EXISTS "Allow public read agent_commands" ON agent_commands;
DROP POLICY IF EXISTS "Allow public insert agent_commands" ON agent_commands;
DROP POLICY IF EXISTS "Allow public update agent_commands" ON agent_commands;

CREATE POLICY "Service role manages brain_synapses" ON brain_synapses
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages agent_commands" ON agent_commands
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages email_drafts" ON email_drafts
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages swarm_events" ON swarm_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 6. Create a function to search the Brain (Vector Similarity Search)
CREATE OR REPLACE FUNCTION match_brain_synapses (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  agent_source text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    brain_synapses.id,
    brain_synapses.agent_source,
    brain_synapses.content,
    brain_synapses.metadata,
    1 - (brain_synapses.embedding <=> query_embedding) AS similarity
  FROM brain_synapses
  WHERE 1 - (brain_synapses.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_synapses (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  agent_source text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT * FROM match_brain_synapses(query_embedding, match_threshold, match_count);
$$;
