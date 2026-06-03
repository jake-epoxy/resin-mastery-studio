import type { VercelRequest, VercelResponse } from './_types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, location, pageToken } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Places API key is not configured on the server.' });
  }

  try {
    const fullQuery = location ? `${query} in ${location}` : query;
    console.log(`[Places API] Searching for: "${fullQuery}"`);

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Request the fields we need, including nextPageToken
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.websiteUri,places.photos,places.nationalPhoneNumber,places.primaryTypeDisplayName,nextPageToken',
      },
      body: JSON.stringify({
        textQuery: fullQuery,
        maxResultCount: 20,
        ...(pageToken && { pageToken }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Places API] Error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: `Google API Error: ${errorText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error(`[Places API] Internal Error:`, error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
