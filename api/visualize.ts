import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { Jimp } from 'jimp';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, coatingStyle, colorDescription, customNotes } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64' });
  }

  try {
    // Build a simple floor description
    const getFloorDesc = (style: string, color: string): string => {
      switch (style) {
        case 'marble-epoxy': return `${color} marble-look epoxy floor with realistic natural stone veining patterns, ultra high-gloss mirror finish that looks like real polished marble`;
        case 'flake-epoxy': return `${color} vinyl flake epoxy with thousands of tiny scattered paint chips under a high-gloss clear coat`;
        case 'metallic-epoxy': return `${color} metallic epoxy with swirling marbled patterns and mirror-like reflective finish`;
        case 'solid-epoxy': return `${color} solid color epoxy, perfectly smooth with ultra high-gloss finish`;
        case 'quartz-epoxy': return `${color} quartz broadcast epoxy with tiny colored sand crystals`;
        case 'polished-concrete': return `${color} polished concrete with exposed aggregate`;
        default: return `${color} glossy epoxy coating`;
      }
    };

    const floorDesc = coatingStyle === 'custom' ? colorDescription : getFloorDesc(coatingStyle, colorDescription);

    // Convert base64 to a Buffer that OpenAI SDK can consume
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    let prompt = `Replace ONLY the concrete floor/ground surface in this photo with ${floorDesc}. Keep everything else in the photo exactly the same - same walls, same sky, same landscape, same camera angle, same lighting. Only change the floor surface material.`;

    if (customNotes) {
      prompt += ` Additional instructions: ${customNotes}`;
    }

    console.log("Processing real AI Visualization...");
    
    // Load the original image and resize to 1024x1024 (OpenAI requirement)
    const originalImage = await Jimp.read(Buffer.from(imageBase64, 'base64'));
    originalImage.cover({ w: 1024, h: 1024 });
    const originalBuffer = await originalImage.getBuffer("image/png");

    // Create a mask for DALL-E 2: Transparent areas indicate where to edit.
    // We make the top 60% opaque (protect walls/sky) and bottom 40% transparent (target the floor)
    const mask = new Jimp({ width: 1024, height: 1024, color: 0x00000000 }); // Fully transparent
    mask.scan(0, 0, 1024, Math.floor(1024 * 0.6), function (x, y, idx) {
       // Fill top 60% with opaque white
       this.bitmap.data[idx] = 255;
       this.bitmap.data[idx + 1] = 255;
       this.bitmap.data[idx + 2] = 255;
       this.bitmap.data[idx + 3] = 255;
    });
    const maskBuffer = await mask.getBuffer("image/png");

    console.log("Sending real request to OpenAI DALL-E 2...");

    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: new File([originalBuffer], "image.png", { type: "image/png" }),
      mask: new File([maskBuffer], "mask.png", { type: "image/png" }),
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const url = response.data?.[0]?.url;
    if (!url) throw new Error("No image returned from OpenAI");

    console.log("DALL-E 2 edit successful!");
    
    // Fetch the resulting image and convert to base64 so frontend doesn't get CORS issues from OpenAI CDN
    const resultRes = await fetch(url);
    const resultBuffer = await resultRes.arrayBuffer();
    const resultBase64 = Buffer.from(resultBuffer).toString('base64');

    res.status(200).json({ image: `data:image/png;base64,${resultBase64}` });

  } catch (error: any) {
    console.error('Error:', error?.message || error);
    res.status(500).json({
      error: error?.message?.includes('safety')
        ? 'Image blocked by safety filter. Try again.'
        : `Failed: ${error?.message || 'Unknown error'}`
    });
  }
}
