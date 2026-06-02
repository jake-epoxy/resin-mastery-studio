import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Slack URL Verification Challenge (Needed to connect the App)
  if (req.body?.type === 'url_verification') {
    return res.status(200).json({ challenge: req.body.challenge });
  }

  // Verify that it's a POST request for events
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Handle App Mentions (When you talk to the agent in Slack)
  if (req.body?.event?.type === 'app_mention') {
    const slackEvent = req.body.event;
    const userMessage = slackEvent.text;
    const channelId = slackEvent.channel;
    
    // The Bot Token (must be set in Vercel Environment Variables)
    const slackBotToken = process.env.SLACK_BOT_TOKEN;

    // Acknowledge the message immediately so Slack doesn't time out
    res.status(200).send('OK');

    // Send a message back to the Slack channel
    try {
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${slackBotToken}`
        },
        body: JSON.stringify({
          channel: channelId,
          text: `*Neural Link Active.* I heard you say: "${userMessage}". The Swarm is analyzing...`,
          thread_ts: slackEvent.ts // Reply in a thread!
        })
      });
    } catch (error) {
      console.error("Failed to reply to Slack:", error);
    }
    return;
  }

  return res.status(200).send('OK');
}
