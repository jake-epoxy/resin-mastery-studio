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
    const userMessage = slackEvent.text.toLowerCase();

    const intros = [
      "_Deploying scraping engine across multiple platforms..._",
      "_Scanning the digital landscape for fresh intel..._",
      "_Activating data harvesting protocols..._",
      "_Infiltrating social media networks for trend data..._"
    ];
    const randomIntro = intros[Math.floor(Math.random() * intros.length)];

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify({ channel: slackEvent.channel, text: randomIntro, thread_ts: slackEvent.ts })
    });

    // Determine which platforms to scrape
    const wantsTikTok = userMessage.includes('tiktok') || userMessage.includes('tik tok') || userMessage.includes('tt');
    const wantsIG = userMessage.includes('instagram') || userMessage.includes('ig') || userMessage.includes('insta');
    const wantsBoth = (!wantsTikTok && !wantsIG) || (wantsTikTok && wantsIG) || userMessage.includes('both') || userMessage.includes('everything') || userMessage.includes('all');

    // Extract hashtags/keywords
    const scoutPrompt = `Extract 1-3 hashtags or search keywords the user wants to scrape from this message: "${slackEvent.text}". Return ONLY a comma-separated list without the # symbol. Default: epoxy,concretecoatings,epoxyfloors`;
    const scoutRes = await openai.chat.completions.create({
       model: "gpt-4o-mini",
       messages: [{ role: "user", content: scoutPrompt }],
       max_tokens: 30
    });
    const tagsStr = scoutRes.choices[0].message.content || "epoxy,concretecoatings,epoxyfloors";
    const tags = tagsStr.split(",").map((t: string) => t.trim().replace("#", ""));

    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: `I need the \`APIFY_API_TOKEN\` added to your Vercel Environment Variables before I can deploy the scraper, Boss.`, thread_ts: slackEvent.ts })
      });
      return res.status(200).send('OK');
    }

    const launched: string[] = [];

    // Instagram Scraper
    if (wantsIG || wantsBoth) {
      const igActorId = 'apify~instagram-scraper';
      const igUrl = `https://api.apify.com/v2/acts/${igActorId}/runs?token=${apifyToken}`;
      await fetch(igUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtags: tags, resultsLimit: 15, scrapePosts: true, scrapeComments: false })
      });
      launched.push('📸 Instagram');
    }

    // TikTok Scraper
    if (wantsTikTok || wantsBoth) {
      const ttActorId = 'clockworks~tiktok-scraper';
      const ttUrl = `https://api.apify.com/v2/acts/${ttActorId}/runs?token=${apifyToken}`;
      await fetch(ttUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtags: tags, resultsPerPage: 15, shouldDownloadVideos: false })
      });
      launched.push('🎵 TikTok');
    }

    const finalReply = `**Scraping engines deployed!**\n\nPlatforms: ${launched.join(' + ')}\nKeywords: ${tags.map((t: string) => '#' + t).join(', ')}\n\nOnce the data lands, it will be automatically embedded into the Hive Mind. The Scientist will have access to every single trend we harvest.`;

    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
      body: JSON.stringify({ channel: slackEvent.channel, text: finalReply, thread_ts: slackEvent.ts })
    });
  }
  return res.status(200).send('OK');
}
