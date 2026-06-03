import type { VercelRequest, VercelResponse } from './_types.js';
import OpenAI from 'openai';
import { getBrainClient, logSwarmEvent, rememberInBrain } from './_brain.js';

const agents = [
  {
    id: 'scout',
    role: 'Find fresh epoxy/concrete coating market signals and recommend what to scrape next.',
  },
  {
    id: 'scientist',
    role: 'Find trend patterns and predict what epoxy content should be tested next.',
  },
  {
    id: 'closer',
    role: 'Look for lead/outreach angles and recommend what pitch should be drafted next.',
  },
  {
    id: 'hustler',
    role: 'Look for revenue, partnership, and growth opportunities.',
  },
  {
    id: 'engineer',
    role: 'Look for system, automation, data, deployment, and product improvements.',
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }

  const supabase = getBrainClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { data: recentMemories } = await supabase
      .from('brain_synapses')
      .select('agent_source, content, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(12);

    const memoryContext = recentMemories?.length
      ? recentMemories.map((m: any) => `[${m.agent_source}] ${m.content}`).join('\n\n')
      : 'No memories yet. Focus on bootstrapping the brain with useful actions.';

    await logSwarmEvent({
      agentId: 'operator',
      eventType: 'tick',
      message: 'Hourly swarm tick started. Agents are reviewing the brain.',
      metadata: { source: 'cron' },
    });

    const outputs: Array<{ agent: string; message: string }> = [];

    for (const agent of agents) {
      const prompt = `You are ${agent.id.toUpperCase()} inside the Resin Academics hive mind.

Your role: ${agent.role}

Recent brain memories:
${memoryContext}

Produce one short internal feed update. Include:
- what you noticed
- what you recommend next

Keep it under 70 words. Always spell it "epoxy"; never write "Epoxee".`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
      });

      const message = response.choices[0].message.content || `${agent.id} standing by.`;
      outputs.push({ agent: agent.id, message });

      await logSwarmEvent({
        agentId: agent.id,
        eventType: 'thought',
        message,
        metadata: { source: 'cron' },
      });

      await rememberInBrain({
        agentSource: `${agent.id}-hourly-thought`,
        content: `[${agent.id.toUpperCase()} HOURLY THOUGHT] ${message}`,
        metadata: { source: 'cron', agent: agent.id },
      });
    }

    return res.status(200).json({ success: true, outputs });
  } catch (error: any) {
    console.error('Swarm tick error:', error);
    return res.status(500).json({ error: error.message });
  }
}
