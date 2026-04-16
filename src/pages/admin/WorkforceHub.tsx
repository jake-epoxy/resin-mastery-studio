import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, HardHat, Plus, Trash2, ShieldCheck, Mail, Phone, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

export default function WorkforceHub() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("Resin2026!");
  const [newRole, setNewRole] = useState("Crew Leader");
  const [newPhone, setNewPhone] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCrew() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const stored = localStorage.getItem(`crew_${user.id}`);
        if (stored) {
          setCrew(JSON.parse(stored));
        }
      }
      setLoading(false);
    }
    loadCrew();
  }, []);

  const saveCrew = (newCrew: CrewMember[]) => {
    setCrew(newCrew);
    if (userId) {
      localStorage.setItem(`crew_${userId}`, JSON.stringify(newCrew));
    }
  };

  const addCrewMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    setIsMinting(true);
    setApiError(null);

    // 1. Attempt to create the actual secure Supabase Auth account via Serverless API
    try {
      const res = await fetch('/api/create-worker', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            email: newEmail,
            password: newPassword,
            name: newName,
            role: newRole,
            contractorId: userId
         })
      });

      const data = await res.json();
      if (!res.ok) {
         console.warn("API Worker Creation Failed (likely missing Admin API Key):", data.error);
         setApiError("Warning: Secure Auth failed. Falling back to local offline profile.");
      }
    } catch (err) {
      console.warn("API Request Failed:", err);
    }

    // 2. Regardless of Auth success (for MVP resilience), save the profile locally
    const newMember: CrewMember = {
      id: crypto.randomUUID(),
      name: newName,
      role: newRole,
      phone: newPhone,
      email: newEmail
    };

    saveCrew([...crew, newMember]);
    setIsAddOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewRole("Crew Leader");
    setIsMinting(false);
  };

  const removeCrew = (id: string) => {
    saveCrew(crew.filter(c => c.id !== id));
  };

  if (loading) return null;

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8 md:mb-10 border-b border-white/5 pb-6">
         <div className="flex justify-between items-end gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-space font-bold text-white tracking-tight mb-1 flex items-center gap-3">
                <HardHat className="text-[#ffffff]" size={28} /> Workforce Hub
              </h1>
              <p className="text-white/60 text-sm md:text-base">Manage your crews, edit dispatch profiles, and configure field permissions.</p>
            </div>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 bg-[#ffffff] text-black px-4 py-2 rounded-xl font-bold hover:bg-white transition-colors text-sm"
            >
              <Plus size={18} /> Add Crew Member
            </button>
         </div>
      </header>

      {crew.length === 0 ? (
        <div className="bg-[#111] border border-white/10 border-dashed rounded-2xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#ffffff]/10 rounded-full flex items-center justify-center mb-4">
                <Users className="text-[#ffffff]" size={32} />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">No Crew Assigned</h3>
            <p className="text-zinc-500 max-w-sm mx-auto mb-6">Build your roster to assign jobs on the Kanban board and track field notes by author.</p>
            <button onClick={() => setIsAddOpen(true)} className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-blue-500/10 transition-colors">
                Add First Worker
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {crew.map((member) => (
              <motion.div 
                key={member.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 relative group shadow-lg"
              >
                <button 
                  onClick={() => removeCrew(member.id)}
                  className="absolute top-4 right-4 text-white/20 hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 bg-gradient-to-tr from-[#ffffff]/20 to-[#ffffff]/20 rounded-full flex items-center justify-center border border-[#ffffff]/30">
                      <HardHat size={20} className="text-[#ffffff]" />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-white leading-tight">{member.name}</h3>
                     <span className={`text-xs font-bold uppercase tracking-widest ${member.role === 'Crew Leader' ? 'text-amber-400' : 'text-[#ffffff]'}`}>
                        {member.role}
                     </span>
                   </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                   <p className="flex items-center gap-2 text-xs text-zinc-500">
                     <Phone size={12} /> {member.phone || "No phone added"}
                   </p>
                   <p className="flex items-center gap-2 text-xs text-zinc-500">
                     <ShieldCheck size={12} /> Field App Access: <span className="text-emerald-400">Locked</span>
                   </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-6">Add Crew Member</h2>
              
              {apiError && <div className="mb-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded">{apiError}</div>}

              <form onSubmit={addCrewMember} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Worker Name</label>
                    <input required autoFocus value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffffff]" placeholder="e.g. Mike Johnson" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Login Email</label>
                    <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffffff] text-sm" placeholder="mike@company.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#ffffff] mb-2 flex items-center gap-1"><Lock size={12}/> Worker Password</label>
                    <input required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-black border border-[#ffffff]/30 rounded-xl px-4 py-3 text-[#ffffff] focus:outline-none focus:border-[#ffffff] text-sm" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Role</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffffff] appearance-none text-sm">
                       <option>Crew Leader</option>
                       <option>Installer</option>
                       <option>Prep Specialist</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Phone</label>
                    <input value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffffff] text-sm" placeholder="(555) 123-4567" />
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-3 text-white/50 hover:text-white font-bold w-1/3 text-center">Cancel</button>
                  <button type="submit" disabled={!newName || !newEmail || isMinting} className="bg-[#ffffff] text-black font-bold py-3 rounded-xl hover:bg-white transition-colors w-2/3 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isMinting ? "Generating..." : "Generate Credentials"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
