import { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Jake <support@resinacademics.com>',
      to: [email],
      subject: 'Welcome to Resin OS (+ Starter Kit Inside)',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #111;">
          <h1 style="color: #050505;">Welcome to Resin Academics.</h1>
          <p>Hey ${firstName || 'there'},</p>
          <p>Your Resin OS account has been successfully created.</p>
          <p>We specifically built this platform because most epoxy contractors are trying to run a six-figure business using yellow legal pads and mental math.</p>
          <p>Inside your Command Center, you can instantly generate <strong>digital PDF quotes</strong>, and use the <strong>AI Visualizer</strong> to show a client exactly what their floor will look like before you ever touch a grinder.</p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #ffffff;">
            <h3 style="margin-top: 0;">Your Starter Kit PDF</h3>
            <p style="margin-bottom: 20px;">As promised, your Epoxy Starter Kit Guide is waiting for you entirely free inside the Academy vault.</p>
            <a href="https://resinacademics.com/admin/academy" style="background-color: #050505; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Access Academy Vault</a>
          </div>

          <p>Poke around the software, use your free credits, and if you want to get serious about learning our exact Metallic techniques, check out the physical class schedule in the dashboard.</p>
          <p>— Jake & The Resin Academics Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Welcome email sent successfully', data });
  } catch (err: any) {
    console.error('Unhandled Resend Exception:', err);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
}
