import { MessageSquare, Phone, Sparkles, BookOpen, AlertTriangle, ArrowRight, Download, FileText, Check, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { logLeadToSheets } from "@/lib/logLead";

export default function Academy() {
  const QUO_NUMBER = "9158000038";
  const [kitOpen, setKitOpen] = useState(false);
  const [kitName, setKitName] = useState("");
  const [kitEmail, setKitEmail] = useState("");
  const [kitPhone, setKitPhone] = useState("");
  const [kitSubmitting, setKitSubmitting] = useState(false);
  const [kitSuccess, setKitSuccess] = useState(false);

  const handleKitDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setKitSubmitting(true);

    // Save lead locally
    const newLead = { name: kitName, email: kitEmail, phone: kitPhone, date: new Date().toISOString() };
    const savedLeads = JSON.parse(localStorage.getItem("starterKitLeads") || "[]");
    localStorage.setItem("starterKitLeads", JSON.stringify([...savedLeads, newLead]));

    // Log to Google Sheets
    logLeadToSheets({ name: kitName, email: kitEmail, phone: kitPhone, source: "Starter Kit Download (Dashboard)" });

    try {
      await fetch("https://formsubmit.co/ajax/PourMastersLLC@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `📚 New Starter Kit Download | ${kitName}`,
          "Customer Name": kitName,
          Email: kitEmail,
          Phone: kitPhone,
          Source: "Starter Kit Download — Dashboard",
          _template: "table",
        }),
      });
    } catch (error) {
      console.error("Failed to send email notification", error);
    } finally {
      setKitSubmitting(false);

      const downloadUrl = "/Epoxy_Flooring_Starter_Kit_2025.html";
      const ua = navigator.userAgent || "";
      const isInAppBrowser = /FBAN|FBAV|Instagram|Line|Twitter|TikTok|Snapchat|Pinterest/i.test(ua);

      if (isInAppBrowser) {
        window.open(downloadUrl, "_system");
        setTimeout(() => { window.location.href = downloadUrl; }, 300);
      } else {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "Epoxy_Flooring_Starter_Kit_2025.html";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setKitSuccess(true);
    }
  };

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

          {/* ─── STARTER KIT CARD ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#050505] border border-[#78c8ff]/20 rounded-3xl overflow-hidden shadow-2xl relative"
          >
            {/* Ambient glow */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-[#78c8ff]/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-[#a78bfa]/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 md:p-10">
              
              {/* PDF Visual */}
              <div className="shrink-0 relative">
                <div className="w-44 aspect-[3/4] rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
                  style={{ transform: "rotateY(-5deg) rotateX(5deg)" }}
                >
                  <div className="p-5 flex-1">
                    <div className="w-9 h-9 bg-[#78c8ff]/20 rounded-lg flex items-center justify-center mb-3 border border-[#78c8ff]/30 text-[#78c8ff]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white leading-tight mb-1">The Epoxy Business Starter Kit</h4>
                    <p className="text-[10px] text-[#78c8ff]/70 font-medium">By Jake Epoxy</p>
                    <div className="mt-4 space-y-2 opacity-40">
                      <div className="h-1.5 w-3/4 bg-white/20 rounded-full" />
                      <div className="h-1.5 w-full bg-white/10 rounded-full" />
                      <div className="h-1.5 w-5/6 bg-white/10 rounded-full" />
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-black/40 border-t border-white/10 grid grid-cols-3 gap-1 mt-auto">
                    <div className="text-center">
                      <p className="text-xs font-bold text-white">40K+</p>
                      <p className="text-[7px] text-zinc-500 uppercase tracking-widest">Followers</p>
                    </div>
                    <div className="text-center border-l border-r border-white/10">
                      <p className="text-xs font-bold text-white">25M+</p>
                      <p className="text-[7px] text-zinc-500 uppercase tracking-widest">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-white">5</p>
                      <p className="text-[7px] text-zinc-500 uppercase tracking-widest">Yrs Exp</p>
                    </div>
                  </div>
                </div>
                {/* Backglow */}
                <div className="absolute top-4 -bottom-2 -left-2 -right-2 bg-[#78c8ff]/15 rounded-xl blur-2xl -z-10 pointer-events-none" />
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#78c8ff]/10 border border-[#78c8ff]/20 text-[#78c8ff] text-xs font-bold uppercase tracking-widest mb-4">
                  <Download className="w-3.5 h-3.5" />
                  Free Download
                </div>
                <h3 className="text-2xl md:text-3xl font-space font-bold text-white mb-3 leading-tight">
                  The Epoxy Business<br />Starter Kit
                </h3>
                <p className="text-white/50 text-sm leading-relaxed mb-5">
                  Everything you need to know before your first pour — from the exact tools to buy, real pricing numbers, and how to land your first client with no portfolio.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-left">
                  {[
                    "How I started with $0 and a girlfriend's desk",
                    "The exact tools you need (under $350)",
                    "What every service pays — real numbers",
                    "5 mistakes that will ruin your first job",
                    "How to get your first client with no portfolio",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-white/60">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-[#78c8ff]/15 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-[#78c8ff]" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => { setKitSuccess(false); setKitOpen(true); }}
                  className="w-full md:w-auto px-8 py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(255,255,255,0.15)] text-sm"
                >
                  <Download className="w-5 h-5" />
                  Download the Free Starter Kit
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
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

      {/* Starter Kit Download Modal */}
      <Dialog open={kitOpen} onOpenChange={setKitOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 shadow-2xl">
          {kitSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white">Success!</DialogTitle>
              <DialogDescription className="text-lg text-zinc-400">
                Your download should start automatically. If it doesn't, it may open in a new browser window.
              </DialogDescription>
              <button
                onClick={() => setKitOpen(false)}
                className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors w-full"
              >
                Close Window
              </button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">Get the Starter Kit</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Enter your details below to instantly download the PDF.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleKitDownload} className="space-y-4 mt-4 text-left">
                <div className="space-y-2">
                  <label htmlFor="kit-name" className="text-sm font-medium text-zinc-300">Full Name</label>
                  <input
                    id="kit-name"
                    type="text"
                    required
                    value={kitName}
                    onChange={(e) => setKitName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#78c8ff]/50"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="kit-email" className="text-sm font-medium text-zinc-300">Email Address</label>
                  <input
                    id="kit-email"
                    type="email"
                    required
                    value={kitEmail}
                    onChange={(e) => setKitEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#78c8ff]/50"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="kit-phone" className="text-sm font-medium text-zinc-300">Phone Number</label>
                  <input
                    id="kit-phone"
                    type="tel"
                    required
                    value={kitPhone}
                    onChange={(e) => setKitPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#78c8ff]/50"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <button
                  type="submit"
                  disabled={kitSubmitting}
                  className="w-full py-3 mt-4 bg-[#78c8ff] hover:bg-[#78c8ff]/90 text-black font-bold rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {kitSubmitting ? "Sending..." : <>Send My Starter Kit <ChevronRight className="w-4 h-4" /></>}
                </button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
