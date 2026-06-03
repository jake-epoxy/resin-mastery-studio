import type { VercelRequest, VercelResponse } from '../_types';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const botToken = process.env.SLACK_HUSTLER_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.body?.type === 'url_verification') return res.status(200).json({ challenge: req.body.challenge });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (req.body?.event?.type === 'app_mention') {
    if (req.headers['x-slack-retry-num']) return res.status(200).send('OK');
    const slackEvent = req.body.event;
    const userMessage = slackEvent.text;

    // Step 1: Determine intent
    const intentPrompt = `You are The Hustler, a high-IQ business development AI. The user sent you this message:
"${userMessage}"

Classify the intent into ONE category. Reply with ONLY the category name:
- STRATEGIZE: The user wants business strategy, partnership ideas, revenue plays, LinkedIn outreach, or growth tactics.
- STATUS: The user is asking about current strategies, checking progress, or asking what's going on.
- CHAT: The user is just talking, greeting, or asking a general question.`;

    const intentRes = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: intentPrompt }], max_tokens: 10 });
    const intent = (intentRes.choices[0].message.content || "CHAT").trim().toUpperCase();

    if (intent === 'STRATEGIZE') {
      // ---- STRATEGIZE MODE ----
      const intros = [
        "_Crunching market data and structuring the plays..._",
        "_Mapping out revenue opportunities. Give me a minute to strategize..._",
        "_Analyzing competitive landscape and identifying leverage points..._",
        "_Running the numbers. Building your growth playbook now..._"
      ];
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: intros[Math.floor(Math.random() * intros.length)], thread_ts: slackEvent.ts })
      });

      let hiveMindContext = "No relevant data available.";
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
      const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

      if (supabaseKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
          const embedRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: slackEvent.text });
          const { data: memories } = await supabaseAdmin.rpc('match_brain_synapses', { query_embedding: embedRes.data[0].embedding, match_threshold: 0.1, match_count: 5 });
          if (memories?.length) hiveMindContext = memories.map((m: any) => m.content).join('\n\n');
        } catch (err) {}
      }

      const hustlerPrompt = `You are The Hustler, the ruthless Business Development strategist for Resin Academics.
Your job is to analyze macro revenue opportunities, draft strategic LinkedIn outreach, suggest high-leverage partnerships, and map out growth tactics for epoxy and concrete contractors.

Be specific. Use actual numbers when possible. Structure your response with clear action items, not vague advice.

[HIVE MIND CONTEXT]:
${hiveMindContext}

If you need The Closer to draft a cold email based on your strategy, ping him: <@${process.env.SLACK_CLOSER_USER_ID || 'U0B7X27TE1F'}>
If you need The Scientist for marketing data, ping him: <@${process.env.SLACK_SCIENTIST_USER_ID || 'U0B7YR1DYKE'}>

The user asked: ${userMessage}`;

      const hustlerRes = await openai.chat.completions.create({ model: "o3-mini", messages: [{ role: "user", content: hustlerPrompt }] });
      const finalReply = hustlerRes.choices[0].message.content || "Strategy failed to compile. Try again.";

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
          const { count: totalMemories } = await supabaseAdmin.from('brain_synapses').select('*', { count: 'exact', head: true });
          const { count: totalDrafts } = await supabaseAdmin.from('email_drafts').select('*', { count: 'exact', head: true });

          statusReply = `**💼 The Hustler's Situation Room**\n\nHive Mind memories: **${totalMemories || 0}**\nEmail drafts in pipeline: **${totalDrafts || 0}**\n\nThe operation is running. Tell me where to focus the next play, Boss.`;
        } catch (err) {
          statusReply = `Couldn't pull the data right now. Database might be under load.`;
        }
      }

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: statusReply, thread_ts: slackEvent.ts })
      });

    } else {
      // ---- CHAT MODE ----
      const chatPrompt = `You are The Hustler, a ruthless, high-IQ business development AI for Resin Academics (epoxy/concrete coatings). You talk like a sharp dealmaker who's always three moves ahead. Short, punchy responses (2-3 sentences). The user said: "${userMessage}"`;
      const chatRes = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: chatPrompt }], max_tokens: 150 });
      const chatReply = chatRes.choices[0].message.content || "Always looking for the next angle. What do you need?";

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: chatReply, thread_ts: slackEvent.ts })
      });
    }
  }
  return res.status(200).send('OK');
}
