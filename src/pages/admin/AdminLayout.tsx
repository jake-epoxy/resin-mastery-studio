import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calculator, PlaySquare, ShoppingBag, Settings, LogOut, Lock, ShieldAlert, ContactRound, LifeBuoy, Wand2, Landmark, FileText, HardHat, Factory } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import OnboardingWizard from "../../components/OnboardingWizard";
import PaywallGuard from "../../components/PaywallGuard";
import AssistantFAB from "../../components/AssistantFAB";

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

  // =========================================================
  // SINGLE SOURCE OF TRUTH — All nav tabs live here.
  // If you add a route, add it here. Mobile + Desktop both read this.
  // devOnly tabs only show for the developer account.
  // =========================================================
  const allNavItems = [
    { name: "Command Center", mobileLabel: "Home", path: "/admin", icon: LayoutDashboard },
    { name: "Lead Center", mobileLabel: "Leads", path: "/admin/leads", icon: ContactRound },
    { name: "Quote Generator", mobileLabel: "Quotes", path: "/admin/quote", icon: Calculator },
    { name: "AI Visualizer", mobileLabel: "AI", path: "/admin/visualizer", icon: Wand2 },
    { name: "Mastery Support", mobileLabel: "Help", path: "/admin/academy", icon: LifeBuoy },
    { name: "Proposals", mobileLabel: "Proposals", path: "/admin/proposals", icon: FileText },
    { name: "Workforce Hub", mobileLabel: "Team", path: "/admin/workforce", icon: HardHat },
    { name: "Ops & Dispatch", mobileLabel: "Ops", path: "/admin/ops", icon: Factory },
    { name: "Banking & Payouts", mobileLabel: "Banking", path: "/admin/finances", icon: Landmark },
    { name: "Mud2Marble Store", mobileLabel: "Store", path: "/admin/marketplace", icon: ShoppingBag },
    { name: "Settings", mobileLabel: "Settings", path: "/admin/settings", icon: Settings },
    // Developer-only tabs
    { name: "Clone AI", mobileLabel: "Clone", path: "/admin/clone", icon: Wand2, devOnly: true },
    { name: "God Mode", mobileLabel: "God", path: "/admin/super", icon: ShieldAlert, devOnly: true },
  ];

  const isDev = userEmail === "jakeflowers222@gmail.com";
  const navItems = allNavItems.filter(item => !item.devOnly || isDev);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#78c8ff]/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-10 flex flex-col items-center text-center shadow-[0_0_50px_rgba(120,200,255,0.1)]">
          {isSignUp ? (
            <OnboardingWizard 
              onComplete={async () => {
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                   await fetchProfile(data.session.user.id);
                }
                setIsAuthenticated(true);
              }}
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
                  Don't have an account? <button type="button" onClick={() => setIsSignUp(true)} className="text-[#78c8ff] hover:underline font-bold">Subscribe ($97/mo)</button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (installerProfile && installerProfile.subscription_active === false && userEmail !== 'jakeflowers222@gmail.com') {
    // Webhook Falback: If they just returned from Stripe correctly, immediately save them!
    if (window.location.search.includes('success=true')) {
       // Fire off a background update to ensure they are active in DB just in case webhook didn't route
       supabase.from('installer_profiles').update({ subscription_active: true }).eq('user_id', installerProfile.user_id).then(() => fetchProfile(installerProfile.user_id));
       return <div className="min-h-screen bg-black flex items-center justify-center text-white/50">Activating your terminal...</div>;
    }

    return (
      <PaywallGuard 
        userId={installerProfile.user_id} 
        userEmail={userEmail || undefined}
        paymentLink="https://buy.stripe.com/9B63cv2338Od9qPgBN6J201" 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col text-white font-inter">
      {/* Sleek Top Header for Branding and Logout */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/20 bg-[#78c8ff]/10 flex items-center justify-center overflow-hidden shrink-0">
             {installerProfile?.company_name ? (
                <span className="text-[#78c8ff] font-bold text-base md:text-lg">{installerProfile.company_name.charAt(0)}</span>
             ) : (
                <img src="/logo.png" alt="Resin Academics" className="w-full h-full object-cover" />
             )}
          </div>
          <span className="font-space font-bold tracking-widest text-[#78c8ff] uppercase text-xs md:text-sm leading-tight">
            {installerProfile?.company_name || "Resin OS"}
          </span>
        </div>

        <button 
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          className="flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all text-xs font-bold uppercase tracking-wider"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">Lock Terminal</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
}
