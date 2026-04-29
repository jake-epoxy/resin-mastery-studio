import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

const CTASection = () => {
  const ref = useScrollReveal();

  return (
    <section id="pricing" className="py-32 px-6 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <h2 className="text-4xl md:text-6xl font-bold font-display text-primary text-glow-strong leading-tight mb-4 animate-scroll-reveal">
          Built for Winners.
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-16 animate-scroll-reveal" style={{ transitionDelay: "0.1s" }}>
          Stop losing bids to inferior contractors just because they have a nicer PDF template. Unlock the ultimate operating system for your epoxy business.
        </p>

        <div className="max-w-2xl mx-auto animate-scroll-reveal" style={{ transitionDelay: "0.2s" }}>
          <div className="p-8 md:p-12 rounded-2xl border border-[#78c8ff]/30 bg-[#111]/80 backdrop-blur-md relative overflow-hidden shadow-[0_0_50px_rgba(120,200,255,0.1)]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#78c8ff] to-transparent" />
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-8 border-b border-white/10 gap-6">
               <div className="text-left w-full">
                 <h3 className="text-3xl font-display font-bold text-white mb-2">Resin OS <span className="text-[#78c8ff]">Pro</span></h3>
                 <p className="text-white/60">Everything you need to scale your high-ticket coating business.</p>
               </div>
               <div className="text-center md:text-right shrink-0">
                 <div className="text-4xl font-bold text-white mb-1">$39<span className="text-xl text-white/50 font-normal">/mo</span></div>
                 <p className="text-[#78c8ff] text-sm font-bold tracking-widest uppercase">After 7-Day Free Trial</p>
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-10 text-left">
              {[
                "Interactive Smart Quotes",
                "Built-in Client CRM",
                "Automated Read-Receipts",
                "AI Room Visualizer Integration",
                "Install Tracking & Calendar",
                "Cancel Anytime Guarantee"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#78c8ff] shrink-0" size={20} />
                  <span className="text-white/80">{feature}</span>
                </div>
              ))}
            </div>

            <Link
              to="/admin"
              className="w-full block py-5 bg-[#78c8ff] text-black font-display font-bold text-lg rounded-xl hover:bg-white transition-all transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(120,200,255,0.4)]"
            >
              Start Your 7-Day Free Trial
            </Link>
            <p className="mt-4 text-xs tracking-wider uppercase text-white/40 font-bold">No Credit Card Required to Start</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
