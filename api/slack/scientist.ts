import type { VercelRequest, VercelResponse } from '../_types';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const botToken = process.env.SLACK_SCIENTIST_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.body?.type === 'url_verification') return res.status(200).json({ challenge: req.body.challenge });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (req.body?.event?.type === 'app_mention') {
    if (req.headers['x-slack-retry-num']) return res.status(200).send('OK');
    const slackEvent = req.body.event;
    const userMessage = slackEvent.text;

    // Step 1: Determine intent
    const intentPrompt = `You are The Scientist, a predictive trend forecasting AI. The user sent you this message:
"${userMessage}"

Classify the intent into ONE category. Reply with ONLY the category name:
- ANALYZE: The user wants a marketing strategy, content ideas, trend analysis, predictions, or campaign planning.
- STATUS: The user is asking what you know, what data you have, what's in the brain, or checking on something.
- CHAT: The user is just talking, greeting, or asking a general question.`;

    const intentRes = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: intentPrompt }], max_tokens: 10 });
    const intent = (intentRes.choices[0].message.content || "CHAT").trim().toUpperCase();

    if (intent === 'ANALYZE') {
      // ---- ANALYZE MODE ----
      const intros = [
        "_Pulling data from the Hive Mind and running predictive models..._",
        "_Analyzing recent Instagram and TikTok scrapes... calculating virality coefficients..._",
        "_Diving deep into the neural network. Building your strategy now..._",
        "_Extracting trend trajectories from the Core Brain..._"
      ];
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: intros[Math.floor(Math.random() * intros.length)], thread_ts: slackEvent.ts })
      });

      let hiveMindContext = "No relevant memories found in the database. There may not be enough scraped data yet. Give your best practical advice based on general epoxy industry knowledge, but be honest about the data gap.";
      let memoryCount = 0;
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
      const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

      if (supabaseKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
          const embedRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: slackEvent.text });
          const { data: memories } = await supabaseAdmin.rpc('match_brain_synapses', { query_embedding: embedRes.data[0].embedding, match_threshold: 0.1, match_count: 8 });
          if (memories?.length) {
            memoryCount = memories.length;
            hiveMindContext = memories.map((m: any) => `[${m.metadata?.source?.toUpperCase() || 'UNKNOWN'}] ${m.content}`).join('\n\n');
          }
        } catch (err) {}
      }

      const scientistPrompt = `You are The Scientist, the predictive trend forecasting engine for Resin Academics.

YOUR PRIMARY MISSION: Analyze the scraped social media data below and PREDICT what content will go viral NEXT in the epoxy/concrete coatings space. Use the patterns, engagement metrics, and content formats to extrapolate FORWARD.

Your response MUST follow this structure:
1. **📊 Current Trend Analysis** — What patterns do you see in the data? What formats get the most engagement?
2. **🔮 Predicted Viral Content (Next 30 Days)** — Based on trajectory, what specific content ideas will explode? Be extremely specific.
3. **🎯 Actionable Playbook** — 2-3 exact videos to film THIS WEEK with specific shooting instructions.

DO NOT give generic advice. Every recommendation must reference the actual data below when available.

[HIVE MIND DATA - SCRAPED INSTAGRAM + TIKTOK]:
${hiveMindContext}

If you need The Closer to draft an email, ping him: <@${process.env.SLACK_CLOSER_USER_ID || 'U0B7X27TE1F'}>
If you need The Hustler for business strategy, ping him: <@${process.env.SLACK_HUSTLER_USER_ID || 'U0B7V6V3JN6'}>

The user asked: ${userMessage}`;

      const scientistRes = await openai.chat.completions.create({ model: "o3-mini", messages: [{ role: "user", content: scientistPrompt }] });
      let finalReply = scientistRes.choices[0].message.content || "My neural circuits overloaded. Try again.";
      finalReply += `\n\n_🧠 Retrieved ${memoryCount} memories from the Hive Mind for this analysis._`;

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: finalReply, thread_ts: slackEvent.ts })
      });

    } else if (intent === 'STATUS') {
      // ---- STATUS MODE ----
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
      const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      let statusReply = "";

      if (supabaseKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
          const { count } = await supabaseAdmin.from('brain_synapses').select('*', { count: 'exact', head: true });
          const { data: igCount } = await supabaseAdmin.from('brain_synapses').select('id', { count: 'exact', head: true }).eq('metadata->>source', 'instagram');
          const { data: ttCount } = await supabaseAdmin.from('brain_synapses').select('id', { count: 'exact', head: true }).eq('metadata->>source', 'tiktok');

          statusReply = `**🧪 Scientist's Lab Report**\n\nTotal memories in the Hive Mind: **${count || 0}**\nInstagram memories: **${igCount || 0}**\nTikTok memories: **${ttCount || 0}**\n\nIf you want me to run a full analysis on this data, just say the word, Boss.`;
        } catch (err) {
          statusReply = `I tried to access the Hive Mind but something went wrong. Check the Supabase connection.`;
        }
      } else {
        statusReply = `Database credentials aren't loaded. Can't check the Brain right now.`;
      }

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: statusReply, thread_ts: slackEvent.ts })
      });

    } else {
      // ---- CHAT MODE ----
      const chatPrompt = `You are The Scientist, a brilliant but slightly eccentric AI trend forecaster for Resin Academics (epoxy/concrete coatings company). You're data-obsessed, always thinking about virality patterns, and you talk with confident energy. Keep responses short (2-3 sentences). The user said: "${userMessage}"`;
      const chatRes = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: chatPrompt }], max_tokens: 150 });
      const chatReply = chatRes.choices[0].message.content || "Ready to analyze whenever you need me, Boss.";

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: chatReply, thread_ts: slackEvent.ts })
      });
    }
  }
  return res.status(200).send('OK');
}
