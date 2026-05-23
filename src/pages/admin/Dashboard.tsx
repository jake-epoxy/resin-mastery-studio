import { motion, AnimatePresence } from "framer-motion";
import { Users, FileText, CheckCircle, TrendingUp, Plus, BarChart3, Archive, PackageCheck, Trash2, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import ClientProfileDrawer from "./ClientProfileDrawer";
import AddLeadModal from "./AddLeadModal";
import { useToast } from "@/components/ui/use-toast";

export default function AdminDashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showLost, setShowLost] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Stats
  const newLeads = clients.filter(c => c.status === 'New Lead');
  const quoted = clients.filter(c => c.status === 'Quoted');
  const won = clients.filter(c => ['Won', 'Paid', 'Paid In Full', 'Scheduled', 'In Progress', 'Curing'].includes(c.status));
  const completed = clients.filter(c => c.status === 'Completed');
  const lost = clients.filter(c => c.status === 'Lost');
  const revenue = [...won, ...completed].reduce((acc, curr) => acc + (Number(curr.total_value) || 0), 0);

  async function handleArchive(clientId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setArchivingId(clientId);
    const { error } = await supabase
      .from('clients')
      .update({ status: 'Completed' })
      .eq('id', clientId);
    setArchivingId(null);
    if (error) {
      toast({ title: "Archive Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Project Completed ✅", description: "Moved to Completed. Your pipeline is clear." });
      fetchClients();
    }
  }

  async function handleRestore(clientId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const { error } = await supabase
      .from('clients')
      .update({ status: 'Won' })
      .eq('id', clientId);
    if (error) {
      toast({ title: "Restore Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Restored", description: "Moved back to active pipeline." });
      fetchClients();
    }
  }

  async function handlePermanentDelete(clientId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("Permanently delete this completed project? This cannot be undone.")) return;
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Project permanently removed." });
      fetchClients();
    }
  }

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('installer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  }

  const chartData = [
    { name: "New Leads", uv: newLeads.length, fill: "#78c8ff" },
    { name: "Quoted", uv: quoted.length, fill: "#a78bfa" },
    { name: "Won Jobs", uv: won.length, fill: "#4ade80" },
    { name: "Completed", uv: completed.length, fill: "#facc15" }
  ];

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6 md:mb-8">
        <div className="flex justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-space font-bold text-white tracking-tight mb-1">Command Center</h1>
            <p className="text-white/60 text-sm md:text-base">Manage your pipeline, incoming leads, and active projects.</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-[#78c8ff] text-black px-3 md:px-4 py-2 rounded-xl font-bold hover:bg-white transition-colors text-sm md:text-base whitespace-nowrap shrink-0">
            <Plus size={18} /> Add Lead
          </button>
        </div>
      </header>

      {/* Guided Track: Daily Tasks */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 bg-zinc-950 border border-white/5 p-6 rounded-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#78c8ff]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-xl font-space font-bold text-white flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-[#78c8ff]" /> Your Daily Immersion Tasks
          </h2>
          <p className="text-white/50 text-sm mb-6">Complete these 3 tasks today to advance your epoxy business.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {localStorage.getItem('resin_guided_track') === 'advanced' ? (
              <>
                <TaskCard num={1} title="Setup Quote Engine" desc="Configure your pricing & custom PDF contract." />
                <TaskCard num={2} title="Closing Scripts" desc="Review the masterclass on closing high-ticket leads." />
                <TaskCard num={3} title="Controlled Veining" desc="Advanced technique: Spray paint highlights for precise designs." isAction />
              </>
            ) : (
              <>
                <TaskCard num={1} title="Watch Day 1 Primer" desc="Safety, prep, and basic mixing ratios." />
                <TaskCard num={2} title="Order Starter Kit" desc="Get your gear. Your student discount is applied." />
                <TaskCard num={3} title="Spray Paint Technique" desc="Practice highlights & veins for easy, controlled designs." isAction />
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Analytics Chart Row */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black border border-white/5 p-6 rounded-2xl mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#78c8ff]/5 rounded-full blur-3xl"></div>
        <h3 className="text-white font-bold mb-6 flex items-center gap-3"><BarChart3 size={18} className="text-[#78c8ff]"/> Pipeline Conversion Funnel</h3>
        
        <div className="h-48 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', color: '#fff' }} 
              />
              <Bar dataKey="uv" radius={[6, 6, 0, 0]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-10">
        {[
          { label: "New Leads", value: newLeads.length.toString(), icon: Users, color: "text-blue-400" },
          { label: "Active Quotes", value: quoted.length.toString(), icon: FileText, color: "text-purple-400" },
          { label: "Jobs Won", value: won.length.toString(), icon: CheckCircle, color: "text-green-400" },
          { label: "Revenue (MTD)", value: `$${revenue.toLocaleString()}`, icon: TrendingUp, color: "text-yellow-400" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-white/50 text-sm font-semibold uppercase tracking-wider">{stat.label}</span>
              <stat.icon size={20} className={stat.color} />
            </div>
            <span className="text-2xl md:text-3xl font-space font-bold text-white">{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Board */}
      <h2 className="text-xl font-space font-bold text-white mb-6">Pipeline</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* New Leads Column */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[200px] md:min-h-[500px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#78c8ff] mb-4 flex justify-between">
            New Leads <span>{newLeads.length}</span>
          </h3>
          <div className="space-y-4">
            {newLeads.map(c => (
              <PipelineCard key={c.id} onClick={() => setSelectedClient(c)} name={`${c.first_name} ${c.last_name}`} project={typeof c.project_type === 'object' ? 'Autopilot Lead' : (c.project_type || 'Quote')} status={c.status} date="Just Now" />
            ))}
          </div>
        </div>

        {/* Quoted Column */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[200px] md:min-h-[500px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#a78bfa] mb-4 flex justify-between">
            Quoted / Follow Up <span>{quoted.length}</span>
          </h3>
          <div className="space-y-4">
            {quoted.map(c => (
              <PipelineCard key={c.id} onClick={() => setSelectedClient(c)} name={`${c.first_name} ${c.last_name}`} project={typeof c.project_type === 'object' ? 'Autopilot Lead' : (c.project_type || 'Quote')} status={c.status} date="Recent" amount={`$${c.total_value}`} />
            ))}
          </div>
        </div>

        {/* Won Column */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[200px] md:min-h-[500px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-green-400 mb-4 flex justify-between">
            Active Jobs (Won/Scheduled) <span>{won.length}</span>
          </h3>
          <div className="space-y-4">
            {won.map(c => (
              <div key={c.id} className="relative group">
                <PipelineCard onClick={() => setSelectedClient(c)} name={`${c.first_name} ${c.last_name}`} project={typeof c.project_type === 'object' ? 'Autopilot Lead' : (c.project_type || 'Quote')} status={c.status} date="Recent" amount={`$${c.total_value}`} isWon />
                {/* Archive / Remove from Pipeline button */}
                <motion.button
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={(e) => handleArchive(c.id, e)}
                  disabled={archivingId === c.id}
                  className="w-full mt-1.5 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 disabled:opacity-50"
                >
                  {archivingId === c.id ? (
                    <span className="animate-pulse">Archiving...</span>
                  ) : (
                    <><PackageCheck size={13} /> Remove from Pipeline</>
                  )}
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completed / Archived Section */}
      {completed.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-3 mb-4 group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Archive size={18} className="text-yellow-400/70" />
              <h2 className="text-lg font-space font-bold text-white/60 group-hover:text-white transition-colors">Completed Projects</h2>
            </div>
            <span className="text-xs font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2.5 py-1 rounded-full">{completed.length}</span>
            <span className="text-white/30 text-xs font-bold uppercase tracking-wider">{showCompleted ? '▼ Hide' : '▶ Show'}</span>
          </button>

          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {completed.map(c => (
                    <div key={c.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 relative group">
                      <div onClick={() => setSelectedClient(c)} className="cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-white/50 text-sm">{c.first_name} {c.last_name}</h4>
                          {c.total_value && <span className="font-space text-xs font-bold text-emerald-400/60">${c.total_value?.toLocaleString()}</span>}
                        </div>
                        <p className="text-xs text-white/30 mb-3">{typeof c.project_type === 'object' ? 'Autopilot Lead' : (c.project_type || 'Quote')}</p>
                        <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider text-yellow-400/50">
                          <CheckCircle size={10} /> Completed
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/5">
                        <button
                          onClick={(e) => handleRestore(c.id, e)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-white/40 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
                        >
                          Restore
                        </button>
                        <button
                          onClick={(e) => handlePermanentDelete(c.id, e)}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-white/5"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Lost / Dead Leads Section */}
      {lost.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowLost(!showLost)}
            className="flex items-center gap-3 mb-4 group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Archive size={18} className="text-red-400/70" />
              <h2 className="text-lg font-space font-bold text-white/60 group-hover:text-white transition-colors">Lost / Dead Leads</h2>
            </div>
            <span className="text-xs font-bold bg-red-400/10 text-red-400 border border-red-400/20 px-2.5 py-1 rounded-full">{lost.length}</span>
            <span className="text-white/30 text-xs font-bold uppercase tracking-wider">{showLost ? '▼ Hide' : '▶ Show'}</span>
          </button>

          <AnimatePresence>
            {showLost && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {lost.map(c => (
                    <div key={c.id} className="bg-red-950/20 border border-red-500/10 rounded-xl p-4 relative group">
                      <div onClick={() => setSelectedClient(c)} className="cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-white/50 text-sm">{c.first_name} {c.last_name}</h4>
                        </div>
                        <p className="text-xs text-white/30 mb-3">{typeof c.project_type === 'object' ? 'Autopilot Lead' : (c.project_type || 'Quote')}</p>
                        <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider text-red-400/50">
                          <X size={10} /> Lost Lead
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-3 pt-3 border-t border-red-500/10">
                        <button
                          onClick={(e) => handleRestore(c.id, e)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-white/40 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
                        >
                          Restore
                        </button>
                        <button
                          onClick={(e) => handlePermanentDelete(c.id, e)}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/20"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {selectedClient && (
        <ClientProfileDrawer 
          client={selectedClient} 
          onClose={() => setSelectedClient(null)} 
          onUpdate={fetchClients} 
        />
      )}

      <AddLeadModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={fetchClients} 
      />
    </div>
  );
}

function PipelineCard({ name, project, status, date, amount, isWon, onClick }: any) {
  return (
    <div onClick={onClick} className={`p-4 rounded-xl border ${isWon ? 'bg-green-900/20 border-green-500/20' : 'bg-[#0a0a0a] border-white/10'} hover:border-white/30 cursor-pointer transition-all`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-white text-sm">{name}</h4>
        {amount && <span className="font-space text-xs font-bold text-white">{amount}</span>}
      </div>
      <p className="text-xs text-white/60 mb-3">{project}</p>
      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
        <span className={isWon ? 'text-green-400' : 'text-white/40'}>{status}</span>
        <span className="text-white/30">{date}</span>
      </div>
    </div>
  );
}

function TaskCard({ num, title, desc, isAction }: any) {
  const taskKey = "resin_task_" + title.replace(/\s+/g, '_');
  const [done, setDone] = useState(() => localStorage.getItem(taskKey) === 'true');

  const toggleDone = () => {
    const next = !done;
    setDone(next);
    localStorage.setItem(taskKey, next.toString());
  };

  return (
    <div 
      onClick={toggleDone}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        done ? 'bg-green-950/30 border-green-500/20 opacity-60' : 
        isAction ? 'bg-[#78c8ff]/5 border-[#78c8ff]/20 hover:bg-[#78c8ff]/10' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${done ? 'bg-green-500/20 text-green-400' : 'bg-black text-white/50'}`}>Task {num}</span>
        {done && <CheckCircle size={16} className="text-green-400" />}
      </div>
      <h4 className={`font-bold text-sm mb-1 ${done ? 'text-green-400/80 line-through' : 'text-white'}`}>{title}</h4>
      <p className={`text-xs ${done ? 'text-green-400/50' : 'text-white/50'}`}>{desc}</p>
    </div>
  );
}
