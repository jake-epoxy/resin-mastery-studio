import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const botToken = process.env.SLACK_CLOSER_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.body?.type === 'url_verification') return res.status(200).json({ challenge: req.body.challenge });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (req.body?.event?.type === 'app_mention') {
    if (req.headers['x-slack-retry-num']) return res.status(200).send('OK');
    const slackEvent = req.body.event;
    res.status(200).send('OK');

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify({ channel: slackEvent.channel, text: `_I'm drafting the pitch right now. Give me a minute, Boss._`, thread_ts: slackEvent.ts })
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

    const closerPrompt = `You are The Closer, the ruthless Email Marketing agent for Resin Academics.
Your job is to draft highly personalized, aggressive cold emails pitching AI/Digital Marketing services to contractors.

[HIVE MIND CONTEXT - STRATEGIES & TRENDS TO USE IN THE EMAIL]:
${hiveMindContext}

The user asked: ${slackEvent.text}

Respond in pure JSON format with exactly these fields:
{
  "lead_name": "Name of the person/company to email",
  "lead_email": "Email address",
  "subject": "The highly converting subject line",
  "body": "The actual email body. Use aggressive, confident copywriting. Sign off as Jake from Resin OS.",
  "chain_to_id": "If you need another agent to do something next, put their Slack User ID here, otherwise leave blank."
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

    let finalReply = `I just drafted the pitch for **${draftData.lead_name}** (${draftData.lead_email}).\n\n*Subject:* ${draftData.subject}\n\n${draftData.body}`;
    if (draftData.chain_to_id) finalReply += `\n\n<@${draftData.chain_to_id}>`;

    const blocks = currentDraftId ? [
      { "type": "section", "text": { "type": "mrkdwn", "text": finalReply } },
      { "type": "actions", "elements": [{ "type": "button", "text": { "type": "plain_text", "text": "✅ Approve & Send", "emoji": true }, "style": "primary", "value": currentDraftId.toString(), "action_id": "approve_and_send_email" }] }
    ] : undefined;

    const payload: any = { channel: slackEvent.channel, thread_ts: slackEvent.ts };
    if (blocks) {
      payload.text = `The Closer posted a draft.`;
      payload.blocks = blocks;
    } else {
      payload.text = finalReply;
    }

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify(payload)
    });
  }
  return res.status(200).send('OK');
}
