import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // We can support GET requests for image proxying
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // The name parameter will be like: places/ChIJyX19QC31Zs0RzZ1PkUB21QI/photos/AUacShh3_9a7...
  const name = req.query.name as string;
  const base64 = req.query.base64 === 'true';
  const maxWidthPx = req.query.maxWidthPx || req.query.maxwidth || '';
  const maxHeightPx = req.query.maxHeightPx || req.query.maxheight || '';

  if (!name) {
    return res.status(400).json({ error: 'Missing photo resource name parameter ("name")' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Places API key is not configured on the server.' });
  }

  try {
    // Construct the Google Places Media endpoint URL
    // Format: https://places.googleapis.com/v1/{NAME}/media?key={API_KEY}&maxWidthPx={WIDTH}
    let googleUrl = `https://places.googleapis.com/v1/${name}/media?key=${apiKey}`;

    if (maxWidthPx) {
      googleUrl += `&maxWidthPx=${maxWidthPx}`;
    } else if (maxHeightPx) {
      googleUrl += `&maxHeightPx=${maxHeightPx}`;
    } else {
      // Default to a reasonable size for high-res screen displays and visualizer inputs
      googleUrl += `&maxHeightPx=800`;
    }

    console.log(`[Places Photo API] Proxying photo from Google: ${name}`);

    const response = await fetch(googleUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Places Photo API] Google error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: `Google API Error: ${errorText}` });
    }

    // Get the image buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    if (base64) {
      // Return as JSON base64 string
      const base64Str = buffer.toString('base64');
      return res.status(200).json({
        image: `data:${contentType};base64,${base64Str}`,
        contentType,
      });
    } else {
      // Return as raw binary image
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // Cache for 24 hours
      return res.status(200).send(buffer);
    }
  } catch (error: any) {
    console.error(`[Places Photo API] Internal Error:`, error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
