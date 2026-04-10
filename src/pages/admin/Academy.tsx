import { MessageSquare, Phone, Sparkles, BookOpen, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Academy() {
  const QUO_NUMBER = "9158000038";

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <header className="mb-10">
        <h1 className="text-3xl font-space font-bold text-white tracking-tight mb-2">Resin OS Support & AI Command</h1>
        <p className="text-white/60">Your 24/7 lifeline. Consult Sona AI or escalate directly to the Expert Network.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Sona AI Core */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050505] border border-[#a78bfa]/30 rounded-3xl overflow-hidden shadow-2xl relative p-10 flex flex-col items-center text-center w-full min-h-[400px] justify-center"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#a78bfa]/10 rounded-full blur-3xl rounded-none pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#78c8ff]/10 rounded-full blur-3xl rounded-none pointer-events-none"></div>
            
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#a78bfa] to-[#78c8ff] flex items-center justify-center shadow-[0_0_50px_rgba(167,139,250,0.3)] mb-6 relative z-10">
              <Sparkles className="text-white" size={40} />
            </div>
            
            <h2 className="text-4xl font-space font-bold text-white mb-4 relative z-10">Expert SOS Hotline.</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto leading-relaxed relative z-10">
              When you're in the middle of a floor and things go wrong, you don't have time to search a manual. Text our automated emergency response line directly from the job site for instant troubleshooting. If our system can't solve it, a real industry pro will step into the text thread.
            </p>

            <a 
              href={`sms:${QUO_NUMBER}`}
              className="bg-white hover:bg-gray-200 text-black font-bold py-5 px-10 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)] text-lg relative z-10"
            >
              <MessageSquare size={22} /> Text the Support Network <ArrowRight size={20}/>
            </a>
            
            <p className="text-xs text-white/40 uppercase tracking-widest mt-6 font-bold flex items-center gap-2 relative z-10">
              <Phone size={14}/> Save to Contacts: (915) 800-0038
            </p>
          </motion.div>
        </div>

        {/* Right Column: Emergency Escalation & Resources */}
        <div className="space-y-6">
          
          {/* EMERGENCY HOTLINE */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent pointer-events-none"></div>
            
            <AlertTriangle className="text-red-400 mb-4" size={32} />
            <h3 className="text-xl font-space font-bold text-white mb-2">Emergency?</h3>
            <p className="text-sm text-red-100/70 mb-6 leading-relaxed">If Sona can't answer your question and you're in the middle of a job, escalate immediately to Jake and the Pro Network.</p>
            
            <a 
              href={`sms:${QUO_NUMBER}`}
              className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-2xl"
            >
              <MessageSquare size={18} /> Text Emergency Hotline
            </a>
            
            <p className="text-[10px] text-red-400/50 uppercase tracking-widest text-center mt-4 mb-2 font-bold flex flex-col items-center gap-2">
              <Phone size={14}/> Routing: (915) 800-0038
            </p>
          </motion.div>

          {/* Resources */}
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
             <h3 className="text-sm uppercase tracking-widest font-bold text-white/50 mb-6 flex items-center gap-2"><BookOpen size={16}/> Knowledge Base</h3>
             
             <div className="space-y-3">
               {[
                 { title: "Standard Preparation Guidelines", type: "PDF" },
                 { title: "Epoxy Troubleshooting Matrix", type: "Wiki" },
                 { title: "Sales & Quoting Script", type: "Doc" },
               ].map((resource, i) => (
                 <div onClick={() => alert("This document is currently being uploaded to the Knowledge Base. Check back soon!")} key={i} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-colors rounded-xl p-4 flex justify-between items-center cursor-pointer">
                    <p className="text-sm text-white font-bold">{resource.title}</p>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-white/50">{resource.type}</span>
                 </div>
               ))}
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
