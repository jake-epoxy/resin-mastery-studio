import type { VercelRequest, VercelResponse } from './_types.js';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Hardcode the public URL to bypass Vercel missing env vars
  const supabaseUrl = 'https://efgveagtdpqownyjspvf.supabase.co';
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
     return res.status(500).json({ error: 'Supabase Configuration Missing on Server' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

  const { installer_id, first_name, last_name, phone } = req.body;

  if (!installer_id || !first_name || !phone) {
    return res.status(400).json({ error: 'Missing required lead payload.' });
  }

  try {
    const { data: clientData, error: dbError } = await supabaseAdmin.from('clients').insert([{
      installer_id,
      first_name,
      last_name,
      phone,
      status: 'New Lead',
      project_type: 'Website AI Preview'
    }]).select();

    if (dbError) throw dbError;

    // Fetch Contractor's Email securely
    try {
      const { data: contractorData } = await supabaseAdmin.auth.admin.getUserById(installer_id);
      const contractorEmail = contractorData?.user?.email;

      if (contractorEmail) {
        const resendResp = await resend.emails.send({
          from: 'Resin OS Bot <updates@resinacademics.com>',
          to: [contractorEmail],
          subject: 'New Lead: Website AI Visualizer',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; max-width: 600px; color: #111;">
              <p>A new homeowner has submitted their contact information via your website's AI Visualizer widget.</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${first_name} ${last_name}</p>
                <p style="margin: 0;"><strong>Phone:</strong> <a href="tel:${phone}" style="color: #2563eb; text-decoration: none;">${phone}</a></p>
              </div>
              <p style="color: #64748b; font-size: 14px;">This contact has been automatically synced to your Command Center lead pipeline.</p>
            </div>
          `
        });
        console.log("Resend sending attempt:", resendResp);
      }
    } catch(err) {
      console.error("Non-fatal: Resend notification failed", err);
    }
    
    return res.status(200).json({ success: true, lead: clientData });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
