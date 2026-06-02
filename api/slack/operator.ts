import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const botToken = process.env.SLACK_BOT_TOKEN; // The original token

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
      body: JSON.stringify({ channel: slackEvent.channel, text: `_Operator here. I've logged your request._`, thread_ts: slackEvent.ts })
    });

    const operatorPrompt = `You are The Operator, the administrative AI assistant for Resin OS. 
The user asked: ${slackEvent.text}
Keep your response short, helpful, and professional.`;

    const opRes = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: operatorPrompt }] });
    const finalReply = opRes.choices[0].message.content || "Logging failed.";

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify({ channel: slackEvent.channel, text: finalReply, thread_ts: slackEvent.ts })
    });
  }
  return res.status(200).send('OK');
}
