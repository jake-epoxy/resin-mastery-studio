import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calculator, PlaySquare, ShoppingBag, Settings, LogOut, Lock, ShieldAlert, ContactRound, LifeBuoy, Wand2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import OnboardingWizard from "../../components/OnboardingWizard";
import PaywallGuard from "../../components/PaywallGuard";

export default function AdminLayout() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Auth view toggles
  const [isSignUp, setIsSignUp] = useState(false);

  const [installerProfile, setInstallerProfile] = useState<any>(null);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('installer_profiles').select('*').eq('user_id', userId).single();
    if (!error && data) {
      setInstallerProfile(data);
    }
  };

  // Check generic localStorage to keep Jake logged in
  // Check active session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email ?? null);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user.email ?? null);
      if (session) fetchProfile(session.user.id);
      else setInstallerProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const navItems = [
    { name: "Command Center", path: "/admin", icon: LayoutDashboard },
    { name: "Lead Center", path: "/admin/leads", icon: ContactRound },
    { name: "Quote Generator", path: "/admin/quote", icon: Calculator },
    { name: "AI Visualizer", path: "/admin/visualizer", icon: Wand2 },
    { name: "Mastery Support", path: "/admin/academy", icon: LifeBuoy },
    { name: "Mud2Marble Store", path: "/admin/marketplace", icon: ShoppingBag },
  ];

  if (userEmail === "jakeflowers222@gmail.com") {
    navItems.push({ name: "God Mode", path: "/admin/super", icon: ShieldAlert });
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#78c8ff]/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-10 flex flex-col items-center text-center shadow-[0_0_50px_rgba(120,200,255,0.1)]">
          {isSignUp ? (
            <OnboardingWizard 
              onComplete={() => setIsAuthenticated(true)}
              onSwitchToLogin={() => setIsSignUp(false)}
            />
          ) : (
            <>
              <div className="w-16 h-16 bg-[#78c8ff]/10 border border-[#78c8ff]/20 rounded-full flex items-center justify-center mb-6">
                <Lock className="text-[#78c8ff]" size={28} />
              </div>
              
              <h1 className="text-4xl font-space font-bold text-white tracking-tight mb-4">Contractor Login</h1>
              <p className="text-white/60 mb-8 max-w-sm mx-auto">
                Access your CRM dashboard, quotes, and the learning vault.
              </p>

              <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="Contractor Email"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setError(null); }}
                  className={`w-full bg-[#111] border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#78c8ff] transition-colors`}
                  required
                />
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Secure Password"
                    value={passwordInput}
                    onChange={(e) => { setPasswordInput(e.target.value); setError(null); }}
                    className={`w-full bg-[#111] border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#78c8ff] transition-colors`}
                    required
                  />
                  {error && <p className="text-red-500 text-xs text-left mt-2 px-2 absolute -bottom-6">{error}</p>}
                </div>
                
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50"
                >
                  {loading ? "Authenticating..." : "Unlock Terminal"}
                </button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-white/5 w-full">
                <p className="text-sm text-zinc-500">
                  Don't have an account? <button type="button" onClick={() => setIsSignUp(true)} className="text-[#78c8ff] hover:underline font-bold">Subscribe Now</button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // If the user is logged in, but their SQL profile has subscription_active = false
  if (installerProfile && installerProfile.subscription_active === false) {
    return (
      <PaywallGuard 
        userId={installerProfile.user_id} 
        paymentLink="https://buy.stripe.com/9B63cv2338Od9qPgBN6J201" 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row text-white font-inter">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white/5 border-r border-white/10 md:min-h-screen p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-full border border-white/20 bg-[#78c8ff]/10 flex items-center justify-center overflow-hidden shrink-0">
             {installerProfile?.company_name ? (
                <span className="text-[#78c8ff] font-bold text-lg">{installerProfile.company_name.charAt(0)}</span>
             ) : (
                <img src="/logo.png" alt="Resin Academics" className="w-full h-full object-cover" />
             )}
          </div>
          <span className="font-space font-bold tracking-widest text-[#78c8ff] uppercase text-sm leading-tight">
            {installerProfile?.company_name || "Resin OS"}
          </span>
        </div>

        <nav className="space-y-2 flex-grow">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isGodMode = item.name === "God Mode";
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive && !isGodMode
                    ? "bg-gradient-to-r from-[#78c8ff]/20 to-[#a78bfa]/20 text-white border border-white/10"
                    : isActive && isGodMode
                    ? "bg-red-950/40 text-red-400 border border-red-500/30"
                    : isGodMode
                    ? "text-red-500/60 hover:text-red-400 hover:bg-red-950/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={18} className={isActive && !isGodMode ? "text-[#78c8ff]" : ""} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/10 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium">
            <Settings size={18} />
            Settings
          </button>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all font-medium"
          >
            <LogOut size={18} />
            Lock Terminal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
