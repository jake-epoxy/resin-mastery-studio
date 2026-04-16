import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Landmark, ShieldCheck, ArrowRight, Loader2, AlertTriangle, Building2, TrendingUp, DollarSign, Clock, CheckCircle2, Receipt, ExternalLink } from "lucide-react";

export default function AdminBanking() {
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setStripeAccountId(user.user_metadata?.stripe_account_id || null);

    const { data: profileData } = await supabase.from('installer_profiles').select('*').eq('user_id', user.id).limit(1).maybeSingle();
    if (profileData) setProfile(profileData);

    // Fetch all quotes for financial stats
    const { data: quotesData } = await supabase
      .from('quotes')
      .select('*, client:clients(first_name, last_name)')
      .eq('installer_id', user.id)
      .order('created_at', { ascending: false });

    if (quotesData) setQuotes(quotesData);
    
    setLoading(false);
  }

  async function handleOnboard() {
    setOnboarding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch('/api/connect-onboard', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          companyName: profile?.company_name || 'Resin Installer'
        })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create onboard link");
      }
    } catch (err) {
      console.error(err);
      alert("Network Error during Connect Routing");
    }
    setOnboarding(false);
  }

  if (loading) return <div className="p-12 flex justify-center text-white/50"><Loader2 className="animate-spin" /></div>;

  // Financial calculations
  const wonQuotes = quotes.filter(q => q.status === 'Won');
  const paidQuotes = quotes.filter(q => q.status === 'Paid' || q.status === 'Paid In Full');
  const allClosedQuotes = [...wonQuotes, ...paidQuotes];

  const totalEarned = paidQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  const depositsCollected = wonQuotes.reduce((sum, q) => sum + ((q.total_amount || 0) * 0.5), 0);
  const pendingBalances = wonQuotes.reduce((sum, q) => sum + ((q.total_amount || 0) * 0.5), 0);
  const totalPipeline = quotes.filter(q => q.status === 'Sent' || q.status === 'Opened' || q.status === 'Quoted').reduce((sum, q) => sum + (q.total_amount || 0), 0);

  // Recent transactions (last 10 closed quotes)
  const recentTransactions = allClosedQuotes.slice(0, 8);

  return (
    <div className="bg-[#050505] p-6 lg:p-12 font-inter text-white min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-3xl font-space font-bold tracking-tight mb-2">Banking & Payouts</h1>
          <p className="text-white/50 text-sm">Track your earnings, payouts, and manage your merchant account.</p>
        </div>

        {stripeAccountId ? (
          <>
            {/* Verified Badge — Compact */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-400">
                <ShieldCheck size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white">Stripe Connect Active</h2>
                <p className="text-white/50 text-xs font-mono truncate">ID: {stripeAccountId}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full shrink-0">Verified</span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#111] border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Paid In Full</span>
                  <DollarSign size={16} className="text-emerald-400" />
                </div>
                <p className="text-2xl font-space font-bold text-emerald-400">${totalEarned.toLocaleString()}</p>
                <p className="text-[10px] text-white/30 mt-1">{paidQuotes.length} invoice{paidQuotes.length !== 1 ? 's' : ''} closed</p>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Deposits Held</span>
                  <CheckCircle2 size={16} className="text-blue-400" />
                </div>
                <p className="text-2xl font-space font-bold text-blue-400">${depositsCollected.toLocaleString()}</p>
                <p className="text-[10px] text-white/30 mt-1">{wonQuotes.length} deposit{wonQuotes.length !== 1 ? 's' : ''} collected</p>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Balances Due</span>
                  <Clock size={16} className="text-amber-400" />
                </div>
                <p className="text-2xl font-space font-bold text-amber-400">${pendingBalances.toLocaleString()}</p>
                <p className="text-[10px] text-white/30 mt-1">Awaiting final payment</p>
              </div>

              <div className="bg-[#111] border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Open Pipeline</span>
                  <TrendingUp size={16} className="text-purple-400" />
                </div>
                <p className="text-2xl font-space font-bold text-purple-400">${totalPipeline.toLocaleString()}</p>
                <p className="text-[10px] text-white/30 mt-1">Unsigned proposals</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2"><Receipt size={16} className="text-[#78c8ff]" /> Recent Transactions</h3>
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Last {recentTransactions.length}</span>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-white/30 text-sm">
                  No completed transactions yet. Send a quote and close the deal!
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentTransactions.map((q) => {
                    const isPaidFull = q.status === 'Paid' || q.status === 'Paid In Full';
                    const isDeposit = q.status === 'Won';

                    return (
                      <div key={q.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPaidFull ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {isPaidFull ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                              {q.client?.first_name} {q.client?.last_name || 'Client'}
                            </p>
                            <p className="text-xs text-white/40">
                              {q.config?.service_type || 'Service'} • {new Date(q.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className={`font-space font-bold text-sm ${isPaidFull ? 'text-emerald-400' : 'text-blue-400'}`}>
                            {isPaidFull ? `$${q.total_amount?.toLocaleString()}` : `$${(q.total_amount * 0.5)?.toLocaleString()}`}
                          </p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isPaidFull ? 'text-emerald-400/60' : 'text-blue-400/60'}`}>
                            {isPaidFull ? 'Paid In Full' : 'Deposit'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payout Info */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Landmark size={18} className="text-[#635BFF] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-white/70">Payouts arrive in your bank within <strong className="text-white">2 business days</strong> after each payment clears.</p>
                  <p className="text-xs text-white/30 mt-1">Stripe charges ~2.9% + 30¢ per transaction. Resin OS takes 0% platform fee.</p>
                </div>
              </div>
              <a 
                href="https://connect.stripe.com/express_login" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-bold text-[#635BFF] hover:underline flex items-center gap-1 shrink-0"
              >
                Open Stripe Dashboard <ExternalLink size={12} />
              </a>
            </div>
          </>
        ) : (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
             
            <div className="flex flex-col md:flex-row gap-8 relative z-10">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center font-bold font-space bg-[#635BFF]">S</div>
                  <h2 className="text-xl font-bold">Stripe Integrated Billing</h2>
                </div>
                
                <p className="text-white/70 text-sm leading-relaxed">
                  Resin OS securely partners with Stripe to securely tokenize and route client funds. Unlike aggregators, we take 0% Platform Fees from your proposals. 
                </p>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Building2 className="text-[#635BFF] flex-shrink-0" size={18} />
                    <p className="text-blue-400">Funds deposit directly into your LLC's local operating checking account within 2 business days.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Landmark className="text-[#635BFF] flex-shrink-0" size={18} />
                    <p className="text-blue-400">You act as the Merchant of Record, controlling tax reporting.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-orange-400 flex-shrink-0" size={18} />
                    <p className="text-blue-400">Stripe charges standard credit card processing fees typically ~2.9% + 30¢.</p>
                  </div>
                </div>

                <button 
                  onClick={handleOnboard} 
                  disabled={onboarding}
                  className="w-full sm:w-auto bg-[#635BFF] hover:bg-[#635BFF]/90 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
                >
                  {onboarding ? <Loader2 className="animate-spin" /> : "Verify Identity via Stripe"}
                  {!onboarding && <ArrowRight size={16} />}
                </button>
              </div>

              <div className="flex-1 hidden md:flex items-center justify-center bg-black/40 rounded-xl border border-white/5 p-8">
                 <ShieldCheck size={120} className="text-white/5 stroke-[0.5]" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
