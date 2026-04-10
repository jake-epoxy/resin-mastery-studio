import { ArrowRight, Calculator, CheckCircle2 } from "lucide-react";

export default function QuoteGeneratorDemo() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#050505] animate-scroll-reveal border-y border-white/5">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#78c8ff]/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Text Block */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#78c8ff]/10 border border-[#78c8ff]/20 text-[#78c8ff] text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(120,200,255,0.15)]">
               <Calculator size={14} /> Fully Automated
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-space font-bold tracking-tight text-white mb-6">
              The <span className="text-[#78c8ff]">Ultimate</span><br /> Quoting Engine
            </h2>
            
            <p className="text-lg text-zinc-400 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Stop guessing. Access the exact proprietary software we use to generate highly accurate, binding legal quotes in 10 seconds flat. Fully automated interactive PDFs dynamically branded for your business.
            </p>

            <div className="space-y-4 mb-10 text-left max-w-md mx-auto lg:mx-0">
              {[
                "Instant Auto-Calculation for Flake & Metallic",
                "Built-in Profit Margins & Sales Tax",
                "Stripe Connect Deposit Integration",
                "Dynamically Generates Legal PDF Contracts"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#78c8ff] shrink-0" size={20} />
                  <span className="text-zinc-300 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => window.location.href = '/admin'}
              className="inline-flex items-center gap-3 px-8 py-5 bg-white hover:bg-gray-200 text-black font-bold rounded-2xl transition-all transform hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] text-lg"
            >
              Access The Dashboard <ArrowRight size={20} />
            </button>
          </div>

          {/* Right Visual Block - Dashboard Mockup */}
          <div className="flex-1 w-full max-w-2xl">
            <div className="relative rounded-2xl bg-[#111] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden cursor-pointer group" onClick={() => window.location.href = '/admin'}>
              
              {/* Fake Mac Header */}
              <div className="bg-[#1a1a1a] border-b border-white/5 py-3 px-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <div className="mx-auto bg-black/50 px-24 py-1 rounded-md text-xs text-white/30 font-mono tracking-wider">resinacademics.com/admin</div>
              </div>
              
              {/* Fake UI Content */}
              <div className="p-8 aspect-video flex flex-col justify-center items-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-[#78c8ff]/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                 
                 <div className="w-24 h-24 mb-6 rounded-full bg-[#78c8ff]/20 border border-[#78c8ff]/40 flex items-center justify-center shadow-[0_0_30px_rgba(120,200,255,0.3)] animate-pulse">
                    <Calculator className="text-[#78c8ff]" size={40} />
                 </div>
                 <h3 className="text-2xl font-space font-bold text-white mb-2 relative z-10 group-hover:scale-110 transition-transform duration-500">Run The Calculator</h3>
                 <p className="text-zinc-500 text-sm relative z-10">Click to enter the secure portal.</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
