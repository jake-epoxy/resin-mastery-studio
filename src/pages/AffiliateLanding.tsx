import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Zap,
  TrendingUp,
  Terminal,
  Shield,
  Smartphone,
  Star,
  Instagram,
  ExternalLink,
  Sparkles,
  BadgeCheck,
} from "lucide-react";

// ============================================================
// AFFILIATE REGISTRY
// Add new affiliates here. Each entry powers a unique /ref/:slug page.
// ============================================================
interface AffiliateConfig {
  slug: string;
  name: string;
  realName: string;
  tagline: string;
  endorsement: string;
  heroImage: string;       // main photo — used in hero
  workImage: string;       // secondary photo — work showcase
  instagram: string;       // full handle with @
  instagramUrl: string;
  accentColor: string;     // unique color to differentiate from main brand
  accentGlow: string;      // glow version
}

const AFFILIATES: Record<string, AffiliateConfig> = {
  "doctor-epoxy": {
    slug: "doctor-epoxy",
    name: "Doctor Epoxy",
    realName: "Eyan",
    tagline: "The Doctor prescribes Resin OS.",
    endorsement:
      "I've been in this game for years — and finding a tool that actually helps you close more jobs and stay organized? That's rare. Resin OS is that tool. If you're serious about running a real epoxy business and not just winging it, you need this in your arsenal. Period.",
    heroImage: "/doctor-epoxy-metallic.jpg",
    workImage: "/doctor-epoxy-commercial.png",
    instagram: "@doctor.epoxy",
    instagramUrl: "https://instagram.com/doctor.epoxy",
    accentColor: "#4ade80",
    accentGlow: "rgba(74, 222, 128, 0.15)",
  },
};

// ============================================================
// FEATURES LIST (shared across all affiliate pages)
// ============================================================
const FEATURES = [
  {
    icon: Zap,
    title: "Instant Smart Quotes",
    desc: "Generate professional PDF quotes in 30 seconds. No more scribbling numbers on napkins.",
  },
  {
    icon: TrendingUp,
    title: "Pipeline Dashboard",
    desc: "Track every lead, job, and dollar collected in one sleek command center.",
  },
  {
    icon: Terminal,
    title: "40+ Hours of Training",
    desc: "Full access to the Resin Academics video vault — learn every system from flake to metallic.",
  },
  {
    icon: Shield,
    title: "Collect Payments Online",
    desc: "Accept deposits and final payments via Stripe. Get paid before you show up.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    desc: "Close deals and manage your crew from the job site. Built for the field.",
  },
  {
    icon: BadgeCheck,
    title: "Auto-CYA Legal Terms",
    desc: "Every quote ships with a bulletproof epoxy contract. Protect your business automatically.",
  },
];

export default function AffiliateLanding() {
  const { affiliateSlug } = useParams<{ affiliateSlug: string }>();
  const navigate = useNavigate();

  const affiliate = AFFILIATES[affiliateSlug || ""];

  // Unknown affiliate → redirect home
  if (!affiliate) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Affiliate Not Found</h1>
          <p className="text-white/60 mb-8">This referral link doesn't exist.</p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const handleCTA = () => {
    // Store referral in localStorage so the OnboardingWizard picks it up
    localStorage.setItem("resin_ref", affiliate.slug);
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* ============================================= */}
      {/* HERO SECTION                                  */}
      {/* ============================================= */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full blur-[180px] pointer-events-none opacity-30"
          style={{ background: `radial-gradient(circle, ${affiliate.accentGlow}, transparent 70%)` }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#78c8ff]/5 rounded-full blur-[150px] pointer-events-none" />

        {/* Top nav bar */}
        <div className="absolute top-0 inset-x-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#78c8ff]/10 border border-[#78c8ff]/20 flex items-center justify-center">
                <span className="text-[#78c8ff] font-bold text-sm">R</span>
              </div>
              <span className="font-bold tracking-widest text-[#78c8ff] uppercase text-xs">
                Resin OS
              </span>
            </div>
            <a
              href={affiliate.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
            >
              <Instagram size={16} />
              <span className="hidden sm:inline">{affiliate.instagram}</span>
            </a>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Affiliate badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border mb-8"
                style={{
                  backgroundColor: `${affiliate.accentColor}10`,
                  borderColor: `${affiliate.accentColor}30`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: affiliate.accentColor }}
                />
                <span
                  className="text-xs font-bold tracking-[0.2em] uppercase"
                  style={{ color: affiliate.accentColor }}
                >
                  Recommended by {affiliate.name}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                The Operating System for{" "}
                <span
                  className="text-transparent bg-clip-text bg-gradient-to-r filter"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${affiliate.accentColor}, #78c8ff)`,
                    WebkitFilter: `drop-shadow(0 0 10px ${affiliate.accentGlow})`,
                  }}
                >
                  Epoxy Contractors
                </span>
              </h1>

              <p className="text-lg text-white/60 leading-relaxed max-w-lg mb-10">
                Quote jobs in 30 seconds, track your pipeline, collect payments, and access 40+ hours
                of pro training — all in one subscription. {affiliate.realName} uses it. You should too.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCTA}
                  className="group flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.03] shadow-lg"
                  style={{
                    backgroundColor: affiliate.accentColor,
                    color: "#000",
                    boxShadow: `0 0 30px ${affiliate.accentGlow}`,
                  }}
                >
                  Start Your 7-Day Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-2 text-white/40 text-sm self-center">
                  <Shield size={14} />
                  <span>No credit card required</span>
                </div>
              </div>

              {/* Social proof stats */}
              <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
                {[
                  { value: "$97", label: "/ month after trial" },
                  { value: "7", label: "day free trial" },
                  { value: "40+", label: "hours of training" },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={affiliate.heroImage}
                  alt={`${affiliate.name} — metallic epoxy floor`}
                  className="w-full h-[500px] lg:h-[600px] object-cover"
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />

                {/* Floating name badge */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black text-sm shrink-0"
                      style={{ backgroundColor: affiliate.accentColor }}
                    >
                      {affiliate.realName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-white text-sm">{affiliate.name}</p>
                        <BadgeCheck size={14} style={{ color: affiliate.accentColor }} />
                      </div>
                      <p className="text-white/50 text-xs truncate">{affiliate.instagram}</p>
                    </div>
                    <a
                      href={affiliate.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border"
                      style={{
                        borderColor: `${affiliate.accentColor}40`,
                        color: affiliate.accentColor,
                      }}
                    >
                      Follow <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* ENDORSEMENT / TESTIMONIAL                     */}
      {/* ============================================= */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            {/* Quote icon */}
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-8 border"
              style={{
                backgroundColor: `${affiliate.accentColor}10`,
                borderColor: `${affiliate.accentColor}25`,
              }}
            >
              <Star size={24} style={{ color: affiliate.accentColor }} />
            </div>

            <blockquote className="text-xl sm:text-2xl lg:text-3xl font-medium text-white/90 leading-relaxed mb-8 italic">
              "{affiliate.endorsement}"
            </blockquote>

            <div className="flex items-center justify-center gap-4">
              <img
                src={affiliate.workImage}
                alt={affiliate.name}
                className="w-14 h-14 rounded-full object-cover border-2"
                style={{ borderColor: affiliate.accentColor }}
              />
              <div className="text-left">
                <p className="font-bold text-white flex items-center gap-1.5">
                  {affiliate.realName} <BadgeCheck size={14} style={{ color: affiliate.accentColor }} />
                </p>
                <p className="text-sm text-white/50">{affiliate.name} • Epoxy Professional</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================= */}
      {/* WORK SHOWCASE / SPLIT IMAGE                   */}
      {/* ============================================= */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-4 rounded-2xl overflow-hidden"
          >
            <div className="relative h-[350px] overflow-hidden rounded-2xl border border-white/10">
              <img
                src={affiliate.heroImage}
                alt="Metallic epoxy floor by Doctor Epoxy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/50 backdrop-blur-sm text-white/80 border border-white/10">
                  Metallic Epoxy
                </span>
              </div>
            </div>
            <div className="relative h-[350px] overflow-hidden rounded-2xl border border-white/10">
              <img
                src={affiliate.workImage}
                alt="Commercial epoxy floor by Doctor Epoxy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/50 backdrop-blur-sm text-white/80 border border-white/10">
                  Commercial Install
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================= */}
      {/* FEATURES GRID                                 */}
      {/* ============================================= */}
      <section className="py-24 px-6 relative">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[150px] pointer-events-none opacity-20"
          style={{ backgroundColor: affiliate.accentGlow }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold tracking-wide mb-6 border"
              style={{
                backgroundColor: `${affiliate.accentColor}10`,
                borderColor: `${affiliate.accentColor}20`,
                color: affiliate.accentColor,
              }}
            >
              <Sparkles size={14} />
              WHAT YOU GET
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Everything in{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: `linear-gradient(to right, ${affiliate.accentColor}, #78c8ff)`,
                }}
              >
                One Subscription
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              The exact platform {affiliate.realName} uses to run and scale his epoxy business.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border"
                  style={{
                    backgroundColor: `${affiliate.accentColor}10`,
                    borderColor: `${affiliate.accentColor}20`,
                  }}
                >
                  <feature.icon size={22} style={{ color: affiliate.accentColor }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* PRICING CTA                                   */}
      {/* ============================================= */}
      <section className="py-24 px-6 relative">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border"
            style={{ borderColor: `${affiliate.accentColor}30` }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 inset-x-0 h-1"
              style={{
                background: `linear-gradient(to right, transparent, ${affiliate.accentColor}, transparent)`,
              }}
            />

            <div className="p-8 md:p-12 bg-[#0a0a0a]">
              {/* Referred badge */}
              <div className="flex justify-center mb-6">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border"
                  style={{
                    backgroundColor: `${affiliate.accentColor}10`,
                    borderColor: `${affiliate.accentColor}25`,
                  }}
                >
                  <BadgeCheck size={14} style={{ color: affiliate.accentColor }} />
                  <span
                    className="text-xs font-bold tracking-[0.15em] uppercase"
                    style={{ color: affiliate.accentColor }}
                  >
                    Referred by {affiliate.name}
                  </span>
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">
                  Resin OS <span style={{ color: affiliate.accentColor }}>Pro</span>
                </h3>
                <p className="text-white/50">
                  Everything you need to run a high-ticket coating business.
                </p>
              </div>

              <div className="text-center mb-8 pb-8 border-b border-white/10">
                <div className="text-5xl font-bold text-white mb-1">
                  $97<span className="text-xl text-white/40 font-normal">/mo</span>
                </div>
                <p
                  className="text-sm font-bold tracking-widest uppercase mt-2"
                  style={{ color: affiliate.accentColor }}
                >
                  After 7-Day Free Trial
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-10">
                {[
                  "Interactive Smart Quotes",
                  "Full CRM Dashboard",
                  "40+ Hours Video Training",
                  "AI Room Visualizer",
                  "Stripe Payment Collection",
                  "Cancel Anytime — No Lock-in",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} style={{ color: affiliate.accentColor }} />
                    <span className="text-white/70 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCTA}
                className="w-full group flex items-center justify-center gap-3 py-5 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: affiliate.accentColor,
                  color: "#000",
                  boxShadow: `0 0 30px ${affiliate.accentGlow}`,
                }}
              >
                Start Your 7-Day Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="mt-4 text-center text-xs tracking-wider uppercase text-white/30 font-bold">
                No Credit Card Required to Start
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================= */}
      {/* FOOTER                                        */}
      {/* ============================================= */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#78c8ff]/10 border border-[#78c8ff]/20 flex items-center justify-center">
              <span className="text-[#78c8ff] font-bold text-[10px]">R</span>
            </div>
            <span className="font-bold tracking-wider text-white/50 uppercase text-xs">
              Resin OS by Resin Academics
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href={affiliate.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Instagram size={14} />
              {affiliate.instagram}
            </a>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
