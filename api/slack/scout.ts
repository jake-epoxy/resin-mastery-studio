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
    const userMessage = slackEvent.text;

    // Step 1: Determine the user's intent
    const intentPrompt = `You are The Scout, a data-gathering AI agent. The user just sent you this message in Slack:
"${userMessage}"

Classify the user's intent into ONE of these categories. Reply with ONLY the category name:
- SCRAPE: The user wants you to go scrape/search/find new data from Instagram, TikTok, or the web.
- STATUS: The user is asking if a previous task is done, checking on progress, or asking what you found.
- CHAT: The user is just talking to you, greeting you, or asking a general question.`;

    const intentRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: intentPrompt }],
      max_tokens: 10
    });
    const intent = (intentRes.choices[0].message.content || "CHAT").trim().toUpperCase();

    if (intent === 'SCRAPE') {
      // ---- SCRAPE MODE ----
      const intros = [
        "_Deploying scraping engine across multiple platforms..._",
        "_Scanning the digital landscape for fresh intel..._",
        "_Activating data harvesting protocols..._",
        "_Infiltrating social media networks for trend data..._"
      ];
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: intros[Math.floor(Math.random() * intros.length)], thread_ts: slackEvent.ts })
      });

      const msgLower = userMessage.toLowerCase();
      const wantsTikTok = msgLower.includes('tiktok') || msgLower.includes('tik tok') || msgLower.includes('tt');
      const wantsIG = msgLower.includes('instagram') || msgLower.includes('ig') || msgLower.includes('insta');
      const wantsBoth = (!wantsTikTok && !wantsIG) || (wantsTikTok && wantsIG) || msgLower.includes('both') || msgLower.includes('everything') || msgLower.includes('all') || msgLower.includes('full');

      const scoutPrompt = `Extract 1-3 hashtags or search keywords from this message: "${userMessage}". Return ONLY a comma-separated list without # symbols. Default: epoxy,concretecoatings,epoxyfloors`;
      const scoutRes = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: scoutPrompt }], max_tokens: 30 });
      const tagsStr = scoutRes.choices[0].message.content || "epoxy,concretecoatings,epoxyfloors";
      const tags = tagsStr.split(",").map((t: string) => t.trim().replace("#", ""));

      const apifyToken = process.env.APIFY_API_TOKEN;
      if (!apifyToken) {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
          body: JSON.stringify({ channel: slackEvent.channel, text: `I need the \`APIFY_API_TOKEN\` in Vercel before I can scrape, Boss.`, thread_ts: slackEvent.ts })
        });
        return res.status(200).send('OK');
      }

      const launched: string[] = [];

      if (wantsIG || wantsBoth) {
        const igUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${apifyToken}`;
        await fetch(igUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hashtags: tags, resultsLimit: 15, scrapePosts: true, scrapeComments: false }) });
        launched.push('📸 Instagram');
      }

      if (wantsTikTok || wantsBoth) {
        const ttUrl = `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/runs?token=${apifyToken}`;
        await fetch(ttUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hashtags: tags, resultsPerPage: 15, shouldDownloadVideos: false }) });
        launched.push('🎵 TikTok');
      }

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: `**Scraping engines deployed!**\n\nPlatforms: ${launched.join(' + ')}\nKeywords: ${tags.map((t: string) => '#' + t).join(', ')}\n\nThis usually takes about 2-3 minutes. I'll let the Hive Mind process everything automatically once the data lands. After that, tag @Scientist to get the full analysis.`, thread_ts: slackEvent.ts })
      });

    } else if (intent === 'STATUS') {
      // ---- STATUS MODE ----
      let statusReply = "";
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
      const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

      if (supabaseKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
          const { count } = await supabaseAdmin.from('brain_synapses').select('*', { count: 'exact', head: true });
          const { data: recent } = await supabaseAdmin.from('brain_synapses').select('content, metadata, created_at').order('created_at', { ascending: false }).limit(3);
          
          statusReply = `**📊 Hive Mind Status Report**\n\nTotal memories stored: **${count || 0}**\n\n`;
          if (recent && recent.length > 0) {
            statusReply += `**Most recent memories:**\n`;
            recent.forEach((m: any, i: number) => {
              const source = m.metadata?.source || 'unknown';
              const time = new Date(m.created_at).toLocaleString();
              statusReply += `${i + 1}. [${source.toUpperCase()}] ${m.content?.substring(0, 120)}... _(${time})_\n`;
            });
          } else {
            statusReply += `No memories have landed yet. The scrapers are probably still running. Give it another minute or two and ask me again, Boss.`;
          }
        } catch (err) {
          statusReply = `I tried to check the Hive Mind but hit an error. The Supabase connection might be misconfigured.`;
        }
      } else {
        statusReply = `I can't check the database right now — the Supabase credentials aren't loaded.`;
      }

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: statusReply, thread_ts: slackEvent.ts })
      });

    } else {
      // ---- CHAT MODE ----
      const chatPrompt = `You are The Scout, a data-gathering AI agent for Resin Academics (an epoxy/concrete coatings company). You are tough, efficient, and talk like a military intelligence operative. Keep responses short and punchy (2-3 sentences max). The user said: "${userMessage}"`;
      const chatRes = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: chatPrompt }], max_tokens: 150 });
      const chatReply = chatRes.choices[0].message.content || "Standing by for orders, Boss.";

      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${botToken}` },
        body: JSON.stringify({ channel: slackEvent.channel, text: chatReply, thread_ts: slackEvent.ts })
      });
    }
  }
  return res.status(200).send('OK');
}
