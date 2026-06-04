import type { VercelRequest, VercelResponse } from './_types.js';
import OpenAI from 'openai';
import { getBrainClient, logSwarmEvent, rememberInBrain } from './_brain.js';

const agents = [
  {
    id: 'scout',
    role: 'Find fresh epoxy/concrete coating market signals and recommend what to scrape next.',
    mission: 'Pick one fresh data source or search lane the hive should collect next.',
    format: 'SCOUT SCAN | Source: <platform/source> | Query: <exact search term> | Company Move: <how Resin Academics should use it>',
    forbidden: 'No campaigns, workshops, offers, product lines, customer preferences, or system improvements.',
  },
  {
    id: 'scientist',
    role: 'Find trend patterns and predict what epoxy content should be tested next.',
    mission: 'Turn one pattern into a testable hypothesis.',
    format: 'SCIENCE TEST | Signal: <pattern source> | Test: <small experiment> | Company Move: <how Resin Academics should use it>',
    forbidden: 'No sales copy, pricing, partnerships, dashboards, scraping instructions, or AI tool talk.',
  },
  {
    id: 'closer',
    role: 'Look for lead/outreach angles and recommend what pitch should be drafted next.',
    mission: 'Create one direct sales move from the available intelligence.',
    format: 'CLOSER PLAY | Target: <lead type> | Hook: <one-line pitch> | Company Move: <next sales action>',
    forbidden: 'No trend summaries, content plans, dashboards, Reddit, or engineering ideas.',
  },
  {
    id: 'hustler',
    role: 'Look for revenue, partnership, AI tool, API, automation, and growth opportunities that keep Resin Academics ahead of competitors.',
    mission: 'Find one money-making or competitive advantage play outside generic social content.',
    format: 'HUSTLER EDGE | Source: <intel lane> | Play: <business move> | Company Move: <money or speed advantage for Resin Academics>',
    forbidden: 'No TikTok summaries, before/after content, DIY trend summaries, or generic marketing campaigns.',
  },
  {
    id: 'engineer',
    role: 'Look for system, automation, data, deployment, and product improvements.',
    mission: 'Create one technical ticket that would make the hive smarter or easier to use.',
    format: 'ENGINEER TICKET | Build: <specific feature/fix> | File/API/Data: <where it belongs> | Company Move: <what improves for Resin Academics>',
    forbidden: 'No marketing recommendations, sales ideas, product positioning, customer preference analysis, or content ideas.',
  },
];

type Agent = typeof agents[number];

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

function normalizeActorId(actorId?: string) {
  return actorId?.trim().replace('/', '~') || '';
}

async function launchApifyResearch(input: {
  agentId: string;
  actorId: string;
  actorInput: Record<string, unknown>;
  channel: string;
  label: string;
  companyUse: string;
}) {
  const apifyToken = process.env.APIFY_API_TOKEN;
  const actorId = normalizeActorId(input.actorId);

  if (!apifyToken || !actorId) {
    await logSwarmEvent({
      agentId: input.agentId,
      eventType: 'intel',
      message: `${input.label} skipped. Missing Apify token or actor ID.`,
      metadata: { source: 'cron', channel: input.channel },
    });
    return null;
  }

  const actorUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs?token=${apifyToken}`;
  const response = await fetch(actorUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input.actorInput),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${input.label} failed: ${data.error?.message || response.status}`);
  }

  const runId = data.data?.id || null;
  await logSwarmEvent({
    agentId: input.agentId,
    eventType: 'intel',
    message: `${input.label} launched. Company move: ${input.companyUse}`,
    metadata: { source: 'cron', channel: input.channel, run_id: runId, actor_id: actorId },
  });

  return runId;
}

async function runCloserLeadScan() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const location = process.env.RESIN_MARKET_LOCATION || 'El Paso, TX';

  if (!apiKey) {
    await logSwarmEvent({
      agentId: 'closer',
      eventType: 'intel',
      message: 'Lead scan skipped. Add GOOGLE_PLACES_API_KEY in Vercel to enable Closer lead research.',
      metadata: { source: 'cron', channel: 'google_places' },
    });
    return 'Lead scan skipped: missing Google Places key.';
  }

  const leadQueries = [
    `auto detail shops in ${location}`,
    `gyms in ${location}`,
    `warehouses in ${location}`,
  ];

  const pickedQuery = leadQueries[Math.floor(Date.now() / 600000) % leadQueries.length];
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.websiteUri',
    },
    body: JSON.stringify({
      textQuery: pickedQuery,
      maxResultCount: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(`Closer lead scan failed: ${response.status}`);
  }

  const data = await response.json();
  const places = data.places || [];
  const leadSummary = places
    .map((place: any) => place.displayName?.text)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ') || 'No leads found';

  const message = `Lead lane scanned: ${pickedQuery}. Company move: pitch high-traffic spaces that need durable, visual floors. Leads: ${leadSummary}.`;
  await logSwarmEvent({
    agentId: 'closer',
    eventType: 'intel',
    message,
    metadata: { source: 'cron', channel: 'google_places', query: pickedQuery, leads: places },
  });

  await rememberInBrain({
    agentSource: 'closer-lead-scan',
    content: `[CLOSER LEAD SCAN] ${message}`,
    metadata: { source: 'google_places', agent: 'closer', query: pickedQuery },
  });

  return message;
}

async function launchAgentResearch(agent: Agent) {
  if (agent.id === 'scout') {
    const runId = await launchApifyResearch({
      agentId: 'scout',
      actorId: 'apify~instagram-scraper',
      actorInput: {
        hashtags: ['epoxyfloors', 'garagefloorcoating', 'concretecoatings'],
        resultsLimit: 8,
        scrapePosts: true,
        scrapeComments: false,
      },
      channel: 'instagram',
      label: 'Scout market-signal Instagram scrape',
      companyUse: 'find which epoxy visuals and keywords should feed the next scrape queue.',
    });
    return `Scout launched Instagram market scan${runId ? ` (${runId})` : ''}.`;
  }

  if (agent.id === 'scientist') {
    const runId = await launchApifyResearch({
      agentId: 'scientist',
      actorId: 'clockworks~tiktok-scraper',
      actorInput: {
        hashtags: ['resinart', 'metallicepoxy', 'epoxytable'],
        resultsPerPage: 8,
        shouldDownloadVideos: false,
      },
      channel: 'tiktok',
      label: 'Scientist experiment-signal TikTok scrape',
      companyUse: 'turn viral formats into testable content experiments for Resin Academics.',
    });
    return `Scientist launched TikTok experiment scan${runId ? ` (${runId})` : ''}.`;
  }

  if (agent.id === 'closer') {
    return runCloserLeadScan();
  }

  if (agent.id === 'hustler') {
    const actorInput = process.env.APIFY_REDDIT_INPUT_JSON
      ? JSON.parse(process.env.APIFY_REDDIT_INPUT_JSON)
      : {
          searchQueries: [
            'new AI tools for agencies',
            'AI automation workflow tools',
            'best AI API tools small business',
            'AI tools for contractors marketing',
          ],
          subreddits: ['ArtificialInteligence', 'OpenAI', 'SaaS', 'Entrepreneur', 'marketing'],
          maxItems: 15,
          sort: 'new',
          time: 'week',
        };
    const runId = await launchApifyResearch({
      agentId: 'hustler',
      actorId: process.env.APIFY_REDDIT_ACTOR_ID || '',
      actorInput,
      channel: 'reddit',
      label: 'Hustler AI/business Reddit scrape',
      companyUse: 'find AI tools, APIs, pricing plays, and partnerships to bring into Resin Academics.',
    });
    return `Hustler launched AI/business Reddit scan${runId ? ` (${runId})` : ''}.`;
  }

  if (agent.id === 'engineer') {
    const runId = await launchApifyResearch({
      agentId: 'engineer',
      actorId: process.env.APIFY_REDDIT_ACTOR_ID || '',
      actorInput: {
        searchQueries: [
          'Supabase pgvector RAG production',
          'Vercel cron monitoring serverless',
          'Apify webhook automation Node',
          'OpenAI API cost controls embeddings',
        ],
        subreddits: ['webdev', 'OpenAI', 'supabase', 'node', 'SaaS'],
        maxItems: 12,
        sort: 'new',
        time: 'week',
      },
      channel: 'reddit',
      label: 'Engineer system-intel Reddit scrape',
      companyUse: 'find implementation ideas that make the brain cheaper, safer, and more reliable.',
    });
    return `Engineer launched system-intel Reddit scan${runId ? ` (${runId})` : ''}.`;
  }

  return 'No research lane configured.';
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
    const researchRuns: Array<{ agent: string; summary: string }> = [];

    for (const agent of agents) {
      const previousOutputs = outputs.length
        ? outputs.map((output) => `[${output.agent.toUpperCase()}] ${output.message}`).join('\n')
        : 'None yet.';

      let researchSummary = 'Research lane not launched.';
      try {
        researchSummary = await launchAgentResearch(agent);
      } catch (error: any) {
        researchSummary = `${agent.id} research lane failed: ${error.message}`;
        await logSwarmEvent({
          agentId: agent.id,
          eventType: 'intel_error',
          message: researchSummary,
          metadata: { source: 'cron' },
        });
      }
      researchRuns.push({ agent: agent.id, summary: researchSummary });

      const prompt = `You are ${agent.id.toUpperCase()} inside the Resin Academics hive mind.

Your role: ${agent.role}
Your only mission this hour: ${agent.mission}
Your agent-specific research lane this hour:
${researchSummary}

Recent brain memories:
${memoryContext}

Previous agent outputs from this same wakeup:
${previousOutputs}

Return exactly one line using this format:
${agent.format}

Rules:
- Do not overlap with previous agent outputs from this wakeup.
- Do not use markdown.
- Do not start with "I noticed", "I've noticed", "I've observed", "Internal Feed Update", or "To capitalize on this".
- Forbidden for this agent: ${agent.forbidden}
- Base your answer on your own research lane and your own role. Do not use another agent's research lane.
- Do not default to TikTok unless your assignment specifically needs it.
- Keep it under 70 words.
- Always spell it "epoxy"; never write "Epoxee".`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
        temperature: 0.9,
        presence_penalty: 0.7,
        frequency_penalty: 0.4,
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

    await logSwarmEvent({
      agentId: 'operator',
      eventType: 'tick_completed',
      message: 'Hourly swarm tick completed. Agent thoughts were saved into the brain.',
      metadata: { source: 'cron', output_count: outputs.length, research_runs: researchRuns },
    });

    return res.status(200).json({ success: true, outputs, researchRuns });
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
