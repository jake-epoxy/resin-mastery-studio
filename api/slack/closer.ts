import type { VercelRequest, VercelResponse } from '../_types.js';
import OpenAI from 'openai';
import { rememberSlackConversation } from '../_brain.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const botToken = process.env.SLACK_CLOSER_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.body?.type === 'url_verification') return res.status(200).json({ challenge: req.body.challenge });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (req.body?.event?.type === 'app_mention') {
    if (req.headers['x-slack-retry-num']) return res.status(200).send('OK');
    const slackEvent = req.body.event;
    const userMessage = slackEvent.text;

    // Step 1: Determine intent
    const intentPrompt = `You are The Closer, a ruthless sales and email drafting AI. The user sent you this message:
"${userMessage}"

Classify the intent into ONE category. Reply with ONLY the category name:
- DRAFT: The user wants you to draft an email, write a pitch, create outreach, or close a deal.
- STATUS: The user is asking about previous drafts, checking what emails were sent, or asking about leads.
- CHAT: The user is just talking, greeting, or asking a general question.`;

    const intentRes = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: intentPrompt }], max_tokens: 10 });
    const intent = (intentRes.choices[0].message.content || "CHAT").trim().toUpperCase();

    if (intent === 'DRAFT') {
      // ---- DRAFT MODE ----
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: `_I'm crafting the perfect pitch. Give me a moment, Boss._`, thread_ts: slackEvent.ts })
      });

      let hiveMindContext = "No relevant data available.";
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
      const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

      if (supabaseKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
          const embedRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: slackEvent.text });
          const { data: memories } = await supabaseAdmin.rpc('match_brain_synapses', { query_embedding: embedRes.data[0].embedding, match_threshold: 0.1, match_count: 3 });
          if (memories?.length) hiveMindContext = memories.map((m: any) => m.content).join('\n\n');
        } catch (err) {}
      }

      const closerPrompt = `You are The Closer, the ruthless Email Marketing agent for Resin Academics.
Draft a highly personalized, confident cold email. Use data from the Hive Mind to make it specific and relevant.

[HIVE MIND CONTEXT]:
${hiveMindContext}

The user asked: ${userMessage}

Respond in pure JSON format:
{
  "lead_name": "Name of the person/company",
  "lead_email": "Email address (use placeholder if not given)",
  "subject": "Converting subject line",
  "body": "The email body. Confident copywriting. Sign off as Jake from Resin Academics.",
  "chain_to_id": ""
}`;

      const closerRes = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: closerPrompt }],
        response_format: { type: "json_object" }
      });

      const draftStr = closerRes.choices[0].message.content || "{}";
      const draftData = JSON.parse(draftStr);

      let currentDraftId = null;
      if (supabaseKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        const { data: insertedDraft } = await supabaseAdmin.from('email_drafts').insert([{
          lead_name: draftData.lead_name || 'Unknown',
          lead_email: draftData.lead_email || 'unknown@example.com',
          subject: draftData.subject || 'Opportunity',
          body: draftData.body || 'Email body',
          agent_id: 'CLOSER',
          slack_thread_ts: slackEvent.ts
        }]).select().single();
        if (insertedDraft) currentDraftId = insertedDraft.id;
      }

      let finalReply = `📧 **Draft Ready for ${draftData.lead_name}** (${draftData.lead_email})\n\n*Subject:* ${draftData.subject}\n\n${draftData.body}`;

      const blocks = currentDraftId ? [
        { "type": "section", "text": { "type": "mrkdwn", "text": finalReply } },
        { "type": "actions", "elements": [{ "type": "button", "text": { "type": "plain_text", "text": "✅ Approve & Send", "emoji": true }, "style": "primary", "value": currentDraftId.toString(), "action_id": "approve_and_send_email" }] }
      ] : undefined;

      const payload: any = { channel: slackEvent.channel, thread_ts: slackEvent.ts };
      if (blocks) { payload.text = `Draft ready.`; payload.blocks = blocks; } else { payload.text = finalReply; }

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify(payload)
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
          const { count: totalDrafts } = await supabaseAdmin.from('email_drafts').select('*', { count: 'exact', head: true });
          const { data: recentDrafts } = await supabaseAdmin.from('email_drafts').select('lead_name, lead_email, subject, status, created_at').order('created_at', { ascending: false }).limit(5);

          statusReply = `**📬 The Closer's Pipeline Report**\n\nTotal drafts created: **${totalDrafts || 0}**\n\n`;
          if (recentDrafts && recentDrafts.length > 0) {
            statusReply += `**Recent drafts:**\n`;
            recentDrafts.forEach((d: any, i: number) => {
              statusReply += `${i + 1}. **${d.lead_name}** (${d.lead_email}) — _"${d.subject}"_ [${d.status || 'pending'}]\n`;
            });
          } else {
            statusReply += `No drafts in the pipeline yet. Tell me who to pitch and I'll get to work.`;
          }
        } catch (err) {
          statusReply = `Couldn't pull draft data. Database might be having issues.`;
        }
      }

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: statusReply, thread_ts: slackEvent.ts })
      });

    } else {
      // ---- CHAT MODE ----
      const chatPrompt = `You are The Closer, a ruthless, smooth-talking sales AI for Resin Academics (epoxy/concrete coatings). You talk like a confident closer who lives for the deal. Short, punchy responses (2-3 sentences). The user said: "${userMessage}"`;
      const chatRes = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: chatPrompt }], max_tokens: 150 });
      const chatReply = chatRes.choices[0].message.content || "Point me at a lead and watch me work.";
      await rememberSlackConversation({
        agent: 'closer',
        userMessage,
        reply: chatReply,
        channel: slackEvent.channel,
        threadTs: slackEvent.ts,
        user: slackEvent.user,
        intent,
      });

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: chatReply, thread_ts: slackEvent.ts })
      });
    }
  }
  return res.status(200).send('OK');
}
