import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { MapPin, Phone, Car, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function MobileSchedule() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      const { data: { session } } = await supabase.auth.getSession();
      const contractorId = session?.user.user_metadata?.contractor_id;

      if (contractorId) {
        // Fetch all jobs for this contractor that are not fully completed
        const { data } = await supabase.from('clients')
          .select('*')
          .eq('installer_id', contractorId)
          .neq('ops_status', 'Completed')
          .order('created_at', { ascending: false });
        
        if (data) setJobs(data);
      }
      setLoading(false);
    }
    loadJobs();
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black font-space text-white tracking-widest uppercase">My Schedule</h2>
          <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider">
             {jobs.length} Active Jobs
          </div>
       </div>

       {jobs.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center border-dashed">
             <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
             <h3 className="font-bold text-white mb-2">No Active Jobs</h3>
             <p className="text-xs text-white/50">You're cleared out for the moment. Wait for dispatch to update the board.</p>
          </div>
       ) : (
          <div className="space-y-4">
             {jobs.map(job => (
                <div key={job.id} className="bg-[#111] border border-white/10 rounded-2xl p-5 relative overflow-hidden">
                   {/* Status Indicator Bar */}
                   <div className={`absolute top-0 left-0 w-1.5 h-full ${job.ops_status === 'Scheduled' ? 'bg-amber-400' : 'bg-[#ffffff]'}`} />
                   
                   <div className="pl-2">
                       <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg leading-tight text-white">{job.first_name} {job.last_name}</h3>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded ${job.ops_status === 'Scheduled' ? 'bg-amber-400/20 text-amber-400' : 'bg-[#ffffff]/20 text-[#ffffff]'}`}>
                             {job.ops_status || "Scheduled"}
                          </span>
                       </div>
                       
                       <p className="text-xs text-white/50 mb-4 line-clamp-1 flex items-center gap-1.5">
                          <MapPin size={12}/> {job.street_address || "No Address Provided"}
                       </p>

                       <div className="grid grid-cols-2 gap-2 mb-5">
                          <button className="bg-white/5 hover:bg-blue-500/10 text-white p-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors">
                             <Phone size={14} className="text-zinc-400" /> Phone
                          </button>
                          <button className="bg-white/5 hover:bg-blue-500/10 text-white p-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors">
                             <Car size={14} className="text-zinc-400" /> Drive
                          </button>
                       </div>

                       <div className="flex items-center justify-between border-t border-white/5 pt-4">
                          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
                             <Clock size={12} /> Unassigned Time
                          </div>
                          <button className="text-[#ffffff] text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors">
                             View Details <ArrowRight size={14} />
                          </button>
                       </div>
                   </div>
                </div>
             ))}
          </div>
       )}
    </div>
  );
}
