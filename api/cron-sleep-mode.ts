import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Jimp } from 'jimp';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Define Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST or Cron execution (Vercel Cron triggers via GET, but we'll allow both)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: You can check req.headers.authorization here if triggered by Vercel Cron
  // if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) ...

  console.log("[Sleep Mode] Waking up autonomous queue...");

  try {
    // 1. Fetch active Sleep Mode profiles
    const { data: profiles, error: profileErr } = await supabase
      .from('installer_profiles')
      .select('*');

    if (profileErr || !profiles) {
      throw new Error("Failed to fetch installer profiles.");
    }

    let processedCount = 0;

    for (const profile of profiles) {
      // Parse settings
      let settings;
      try {
        settings = typeof profile.service_pricing === 'string' ? JSON.parse(profile.service_pricing) : profile.service_pricing;
      } catch (e) { continue; }

      if (!settings || !settings.autopilot_config || !settings.autopilot_config.active) {
        continue; // Skip profiles without sleep mode active
      }

      const config = settings.autopilot_config;
      console.log(`[Sleep Mode] Processing for ${profile.company_name || profile.full_name}. Query: ${config.query}`);

      // 2. Hit Google Places API (With Auto-Rollover)
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      const FALLBACK_NICHES = ["Car Dealerships", "Warehouses", "Meat Production Facilities", "Restaurants", "General Contractors", "Auto Garages", "Gyms", "Retail Stores", "Airplane Hangars", "Breweries", "Medical Clinics", "Dog Kennels", "Beauty Salons", "Food Processing Plants"];
      
      let places = [];
      let placesData: any = {};
      
      // We wrap the API call in a loop that can execute up to 2 times.
      // If the first niche returns 0 results, we rollover to the next niche and fetch immediately.
      for (let attempt = 0; attempt < 2; attempt++) {
        const fullQuery = config.location ? `${config.query} in ${config.location}` : config.query;
        
        const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey || '',
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.websiteUri,places.photos,places.nationalPhoneNumber,places.primaryTypeDisplayName,nextPageToken',
          },
          body: JSON.stringify({
            textQuery: fullQuery,
            maxResultCount: 20, // Fetch up to 20 leads
            ...(config.nextPageToken && { pageToken: config.nextPageToken }),
          }),
        });

        if (placesRes.ok) {
          placesData = await placesRes.json();
          places = placesData.places || [];
        }

        if (places.length > 0) {
          break; // We found leads, break the attempt loop!
        } else {
          // AUTO-ROLLOVER LOGIC: We ran out of leads for this niche.
          console.log(`[Sleep Mode] Niche exhausted: ${config.query}. Rolling over...`);
          const currentIndex = FALLBACK_NICHES.indexOf(config.query);
          const nextIndex = currentIndex !== -1 && currentIndex < FALLBACK_NICHES.length - 1 ? currentIndex + 1 : 0;
          config.query = FALLBACK_NICHES[nextIndex];
          config.nextPageToken = null; // Reset pagination for the new niche
          
          // Save the new niche to the database so the UI reflects the change
          settings.autopilot_config.query = config.query;
          settings.autopilot_config.nextPageToken = null;
          await supabase.from('installer_profiles').update({ service_pricing: settings }).eq('id', profile.id);
        }
      }
      
      if (places.length === 0) {
        console.log(`[Sleep Mode] Could not find any leads even after rollover for ${profile.id}`);
        continue;
      }

      // Process up to 20 leads per run now that we have Vercel Pro (300s timeout)
      let currentRunPitched = 0;

      for (const biz of places) {
        if (currentRunPitched >= 20) break; // Hard cap per run just to be safe

        const bizName = biz.displayName?.text || 'Business';
        const address = biz.formattedAddress || 'Local Area';

        // 3. Check CRM to prevent duplicate pitch
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('installer_id', profile.id)
          .eq('first_name', bizName)
          .single();

        if (existingClient) {
          console.log(`[Sleep Mode] Skipping ${bizName} - Already in CRM.`);
          continue; 
        }

        console.log(`[Sleep Mode] Pitching ${bizName}...`);

        // Get Photo
        const photo = biz.photos && biz.photos.length > 0 ? biz.photos[0] : null;
        if (!photo) {
           // Skip if no photo to render
           continue;
        }

        // Fetch photo proxy
        const photoRes = await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=1024&key=${apiKey}`);
        if (!photoRes.ok) continue;
        const photoBuffer = await photoRes.arrayBuffer();
        const base64Image = Buffer.from(photoBuffer).toString('base64');

        // 4. Render AI Image via DALL-E 2 directly
        const originalImage = await Jimp.read(Buffer.from(base64Image, 'base64'));
        originalImage.cover({ w: 1024, h: 1024 });
        const originalBuffer = await originalImage.getBuffer("image/png");

        const mask = new Jimp({ width: 1024, height: 1024, color: 0x00000000 });
        mask.scan(0, 0, 1024, Math.floor(1024 * 0.6), function (x, y, idx) {
           this.bitmap.data[idx] = 255;
           this.bitmap.data[idx+1] = 255;
           this.bitmap.data[idx+2] = 255;
           this.bitmap.data[idx+3] = 255;
        });
        const maskBuffer = await mask.getBuffer("image/png");

        let aiRenderUrl = '';
        try {
          const openaiRes = await openai.images.edit({
            model: "gpt-image-1",
            image: new File([originalBuffer], "image.png", { type: "image/png" }),
            mask: new File([maskBuffer], "mask.png", { type: "image/png" }),
            prompt: "Replace ONLY the concrete floor/ground surface in this photo with metallic epoxy with swirling marbled patterns and mirror-like reflective finish. Keep walls exactly the same.",
            n: 1,
            size: "1024x1024",
          });
          
          const resultUrl = openaiRes.data?.[0]?.url;
          if (resultUrl) {
              const fetchResult = await fetch(resultUrl);
              const fetchBuffer = await fetchResult.arrayBuffer();
              aiRenderUrl = `data:image/png;base64,${Buffer.from(fetchBuffer).toString('base64')}`;
          }
        } catch(e) {
          console.error("AI Render Failed", e);
          continue; // Skip if AI fails
        }

        if (!aiRenderUrl) continue;

        // 5. Scrape Website for Email
        let scrapedEmail = '';
        if (biz.websiteUri) {
          try {
            console.log(`[Sleep Mode] Scraping website for email: ${biz.websiteUri}`);
            const webRes = await fetch(biz.websiteUri, { 
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              signal: AbortSignal.timeout(3000)
            });
            const html = await webRes.text();
            // Regex to find an email address
            const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch && emailMatch[0]) {
               // Filter out common image/file extensions or sentry noise
               const em = emailMatch[0].toLowerCase();
               if (!em.endsWith('.png') && !em.endsWith('.jpg') && !em.endsWith('.jpeg') && !em.endsWith('.gif') && !em.includes('sentry')) {
                  scrapedEmail = em;
                  console.log(`[Sleep Mode] Found email: ${scrapedEmail}`);
               }
            }
          } catch (e) {
            console.log(`[Sleep Mode] Website scrape failed for ${biz.websiteUri}`);
          }
        }

        // 6. Create Client in CRM
        const { data: clientRes, error: clientErr } = await supabase.from('clients').insert({
          installer_id: profile.id,
          first_name: bizName,
          last_name: '(Lead)',
          email: scrapedEmail,
          phone: biz.nationalPhoneNumber || '',
          project_type: 'Metallic Epoxy',
          status: scrapedEmail ? 'Auto-Pitched' : 'Auto-Pitched (No Email)',
          address: address
        }).select().single();

        if (clientErr || !clientRes) continue;

        // 7. Create Pitch Quote Link
        const { data: quoteRes } = await supabase.from('quotes').insert({
          client_id: clientRes.id,
          installer_id: profile.id,
          installer_email: profile.user_id || 'installer',
          total_amount: 5000, // Placeholder
          deposit_amount: 500,
          status: 'Sent',
          config: {
            document_mode: 'pitch',
            brand_name: profile.company_name || 'Resin Contractor',
            service_type: 'Metallic Epoxy System',
            visualization_image: aiRenderUrl
          }
        }).select().single();

        // 8. Fire Cold Outreach Email via Resend
        if (scrapedEmail && RESEND_API_KEY) {
           console.log(`[Sleep Mode] Dispatching cold email to ${scrapedEmail}...`);
           const pitchLink = `https://www.resinacademics.com/quote-live/${quoteRes?.id}`;
           const companyName = profile.company_name || 'Resin Contractor';
           const contactName = profile.full_name || companyName;
           try {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${RESEND_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: `${companyName} <updates@resinacademics.com>`,
                  to: scrapedEmail,
                  subject: `${bizName} — We mocked up your floors and the result is stunning`,
                  html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.05);">
<tr><td style="padding:32px 40px 20px;text-align:center;">
  <h1 style="margin:0;font-size:22px;color:#111827;letter-spacing:-0.5px;">We Visualized Your Space</h1>
  <p style="margin:8px 0 0;color:#6b7280;font-size:15px;">A custom AI rendering for <strong>${bizName}</strong></p>
</td></tr>
<tr><td style="padding:0 40px 24px;">
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">We took a photo of your location and rendered what your floors could look like with our <strong>Metallic Epoxy System</strong>. The result speaks for itself.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${pitchLink}" style="background:#111827;color:#fff;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:700;font-size:16px;display:inline-block;">View Your Custom Mockup &rarr;</a>
    </td></tr></table>
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
      <table width="100%"><tr>
        <td style="font-size:13px;color:#6b7280;" width="20">💎</td>
        <td style="font-size:13px;color:#374151;padding-left:8px;"><strong>Adds $3-$7/sqft</strong> in perceived property value</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
      <table width="100%"><tr>
        <td style="font-size:13px;color:#6b7280;" width="20">🛡️</td>
        <td style="font-size:13px;color:#374151;padding-left:8px;"><strong>15-20 year lifespan</strong> with zero maintenance</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
      <table width="100%"><tr>
        <td style="font-size:13px;color:#6b7280;" width="20">⚡</td>
        <td style="font-size:13px;color:#374151;padding-left:8px;"><strong>Installed in 1 day</strong> — walk on it in 24 hours</td>
      </tr></table>
    </td></tr>
  </table>
  <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">We only take <strong>3-4 projects per month</strong> due to the hands-on nature of our work. If you're interested, let's schedule a quick call.</p>
</td></tr>
<tr><td style="padding:20px 40px 24px;text-align:center;">
  <p style="margin:0;font-size:14px;color:#374151;">— ${contactName}, <strong>${companyName}</strong></p>
</td></tr>
<tr><td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
  <p style="margin:0;font-size:11px;color:#9ca3af;">This is a one-time outreach from ${companyName}. If you'd prefer not to hear from us, simply reply STOP.</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`
                })
              });
              console.log(`[Sleep Mode] Email dispatched successfully!`);
            } catch (e) {
              console.error(`[Sleep Mode] Failed to send email via Resend`, e);
            }
        } else {
           console.log(`[Sleep Mode] Successfully generated pitch: /quote-live/${quoteRes?.id} (No email sent)`);
        }
        
        currentRunPitched++;
        processedCount++;
      }

      // 8. Update Next Page Token for tomorrow
      if (placesData.nextPageToken && currentRunPitched > 0) {
         settings.autopilot_config.nextPageToken = placesData.nextPageToken;
         await supabase.from('installer_profiles')
           .update({ service_pricing: settings })
           .eq('id', profile.id);
      }
    }

    return res.status(200).json({ success: true, processed: processedCount });

  } catch (error: any) {
    console.error(`[Sleep Mode] Global Error:`, error);
    return res.status(500).json({ error: error.message });
  }
}
