import { motion } from "framer-motion";
import {
  CheckCircle2,
  Instagram,
  Bot,
  MessageSquare,
  Sparkles,
  Clock,
  Phone,
  Brain,
  ToggleRight,
  Shield,
} from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function CloneAISection() {
  const ref = useScrollReveal();

  return (
    <section className="py-32 px-6 relative overflow-hidden" ref={ref} id="clone-ai">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#78c8ff]/[0.015] to-transparent" />
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-[#78c8ff]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-20 animate-scroll-reveal">
          {/* World's first badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#78c8ff]/10 via-purple-500/10 to-pink-500/10 border border-[#78c8ff]/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#78c8ff] animate-pulse" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#78c8ff] to-purple-400">
              World's First — Only on Resin OS
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-white mb-6 leading-tight">
            AI That Answers{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#78c8ff] via-purple-400 to-pink-400 filter drop-shadow-[0_0_15px_rgba(120,200,255,0.3)]">
              Your DMs For You
            </span>
          </h2>

          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            No other epoxy contractor app has this. Clone AI responds to your Instagram &amp; Facebook
            Messenger DMs instantly — trained on your voice, your pricing, and your services. 
            You focus on pouring floors. Your clone focuses on closing leads.
          </p>
        </div>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Interactive DM mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="animate-scroll-reveal"
          >
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(120,200,255,0.05)]">
              {/* Chat header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                    <Instagram size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-1.5">
                      Instagram DMs
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    </p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Clone AI • Autopilot Active</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">Live</span>
                </div>
              </div>

              {/* Messages */}
              <div className="p-5 space-y-4">
                {/* Customer message */}
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-white/50">M</div>
                  <div>
                    <p className="text-[10px] text-white/30 mb-1 ml-1">Maria G. • 2:47 PM</p>
                    <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3">
                      <p className="text-sm text-white/80">hi! i'm interested in getting my garage floor done. do you do metallic epoxy? what's the cost?</p>
                    </div>
                  </div>
                </div>

                {/* Clone AI response */}
                <div className="flex gap-2.5 max-w-[85%] ml-auto flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-[#78c8ff]/20 flex items-center justify-center shrink-0">
                    <Bot size={13} className="text-[#78c8ff]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#78c8ff]/50 mb-1 mr-1 text-right">Clone AI • Instant reply</p>
                    <div className="bg-[#78c8ff]/10 border border-[#78c8ff]/20 rounded-2xl rounded-tr-md px-4 py-3">
                      <p className="text-sm text-white/80">hey maria! yes we do metallics all the time — it's actually our specialty 🔥 for a standard 2-car garage you're looking at around $8-12/sqft depending on the design. what's the approx size of your garage?</p>
                    </div>
                  </div>
                </div>

                {/* Customer reply */}
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-white/50">M</div>
                  <div>
                    <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3">
                      <p className="text-sm text-white/80">probably around 450 sqft. i want that ocean blue and silver look</p>
                    </div>
                  </div>
                </div>

                {/* Clone AI closing */}
                <div className="flex gap-2.5 max-w-[85%] ml-auto flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-[#78c8ff]/20 flex items-center justify-center shrink-0">
                    <Bot size={13} className="text-[#78c8ff]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#78c8ff]/50 mb-1 mr-1 text-right">Clone AI • Instant reply</p>
                    <div className="bg-[#78c8ff]/10 border border-[#78c8ff]/20 rounded-2xl rounded-tr-md px-4 py-3">
                      <p className="text-sm text-white/80">that's gon be fire 🌊 for 450 sqft in a custom metallic you're looking at $3,600 - $5,400. i can put together a detailed quote for you — what's a good number to reach you at?</p>
                    </div>
                  </div>
                </div>

                {/* Typing indicator */}
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-white/50">M</div>
                  <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="px-5 py-3 border-t border-white/5 bg-[#060606] flex items-center justify-between">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#78c8ff]/10 border border-[#78c8ff]/20">
                  <Bot size={12} className="text-[#78c8ff]" />
                  <span className="text-[10px] font-bold text-[#78c8ff] uppercase tracking-wider">Clone AI responding</span>
                </div>
                <span className="text-[10px] text-white/25">Lead captured while you pour 💪</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Features + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="animate-scroll-reveal"
            style={{ transitionDelay: "0.15s" }}
          >
            <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
              Your business never sleeps.
            </h3>
            <p className="text-white/50 leading-relaxed mb-8">
              While you're grinding, pouring, or sleeping — your Clone AI is answering every DM, 
              qualifying every lead, and capturing phone numbers. Trained to sound exactly like you.
            </p>

            {/* Feature list */}
            <div className="space-y-4 mb-10">
              {[
                {
                  icon: MessageSquare,
                  title: "Instagram & Messenger DMs on Autopilot",
                  desc: "Every incoming message gets an instant, intelligent response. No more missed leads at 11pm.",
                },
                {
                  icon: Brain,
                  title: "Trained on YOUR Voice & Pricing",
                  desc: "Not a generic chatbot — it knows your services, your prices, and talks like you talk.",
                },
                {
                  icon: Phone,
                  title: "Captures Leads Automatically",
                  desc: "Qualifies inquiries, gives pricing ranges, and asks for their phone number — just like you would.",
                },
                {
                  icon: ToggleRight,
                  title: "Full Control — Autopilot On/Off",
                  desc: "Watch every conversation live. Step in manually anytime. You're always in the driver's seat.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#78c8ff]/10 border border-[#78c8ff]/15 flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-[#78c8ff]" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm mb-1">{item.title}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Meta Approval Status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="p-5 rounded-xl bg-gradient-to-r from-[#78c8ff]/5 to-purple-500/5 border border-[#78c8ff]/15 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#78c8ff]/40 to-transparent" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                    Awaiting Meta Approval
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                      Coming Soon
                    </span>
                  </p>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Clone AI is built, tested, and ready to deploy. We're currently in the Meta app review process
                    for Instagram & Messenger API access. Once approved, this feature goes live for all Resin OS subscribers — free.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
