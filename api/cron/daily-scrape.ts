import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Verify this request is actually coming from Vercel Cron
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In local development or manual testing, we might bypass this, but in production we enforce it.
    if (process.env.NODE_ENV === 'production') {
       return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    return res.status(500).json({ error: 'Missing APIFY_API_TOKEN' });
  }

  try {
    // 2. Trigger the Apify Instagram Scraper Actor
    // We are using the popular 'apify/instagram-scraper' actor.
    const actorId = 'apify~instagram-scraper'; 
    const apifyRunUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`;

    const scraperInput = {
      hashtags: ["epoxy", "concretecoatings", "artificialintelligence"],
      resultsLimit: 10, // Just grab the top 10 most recent/viral ones daily
      scrapePosts: true,
      scrapeComments: false
    };

    const response = await fetch(apifyRunUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scraperInput)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Apify Error: ${data.error?.message || 'Unknown error'}`);
    }

    // Since scraping takes time, we just trigger it and return immediately.
    // We will configure Apify to send a webhook to /api/webhooks/apify when it finishes!
    return res.status(200).json({ 
      success: true, 
      message: 'Scraping job triggered successfully!',
      runId: data.data.id
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
