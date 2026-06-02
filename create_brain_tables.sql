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

-- 4. Set up Row Level Security (RLS)
ALTER TABLE brain_synapses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commands ENABLE ROW LEVEL SECURITY;

-- For local development and testing, we allow open access. 
-- In production, restrict this to authenticated users or service role.
CREATE POLICY "Allow public read brain_synapses" ON brain_synapses FOR SELECT USING (true);
CREATE POLICY "Allow public insert brain_synapses" ON brain_synapses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update brain_synapses" ON brain_synapses FOR UPDATE USING (true);

CREATE POLICY "Allow public read agent_commands" ON agent_commands FOR SELECT USING (true);
CREATE POLICY "Allow public insert agent_commands" ON agent_commands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update agent_commands" ON agent_commands FOR UPDATE USING (true);

-- 5. Create a function to search the Brain (Vector Similarity Search)
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
