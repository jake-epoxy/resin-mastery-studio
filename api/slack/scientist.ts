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

    const scientistPrompt = `You are The Scientist, the data-driven content strategist for Resin Academics.
Your job is to analyze the actual scraped data from the Hive Mind and formulate highly realistic, actionable social media content (TikTok/Instagram Reels) for epoxy contractors.

DO NOT hallucinate generic "Time Machine" or "Virtual Rave" ideas. 
Look strictly at the [HIVE MIND CONTEXT] below. If there is data, base your entire strategy on EXACTLY what is currently trending in those scraped posts.
If the context says "No relevant memories found", give highly practical, down-to-earth advice for a blue-collar contractor (e.g. before/after time-lapses, satisfying pouring videos).

[HIVE MIND CONTEXT - RECENT LEARNED TRENDS]:
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
