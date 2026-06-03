import type { VercelRequest, VercelResponse } from './_types.js';
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
    const { userId, email, companyName } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Fetch user to see if they already have an account ID in meta_data
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    let accountId = user.user_metadata?.stripe_account_id;

    // 2. Create if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        email: email,
        business_profile: {
          name: companyName || 'Resin Installer',
        },
      });
      accountId = account.id;

      // Save to Supabase User Metadata
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { ...user.user_metadata, stripe_account_id: accountId }
      });
    }

    // 3. Generate Onboarding Link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.origin}/admin/ops?refresh_stripe=true`,
      return_url: `${req.headers.origin}/admin/ops?success_stripe=true`,
      type: 'account_onboarding',
    });

    res.status(200).json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Stripe Connect Error:", error);
    res.status(500).json({ error: error.message || 'Internal Connect Error' });
  }
}
