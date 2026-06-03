import type { VercelRequest, VercelResponse } from '../_types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
       return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    return res.status(500).json({ error: 'Missing APIFY_API_TOKEN' });
  }

  const hashtags = ["epoxy", "concretecoatings", "epoxyfloors", "epoxycoatings", "metallicepoxy"];

  try {
    // 1. Trigger Instagram Scraper
    const igActorId = 'apify~instagram-scraper';
    const igUrl = `https://api.apify.com/v2/acts/${igActorId}/runs?token=${apifyToken}`;
    const igResponse = await fetch(igUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashtags, resultsLimit: 15, scrapePosts: true, scrapeComments: false })
    });
    const igData = await igResponse.json();
    if (!igResponse.ok) throw new Error(`Instagram Scraper Error: ${igData.error?.message || 'Unknown'}`);

    // 2. Trigger TikTok Scraper
    const ttActorId = 'clockworks~tiktok-scraper';
    const ttUrl = `https://api.apify.com/v2/acts/${ttActorId}/runs?token=${apifyToken}`;
    const ttResponse = await fetch(ttUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashtags, resultsPerPage: 15, shouldDownloadVideos: false })
    });
    const ttData = await ttResponse.json();
    if (!ttResponse.ok) throw new Error(`TikTok Scraper Error: ${ttData.error?.message || 'Unknown'}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Both Instagram + TikTok scraping jobs triggered!',
      igRunId: igData.data?.id,
      ttRunId: ttData.data?.id
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
