import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, coatingStyle, colorDescription } = req.body;

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

    const prompt = `Replace ONLY the concrete floor/ground surface in this photo with ${floorDesc}. Keep everything else in the photo exactly the same - same walls, same sky, same landscape, same camera angle, same lighting. Only change the floor surface material.`;

    console.log("Editing image with gpt-image-1:", prompt);
    console.log("Image buffer size:", imageBuffer.length);

    // Use OpenAI's native image EDIT endpoint - this actually sees and modifies the real photo
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: new File([imageBuffer], "photo.png", { type: "image/png" }),
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned from edit");

    console.log("gpt-image-1 edit successful!");
    res.status(200).json({ image: `data:image/png;base64,${b64}` });

  } catch (error: any) {
    console.error('Error:', error?.message || error);
    res.status(500).json({
      error: error?.message?.includes('safety')
        ? 'Image blocked by safety filter. Try again.'
        : `Failed: ${error?.message || 'Unknown error'}`
    });
  }
}
