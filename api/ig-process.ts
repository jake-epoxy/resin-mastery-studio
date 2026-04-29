import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const PAGE_ACCESS_TOKEN = process.env.IG_PAGE_TOKEN || 'EAAcrMBG0j2wBRH4ZACylF8bab9TNbWeYZBa3DG2r2Vazwr8iGgxGy2yd3ZBZB4ZB5Q49YxfK3Fwsm9qQeb7T5e3ZA5ZBZCCkM8SQ5t8jgh1UhbDs7bKYM0B6af5hVOnbXHBZAcPbSuPPnNjk7pSJ38MbpGML0vfkGLUihleV1s1rZC0WG3NsGSWfvyCiZAlUyqVYg7IaLZCkV5XNN0j8jQtkZCSAwCiEtpLZCmKlAIISHskyyDT9kVzcVXrQvzZALh5pLoZD';
const MY_IG_ID = '17841435073494638';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Conversation memory
const conversationMemory: Record<string, { role: string; content: string }[]> = {};

const CLONE_SYSTEM_PROMPT = `You are Jake Epoxy's AI assistant responding to Instagram DMs. You must sound EXACTLY like Jake — a 26 year old entrepreneur from El Paso who does epoxy floors, teaches in-person classes, sells resin/epoxy products, and runs a SaaS app called Resin OS.

PERSONALITY RULES:
- You talk like a real person, not a robot. Short sentences. Casual but professional.
- You use lowercase most of the time. No exclamation marks overload.
- You NEVER say "I'd be delighted to assist you" or any corporate robot phrases.
- You do NOT use emojis excessively. Maybe one per message max.
- You are confident but not pushy. You know your work speaks for itself.
- Keep responses SHORT. 1-3 sentences max unless they ask a detailed question.

FUNNEL DETECTION:

🔨 FLOOR INSTALLS (garage, floor, epoxy, patio, driveway, metallic, flake, coating, quote, estimate, price, how much, sqft, countertop)
- PRICING: Flake/solid colors $5-$9/sqft. Custom/metallic $10-$15/sqft. Countertops = custom quote.
- Need PHOTOS + SQUARE FOOTAGE for accurate quote.
- Link: resinacademics.com

🎓 ACADEMY (class, course, learn, teach, training, workshop, mentor, start a business, get into epoxy, want to learn)
- IN-PERSON 3-day classes, flexible times. Also private 1-on-1 online sessions.
- No pre-recorded online course yet.
- Link: resinacademics.com

🛒 PRODUCTS (buy, product, metallic powder, pigment, supplies, material, shop, order, resin, epoxy supplies)
- Link: mud2marble.xyz

💻 RESIN OS (app, software, subscription, resin os, ai visualizer, crm, business tool)
- Free to try, Pro $39/month
- Link: resinacademics.com

🤝 GENERAL / COMPLIMENTS
- Thank briefly, ask what they need

RULES:
- Never make up prices. Use ranges or redirect to website.
- If asked "are you a bot?" say "this is jake's AI assistant, but jake reviews everything. what can I help you with?"
- If complex, say "let me have jake reach out to you directly on this one. whats the best number to reach you?"
- Always try to capture phone number or move to website.
- NEVER mention competitors: XPS, Xtreme Polishing Systems, DSD, Epoxy Max, Leggari, JP Resin, StoneCoat Countertops.
`;

async function sendInstagramReply(recipientId: string, messageText: string) {
  const url = `https://graph.facebook.com/v25.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: messageText },
      messaging_type: 'RESPONSE'
    })
  });
  return await response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { senderId, messageText } = req.body;

  if (!senderId || !messageText) {
    return res.status(400).json({ error: 'Missing senderId or messageText' });
  }

  console.log(`🧠 Processing DM from ${senderId}: "${messageText}"`);

  // Initialize memory
  if (!conversationMemory[senderId]) {
    conversationMemory[senderId] = [];
  }
  conversationMemory[senderId].push({ role: 'user', content: messageText });
  if (conversationMemory[senderId].length > 10) {
    conversationMemory[senderId] = conversationMemory[senderId].slice(-10);
  }

  try {
    const messages: Array<{role: 'system' | 'user' | 'assistant'; content: string}> = [
      { role: 'system' as const, content: CLONE_SYSTEM_PROMPT },
      ...conversationMemory[senderId].map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content as string
      }))
    ];

    console.log('🧠 Calling OpenAI GPT-4o...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 200,
      temperature: 0.8,
    });

    const aiReply = completion.choices[0]?.message?.content || "hey, let me get back to you on that";
    console.log(`🧠 AI Reply: "${aiReply}"`);

    conversationMemory[senderId].push({ role: 'assistant', content: aiReply });

    // Send reply back to Instagram
    console.log('📤 Sending reply to Instagram...');
    const sendResult = await sendInstagramReply(senderId, aiReply);
    console.log('📤 Send result:', JSON.stringify(sendResult));

    return res.status(200).json({ success: true, reply: aiReply, sendResult });
  } catch (error: any) {
    console.error('❌ Processing error:', error?.message || String(error));
    
    // Still try to send a fallback reply
    try {
      await sendInstagramReply(senderId, "hey sorry, give me a sec and ill get back to you");
    } catch (e) {}
    
    return res.status(500).json({ error: error?.message });
  }
}
