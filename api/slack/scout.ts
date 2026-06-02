import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const botToken = process.env.SLACK_SCOUT_TOKEN;

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
      body: JSON.stringify({ channel: slackEvent.channel, text: `_Deploying scraping engine..._`, thread_ts: slackEvent.ts })
    });

    const userMessage = slackEvent.text;
    const scoutPrompt = `Extract 1-3 hashtags the user wants to scrape from this message: "${userMessage}". Return ONLY a comma-separated list of the hashtags without the # symbol. Default: epoxy,concretecoatings`;

    const scoutRes = await openai.chat.completions.create({
       model: "gpt-4o-mini",
       messages: [{ role: "user", content: scoutPrompt }],
       max_tokens: 20
    });
    
    const tagsStr = scoutRes.choices[0].message.content || "epoxy,concretecoatings";
    const tags = tagsStr.split(",").map((t: string) => t.trim().replace("#", ""));

    let finalReply = "";
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (apifyToken) {
      const actorId = 'apify~instagram-scraper'; 
      const apifyRunUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`;
      await fetch(apifyRunUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtags: tags, resultsLimit: 10, scrapePosts: true, scrapeComments: false })
      });
      finalReply = `I just triggered a manual sweep of the web for: **${tags.map((t: string)=>'#'+t).join(', ')}**. Once it's done, those memories will be permanently burned into our Hive Mind.`;
    } else {
      finalReply = `I need the \`APIFY_API_TOKEN\` added to your Vercel Environment Variables before I can deploy the scraper, Boss.`;
    }

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify({ channel: slackEvent.channel, text: finalReply, thread_ts: slackEvent.ts })
    });
    return;
  }
  return res.status(200).send('OK');
}
