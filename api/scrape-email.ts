import type { VercelRequest, VercelResponse } from './_types.js';

const EMAIL_REGEX = /([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
const INVALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.js', '.css', '.woff', '.woff2', '.ttf', '.eot'];
const INVALID_DOMAINS = ['sentry.io', 'example.com', 'domain.com', 'wix.com', 'wordpress.com', 'gravatar.com', 'schema.org', 'googleusercontent.com', 'w3.org'];

// Common contact page paths to try
const CONTACT_PATHS = ['', '/contact', '/contact-us', '/about', '/about-us'];

function extractEmail(html: string): string | null {
  const matches = html.match(EMAIL_REGEX) || [];

  for (let email of matches) {
    email = email.toLowerCase();

    const isInvalidExtension = INVALID_EXTENSIONS.some(ext => email.endsWith(ext));
    const isInvalidDomain = INVALID_DOMAINS.some(domain => email.includes(domain));

    // Basic sanity check for valid email structure
    const parts = email.split('@');
    if (parts.length !== 2 || parts[0].length < 2 || parts[1].length < 3) continue;
    if (parts[1].split('.').pop()!.length < 2) continue;

    if (!isInvalidExtension && !isInvalidDomain) {
      return email;
    }
  }

  return null;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow',
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

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

  // Remove trailing slash for consistent path joining
  const baseUrl = url.replace(/\/+$/, '');

  try {
    // Try multiple pages to find an email
    for (const path of CONTACT_PATHS) {
      const fullUrl = path ? `${baseUrl}${path}` : baseUrl;
      const html = await fetchPage(fullUrl);

      if (html) {
        const email = extractEmail(html);
        if (email) {
          return res.status(200).json({ email, source: fullUrl });
        }
      }
    }

    // Also check for mailto: links specifically (sometimes hidden in JS)
    // Try the homepage one more time with a broader regex for mailto:
    const homepageHtml = await fetchPage(baseUrl);
    if (homepageHtml) {
      const mailtoMatch = homepageHtml.match(/mailto:([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/i);
      if (mailtoMatch && mailtoMatch[1]) {
        const email = mailtoMatch[1].toLowerCase();
        if (!INVALID_DOMAINS.some(d => email.includes(d))) {
          return res.status(200).json({ email, source: 'mailto' });
        }
      }
    }

    // Nothing found
    res.status(200).json({ email: null });

  } catch (error: any) {
    console.error('Error scraping email:', error?.message);
    res.status(200).json({ email: null });
  }
}
