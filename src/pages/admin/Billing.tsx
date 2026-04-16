import { useState, useEffect } from "react";
import { Check, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Billing() {
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("https://buy.stripe.com/7sY4gzcHH4xX0Uj71d6J202");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCheckoutUrl(`https://buy.stripe.com/7sY4gzcHH4xX0Uj71d6J202?client_reference_id=${user.id}`);
      }
    });
  }, []);

  return (
    <div className="p-8 pb-20 max-w-4xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-space font-bold text-white tracking-tight mb-4">Upgrade to Resin OS Pro</h1>
        <p className="text-white/60">Unlock full access to the AI Visualizer, unlimited quotes, and automated lead capture.</p>
      </header>

      <div className="bg-[#111] border border-[#ffffff]/30 rounded-3xl p-8 max-w-lg mx-auto shadow-[0_0_50px_rgba(255, 255, 255,0.1)] relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ffffff] text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
          <Zap size={14} /> Recommended
        </div>

        <div className="text-center mb-8">
          <div className="text-5xl font-space font-bold text-white mb-2">$97<span className="text-xl text-white/50 font-normal">/mo</span></div>
          <p className="text-white/50 text-emerald-400 font-bold mb-1">Includes 7-Day Free Trial</p>
          <p className="text-white/40 text-sm">Cancel anytime. No hidden fees.</p>
        </div>

        <div className="space-y-4 mb-8">
          {[
            "15 AI Floor Visualizations per day",
            "Unlimited Quote Generation",
            "Unlimited Client CRM Storage",
            "Custom Embeddable Lead Form",
            "Dedicated Support"
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-1 rounded-full text-emerald-400">
                <Check size={16} />
              </div>
              <p className="text-white font-bold">{feature}</p>
            </div>
          ))}
        </div>

        <a 
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-[#ffffff] text-black hover:bg-white font-bold py-4 rounded-xl transition-colors"
        >
          Subscribe Now
        </a>

        <div className="mt-4 flex items-center justify-center gap-2 text-white/40 text-sm">
          <ShieldCheck size={16} />
          Secure checkout by Stripe
        </div>
      </div>
    </div>
  );
}
