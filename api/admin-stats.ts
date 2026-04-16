import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || email.toLowerCase() !== 'jakeflowers222@gmail.com') {
    return res.status(403).json({ error: 'Unauthorized. God Mode Only.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ 
      error: 'Missing backend credentials',
      debug: { urlMissing: !supabaseUrl, keyMissing: !supabaseKey }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Bypass RLS securely to fetch global stats
    const { data: installers, error: iError } = await supabase
      .from('installer_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (iError) throw iError;

    const { count, error: cError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    if (cError) throw cError;

    // Fetch all quotes for GMV
    const { data: quotes, error: qError } = await supabase
      .from('quotes')
      .select('total_amount, status');

    if (qError) throw qError;

    let totalGmv = 0;
    if (quotes) {
       for (const q of quotes) {
          if (q.status === 'Won') {
             totalGmv += (q.total_amount || 0) * 0.5;
          } else if (q.status === 'Paid' || q.status === 'Paid In Full') {
             totalGmv += (q.total_amount || 0);
          }
       }
    }

    // Fetch Auth users for Connect ID
    const { data: usersData, error: uError } = await supabase.auth.admin.listUsers();
    if (uError) throw uError;

    const userMap: Record<string, boolean> = {};
    usersData.users.forEach(u => {
       userMap[u.id] = !!u.user_metadata?.stripe_account_id;
    });

    const installersWithStripe = installers?.map(i => ({
       ...i,
       has_stripe: userMap[i.user_id] || false
    })) || [];

    return res.status(200).json({
      installers: installersWithStripe,
      totalClients: count || 0,
      totalGmv: totalGmv
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
