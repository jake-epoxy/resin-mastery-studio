import { Lock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

interface PaywallGuardProps {
  userId: string;
  paymentLink: string; // The Stripe Payment Link url
}

export default function PaywallGuard({ userId, paymentLink }: PaywallGuardProps) {
  // We append the user's Supabase ID to the Stripe link so the webhook knows EXACTLY who just paid
  const secureCheckoutLink = `${paymentLink}?client_reference_id=${userId}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center p-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#78c8ff]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-10 flex flex-col items-center text-center shadow-[0_0_50px_rgba(120,200,255,0.05)]">
        
        <div className="w-20 h-20 bg-gradient-to-br from-[#78c8ff]/20 to-black border border-[#78c8ff]/30 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(120,200,255,0.2)]">
          <Lock className="text-[#78c8ff]" size={36} />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-space font-bold text-white tracking-tight mb-4">
          Activate Your Terminal
        </h1>
        
        <p className="text-white/60 text-lg mb-10 max-w-lg mx-auto">
          Your secure business profile has been generated. Activate your monthly subscription to instantly unlock the CRM, Quoting Engine, and Video Vault.
        </p>

        {/* Feature Payload */}
        <div className="w-full bg-[#111] border border-white/10 rounded-2xl p-6 mb-10 text-left">
          <h3 className="text-white font-bold mb-4 font-space tracking-wider uppercase text-sm border-b border-white/5 pb-3">
            <span className="text-[#78c8ff]">Included</span> in Access
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[#78c8ff] shrink-0 mt-0.5" size={18} />
              <span className="text-sm border-white/70 text-white">Smart Quoting Engine</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[#78c8ff] shrink-0 mt-0.5" size={18} />
              <span className="text-sm border-white/70 text-white">Interactive PDF Generation</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[#78c8ff] shrink-0 mt-0.5" size={18} />
              <span className="text-sm border-white/70 text-white">Custom Lead Pipeline</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[#78c8ff] shrink-0 mt-0.5" size={18} />
              <span className="text-sm border-white/70 text-white">Mastery Video Vault</span>
            </div>
          </div>
        </div>

        {/* Checkout CTA */}
        <div className="w-full">
            <a 
              href={secureCheckoutLink}
              className="w-full relative group overflow-hidden bg-white text-black font-bold py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(120,200,255,0.3)] flex items-center justify-center gap-3 text-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 -translate-x-full" />
              Subscribe ($99/mo) <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-white/40 font-mono">
              <ShieldCheck size={14} className="text-green-500/70" /> Secured natively by Stripe
            </div>
        </div>

      </div>
    </div>
  );
}
