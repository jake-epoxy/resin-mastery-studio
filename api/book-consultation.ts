import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      installer_id,
      client_name,
      client_email,
      client_phone,
      project_details,
      scheduled_at
    } = req.body;

    if (!installer_id || !client_name || !client_email || !scheduled_at) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Fetch Installer Profile to get their email and company name
    const { data: profile } = await supabase
      .from('installer_profiles')
      .select('contact_email, company_name')
      .eq('user_id', installer_id)
      .single();

    // 2. Create the Booking Record
    const { data: booking, error: bookingError } = await supabase
      .from('consultation_bookings')
      .insert({
        installer_id,
        client_name,
        client_email,
        client_phone,
        project_details,
        scheduled_at,
        status: 'pending'
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 3. Create or update the client in the CRM (Lead Pipeline)
    // We check if a client with this email exists for this installer
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('installer_id', installer_id)
      .eq('email', client_email)
      .maybeSingle();

    if (!existingClient) {
      const [firstName, ...lastNames] = client_name.split(' ');
      await supabase.from('clients').insert({
        installer_id,
        first_name: firstName,
        last_name: lastNames.join(' ') || '',
        email: client_email,
        phone: client_phone,
        project_type: 'Consultation Call',
        source: 'Booking Engine',
        status: 'Lead'
      });
    }

    // 4. Send Email Notification to Installer
    if (profile?.contact_email) {
      const displayDate = new Date(scheduled_at).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      const emailHtml = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #10B981; padding: 20px; border-radius: 10px; text-align: center;">
          <h2 style="color: #10B981; margin-bottom: 5px;">New Consultation Booked!</h2>
          <p style="color: #333; font-size: 16px;"><strong>${client_name}</strong> just booked a consultation with you.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; border: 1px solid #eee;">
            <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase; font-weight: bold;">Booking Details</p>
            <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Time:</strong> ${displayDate}</p>
            <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Email:</strong> ${client_email}</p>
            <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Phone:</strong> ${client_phone || 'N/A'}</p>
            <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Notes:</strong> ${project_details || 'N/A'}</p>
          </div>
          <p style="font-size: 14px; color: #666;">This lead has also been automatically added to your CRM pipeline.</p>
        </div>
      `;

      await fetch(`https://${req.headers.host || 'localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: profile.contact_email,
          subject: `NEW BOOKING: ${client_name} - ${displayDate}`,
          html: emailHtml
        })
      });

      // 5. Send Email Confirmation to Client
      const clientEmailHtml = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; border: 1px solid #e4e4e7; background-color: #ffffff;">
          <h2 style="color: #18181b; margin-bottom: 10px; font-size: 24px;">Booking Confirmed!</h2>
          <p style="color: #52525b; font-size: 16px; line-height: 1.6;">Hi ${client_name.split(' ')[0]}, your consultation with <strong>${profile.company_name || 'us'}</strong> is officially confirmed.</p>
          
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e4e4e7;">
            <p style="margin: 0; color: #18181b; font-size: 16px;"><strong>Date & Time:</strong> ${displayDate}</p>
          </div>
          <p style="font-size: 15px; color: #52525b; line-height: 1.5;">We will send you a reminder 1 hour before the call. Talk to you soon!</p>
        </div>
      `;

      await fetch(`https://${req.headers.host || 'localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client_email,
          subject: `Booking Confirmed: Consultation with ${profile.company_name || 'Us'}`,
          html: clientEmailHtml
        })
      });
    }

    return res.status(200).json({ success: true, booking });
  } catch (err: any) {
    console.error("Booking Error:", err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
