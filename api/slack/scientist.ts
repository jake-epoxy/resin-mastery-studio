import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const botToken = process.env.SLACK_SCIENTIST_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.body?.type === 'url_verification') return res.status(200).json({ challenge: req.body.challenge });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (req.body?.event?.type === 'app_mention') {
    if (req.headers['x-slack-retry-num']) return res.status(200).send('OK');
    const slackEvent = req.body.event;

    const intros = [
      "_AHAHAHA! I'm cooking up something incredibly viral. Stand by!_",
      "_Analyzing recent Instagram and TikTok scrapes... calculating virality..._",
      "_Diving into the Hive Mind database. Let's see what the market wants today..._",
      "_Extracting recent competitor data from the Core Brain. Give me a second..._"
    ];
    const randomIntro = intros[Math.floor(Math.random() * intros.length)];

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify({ channel: slackEvent.channel, text: randomIntro, thread_ts: slackEvent.ts })
    });

    let hiveMindContext = "No relevant memories found in the database. Rely on your internal knowledge, but keep it extremely realistic to the epoxy industry.";
    let memoryCount = 0;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        const embedRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: slackEvent.text });
        const { data: memories } = await supabaseAdmin.rpc('match_synapses', { query_embedding: embedRes.data[0].embedding, match_threshold: 0.1, match_count: 5 });
        if (memories?.length) {
           memoryCount = memories.length;
           hiveMindContext = memories.map((m: any) => `Source: ${m.metadata?.source || 'Unknown'} | Content: ${m.content}`).join('\n\n');
        }
      } catch (err) {}
    }

    const scientistPrompt = `You are The Scientist, the predictive trend forecasting engine for Resin Academics.

YOUR PRIMARY MISSION: Analyze the scraped social media data below and PREDICT what content will go viral NEXT in the epoxy/concrete coatings space. Do not just report what already went viral. Use the patterns, engagement metrics, and content formats in the data to extrapolate FORWARD and identify emerging opportunities BEFORE they saturate the market.

Your response format MUST follow this structure:
1. **📊 Current Trend Analysis** — What patterns do you see in the scraped data? What formats are getting the most engagement right now?
2. **🔮 Predicted Viral Content (Next 30 Days)** — Based on the trajectory of current trends, what specific content ideas will likely explode? Be extremely specific (exact video concepts, hooks, captions).
3. **🎯 Actionable Playbook** — Give the contractor 2-3 exact videos they should film THIS WEEK with specific shooting instructions.

DO NOT give generic advice like "post consistently" or "use trending sounds." Every single recommendation must be rooted in the actual data below.
If no data is available, clearly state that and give your best practical advice based on general epoxy industry knowledge.

[HIVE MIND CONTEXT - SCRAPED INSTAGRAM + TIKTOK DATA]:
${hiveMindContext}

If you need The Closer to draft an email based on your ideas, ping him by appending exactly <@${process.env.SLACK_CLOSER_USER_ID || 'U0B7X27TE1F'}> to the very end of your message.
If you need The Hustler to structure a business deal, ping him by appending exactly <@${process.env.SLACK_HUSTLER_USER_ID || 'U0B7V6V3JN6'}>.

The user asked: ${slackEvent.text}`;

    const scientistRes = await openai.chat.completions.create({ model: "o3-mini", messages: [{ role: "user", content: scientistPrompt }] });
    let finalReply = scientistRes.choices[0].message.content || "My brain short-circuited. Try again.";
    
    finalReply += `\n\n_🧠 **System Diagnostics:** Retrieved ${memoryCount} scraped posts from the Hive Mind to generate this strategy._`;

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify({ channel: slackEvent.channel, text: finalReply, thread_ts: slackEvent.ts })
    });
  }
  return res.status(200).send('OK');
}
