import type { VercelRequest, VercelResponse } from './_types';
import OpenAI from 'openai';

const VERIFY_TOKEN = process.env.IG_VERIFY_TOKEN || 'JAKE_EPOXY_SECURE_2026';
const PAGE_ACCESS_TOKEN = process.env.IG_PAGE_TOKEN;
const MY_IG_ID = '17841435073494638';

import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabaseUrl = 'https://efgveagtdpqownyjspvf.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CLONE_PROMPT = `You are Jake Epoxy's AI assistant responding to Instagram DMs. Sound EXACTLY like Jake — a 26 year old entrepreneur from El Paso. Epoxy floors, in-person classes, products, and Resin OS app.

RULES: Talk casual but professional. Short sentences. Lowercase. No corporate robot phrases. No emoji overload (1 max). Keep responses 1-3 sentences. Be confident, not pushy.

FUNNELS:
FLOORS: Flake/solid $5-$9/sqft. Custom/metallic $10-$15/sqft. Countertops = custom quote. Need PHOTOS + SQFT for quotes. Link: resinacademics.com
ACADEMY: 3-day in-person classes, flexible schedule. Private 1-on-1 online sessions available. No online course yet. Link: resinacademics.com  
PRODUCTS: metallics, pigments, flakes, kits at mud2marble.xyz
RESIN OS: business OS for epoxy contractors. Free trial, Pro $39/mo. Link: resinacademics.com

If asked "are you a bot?" say "this is jake's AI assistant, but jake reviews everything. what can I help you with?"
If complex/negotiation: "let me have jake reach out to you directly. whats the best number to reach you?"
Capture phone numbers. Push to website. If they send a photo: "dope, let me get jake to look at this and get back to you"
NEVER mention: XPS, Xtreme Polishing Systems, DSD, Epoxy Max, Leggari, JP Resin, StoneCoat Countertops.`;

const PAGE_ID = '2005868723050736';

async function sendReply(recipientId: string, text: string) {
  const url = `https://graph.facebook.com/v25.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: 'RESPONSE'
    })
  });
  return r.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET = Meta verification handshake
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WEBHOOK VERIFIED');
      return res.status(200).send(challenge);
    }
    return res.status(403).end();
  }

  // POST = Incoming DM event
  if (req.method === 'POST') {
    const body = req.body;
    if (body.object !== 'page' && body.object !== 'instagram') {
      return res.status(200).send('EVENT_RECEIVED');
    }

    // Extract the first valid message
    let senderId = '';
    let messageText = '';

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        if (event.message?.is_echo) continue;
        if (!event.sender?.id || !event.message?.text) continue;
        if (event.sender.id === MY_IG_ID) continue;
        senderId = event.sender.id;
        messageText = event.message.text;
        break;
      }
      if (senderId) break;
    }

    // No valid message found, just acknowledge
    if (!senderId || !messageText) {
      return res.status(200).send('EVENT_RECEIVED');
    }

    console.log(`📥 DM from ${senderId}: "${messageText}"`);

    try {
      if (!supabaseServiceKey) {
          throw new Error("Missing Supabase configuration");
      }

      // 1. Upsert Conversation based on senderId
      let { data: convData } = await supabase
        .from('clone_conversations')
        .select('id')
        .eq('instagram_id', senderId)
        .single();
        
      let conversationId = convData?.id;

      if (!conversationId) {
        const { data: newConv } = await supabase
          .from('clone_conversations')
          .insert({ instagram_id: senderId })
          .select('id')
          .single();
        if (newConv) conversationId = newConv.id;
      } else {
        await supabase
          .from('clone_conversations')
          .update({ last_message_at: new Date().toISOString(), needs_human: true })
          .eq('id', conversationId);
      }

      if (!conversationId) throw new Error("Could not create/find conversation");

      // 2. Insert User Message
      await supabase.from('clone_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: messageText
      });

      // 3. Fetch History
      const { data: historyData } = await supabase
        .from('clone_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      const chronologicalHistory = (historyData || []).reverse().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // 4. Fetch System Prompt
      const { data: settings } = await supabase
        .from('clone_settings')
        .select('system_prompt, is_active')
        .eq('id', 'default')
        .single();
        
      if (settings && settings.is_active === false) {
        console.log("AI is turned off.");
        return res.status(200).send('EVENT_RECEIVED'); 
      }
      
      const activePrompt = settings?.system_prompt || CLONE_PROMPT;

      // 5. Call GPT-4o
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: activePrompt },
          ...chronologicalHistory
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      const aiReply = completion.choices[0]?.message?.content || "hey let me get back to you on that";
      console.log(`🧠 AI: "${aiReply}"`);
      
      // 6. Save AI Reply
      await supabase.from('clone_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiReply
      });

      // 7. Send reply via Instagram
      const result = await sendReply(senderId, aiReply);
      console.log(`📤 Sent:`, JSON.stringify(result));

      return res.status(200).send('EVENT_RECEIVED');
    } catch (err: any) {
      console.error(`❌ Error: ${err?.message}`);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  return res.status(200).send('OK');
}
