import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ShieldAlert, Users, TrendingUp, Building, Download, Share2 } from "lucide-react";

export default function MasterControl() {
  const [installers, setInstallers] = useState<any[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [totalGmv, setTotalGmv] = useState(0);
  const [loading, setLoading] = useState(true);

  const [newSignups, setNewSignups] = useState(0);

  useEffect(() => {
    fetchGlobalData();
  }, []);

  async function fetchGlobalData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email })
      });

      if (!res.ok) throw new Error("Failed to fetch superadmin stats");

      const data = await res.json();
      const installersData = data.installers;
      const count = data.totalClients;
      const gmv = data.totalGmv;

    if (installersData) {
      setInstallers(installersData);
      
      // God Mode Analytics
      const lastVisitStr = localStorage.getItem("lastGodModeVisit");
      if (lastVisitStr) {
        const lastVisitDate = new Date(lastVisitStr);
        const newCount = installersData.filter(i => new Date(i.created_at) > lastVisitDate).length;
        setNewSignups(newCount);
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newCount = installersData.filter(i => new Date(i.created_at) > yesterday).length;
        setNewSignups(newCount);
      }
      
      // Save current timestamp for next visit
      localStorage.setItem("lastGodModeVisit", new Date().toISOString());
    }

    if (count !== undefined && count !== null) setTotalClients(count);
    if (gmv !== undefined && gmv !== null) setTotalGmv(gmv);

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  function downloadCSV() {
    if (installers.length === 0) return;
    
    const headers = ['Company Name', 'Full Name', 'Phone', 'Generations', 'Quotes', 'Subscription Active', 'Joined Date'];
    
    const csvRows = installers.map(i => {
      return [
        `"${i.company_name || ''}"`,
        `"${i.full_name || ''}"`,
        `"${i.company_phone || ''}"`,
        i.generation_count || 0,
        i.quote_count || 0,
        i.subscription_active || false,
        `"${new Date(i.created_at).toLocaleDateString()}"`
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...csvRows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contractors_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="p-8 pb-20">
      <header className="mb-10 border-b border-emerald-500/20 pb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="text-emerald-500" size={32} />
            <h1 className="text-3xl font-space font-bold text-white tracking-tight">Super Admin Control</h1>
          </div>
          <p className="text-white/60">Global overview. You are viewing data across all multi-tenant contractor accounts.</p>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold transition-colors"
        >
          <Download size={18} />
          Export CSV
        </button>
      </header>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Building size={80} />
          </div>
          <p className="text-emerald-400/80 text-sm font-bold uppercase tracking-widest mb-2">Total Tenants</p>
          <p className="text-4xl font-space font-bold text-white">{installers.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-2">Global CRM Clients</p>
          <p className="text-4xl font-space font-bold text-white">{totalClients}</p>
          <p className="text-xs text-white/40 mt-2">Across all contractors</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-2 relative z-10">Total Application GMV</p>
          <p className="text-4xl font-space font-bold text-emerald-400 relative z-10">${typeof totalGmv === 'number' ? totalGmv.toLocaleString() : '0'}</p>
          <p className="text-xs text-white/40 mt-2 relative z-10">Direct mathematically processed volume</p>
        </div>
      </div>

      {/* New Signups Dopamine Hit */}
      {newSignups > 0 && (
        <div className="mb-12 bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl flex items-center justify-between shadow-[0_0_50px_rgba(220, 38, 38,0.15)] animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400">+{newSignups} New Accounts!</h2>
            <p className="text-emerald-400/70">Since your last login</p>
          </div>
          <div className="bg-emerald-500/20 p-4 rounded-full">
            <TrendingUp className="text-emerald-400" size={32} />
          </div>
        </div>
      )}

      {/* Affiliate Referrals Panel */}
      {(() => {
        const referred = installers.filter(i => i.referred_by);
        const affiliateGroups = referred.reduce((acc, curr) => {
          const slug = curr.referred_by;
          if (!acc[slug]) acc[slug] = [];
          acc[slug].push(curr);
          return acc;
        }, {} as Record<string, any[]>);
        const affiliateSlugs = Object.keys(affiliateGroups);

        if (affiliateSlugs.length === 0 && !loading) return null;

        return (
          <div className="mb-12">
            <h2 className="text-xl font-space font-bold text-white mb-6 flex items-center gap-3">
              <Share2 size={20} className="text-purple-400" />
              Affiliate Referrals
              {referred.length > 0 && (
                <span className="text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full">
                  {referred.length} total
                </span>
              )}
            </h2>

            {affiliateSlugs.length === 0 ? (
              <div className="bg-[#111] border border-white/10 p-6 rounded-2xl text-center">
                <p className="text-white/40 text-sm">No affiliate referrals yet. Share your link: <span className="text-purple-400">resinacademics.com/ref/doctor-epoxy</span></p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {affiliateSlugs.map(slug => {
                  const group = affiliateGroups[slug];
                  const paying = group.filter(i => i.subscription_active);
                  const commission = paying.length * 30;

                  return (
                    <div key={slug} className="bg-[#0a0a0a] border border-purple-500/20 rounded-2xl overflow-hidden">
                      {/* Affiliate header */}
                      <div className="p-5 border-b border-white/5 bg-purple-500/5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                              {slug.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{slug}</p>
                              <p className="text-[10px] text-white/40">resinacademics.com/ref/{slug}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-white">{group.length}</p>
                            <p className="text-[9px] text-white/40 uppercase tracking-wider">Signups</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-emerald-400">{paying.length}</p>
                            <p className="text-[9px] text-white/40 uppercase tracking-wider">Paying</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-purple-400">${commission}</p>
                            <p className="text-[9px] text-white/40 uppercase tracking-wider">Owed</p>
                          </div>
                        </div>
                      </div>

                      {/* Referred contractors list */}
                      <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto">
                        {group.map(installer => (
                          <div key={installer.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                            <div>
                              <p className="text-xs font-bold text-white/80">{installer.company_name || installer.full_name || 'Unnamed'}</p>
                              <p className="text-[10px] text-white/30">{new Date(installer.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              installer.subscription_active
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {installer.subscription_active ? 'Paying' : 'Trial'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        {/* Contractor Directory */}
        <div className="col-span-3">
          <h2 className="text-xl font-space font-bold text-white mb-6">Contractor Directory</h2>
          {loading ? (
            <p className="text-white/50">Decrypting global state...</p>
          ) : (
            <div className="space-y-4">
              {installers.map((installer) => (
                <div key={installer.id} className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl flex justify-between items-center hover:border-emerald-500/30 transition-colors">
                  <div>
                    <h3 className="font-bold text-white text-lg">{installer.company_name}</h3>
                    <p className="text-sm text-white/50">{installer.full_name} • {installer.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex justify-end gap-2 mb-2">
                       {installer.has_stripe ? (
                         <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest">
                           Stripe Active
                         </span>
                       ) : (
                         <span className="inline-block px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                           Pending Setup
                         </span>
                       )}
                       <span className="inline-block px-3 py-1 bg-blue-500/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/70">
                         {installer.subscription_active ? 'SUBSCRIBED' : 'FREE TIER'}
                       </span>
                    </div>
                    <p className="text-xs text-white/30">Joined {new Date(installer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {installers.length === 0 && (
                <p className="text-white/40">No contractors have signed up yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Calendar Analytics */}
        <div className="col-span-1">
          <h2 className="text-xl font-space font-bold text-white mb-6">30-Day Velocity</h2>
          <div className="bg-[#111] border border-white/10 p-5 rounded-2xl space-y-3">
             {Object.entries(installers.reduce((acc, curr) => {
                const dateStr = new Date(curr.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                acc[dateStr] = (acc[dateStr] || 0) + 1;
                return acc;
             }, {} as Record<string, number>)).slice(0, 10).map(([date, count]) => (
                <div key={date} className="flex items-center justify-between text-sm">
                  <span className="text-white/50">{date}</span>
                  <div className="flex items-center gap-2">
                     <span className="font-bold text-white">+{count as number}</span>
                  </div>
                </div>
             ))}
             {installers.length === 0 && <p className="text-xs text-white/40">No history</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
