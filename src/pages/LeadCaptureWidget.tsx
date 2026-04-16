import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Calculator, ArrowRight, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export default function LeadCaptureWidget({ hideGlow = false }: { hideGlow?: boolean }) {
  const { id } = useParams(); // id is the installer_profiles.user_id
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [sqft, setSqft] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      if (id) {
        const { data, error } = await supabase
          .from("installer_profiles")
          .select("*")
          .eq("user_id", id)
          .single();
          
        if (!error && data) {
          setProfile(data);
        }
      } else {
        // Fallback: Default to Jake's profile ID if no ID in URL
        const { data: defaultData, error: defaultError } = await supabase
          .from("installer_profiles")
          .select("*")
          .ilike("company_name", "%Resin%")
          .limit(1)
          .single();
          
        if (!defaultError && defaultData) {
          setProfile(defaultData);
        }
      }
      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSubmitting(true);

    try {
      // Add lead directly to the contractor's CRM pipeline table
      // It looks like his leads table is 'clients' and links via installer_id
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error } = await supabase.from('clients').insert({
        installer_id: profile.user_id,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone,
        address: address,
        status: 'New Lead',
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      console.error("Failed to submit lead:", err.message);
      alert("Failed to submit your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-[#ffffff]" /></div>;
  if (!profile) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Contractor profile not found.</div>;

  if (success) {
      return (
          <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
               <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                   <CheckCircle2 size={40} className="text-emerald-500" />
               </div>
               <h1 className="text-3xl font-bold text-white mb-4 text-center">Quote Request Sent!</h1>
               <p className="text-zinc-400 text-center max-w-md">
                   {profile.company_name} will review your details and be in touch shortly with an estimate.
               </p>
          </div>
      )
  }

  return (
    <div className={`flex items-center justify-center px-4 py-10 relative overflow-hidden ${!hideGlow ? 'min-h-screen bg-[#050505]' : 'bg-transparent'}`}>
        {/* Glow */}
        {!hideGlow && <div className="absolute top-0 w-full h-[300px] bg-[#ffffff]/10 blur-[150px] pointer-events-none" />}
        {!hideGlow && <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />}
        
        <div className="w-full max-w-md relative z-10">
            <div className="text-center mb-8">
                <h2 className="text-sm font-bold tracking-widest text-[#ffffff] uppercase mb-2">Request an Estimate</h2>
                <h1 className="text-3xl font-bold text-white mb-2">{profile.company_name}</h1>
                <p className="text-zinc-400 text-sm">Fill out the details below to get a custom epoxy flooring quote.</p>
            </div>

            <div className="relative group rounded-3xl p-[1px] shadow-[0_0_50px_rgba(255, 255, 255,0.05)]">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#ffffff]/20 to-transparent opacity-50 block md:hidden pointer-events-none" />
                <div className="hidden md:block absolute inset-0 pointer-events-none rounded-3xl">
                    <GlowingEffect spread={40} glow={true} proximity={64} inactiveZone={0.01} borderWidth={1} />
                </div>
                
                <form onSubmit={handleSubmit} className="relative bg-[#0a0a0a] rounded-[23px] border border-white/10 p-6 md:p-8 space-y-5 z-10">
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider ml-2 mb-1 block">Your Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffffff] transition-colors"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider ml-2 mb-1 block">Phone</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffffff] transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider ml-2 mb-1 block">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffffff] transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider ml-2 mb-1 block">Job Address</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffffff] transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider ml-2 mb-1 block">Approx Sq. Ft</label>
                            <input
                                type="number"
                                value={sqft}
                                onChange={(e) => setSqft(e.target.value)}
                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffffff] transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isSubmitting || !fullName || !phone || !address || !sqft}
                        className="w-full mt-6 bg-[#ffffff] text-black font-bold py-4 rounded-xl hover:bg-white transition-colors shadow-[0_0_20px_rgba(255, 255, 255,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Generate Custom Quote <ArrowRight size={18} /></>}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 mt-4 opacity-40">
                        <ShieldCheck size={12} className="text-white" />
                        <span className="text-[10px] text-white uppercase tracking-widest font-mono">Powered by Resin OS</span>
                    </div>

                </form>
            </div>
        </div>
    </div>
  );
}
