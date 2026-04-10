import { motion } from "framer-motion";
import { Users, FileText, CheckCircle, TrendingUp, Plus, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import ClientProfileDrawer from "./ClientProfileDrawer";
import AddLeadModal from "./AddLeadModal";

export default function AdminDashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Stats
  const newLeads = clients.filter(c => c.status === 'New Lead');
  const quoted = clients.filter(c => c.status === 'Quoted');
  const won = clients.filter(c => c.status === 'Won');
  const revenue = won.reduce((acc, curr) => acc + (Number(curr.total_value) || 0), 0);

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
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  }

  const chartData = [
    { name: "New Leads", uv: newLeads.length, fill: "#78c8ff" },
    { name: "Quoted", uv: quoted.length, fill: "#a78bfa" },
    { name: "Won Jobs", uv: won.length, fill: "#4ade80" }
  ];

  return (
    <div className="p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-space font-bold text-white tracking-tight mb-2">Command Center</h1>
          <p className="text-white/60">Manage your pipeline, incoming leads, and active projects.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-[#78c8ff] text-black px-4 py-2 rounded-xl font-bold hover:bg-white transition-colors">
          <Plus size={18} /> Add Lead
        </button>
      </header>

      {/* Analytics Chart Row */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#050505] border border-white/10 p-6 rounded-2xl mb-6 shadow-2xl relative overflow-hidden"
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
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
            className="bg-white/5 border border-white/10 p-6 rounded-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-white/50 text-sm font-semibold uppercase tracking-wider">{stat.label}</span>
              <stat.icon size={20} className={stat.color} />
            </div>
            <span className="text-3xl font-space font-bold text-white">{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Board */}
      <h2 className="text-xl font-space font-bold text-white mb-6">Pipeline</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* New Leads Column */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[500px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#78c8ff] mb-4 flex justify-between">
            New Leads <span>{newLeads.length}</span>
          </h3>
          <div className="space-y-4">
            {newLeads.map(c => (
              <PipelineCard key={c.id} onClick={() => setSelectedClient(c)} name={`${c.first_name} ${c.last_name}`} project={c.project_type} status={c.status} date="Just Now" />
            ))}
          </div>
        </div>

        {/* Quoted Column */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[500px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#a78bfa] mb-4 flex justify-between">
            Quoted / Follow Up <span>{quoted.length}</span>
          </h3>
          <div className="space-y-4">
            {quoted.map(c => (
              <PipelineCard key={c.id} onClick={() => setSelectedClient(c)} name={`${c.first_name} ${c.last_name}`} project={c.project_type} status={c.status} date="Recent" amount={`$${c.total_value}`} />
            ))}
          </div>
        </div>

        {/* Won Column */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[500px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-green-400 mb-4 flex justify-between">
            Won / Deposit Paid <span>{won.length}</span>
          </h3>
          <div className="space-y-4">
            {won.map(c => (
              <PipelineCard key={c.id} onClick={() => setSelectedClient(c)} name={`${c.first_name} ${c.last_name}`} project={c.project_type} status={c.status} date="Recent" amount={`$${c.total_value}`} isWon />
            ))}
          </div>
        </div>
      </div>
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
