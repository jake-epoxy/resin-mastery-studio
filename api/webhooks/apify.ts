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

    // 2. Process each post and turn it into a Vector Memory
    let embeddedCount = 0;
    
    for (const post of dataset) {
      const caption = post.caption || '';
      const likes = post.likesCount || 0;
      const url = post.url || '';

      // Only save memories for posts with some decent traction (e.g., > 100 likes) to avoid junk data
      if (likes < 100 || !caption) continue;

      // Have the "Mad Scientist" summarize the marketing insight of this post
      const insightPrompt = `Analyze this viral Instagram post in the epoxy/AI space.
Caption: "${caption}"
Likes: ${likes}

Extract the core marketing hook, trend, or lesson from this post in 1-2 sentences so we can use it to build our own viral content.`;

      const insightRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: insightPrompt }]
      });

      const coreInsight = insightRes.choices[0].message.content || caption;

      // Generate the Vector Embedding using text-embedding-3-small
      const embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: coreInsight,
      });

      const embeddingVector = embeddingRes.data[0].embedding;

      // Inject the new memory into the pgvector brain
      await supabaseAdmin.from('brain_synapses').insert([{
        // We will associate these global learnings with a generic system ID or null, 
        // so all contractors benefit from the Hive Mind.
        content: `VIRAL IG TREND: ${coreInsight} (Source: ${url})`,
        embedding: embeddingVector,
        metadata: { source: 'instagram', url, likes }
      }]);

      embeddedCount++;
    }

    return res.status(200).json({ 
      success: true, 
      message: `Brain Expanded. Injected ${embeddedCount} new neural pathways.`
    });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
