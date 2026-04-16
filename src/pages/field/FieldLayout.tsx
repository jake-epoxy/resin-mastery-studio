import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, CalendarRange, Clock, Settings, HardHat } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function FieldLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [workerName, setWorkerName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/admin');
        return;
      }
      if (session.user.user_metadata?.role !== 'worker') {
        // Fallback catch if they end up here but are a contractor
        navigate('/admin');
        return;
      }
      setWorkerName(session.user.user_metadata?.full_name || "Worker");
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#ffffff] border-t-transparent rounded-full animate-spin"></div></div>;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-inter pb-20 selection:bg-[#ffffff]/30">
       {/* Top Status Bar */}
       <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 py-4 px-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center">
               <HardHat size={20} className="text-emerald-400" />
            </div>
            <div>
               <h1 className="text-sm font-bold leading-tight">{workerName}</h1>
               <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Field Mode Active</span>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-white/40 hover:text-emerald-400 transition-colors">
            <LogOut size={20} />
          </button>
       </header>

       {/* Mobile Content Area */}
       <main className="flex-1 overflow-y-auto px-4 py-6">
          <Outlet />
       </main>

       {/* Massive Native App Style Bottom Bar */}
       <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 px-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
           <div className="flex items-center justify-around py-2">
              <button onClick={() => navigate('/field')} className={`flex flex-col items-center gap-1 p-2 rounded-xl w-1/3 ${location.pathname === '/field' ? 'text-emerald-400' : 'text-white/40'}`}>
                 <CalendarRange size={24} />
                 <span className="text-[10px] font-bold mt-1">Schedule</span>
              </button>
              
              <div className="relative -top-6 px-2">
                 <button className="w-16 h-16 rounded-full bg-emerald-500 text-black flex flex-col items-center justify-center shadow-[0_0_30px_rgba(220, 38, 38,0.4)] border-4 border-[#050505]">
                    <Clock size={24} />
                    <span className="text-[10px] font-black uppercase tracking-tight mt-0.5">IN/OUT</span>
                 </button>
              </div>

              <button className="flex flex-col items-center gap-1 p-2 rounded-xl w-1/3 text-white/40">
                 <Settings size={24} />
                 <span className="text-[10px] font-bold mt-1">Settings</span>
              </button>
           </div>
       </nav>
    </div>
  );
}
