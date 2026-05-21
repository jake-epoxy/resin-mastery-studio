import { Lock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface PaywallGuardProps {
  userId: string;
  userEmail?: string;
  paymentLink?: string; // Legacy fallback
}

export default function PaywallGuard({ userId, userEmail }: PaywallGuardProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const startCheckout = async () => {
    if (!agreedToTerms) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: true, userId, email: userEmail })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to initialize secure checkout. Please contact support.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

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
          Your secure business profile has been generated. Activate your free trial to instantly unlock the CRM, Quoting Engine, AI Tools, and Dispatch Hub.
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
              <span className="text-sm border-white/70 text-white">Full CRM & Lead Pipeline</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[#78c8ff] shrink-0 mt-0.5" size={18} />
              <span className="text-sm border-white/70 text-white">AI Flooring Visualizer</span>
            </div>
          </div>
        </div>

        {/* Checkout CTA */}
        <div className="w-full">
            <div 
              className="mb-6 flex items-start gap-4 bg-[#78c8ff]/5 border border-[#78c8ff]/20 p-5 rounded-2xl cursor-pointer hover:bg-[#78c8ff]/10 transition-colors" 
              onClick={() => setAgreedToTerms(!agreedToTerms)}
            >
               <div className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors border ${agreedToTerms ? 'bg-[#78c8ff] border-[#78c8ff] shadow-[0_0_15px_rgba(120,200,255,0.4)]' : 'border-white/20'}`}>
                 {agreedToTerms && <CheckCircle2 size={16} className="text-black" />}
               </div>
               <p className="text-sm text-white/80 text-left leading-relaxed">
                 I understand my free trial has concluded. By proceeding, I agree to activate my Resin OS Pro subscription for $19.99/month. I can easily cancel anytime from my dashboard.
               </p>
            </div>

            <button 
              disabled={!agreedToTerms || isProcessing}
              className={`w-full relative group overflow-hidden bg-white text-black font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg ${agreedToTerms ? 'shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(120,200,255,0.3)]' : 'opacity-40 cursor-not-allowed bg-zinc-300'}`}
              onClick={startCheckout}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 -translate-x-full" />
              {isProcessing ? "Connecting to Stripe..." : (
                 <>Activate Subscription <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
            
            <div className="flex flex-col items-center justify-center gap-2 mt-6 text-xs text-white/40 font-mono text-center">
              <span className="text-emerald-400 font-bold">$19.99 due today.</span>
              <span className="mt-1">Securely billed monthly. Cancel anytime via dashboard.</span>
              <div className="flex items-center gap-2 mt-3 text-white/30">
                <ShieldCheck size={14} className="text-emerald-500/50" /> Secured natively by Stripe
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}
