import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apifyEvent = req.body;
    
    // Apify sends a webhook when a run succeeds
    if (apifyEvent?.eventType !== 'ACTOR.RUN.SUCCEEDED') {
      return res.status(200).send('Ignored event type');
    }

    const defaultDatasetId = apifyEvent.resource?.defaultDatasetId;
    const actorId = apifyEvent.resource?.actId || '';
    if (!defaultDatasetId) {
      return res.status(400).json({ error: 'No dataset ID found' });
    }

    // 1. Fetch the actual scraped data from Apify
    const datasetUrl = `https://api.apify.com/v2/datasets/${defaultDatasetId}/items`;
    const datasetRes = await fetch(datasetUrl);
    const dataset = await datasetRes.json();

    if (!dataset || !dataset.length) {
      return res.status(200).json({ message: 'No data scraped' });
    }

    if (!supabaseAdmin) throw new Error('Supabase not configured');

    // 2. Detect platform from the data structure or actor ID
    const isTikTok = actorId.includes('tiktok') || dataset[0]?.diggCount !== undefined || dataset[0]?.videoMeta !== undefined;

    // 3. Process each post and turn it into a Vector Memory
    let embeddedCount = 0;
    
    for (const post of dataset) {
      let caption = '';
      let likes = 0;
      let url = '';
      let platform = 'unknown';

      if (isTikTok) {
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
      const likeThreshold = isTikTok ? 500 : 100;
      if (likes < likeThreshold || !caption) continue;

      // Have the AI extract the marketing insight
      const insightPrompt = `Analyze this viral ${platform.toUpperCase()} post in the epoxy/concrete coatings space.
Caption: "${caption.substring(0, 500)}"
Likes: ${likes}
Platform: ${platform}

Extract the core marketing hook, trend, or lesson from this post in 2-3 sentences. Focus on:
1. What specific content format made this go viral (e.g. satisfying pour, before/after, time-lapse)?
2. What emotional trigger does it use (e.g. transformation, ASMR, humor)?
3. How can an epoxy contractor replicate this exact style?`;

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
        content: `VIRAL ${platform.toUpperCase()} TREND: ${coreInsight} (Source: ${url}, ${likes} likes)`,
        embedding: embeddingVector,
        metadata: { source: platform, url, likes, scraped_at: new Date().toISOString() }
      }]);

      embeddedCount++;
    }

    return res.status(200).json({ 
      success: true, 
      platform: isTikTok ? 'tiktok' : 'instagram',
      message: `Brain Expanded. Injected ${embeddedCount} new neural pathways from ${isTikTok ? 'TikTok' : 'Instagram'}.`
    });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
