import type { VercelRequest, VercelResponse } from './_types';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with the secret key securely
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
});

// We must use the SERVICE_ROLE_KEY to bypass Row Level Security because this is a server-to-server request lacking the user's browser session wrapper.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export const config = {
  api: {
    bodyParser: false, // Stripe webhook signatures require the raw unparsed body
  },
};

// Helper to buffer the raw request exactly as Vercel received it
async function buffer(readable: NodeJS.ReadableStream) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const signature = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(400).send('Webhook endpoint not properly configured with secrets');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the subscription successfully completing
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id; // Passed gracefully from PaywallGuard
    
    // 1. Subscription Logic
    if (userId) {
      try {
        if (session.metadata?.type === 'prospector_addon') {
          console.log(`Activating AI Prospector Add-on for User ${userId}...`);
          
          // Fetch current profile
          const { data: profile, error: fetchError } = await supabase
            .from('installer_profiles')
            .select('id, service_pricing')
            .eq('user_id', userId)
            .single();

          if (fetchError) throw fetchError;

          if (profile) {
            const settings = typeof profile.service_pricing === 'string' 
              ? JSON.parse(profile.service_pricing || "{}") 
              : (profile.service_pricing || {});
            
            settings.prospector_active = true;

            const { error: updateError } = await supabase
              .from('installer_profiles')
              .update({
                service_pricing: settings,
                updated_at: new Date().toISOString()
              })
              .eq('id', profile.id);

            if (updateError) throw updateError;
            console.log(`Successfully activated prospector add-on for user: ${userId}`);
          }
        } else {
          console.log(`Upgrading User ${userId} to PREMIUM tier...`);
          
          const { error } = await supabase
            .from('installer_profiles')
            .update({
              subscription_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

          if (error) throw error;
          console.log(`Successfully upgraded user: ${userId}`);
        }
      } catch (dbError: any) {
        console.error('Failed to upgrade user tier in database:', dbError);
        return res.status(500).send('Database failure during user upgrade');
      }
    }

    // 2. Quote Milestone Payment Logic
    if (session.metadata?.quoteId) {
      const quoteId = session.metadata.quoteId;
      const paymentType = session.metadata.type; // 'deposit_payment', 'milestone_payment', or 'final_payment'
      
      try {
        // Fetch current quote config to update milestones_paid
        const { data: currentQuote } = await supabase
          .from('quotes')
          .select('config')
          .eq('id', quoteId)
          .single();
        
        const currentConfig = currentQuote?.config || {};
        const currentMilestonesPaid = currentConfig.milestones_paid || 0;
        const milestones = currentConfig.payment_schedule?.milestones || [];
        const totalMilestones = milestones.length || 2; // default 2-step
        const newMilestonesPaid = currentMilestonesPaid + 1;
        const isFullyPaid = newMilestonesPaid >= totalMilestones || paymentType === 'final_payment';

        // Update config with new milestones_paid count
        const updatedConfig = { ...currentConfig, milestones_paid: newMilestonesPaid };

        if (isFullyPaid) {
          console.log(`All milestones paid for Quote ${quoteId}. Status → Paid In Full`);
          await supabase
            .from('quotes')
            .update({ status: 'Paid In Full', config: updatedConfig })
            .eq('id', quoteId);
        } else {
          console.log(`Milestone ${newMilestonesPaid}/${totalMilestones} paid for Quote ${quoteId}.`);
          await supabase
            .from('quotes')
            .update({ status: 'Paid', config: updatedConfig })
            .eq('id', quoteId);
        }
      } catch (dbError: any) {
        console.error(`Failed to update quote status for ${quoteId}:`, dbError);
      }
    }
  }

  res.status(200).json({ received: true });
}
