import { useState } from "react";
import { supabase } from "../lib/supabase";
import { User, Building, Calculator, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

interface OnboardingWizardProps {
  onComplete: () => void;
  onSwitchToLogin: () => void;
}

export default function OnboardingWizard({ onComplete, onSwitchToLogin }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  
  const [flakePrice, setFlakePrice] = useState("6.50");
  const [metallicPrice, setMetallicPrice] = useState("8.50");

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user. Please try again.");

      // 2. Insert into installer_profiles
      const { error: profileError } = await supabase.from('installer_profiles').insert({
        user_id: authData.user.id,
        full_name: fullName,
        company_name: companyName,
        company_phone: companyPhone,
        base_flake_price: parseFloat(flakePrice),
        base_metallic_price: parseFloat(metallicPrice)
      });

      if (profileError) {
        console.error("Profile Error: ", profileError);
        throw new Error("Account created, but failed to save business profile. Please contact support.");
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8 px-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= i ? 'bg-[#78c8ff] text-black shadow-[0_0_15px_rgba(120,200,255,0.4)]' : 'bg-white/5 text-white/30 border border-white/10'}`}>
              {step > i ? <CheckCircle2 size={16} /> : i}
            </div>
            {i < 3 && (
              <div className={`w-12 h-px mx-2 transition-colors ${step > i ? 'bg-[#78c8ff]/50' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* STEP 1: ACCOUNT */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <User className="text-[#78c8ff]" size={24} /> Create Account
            </h2>
            <p className="text-zinc-500 text-sm">Secure your dashboard credentials</p>
          </div>
          
          <input
            type="text"
            placeholder="Full Name (e.g. John Smith)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#78c8ff] transition-colors"
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#78c8ff] transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Secure Password (minimum 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#78c8ff] transition-colors"
            required
            minLength={6}
          />
          
          <button 
            onClick={handleNext}
            disabled={!fullName || !email || password.length < 6}
            className="w-full mt-4 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Continue <ArrowRight size={18} />
          </button>
          
          <p className="text-center text-sm text-zinc-500 mt-4">
             Already have an account? <button type="button" onClick={onSwitchToLogin} className="text-[#78c8ff] hover:underline">Log in</button>
          </p>
        </div>
      )}

      {/* STEP 2: BUSINESS */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <Building className="text-[#78c8ff]" size={24} /> Business Profile
            </h2>
            <p className="text-zinc-500 text-sm">This instantly rebrands the entire platform.</p>
          </div>
          
          <div>
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider ml-2 mb-2 block">Company Name</label>
              <input
                type="text"
                placeholder="e.g. Texas Resin Solutions"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#78c8ff] transition-colors shadow-inner"
                required
              />
          </div>
          <div className="mt-4">
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider ml-2 mb-2 block">Business Phone</label>
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#78c8ff] transition-colors shadow-inner"
                required
              />
              <p className="text-xs text-zinc-600 ml-2 mt-2">Required for the auto-generated PDF quotes.</p>
          </div>
          
          <div className="flex gap-3 mt-8">
            <button 
              onClick={handleBack}
              className="w-1/3 bg-transparent border border-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/5 transition-colors"
            >
              Back
            </button>
            <button 
              onClick={handleNext}
              disabled={!companyName || !companyPhone}
              className="w-2/3 bg-[#78c8ff] text-black font-bold py-4 rounded-xl hover:bg-white transition-colors shadow-[0_0_20px_rgba(120,200,255,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: QUOTING */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <Calculator className="text-[#78c8ff]" size={24} /> Quoting Magic
            </h2>
            <p className="text-zinc-500 text-sm">Set your base prices to calibrate the Quoting Engine.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider ml-1 mb-2 block">Flake per SqFt</label>
                  <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={flakePrice}
                        onChange={(e) => setFlakePrice(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl pl-8 pr-4 py-4 text-white focus:outline-none focus:border-green-500 transition-colors shadow-inner"
                        required
                      />
                  </div>
              </div>
              <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider ml-1 mb-2 block">Metallic per SqFt</label>
                  <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={metallicPrice}
                        onChange={(e) => setMetallicPrice(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl pl-8 pr-4 py-4 text-white focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
                        required
                      />
                  </div>
              </div>
          </div>
          
          <div className="bg-[#78c8ff]/5 border border-[#78c8ff]/20 p-4 rounded-xl mt-6">
              <p className="text-xs text-[#78c8ff] leading-relaxed">
                  <strong>Zero-Friction Guarantee:</strong> By providing these two numbers, your Quote Generator is perfectly calibrated. You can generate your first $10k quote the second you log in.
              </p>
          </div>
          
          <div className="flex gap-3 mt-8">
            <button 
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-1/3 bg-transparent border border-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button 
              type="submit"
              disabled={loading || !flakePrice || !metallicPrice}
              className="w-2/3 relative group overflow-hidden bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 -translate-x-full" />
              {loading ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={18} /> Building Dashboard...</span>
              ) : (
                  "Create Digital Profile"
              )}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
