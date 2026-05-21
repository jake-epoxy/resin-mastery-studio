import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }

  // Ensure url has http/https
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);

    const html = await response.text();

    // Regex to match email patterns
    // Using a broad pattern to catch things in mailto: or plain text
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const matches = html.match(emailRegex) || [];

    // Clean and filter the results
    const invalidExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.js', '.css', '.woff'];
    const invalidDomains = ['sentry.io', 'example.com', 'domain.com', 'wix.com'];

    let foundEmail = null;

    for (let email of matches) {
      email = email.toLowerCase();
      
      const isInvalidExtension = invalidExtensions.some(ext => email.endsWith(ext));
      const isInvalidDomain = invalidDomains.some(domain => email.includes(domain));
      
      // Basic sanity check for valid email structure
      const parts = email.split('@');
      if (parts.length !== 2 || parts[0].length < 2 || parts[1].length < 3) continue;

      if (!isInvalidExtension && !isInvalidDomain) {
        foundEmail = email;
        break; // Return the first valid one found
      }
    }

    res.status(200).json({ email: foundEmail });

  } catch (error: any) {
    console.error('Error scraping email:', error?.message);
    // Don't fail the client request, just return null if scrape fails
    res.status(200).json({ email: null });
  }
}
