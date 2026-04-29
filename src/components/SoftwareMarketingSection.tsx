import { motion } from "framer-motion";
import { Terminal, Shield, Zap, CheckCircle2, TrendingUp, Smartphone, ArrowRight } from "lucide-react";
import { GlowingEffect } from "./ui/glowing-effect";

export default function SoftwareMarketingSection() {
  return (
    <section className="py-32 relative bg-[#050505] overflow-hidden" id="software">
      {/* Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#78c8ff]/30 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#78c8ff]/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-20 animate-scroll-reveal">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#78c8ff]/10 border border-[#78c8ff]/20 text-[#78c8ff] text-sm font-bold tracking-wide mb-6">
            <Terminal size={14} /> NEW RELEASE
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-white mb-6">
            Everything you need in <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#78c8ff] to-white filter drop-shadow-[0_0_10px_rgba(120,200,255,0.4)]">
              One Subscription
            </span>
          </h2>
          <p className="text-lg text-white/60 leading-relaxed max-w-2xl mx-auto font-light">
            Subscribe to the Resin Academics Platform to unlock 40+ hours of self-paced video training AND get the exact CRM software you need to quote, sell, and manage jobs.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 px-4 sm:px-0">
          {[
            {
              icon: <Zap className="w-6 h-6 text-[#78c8ff]" />,
              title: "Instant Quoting",
              desc: "Stop doing math in your truck. Generate professional PDF quotes in 30 seconds."
            },
            {
              icon: <TrendingUp className="w-6 h-6 text-[#78c8ff]" />,
              title: "Pipeline Dashboard",
              desc: "Track every lead, active job, and payment collected in one beautiful command center."
            },
            {
              icon: <Terminal className="w-6 h-6 text-[#78c8ff]" />,
              title: "The Learning Vault",
              desc: "Immediate access to our comprehensive self-paced video curriculum."
            },
            {
              icon: <Shield className="w-6 h-6 text-[#78c8ff]" />,
              title: "Secure Payments",
              desc: "Collect $5,000 deposits via Stripe before you even show up to the job site."
            },
            {
              icon: <CheckCircle2 className="w-6 h-6 text-[#78c8ff]" />,
              title: "Auto-CYA Legal Terms",
              desc: "Every quote comes permanently attached with our bulletproof epoxy legal contract."
            },
            {
              icon: <Smartphone className="w-6 h-6 text-[#78c8ff]" />,
              title: "Mobile Optimized",
              desc: "Close deals and track your crew directly from your phone while on the job site."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group rounded-2xl p-[1px]"
            >
              <GlowingEffect spread={40} glow={true} proximity={64} inactiveZone={0.01} borderWidth={1} />
              <div className="relative h-full bg-[#0c0c18] border border-white/5 rounded-[15px] p-8 z-10">
                <div className="bg-[#78c8ff]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-[#78c8ff]/20">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center animate-scroll-reveal">
          <div className="inline-block relative p-[2px] rounded-2xl group cursor-pointer" onClick={() => window.location.href = '/admin'}>
            <div className="absolute inset-0 bg-gradient-to-r from-[#78c8ff] to-white rounded-2xl opacity-50 group-hover:opacity-100 blur transition-opacity duration-500" />
            <div className="relative bg-[#050505] px-10 py-5 rounded-[14px] flex items-center gap-4 transition-transform hover:scale-[1.02]">
              <div className="text-left">
                <h4 className="text-white font-bold text-xl">Subscribe to Resin Academics</h4>
                <p className="text-[#78c8ff] text-sm mt-1 font-mono uppercase tracking-widest">$39/month. Cancel Anytime.</p>
              </div>
              <div className="w-12 h-12 bg-[#78c8ff] rounded-xl flex items-center justify-center shrink-0 ml-4">
                <ArrowRight className="w-6 h-6 text-black" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
