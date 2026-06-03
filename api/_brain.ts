import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function getBrainClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function rememberInBrain(input: {
  agentSource: string;
  content: string;
  metadata?: Record<string, unknown>;
}) {
  if (!input.content.trim() || !process.env.OPENAI_API_KEY) return;

  const supabase = getBrainClient();
  if (!supabase) return;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: input.content.slice(0, 8000),
  });

  await supabase.from('brain_synapses').insert([{
    agent_source: input.agentSource,
    content: input.content,
    embedding: embeddingRes.data[0].embedding,
    metadata: input.metadata || {},
  }]);
}

export async function searchBrain(query: string, matchCount = 8) {
  if (!query.trim() || !process.env.OPENAI_API_KEY) return [];

  const supabase = getBrainClient();
  if (!supabase) return [];

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  const { data } = await supabase.rpc('match_brain_synapses', {
    query_embedding: embeddingRes.data[0].embedding,
    match_threshold: 0.08,
    match_count: matchCount,
  });

  return data || [];
}

export function rememberSlackConversation(input: {
  agent: string;
  userMessage: string;
  reply?: string;
  channel?: string;
  threadTs?: string;
  user?: string;
  intent?: string;
}) {
  const content = [
    `[${input.agent.toUpperCase()} SLACK CONVERSATION]`,
    `User: ${input.userMessage}`,
    input.reply ? `Agent: ${input.reply}` : '',
  ].filter(Boolean).join('\n');

  return rememberInBrain({
    agentSource: `${input.agent}-conversation`,
    content,
    metadata: {
      source: 'slack',
      agent: input.agent,
      intent: input.intent || 'unknown',
      channel: input.channel,
      thread_ts: input.threadTs,
      user: input.user,
      remembered_at: new Date().toISOString(),
    },
  });
}
