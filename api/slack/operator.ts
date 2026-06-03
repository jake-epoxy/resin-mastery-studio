import type { VercelRequest, VercelResponse } from '../_types.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const botToken = process.env.SLACK_BOT_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.body?.type === 'url_verification') return res.status(200).json({ challenge: req.body.challenge });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (req.body?.event?.type === 'app_mention') {
    if (req.headers['x-slack-retry-num']) return res.status(200).send('OK');
    const slackEvent = req.body.event;
    const userMessage = slackEvent.text;

    // The Operator is the general-purpose admin bot
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    let systemStatus = "";
    if (supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        const { count: memCount } = await supabaseAdmin.from('brain_synapses').select('*', { count: 'exact', head: true });
        const { count: draftCount } = await supabaseAdmin.from('email_drafts').select('*', { count: 'exact', head: true });
        systemStatus = `\n\nCurrent system stats: ${memCount || 0} memories in the Hive Mind, ${draftCount || 0} email drafts in the pipeline.`;
      } catch (err) {}
    }

    const operatorPrompt = `You are The Operator, the administrative command center AI for Resin Academics. You manage the overall system, provide status reports, and help coordinate between the other agents (Scout, Scientist, Closer, Hustler).

You know the following about the team:
- @Scout handles data scraping from Instagram and TikTok
- @Scientist handles trend analysis and marketing strategy
- @Closer handles email drafting and sales outreach
- @Hustler handles business development and partnerships
${systemStatus}

Be professional, helpful, and concise. If the user needs a specific agent, tell them exactly which one to tag.

The user said: "${userMessage}"`;

    const opRes = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: operatorPrompt }], max_tokens: 300 });
    const finalReply = opRes.choices[0].message.content || "Operator standing by.";

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify({ channel: slackEvent.channel, text: finalReply, thread_ts: slackEvent.ts })
    });
  }
  return res.status(200).send('OK');
}
