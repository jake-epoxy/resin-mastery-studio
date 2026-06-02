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

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify({ channel: slackEvent.channel, text: `_AHAHAHA! I'm cooking up something incredibly viral. Stand by!_`, thread_ts: slackEvent.ts })
    });

    let hiveMindContext = "No relevant memories found.";
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        const embedRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: slackEvent.text });
        const { data: memories } = await supabaseAdmin.rpc('match_synapses', { query_embedding: embedRes.data[0].embedding, match_threshold: 0.5, match_count: 3 });
        if (memories?.length) hiveMindContext = memories.map((m: any) => m.content).join('\n\n');
      } catch (err) {}
    }

    const scientistPrompt = `You are The Mad Scientist, the in-house viral content creator and schizo-genius marketer for Resin Academics.
Your job is to dream up wildly viral, out-of-the-box marketing campaigns, TikTok scripts, and social media roadmaps for epoxy and concrete coating contractors.
Be eccentric, unhinged, highly creative, but ultimately provide incredibly valuable and actionable marketing strategies.

[HIVE MIND CONTEXT - RECENT LEARNED TRENDS]:
${hiveMindContext}

If you need The Closer to draft an email based on your ideas, ping him by appending exactly <@${process.env.SLACK_CLOSER_USER_ID || 'U0B7X27TE1F'}> to the very end of your message.
If you need The Hustler to structure a business deal, ping him by appending exactly <@${process.env.SLACK_HUSTLER_USER_ID || 'U0B7V6V3JN6'}>.

The user asked: ${slackEvent.text}`;

    const scientistRes = await openai.chat.completions.create({ model: "o3-mini", messages: [{ role: "user", content: scientistPrompt }] });
    const finalReply = scientistRes.choices[0].message.content || "My brain short-circuited. Try again.";

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify({ channel: slackEvent.channel, text: finalReply, thread_ts: slackEvent.ts })
    });
  }
  return res.status(200).send('OK');
}
