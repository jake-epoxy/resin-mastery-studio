import type { VercelRequest, VercelResponse } from './_types.js';
import OpenAI from 'openai';
import { getBrainClient, logSwarmEvent, rememberInBrain } from './_brain.js';

const agents = [
  {
    id: 'scout',
    role: 'Find fresh epoxy/concrete coating market signals and recommend what to scrape next.',
    focus: 'Look only for fresh data-gathering actions. Mention platforms, search terms, or missing data sources. Do not write a content plan.',
  },
  {
    id: 'scientist',
    role: 'Find trend patterns and predict what epoxy content should be tested next.',
    focus: 'Analyze patterns across memories and explain why a trend might work. Do not recommend the same execution as the other agents.',
  },
  {
    id: 'closer',
    role: 'Look for lead/outreach angles and recommend what pitch should be drafted next.',
    focus: 'Turn the signal into a sales angle, lead segment, offer, or follow-up message. Avoid TikTok strategy unless it directly supports sales.',
  },
  {
    id: 'hustler',
    role: 'Look for revenue, partnership, AI tool, API, automation, and growth opportunities that keep Resin Academics ahead of competitors.',
    focus: 'Prioritize AI tools, APIs, Reddit/industry intelligence, partnerships, pricing, automations, and competitive plays. Do not summarize TikTok unless it creates a business opportunity.',
  },
  {
    id: 'engineer',
    role: 'Look for system, automation, data, deployment, and product improvements.',
    focus: 'Recommend technical improvements to the brain, automations, scraping pipeline, dashboard, data quality, or deployment. Do not make marketing content recommendations.',
  },
];

function getHeader(req: VercelRequest, name: string) {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function isAuthorizedCron(req: VercelRequest) {
  const authHeader = getHeader(req, 'authorization');
  const userAgent = getHeader(req, 'user-agent');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  return userAgent.includes('vercel-cron/1.0');
}

async function launchRedditAiIntelScrape() {
  const apifyToken = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_REDDIT_ACTOR_ID?.trim().replace('/', '~');

  if (!apifyToken || !actorId) {
    await logSwarmEvent({
      agentId: 'hustler',
      eventType: 'intel',
      message: 'AI intel scrape skipped. Add APIFY_REDDIT_ACTOR_ID in Vercel to enable Reddit trend gathering.',
      metadata: { source: 'cron', channel: 'reddit' },
    });
    return null;
  }

  const fallbackInput = {
    searchQueries: [
      'new AI tools for agencies',
      'best AI API tools',
      'AI automation workflow tools',
      'new OpenAI API use cases',
      'AI tools for small business marketing',
    ],
    subreddits: ['ArtificialInteligence', 'OpenAI', 'SaaS', 'Entrepreneur', 'marketing'],
    maxItems: 25,
    sort: 'new',
    time: 'week',
  };

  const actorInput = process.env.APIFY_REDDIT_INPUT_JSON
    ? JSON.parse(process.env.APIFY_REDDIT_INPUT_JSON)
    : fallbackInput;

  const actorUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs?token=${apifyToken}`;
  const response = await fetch(actorUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(actorInput),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Reddit AI intel scraper failed: ${data.error?.message || response.status}`);
  }

  await logSwarmEvent({
    agentId: 'hustler',
    eventType: 'intel',
    message: 'Launched Reddit AI-intel scrape for new tools, API trends, and competitive opportunities.',
    metadata: { source: 'cron', channel: 'reddit', run_id: data.data?.id, actor_id: actorId },
  });

  return data.data?.id || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (process.env.NODE_ENV === 'production' && !isAuthorizedCron(req)) {
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
    const cooldownMinutes = 10;
    const cooldownStartedAt = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();
    const { data: recentTick } = await supabase
      .from('swarm_events')
      .select('id, created_at')
      .eq('agent_id', 'operator')
      .eq('event_type', 'tick_completed')
      .gte('created_at', cooldownStartedAt)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentTick?.length) {
      return res.status(200).json({
        success: true,
        skipped: true,
        reason: `Swarm already completed a wakeup in the last ${cooldownMinutes} minutes.`,
        lastTick: recentTick[0].created_at,
      });
    }

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
    let redditRunId: string | null = null;

    for (const agent of agents) {
      const prompt = `You are ${agent.id.toUpperCase()} inside the Resin Academics hive mind.

Your role: ${agent.role}
Your specific assignment this hour: ${agent.focus}

Recent brain memories:
${memoryContext}

Produce one short internal feed update that is meaningfully different from the other agents. Include:
- what you noticed
- what you recommend next

Rules:
- Do not copy the wording or recommendation style of another agent.
- Do not default to TikTok unless your assignment specifically needs it.
- Keep it under 70 words.
- Always spell it "epoxy"; never write "Epoxee".`;

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

    try {
      redditRunId = await launchRedditAiIntelScrape();
    } catch (error: any) {
      await logSwarmEvent({
        agentId: 'hustler',
        eventType: 'intel_error',
        message: `Reddit AI-intel scrape failed: ${error.message}`,
        metadata: { source: 'cron', channel: 'reddit' },
      });
    }

    await logSwarmEvent({
      agentId: 'operator',
      eventType: 'tick_completed',
      message: 'Hourly swarm tick completed. Agent thoughts were saved into the brain.',
      metadata: { source: 'cron', output_count: outputs.length, reddit_run_id: redditRunId },
    });

    return res.status(200).json({ success: true, outputs, redditRunId });
  } catch (error: any) {
    console.error('Swarm tick error:', error);
    try {
      await logSwarmEvent({
        agentId: 'operator',
        eventType: 'tick_error',
        message: `Hourly swarm tick failed: ${error.message}`,
        metadata: { source: 'cron' },
      });
    } catch (logError) {
      console.error('Failed to log swarm tick error:', logError);
    }
    return res.status(500).json({ error: error.message });
  }
}
