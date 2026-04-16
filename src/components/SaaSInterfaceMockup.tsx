import { motion } from "framer-motion";
import { Users, FileText, CheckCircle, Plus, Wand2, Sparkles, Download, Check } from "lucide-react";

export default function SaaSInterfaceMockup() {
  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#ffffff]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-scroll-reveal">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Look Inside <span className="text-[#ffffff]">Resin OS</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Stop running your business on legal pads. Experience the most advanced epoxy contractor software ever built.
          </p>
        </div>

        {/* The MacOS Window Frame */}
        <div className="max-w-5xl mx-auto bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-[0_20px_60px_-10px_rgba(255, 255, 255,0.15)] overflow-hidden animate-scroll-reveal" style={{ transitionDelay: '0.1s' }}>
          
          {/* Mac Header */}
          <div className="bg-[#111] px-4 py-3 flex items-center border-b border-white/5">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
            </div>
            <div className="mx-auto bg-black/40 px-6 py-1 rounded-md text-[10px] text-white/30 font-mono tracking-widest border border-white/5">
              admin.resinacademics.com
            </div>
          </div>

          {/* CRM Mockup Content */}
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-end mb-8">
               <div>
                  <h3 className="text-2xl font-bold text-white font-space mb-1">Command Center</h3>
                  <p className="text-white/40 text-sm">Pipeline & Active Projects</p>
               </div>
               <div className="hidden md:flex bg-[#ffffff] text-black px-4 py-2 rounded-xl text-sm font-bold items-center gap-2">
                  <Plus size={16} /> Add Lead
               </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
               {[
                 { label: "New Leads", val: "14", icon: Users, color: "text-white/80" },
                 { label: "Active Quotes", val: "7", icon: FileText, color: "text-purple-400" },
                 { label: "Jobs Won", val: "3", icon: CheckCircle, color: "text-red-400" },
               ].map((stat, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                   <div className="flex justify-between items-start mb-2">
                      <span className="text-white/40 text-xs font-bold uppercase">{stat.label}</span>
                      <stat.icon size={16} className={stat.color} />
                   </div>
                   <span className="text-2xl font-space font-bold text-white">{stat.val}</span>
                 </div>
               ))}
            </div>

            {/* Pipeline Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Column 1 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                   <h4 className="text-xs font-bold text-[#ffffff] uppercase tracking-wider mb-4 border-b border-white/10 pb-2">New Leads</h4>
                   <div className="bg-[#111] p-3 rounded-lg border border-white/10 mb-3">
                      <p className="text-white font-bold text-sm">Miller Garage</p>
                      <p className="text-white/40 text-xs mb-2">2-Car Flake System</p>
                      <span className="bg-white/10 text-white/50 text-[10px] px-2 py-1 rounded">Just Now</span>
                   </div>
                   <div className="bg-[#111] p-3 rounded-lg border border-white/10">
                      <p className="text-white font-bold text-sm">Downtown Office</p>
                      <p className="text-white/40 text-xs mb-2">Metallic Marble 1200sqft</p>
                      <span className="bg-white/10 text-white/50 text-[10px] px-2 py-1 rounded">2 Hrs Ago</span>
                   </div>
                </div>

                {/* Column 2 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                   <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Quoted</h4>
                   <div className="bg-[#111] p-3 rounded-lg border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                      <div className="flex justify-between mb-1">
                         <p className="text-white font-bold text-sm">Smith Patio</p>
                         <p className="text-white font-space font-bold text-sm">$4,250</p>
                      </div>
                      <p className="text-white/40 text-xs mb-2">Quartz Broadcast</p>
                      <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-1 rounded">Sent Yesterday</span>
                   </div>
                </div>

                {/* Column 3 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 opacity-70">
                   <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Won</h4>
                   <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/20 mb-3">
                      <div className="flex justify-between mb-1">
                         <p className="text-white font-bold text-sm">Auto Shop</p>
                         <p className="text-white font-space font-bold text-sm">$12,000</p>
                      </div>
                      <p className="text-white/40 text-xs mb-2">Solid Color Epoxy</p>
                      <span className="text-red-400 text-[10px] uppercase font-bold flex items-center gap-1"><Check size={10}/> Deposit Paid</span>
                   </div>
                </div>

            </div>

            {/* Visualizer Popout Overlay Mockup */}
            <div className="mt-8 relative border border-red-500/30 rounded-xl p-6 pt-14 md:pt-6 md:p-6 bg-gradient-to-r from-red-950/40 to-black overflow-hidden flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
                <div className="absolute top-0 right-0 p-3 md:p-4">
                   <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border border-red-500/30 flex items-center gap-1.5 whitespace-nowrap">
                     <Sparkles size={12}/> AI Engine Inside
                   </span>
                </div>
                
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center shrink-0">
                  <Wand2 size={32} />
                </div>
                
                <div className="flex-1">
                   <h4 className="text-xl font-bold text-white mb-2 leading-tight">Integrated Aesthetic Visualizer</h4>
                   <p className="text-white/50 text-sm max-w-lg mb-4 mx-auto md:mx-0">
                     Instantly generate photorealistic previews of any floor coating right inside the dashboard, then attach it directly to your quotes.
                   </p>
                   <div className="flex flex-wrap justify-center md:justify-start gap-2">
                     <div className="px-3 py-1.5 min-h-[32px] bg-white/10 rounded flex items-center justify-center text-white/30 text-xs">Original.jpg</div>
                     <div className="px-3 py-1.5 min-h-[32px] bg-red-500/20 text-red-300 rounded flex items-center justify-center text-xs font-bold border border-red-500/30 whitespace-nowrap">&rarr; Generating Metallic Look...</div>
                   </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
