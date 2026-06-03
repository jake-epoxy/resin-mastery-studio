import type { VercelRequest, VercelResponse } from '../_types';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Slack sends interactive payloads as url-encoded forms
  const payloadStr = req.body.payload;
  if (!payloadStr) {
    return res.status(400).json({ error: 'Missing payload' });
  }

  let payload;
  try {
    payload = JSON.parse(payloadStr);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  // Acknowledge the Slack request instantly to prevent timeout
  res.status(200).send(''); 

  const action = payload.actions?.[0];
  if (!action || action.action_id !== 'approve_and_send_email') {
    return;
  }

  const draftId = action.value;
  if (!draftId) return;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseKey || !resendApiKey) {
    console.error("Missing keys for interactivity");
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
  const resend = new Resend(resendApiKey);

  try {
    // 1. Fetch the draft
    const { data: draft, error: fetchErr } = await supabaseAdmin.from('email_drafts').select('*').eq('id', draftId).single();
    
    if (fetchErr || !draft) {
      console.error("Could not find draft", fetchErr);
      return;
    }

    if (draft.status === 'Sent') {
       // Already sent! Just update UI
       await updateSlackMessage(payload.response_url, "⚠️ *This email was already sent.*");
       return;
    }

    // 2. Send via Resend
    await resend.emails.send({
      from: 'Resin OS Closer <updates@resinacademics.com>',
      to: [draft.lead_email],
      subject: draft.subject,
      html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${draft.body}</div>`
    });

    // 3. Update database
    await supabaseAdmin.from('email_drafts').update({ status: 'Sent' }).eq('id', draftId);

    // 4. Update the original Slack message to show success
    await updateSlackMessage(payload.response_url, `✅ *Email sent successfully to ${draft.lead_email}!*`);

  } catch (err) {
    console.error("Error processing approval", err);
    await updateSlackMessage(payload.response_url, `❌ *Failed to send email. Check logs.*`);
  }
}

async function updateSlackMessage(responseUrl: string, text: string) {
  await fetch(responseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      replace_original: true,
      text: text
    })
  });
}
