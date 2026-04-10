import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe (uses live key in production)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia' as any,
});

// Initialize Supabase Admin client
// We MUST use the service_role key to bypass RLS here, because the webhook is an unauthenticated server request.
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // Collect the raw body buffer to securely verify the Stripe signature
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret || '');
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout session
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id; // we passed this from PaywallGuard

    if (userId) {
      // Unlock the dashboard in Supabase
      const { error } = await supabase
        .from('installer_profiles')
        .update({ subscription_active: true })
        .eq('user_id', userId);
        
      if (error) {
        console.error("Failed to unlock dashboard:", error);
        return res.status(500).json({ error: "Failed to update database" });
      }
      console.log(`Success! Unlocked dashboard for user ${userId}`);
    } else {
        console.warn("Checkout completed, but no client_reference_id found.");
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}

// Helper function to extract raw body buffer from Vercel Request
async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
