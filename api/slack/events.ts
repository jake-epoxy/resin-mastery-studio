import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Slack URL Verification Challenge
  if (req.body?.type === 'url_verification') {
    return res.status(200).json({ challenge: req.body.challenge });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Handle App Mentions
  if (req.body?.event?.type === 'app_mention') {
    const slackEvent = req.body.event;
    
    // Slack sends retries if we don't respond in 3 seconds. 
    // If this is a retry, ignore it so we don't spam the channel.
    if (req.headers['x-slack-retry-num']) {
      return res.status(200).send('OK');
    }

    const userMessage = slackEvent.text;
    const channelId = slackEvent.channel;
    const slackBotToken = process.env.SLACK_BOT_TOKEN;

    // Acknowledge immediately to prevent Slack 3-second timeout
    res.status(200).send('OK');

    if (!slackBotToken || !process.env.OPENAI_API_KEY) {
      console.error("Missing Slack or OpenAI tokens.");
      return;
    }

    try {
      // Send a "thinking" message to Slack so the user knows we got it
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${slackBotToken}`
        },
        body: JSON.stringify({
          channel: channelId,
          text: `_The Swarm is analyzing your request..._`,
          thread_ts: slackEvent.ts
        })
      });

      // ==========================================
      // THE SWARM ROUTER
      // Use a fast model to classify the request
      // ==========================================
      const routerPrompt = `
You are the Master Router for the Epoxy Agent Swarm. 
Your job is to read the user's message and determine which of the 5 Agents should handle it.

The 5 Agents are:
1. "SCOUT" (Lead Gen Agent) - Finds leads, scrapes data, searches Google Maps/Instagram.
2. "CLOSER" (Email Agent) - Drafts emails, sends cold emails, writes copy for emails.
3. "HUSTLER" (Business Dev Agent) - Macro strategy, partnerships, LinkedIn outreach, revenue growth.
4. "SCIENTIST" (Content Creator Agent) - Unhinged viral content, TikTok scripts, social media marketing.
5. "OPERATOR" (Product Manager) - Internal tasks, tracking goals, general questions.

Based on the user's message, reply with ONLY the exact capitalized name of the agent who should handle it (e.g., SCOUT, CLOSER, HUSTLER, SCIENTIST, OPERATOR). Do not include any other text.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Fastest model for routing
        messages: [
          { role: "system", content: routerPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 10,
      });

      const selectedAgent = response.choices[0].message.content?.trim().toUpperCase() || 'OPERATOR';

      // Now that we know who should handle it, we will eventually pass it to their specific persona.
      // For now, we will just reply as that agent to confirm the routing works!
      
      let agentEmoji = "⚙️";
      let agentName = "The Operator";
      let agentVoice = "I've logged your request, Boss.";

      if (selectedAgent.includes("SCOUT")) {
        agentEmoji = "🕷️"; agentName = "The Scout"; agentVoice = "Scanning the web for fresh blood, Boss.";
      } else if (selectedAgent.includes("CLOSER")) {
        agentEmoji = "📧"; agentName = "The Closer"; agentVoice = "I'm drafting the pitch right now. Give me a minute.";
      } else if (selectedAgent.includes("HUSTLER")) {
        agentEmoji = "💼"; agentName = "The Hustler"; agentVoice = "Crunching the revenue numbers. Let's make some money.";
      } else if (selectedAgent.includes("SCIENTIST")) {
        agentEmoji = "🧪"; agentName = "The Mad Scientist"; agentVoice = "AHAHAHA! I'm cooking up something incredibly viral. Stand by!";
      }

      // Send the specific Agent's reply back to the Slack thread
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${slackBotToken}`
        },
        body: JSON.stringify({
          channel: channelId,
          text: `${agentEmoji} **${agentName}:** ${agentVoice}\n_(Routing engine successfully classified request as: ${selectedAgent})_`,
          thread_ts: slackEvent.ts
        })
      });

    } catch (error) {
      console.error("Failed to process Slack event:", error);
    }
    return;
  }

  return res.status(200).send('OK');
}
