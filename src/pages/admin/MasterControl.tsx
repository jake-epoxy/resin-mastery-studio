import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ShieldAlert, Users, TrendingUp, Building } from "lucide-react";

export default function MasterControl() {
  const [installers, setInstallers] = useState<any[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalData();
  }, []);

  async function fetchGlobalData() {
    setLoading(true);

    // Fetch all installers
    const { data: installersData } = await supabase
      .from("installers")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch all clients across entire platform
    const { data: clientsData, count } = await supabase
      .from("clients")
      .select("*", { count: "exact" });

    if (installersData) setInstallers(installersData);
    if (count !== null) setTotalClients(count);

    setLoading(false);
  }

  return (
    <div className="p-8 pb-20">
      <header className="mb-10 border-b border-red-500/20 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldAlert className="text-red-500" size={32} />
          <h1 className="text-3xl font-space font-bold text-white tracking-tight">Super Admin Control</h1>
        </div>
        <p className="text-white/60">Global overview. You are viewing data across all multi-tenant contractor accounts.</p>
      </header>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-red-950/20 border border-red-500/30 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Building size={80} />
          </div>
          <p className="text-red-400/80 text-sm font-bold uppercase tracking-widest mb-2">Total Tenants</p>
          <p className="text-4xl font-space font-bold text-white">{installers.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-2">Global CRM Clients</p>
          <p className="text-4xl font-space font-bold text-white">{totalClients}</p>
          <p className="text-xs text-white/40 mt-2">Across all contractors</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-2">Platform MRR</p>
          <p className="text-4xl font-space font-bold text-green-400">$0</p>
          <p className="text-xs text-white/40 mt-2">Stripe pending</p>
        </div>
      </div>

      {/* Contractor Directory */}
      <h2 className="text-xl font-space font-bold text-white mb-6">Contractor Directory</h2>
      {loading ? (
        <p className="text-white/50">Decrypting global state...</p>
      ) : (
        <div className="space-y-4">
          {installers.map((installer) => (
            <div key={installer.id} className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl flex justify-between items-center hover:border-red-500/30 transition-colors">
              <div>
                <h3 className="font-bold text-white text-lg">{installer.company_name}</h3>
                <p className="text-sm text-white/50">{installer.email}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-white/70 mb-2">
                  {installer.subscription_tier}
                </span>
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
  );
}
