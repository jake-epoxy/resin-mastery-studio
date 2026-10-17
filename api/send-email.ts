import { Resend } from 'resend';
import process from 'node:process';

export default async function handler(req: any, res: any) {
  // CORS setup for Vercel Serverless
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, cc, subject, html, attachments } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required email payload.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: 'Email service is not configured.' });
  }

  try {
    const payload: any = {
      from: 'Resin OS <updates@resinacademics.com>',
      to,
      subject,
      html,
    };

    if (cc) {
      payload.cc = cc;
    }
    
    if (attachments && Array.isArray(attachments)) {
       payload.attachments = attachments;
    }

    const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send(payload);
    if (error) {
      const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 502;
      return res.status(status).json({ error: error.message });
    }

    if (!data?.id) {
      return res.status(502).json({ error: 'Email service did not confirm the message.' });
    }

    return res.status(200).json({ id: data.id });
  } catch (error: any) {
    return res.status(502).json({ error: error.message || 'Email service is unavailable.' });
  }
}
