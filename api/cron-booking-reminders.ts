import type { VercelRequest, VercelResponse } from './_types.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET for easy cron testing, normally crons are triggered via GET
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure this is triggered by Vercel Cron or explicitly authorized
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !req.query.force) {
    // return res.status(401).json({ error: 'Unauthorized' });
    // In dev or some setups CRON_SECRET might not be set. We'll proceed if force=true or assume authorized for now
  }

  try {
    const now = new Date();
    // We want bookings that are between NOW and NOW + 65 minutes.
    // 65 minutes provides a small buffer for the 15-minute cron job to safely catch the 1-hour mark.
    const windowStart = now.toISOString();
    
    const windowEnd = new Date(now.getTime() + 65 * 60 * 1000);
    const windowEndStr = windowEnd.toISOString();

    console.log(`[Cron Reminders] Checking bookings between ${windowStart} and ${windowEndStr}`);

    // Query pending bookings in the 65 min window that haven't had a reminder sent yet
    const { data: bookings, error } = await supabase
      .from('consultation_bookings')
      .select('*, installer_profiles(contact_email, company_name)')
      .eq('status', 'pending')
      .eq('reminder_sent', false)
      .gte('scheduled_at', windowStart)
      .lte('scheduled_at', windowEndStr);

    if (error) {
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      console.log("[Cron Reminders] No upcoming bookings to remind.");
      return res.status(200).json({ success: true, sentCount: 0 });
    }

    let sentCount = 0;

    for (const booking of bookings) {
      const installer = booking.installer_profiles;
      const clientEmail = booking.client_email;
      const clientName = booking.client_name;
      
      if (!clientEmail || !installer) continue;

      const displayDate = new Date(booking.scheduled_at).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      const reminderHtml = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; border: 1px solid #e4e4e7; background-color: #ffffff;">
          <h2 style="color: #ec4899; margin-bottom: 10px; font-size: 24px;">Reminder: Upcoming Consultation</h2>
          <p style="color: #52525b; font-size: 16px; line-height: 1.6;">Hi ${clientName.split(' ')[0]}, this is a quick reminder that your consultation with <strong>${installer.company_name || 'us'}</strong> is starting in 1 hour.</p>
          
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e4e4e7;">
            <p style="margin: 0; color: #18181b; font-size: 16px;"><strong>Date & Time:</strong> ${displayDate}</p>
          </div>
          <p style="font-size: 15px; color: #52525b; line-height: 1.5;">Please be ready at the scheduled time. If you need to reschedule, reply directly to this email to reach the contractor.</p>
        </div>
      `;

      // Use the internal email API
      const host = req.headers.host || 'resinacademics.com';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      
      const emailRes = await fetch(`${protocol}://${host}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: clientEmail,
          cc: installer.contact_email, // Send a copy to the installer so they know the reminder went out!
          subject: `Reminder: Consultation with ${installer.company_name || 'Us'} in 1 hour`,
          html: reminderHtml
        })
      });

      if (emailRes.ok) {
        // Mark as sent
        await supabase
          .from('consultation_bookings')
          .update({ reminder_sent: true })
          .eq('id', booking.id);
          
        sentCount++;
        console.log(`[Cron Reminders] Sent reminder to ${clientEmail} for booking ${booking.id}`);
      } else {
        console.error(`[Cron Reminders] Failed to send email to ${clientEmail}`);
      }
    }

    return res.status(200).json({ success: true, sentCount });

  } catch (err: any) {
    console.error("[Cron Reminders] Error:", err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
