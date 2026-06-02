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

      // ==========================================
      // THE HIVE MIND (Vector Retrieval)
      // ==========================================
      let hiveMindContext = "No relevant memories found.";
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
      const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      
      if (supabaseKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

          // Embed the user's message
          const embedRes = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: userMessage,
          });
          const queryEmbedding = embedRes.data[0].embedding;

          // Search the Brain
          const { data: memories } = await supabaseAdmin.rpc('match_synapses', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5, // Return anything moderately relevant
            match_count: 3
          });

          if (memories && memories.length > 0) {
            hiveMindContext = memories.map((m: any) => m.content).join('\n\n');
          }
        } catch (err) {
          console.error("Hive Mind retrieval error:", err);
        }
      }

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

[HIVE MIND CONTEXT - RECENT LEARNED TRENDS]:
${hiveMindContext}

The user asked: ${userMessage}`;

        const scientistRes = await openai.chat.completions.create({
          model: "o3-mini",
          messages: [{ role: "user", content: scientistPrompt }],
        });

        finalReply = scientistRes.choices[0].message.content || "My brain short-circuited. Try again.";
      } else if (selectedAgent.includes("SCOUT")) {
        agentEmoji = "🕷️"; agentName = "The Scout"; finalReply = "Scanning the web for fresh blood, Boss. (Scraping engine coming soon!)";
      } else if (selectedAgent.includes("CLOSER")) {
        agentEmoji = "📧"; agentName = "The Closer"; agentVoice = "I'm drafting the pitch right now. Give me a minute, Boss.";

        // Let the user know the Closer is thinking
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${slackBotToken}`
          },
          body: JSON.stringify({ channel: channelId, text: `${agentEmoji} **${agentName}:** ${agentVoice}`, thread_ts: slackEvent.ts })
        });

        // Use gpt-4o for JSON structured output
        const closerPrompt = `You are The Closer, the ruthless Email Marketing agent for Resin Academics.
Your job is to draft highly personalized, aggressive cold emails pitching AI/Digital Marketing services to contractors.

[HIVE MIND CONTEXT - STRATEGIES & TRENDS TO USE IN THE EMAIL]:
${hiveMindContext}

The user asked: ${userMessage}

Respond in pure JSON format with exactly these fields:
{
  "lead_name": "Name of the person/company to email (extract from user message, or default to 'Local Contractor')",
  "lead_email": "Email address (extract from user message, or default to 'test@example.com')",
  "subject": "The highly converting subject line",
  "body": "The actual email body. Use aggressive, confident copywriting. Sign off as Jake from Resin OS."
}`;

        const closerRes = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: closerPrompt }],
          response_format: { type: "json_object" }
        });

        const draftStr = closerRes.choices[0].message.content || "{}";
        const draftData = JSON.parse(draftStr);

        // Save to Supabase
        const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
        const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        
        if (supabaseKey) {
          // Dynamic import of Supabase to avoid breaking the top-level scope if not used
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
          await supabaseAdmin.from('email_drafts').insert([{
             lead_name: draftData.lead_name || 'Unknown',
             lead_email: draftData.lead_email || 'unknown@example.com',
             subject: draftData.subject || 'Opportunity',
             body: draftData.body || 'Email body',
             agent_id: 'CLOSER',
             slack_thread_ts: slackEvent.ts
          }]);
        }

        finalReply = `I just drafted the pitch for **${draftData.lead_name}** (${draftData.lead_email}).\n\n*Subject:* ${draftData.subject}\n\n${draftData.body}\n\n_(Note: I saved this draft to your database. Next up we will build the interactive [Approve & Send] buttons!)_`;
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

[HIVE MIND CONTEXT - LEVERAGE THIS DATA FOR YOUR STRATEGY]:
${hiveMindContext}

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
