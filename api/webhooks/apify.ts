import type { VercelRequest, VercelResponse } from '../_types.js';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function hasApifySecret(req: VercelRequest): boolean {
  const secret = process.env.APIFY_WEBHOOK_SECRET || '';
  const authorization = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;

  return Boolean(secret && authorization === `Bearer ${secret}`);
}

function getResourceValue(apifyEvent: any, key: string): string {
  return apifyEvent?.resource?.[key] || apifyEvent?.eventData?.[key] || '';
}

async function getAgentForApifyRun(runId: string) {
  if (!runId || !supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from('swarm_events')
    .select('agent_id, metadata')
    .contains('metadata', { run_id: runId })
    .order('created_at', { ascending: false })
    .limit(1);

  return data?.[0]?.agent_id || null;
}

function buildAgentInsightPrompt(input: {
  agentId: string;
  platform: string;
  caption: string;
  likes: number;
  url: string;
  subreddit?: string;
}) {
  const sourceLine = `Source: ${input.platform}${input.subreddit ? ` / ${input.subreddit}` : ''}`;

  if (input.agentId === 'scout') {
    return `You are Scout for Resin Academics.
${sourceLine}
Post: "${input.caption.substring(0, 900)}"
Engagement: ${input.likes}
URL: ${input.url}

Extract one data-gathering signal in 2 sentences:
1. What search lane, keyword, creator type, or platform should the hive collect next?
2. How should Resin Academics use that to improve its market intelligence?`;
  }

  if (input.agentId === 'scientist') {
    return `You are Scientist for Resin Academics.
${sourceLine}
Post: "${input.caption.substring(0, 900)}"
Engagement: ${input.likes}
URL: ${input.url}

Extract one testable experiment in 2 sentences:
1. What trend or behavior pattern is visible?
2. What small test should Resin Academics run, and what metric should be measured?`;
  }

  if (input.agentId === 'closer') {
    return `You are Closer for Resin Academics.
${sourceLine}
Post: "${input.caption.substring(0, 900)}"
Engagement: ${input.likes}
URL: ${input.url}

Extract one sales angle in 2 sentences:
1. What lead type or pain point does this reveal?
2. How should Resin Academics turn it into an offer, pitch, or follow-up?`;
  }

  if (input.agentId === 'engineer') {
    return `You are Engineer for Resin Academics.
${sourceLine}
Post: "${input.caption.substring(0, 900)}"
Engagement: ${input.likes}
URL: ${input.url}

Extract one technical implementation idea in 2 sentences:
1. What system, API, automation, data, or reliability idea matters here?
2. How should Resin Academics build it into the brain or product?`;
  }

  return `You are Hustler for Resin Academics.
${sourceLine}
Post: "${input.caption.substring(0, 900)}"
Engagement: ${input.likes}
URL: ${input.url}

Extract one business advantage in 2 sentences:
1. What AI tool, API, automation, workflow, market pain, partner, or pricing play is being discussed?
2. How should Resin Academics use it to grow revenue or beat competitors?`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!hasApifySecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const apifyEvent = req.body;
    
    // Apify sends a webhook when a run succeeds
    if (apifyEvent?.eventType !== 'ACTOR.RUN.SUCCEEDED') {
      return res.status(200).send('Ignored event type');
    }

    const defaultDatasetId = getResourceValue(apifyEvent, 'defaultDatasetId');
    const actorId = getResourceValue(apifyEvent, 'actId');
    const actorRunId = getResourceValue(apifyEvent, 'id') || getResourceValue(apifyEvent, 'actorRunId');
    if (!defaultDatasetId) {
      return res.status(400).json({ error: 'No dataset ID found' });
    }

    // 1. Fetch the actual scraped data from Apify
    const apifyToken = process.env.APIFY_API_TOKEN || '';
    const datasetUrl = `https://api.apify.com/v2/datasets/${defaultDatasetId}/items`;
    const datasetRes = await fetch(datasetUrl, {
      headers: apifyToken ? { Authorization: `Bearer ${apifyToken}` } : undefined
    });
    if (!datasetRes.ok) {
      throw new Error(`Apify dataset fetch failed: ${datasetRes.status}`);
    }
    const dataset = await datasetRes.json();

    if (!dataset || !dataset.length) {
      return res.status(200).json({ message: 'No data scraped' });
    }

    if (!supabaseAdmin) throw new Error('Supabase not configured');
    if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI not configured');

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 2. Detect platform from the data structure or actor ID
    const isTikTok = actorId.includes('tiktok') || dataset[0]?.diggCount !== undefined || dataset[0]?.videoMeta !== undefined;
    const isReddit = actorId.includes('reddit') || dataset[0]?.subreddit || dataset[0]?.numComments !== undefined || dataset[0]?.upVotes !== undefined;
    const mappedAgentId = await getAgentForApifyRun(actorRunId);
    const fallbackAgentId = isReddit ? 'hustler' : isTikTok ? 'scientist' : 'scout';
    const agentId = mappedAgentId || fallbackAgentId;

    // 3. Process each post and turn it into a Vector Memory
    let embeddedCount = 0;
    
    for (const post of dataset) {
      let caption = '';
      let likes = 0;
      let url = '';
      let platform = 'unknown';

      if (isReddit) {
        caption = post.title || post.body || post.text || post.selftext || '';
        likes = post.upVotes || post.upvotes || post.score || post.ups || 0;
        url = post.url || post.permalink || post.link || '';
        platform = 'reddit';
      } else if (isTikTok) {
        // TikTok data format
        caption = post.text || post.desc || '';
        likes = post.diggCount || post.stats?.diggCount || 0;
        url = post.webVideoUrl || post.url || '';
        platform = 'tiktok';
      } else {
        // Instagram data format
        caption = post.caption || '';
        likes = post.likesCount || 0;
        url = post.url || '';
        platform = 'instagram';
      }

      // Only save memories for posts with decent traction to avoid junk data
      const likeThreshold = isReddit ? 5 : isTikTok ? 500 : 100;
      if (likes < likeThreshold || !caption) continue;

      // Have the AI extract the agent-specific insight
      const insightPrompt = buildAgentInsightPrompt({
        agentId,
        platform,
        caption,
        likes,
        url,
        subreddit: post.subreddit || post.communityName,
      });

      const insightRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: insightPrompt }]
      });

      const coreInsight = insightRes.choices[0].message.content || caption;

      // Generate the Vector Embedding
      const embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: coreInsight,
      });

      const embeddingVector = embeddingRes.data[0].embedding;

      // Inject the new memory into the pgvector brain
      await supabaseAdmin.from('brain_synapses').insert([{
        agent_source: `${agentId}-scrape-agent`,
        content: `[${agentId.toUpperCase()} ${platform.toUpperCase()} INTEL] ${coreInsight} (Source: ${url}, ${likes} ${isReddit ? 'upvotes' : 'likes'})`,
        embedding: embeddingVector,
        metadata: {
          source: platform,
          agent: agentId,
          url,
          likes,
          subreddit: post.subreddit || post.communityName,
          actor_run_id: actorRunId,
          scraped_at: new Date().toISOString(),
        }
      }]);

      embeddedCount++;
    }

    return res.status(200).json({ 
      success: true, 
      platform: isReddit ? 'reddit' : isTikTok ? 'tiktok' : 'instagram',
      agent: agentId,
      message: `Brain Expanded. Injected ${embeddedCount} ${agentId} neural pathways from ${isReddit ? 'Reddit intel' : isTikTok ? 'TikTok' : 'Instagram'}.`
    });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
