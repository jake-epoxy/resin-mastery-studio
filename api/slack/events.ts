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

      let finalReply = "";
      let agentEmoji = "⚙️";
      let agentName = "The Operator";
      let agentVoice = "";
      let agentVoice = "";

      if (selectedAgent.includes("SCIENTIST")) {
        agentEmoji = "🧪"; agentName = "The Mad Scientist"; agentVoice = "AHAHAHA! I'm cooking up something incredibly viral. Stand by!";
        
        // Let the user know the Scientist is thinking
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${slackBotToken}`
          },
          body: JSON.stringify({ channel: channelId, text: `${agentEmoji} **${agentName}:** ${agentVoice}`, thread_ts: slackEvent.ts })
        });

        // Use o3-mini for advanced reasoning and creative writing
        const scientistPrompt = `You are The Mad Scientist, the in-house viral content creator and schizo-genius marketer for Resin Academics.
Your job is to dream up wildly viral, out-of-the-box marketing campaigns, TikTok scripts, and social media roadmaps for epoxy and concrete coating contractors.
Be eccentric, unhinged, highly creative, but ultimately provide incredibly valuable and actionable marketing strategies.
The user asked: ${userMessage}`;

        const scientistRes = await openai.chat.completions.create({
          model: "o3-mini",
          messages: [{ role: "user", content: scientistPrompt }],
        });

        finalReply = scientistRes.choices[0].message.content || "My brain short-circuited. Try again.";
      } else if (selectedAgent.includes("SCOUT")) {
        agentEmoji = "🕷️"; agentName = "The Scout"; finalReply = "Scanning the web for fresh blood, Boss. (Scraping engine coming soon!)";
      } else if (selectedAgent.includes("CLOSER")) {
        agentEmoji = "📧"; agentName = "The Closer"; finalReply = "I'm drafting the pitch right now. (Email drafting coming soon!)";
      } else if (selectedAgent.includes("HUSTLER")) {
        agentEmoji = "💼"; agentName = "The Hustler"; agentVoice = "Crunching the data and structuring the plays. Give me a minute to strategize, Boss.";

        // Let the user know the Hustler is thinking
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${slackBotToken}`
          },
          body: JSON.stringify({ channel: channelId, text: `${agentEmoji} **${agentName}:** ${agentVoice}`, thread_ts: slackEvent.ts })
        });

        // Use o3-mini for advanced strategic BD planning
        const hustlerPrompt = `You are The Hustler, the ruthless, high-IQ Business Development agent for Resin Academics.
Your job is to analyze macro revenue opportunities, draft hyper-strategic LinkedIn outreach, suggest high-leverage partnerships, and map out business growth tactics for epoxy and concrete contractors.
You speak precisely, aggressively, and always focus on scaling revenue.
The user asked: ${userMessage}`;

        const hustlerRes = await openai.chat.completions.create({
          model: "o3-mini",
          messages: [{ role: "user", content: hustlerPrompt }],
        });

        finalReply = hustlerRes.choices[0].message.content || "Strategy failed to compile. Try again.";
      } else {
        agentEmoji = "⚙️"; agentName = "The Operator"; finalReply = "I've logged your request, Boss.";
      }

      // Send the final Agent's reply back to the Slack thread
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${slackBotToken}`
        },
        body: JSON.stringify({
          channel: channelId,
          text: `${agentEmoji} **${agentName}:**\n\n${finalReply}`,
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
