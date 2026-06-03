import type { VercelRequest, VercelResponse } from '../_types.js';
import OpenAI from 'openai';
import { rememberSlackConversation, searchBrain } from '../_brain.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const botToken = process.env.SLACK_ENGINEER_TOKEN || process.env.SLACK_BOT_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.body?.type === 'url_verification') return res.status(200).json({ challenge: req.body.challenge });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  if (req.body?.event?.type === 'app_mention') {
    if (req.headers['x-slack-retry-num']) return res.status(200).send('OK');

    const slackEvent = req.body.event;
    const userMessage = slackEvent.text;

    const memories = await searchBrain(userMessage, 10);
    const memoryContext = memories.length
      ? memories.map((m: any) => `[${m.agent_source || m.metadata?.agent || 'brain'}] ${m.content}`).join('\n\n')
      : 'No relevant brain memories found yet.';

    const engineerPrompt = `You are The Engineer, the lead coding architect for Resin Academics.

Your job:
- Translate Jake's ideas into clear technical plans.
- Catch bugs, deployment risks, missing env vars, broken webhooks, and database issues.
- Explain technical things in plain English without talking down to him.
- Be decisive and practical. If something should be built, say the next concrete step.
- Use the Hive Mind context below when it helps.

Style:
- Calm senior engineer.
- Short, direct, useful.
- Do not pretend you pushed code unless you actually did.
- Always spell it "epoxy"; never write "Epoxee".

[HIVE MIND CONTEXT]:
${memoryContext}

Jake said:
"${userMessage}"`;

    const engineerRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: engineerPrompt }],
      max_tokens: 500,
    });

    const finalReply = engineerRes.choices[0].message.content || 'Engineer online. Tell me what we are building.';

    await rememberSlackConversation({
      agent: 'engineer',
      userMessage,
      reply: finalReply,
      channel: slackEvent.channel,
      threadTs: slackEvent.ts,
      user: slackEvent.user,
      intent: 'ENGINEER',
    });

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify({ channel: slackEvent.channel, text: finalReply, thread_ts: slackEvent.ts })
    });
  }

  return res.status(200).send('OK');
}
