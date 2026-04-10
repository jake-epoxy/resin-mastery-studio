import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const data = await resend.emails.send(payload);
    
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}
