import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { quoteId, originUrl, subscription, userId, email } = req.body;

    // --- SAAS SUBSCRIPTION CHECKOUT BRANCH ---
    if (subscription === true && userId) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: 'price_1TRg5uI38c9rHtE9ewIO2H3Z', quantity: 1 }],
        mode: 'subscription',
        client_reference_id: userId,
        customer_email: email,
        success_url: `https://www.resinacademics.com/admin?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://www.resinacademics.com/admin`,
      });
      return res.status(200).json({ url: session.url });
    }

    // --- AI PROSPECTOR ADD-ON CHECKOUT BRANCH ---
    if (subscription === 'prospector' && userId) {
      // Create a Stripe product+price on the fly if no hardcoded price ID
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI Prospector — Resin OS Add-on',
              description: '20 AI-rendered cold pitches per day on autopilot. Auto email scraping, CRM integration, and read receipts.',
            },
            unit_amount: 7900, // $79.00
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        client_reference_id: userId,
        customer_email: email,
        metadata: { type: 'prospector_addon', userId },
        success_url: `https://www.resinacademics.com/admin/autopilot?activated=true`,
        cancel_url: `https://www.resinacademics.com/admin/autopilot`,
      });
      return res.status(200).json({ url: session.url });
    }

    // --- STANDARD QUOTE PAYMENT BRANCH ---
    if (!quoteId) return res.status(400).json({ error: "Missing quoteId" });

    // 1. Fetch Quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*, client:clients(email, first_name, last_name)')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) return res.status(404).json({ error: "Quote not found" });

    // 2. Fetch Installer User Meta to get Connect ID
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(quote.installer_id);
    if (userError || !user || !user.user_metadata?.stripe_account_id) {
      return res.status(400).json({ error: "Contractor has not verified their bank account for deposits." });
    }
    const connectedAccountId = user.user_metadata.stripe_account_id;

    // 3. Determine which milestone to charge
    const milestones = quote.config?.payment_schedule?.milestones || [];
    const milestonesPaid = quote.config?.milestones_paid || 0;
    
    let chargePct: number;
    let chargeLabel: string;
    let milestoneIndex: number;
    let isLast: boolean;

    if (milestones.length > 0) {
      // Multi-milestone schedule
      milestoneIndex = milestonesPaid;
      if (milestoneIndex >= milestones.length) {
        return res.status(400).json({ error: "All milestones have already been paid." });
      }
      chargePct = milestones[milestoneIndex].pct;
      chargeLabel = milestones[milestoneIndex].label;
      isLast = milestoneIndex === milestones.length - 1;
    } else {
      // Legacy 2-step: deposit then final
      const depositPct = quote.config?.deposit_pct || 50;
      if (milestonesPaid === 0) {
        chargePct = depositPct;
        chargeLabel = 'Material Deposit';
        isLast = depositPct >= 100;
      } else {
        chargePct = 100 - depositPct;
        chargeLabel = 'Final Balance';
        isLast = true;
      }
    }

    const chargeAmountCents = Math.round((quote.total_amount * (chargePct / 100)) * 100);
    const paymentType = isLast ? 'final_payment' : 'milestone_payment';

    // 4. Create Hosted Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: quote.client?.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${quote.config?.service_type || 'Project'} — ${chargeLabel}`,
              description: `${chargePct}% payment (${chargeLabel}) for Quote ID: ${quoteId}`,
              images: quote.config?.logo_url ? [quote.config.logo_url] : [],
            },
            unit_amount: chargeAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        quoteId: quoteId,
        type: paymentType,
        milestoneIndex: milestoneIndex?.toString() || '0',
      },
      payment_intent_data: {
        metadata: {
          quoteId: quoteId,
          installerId: quote.installer_id,
        }
      },
      success_url: `${originUrl || req.headers.origin}/quote-live/${quoteId}?milestone_paid=${milestonesPaid + 1}`,
      cancel_url: `${originUrl || req.headers.origin}/quote-live/${quoteId}?canceled=true`,
    }, {
      stripeAccount: connectedAccountId, 
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Create Error:", error);
    res.status(500).json({ error: error.message || 'Internal Stripe Error' });
  }
}
