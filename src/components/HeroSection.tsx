import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505]">
      {/* Background Video with heavy gradient masks to make it look like a high-end dark SaaS environment */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-30 mix-blend-screen"
        >
          <source src="/hero-background.mp4" type="video/mp4" />
        </video>
        {/* Core background masks */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/95 via-[#050505]/70 to-[#050505]" />
        
        {/* Custom glowing orb behind text (using Epoxy Flow aesthetic but red/cyan) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[800px] h-[500px] bg-gradient-to-r from-[#78c8ff]/20 via-[#ff2a2a]/10 to-[#78c8ff]/20 blur-[120px] rounded-full pointer-events-none opacity-60" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-24">
        
        {/* SaaS Pill Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <Sparkles className="w-4 h-4 text-[#78c8ff]" />
            <span className="text-white/80 text-xs font-bold tracking-widest uppercase">The Ultimate operating system for epoxy</span>
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-6xl md:text-8xl font-bold font-display leading-[1.05] tracking-tight text-white mb-8"
        >
          Close Deals. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2a2a] via-[#ffffff] to-[#78c8ff] drop-shadow-[0_0_40px_rgba(120,200,255,0.4)]">
            Run Your Empire.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed"
        >
          Resin Academics is the only business OS built exclusively for resin contractors. Generate stunning interactive quotes, crush your sales goals, and automate your entire workflow.
        </motion.p>
        
        {/* Call to Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-5 justify-center items-center"
        >
          <Link
            to="/admin"
            className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-black font-bold tracking-wide rounded-full overflow-hidden transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            <span className="relative z-10 flex flex-col items-center leading-tight">
              <span className="text-base uppercase tracking-wider">Start Free Trial</span>
              <span className="text-[9px] opacity-70 tracking-widest mt-0.5">No Credit Card Required</span>
            </span>
            {/* Hover shine effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:animate-shimmer" />
          </Link>
          
          <a
            href="#software"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#software")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-2 px-8 py-4 bg-transparent border border-white/20 text-white font-bold tracking-wide rounded-full transition-all duration-300 hover:bg-white/10 hover:border-white/40"
          >
            Explore Platform
            <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-[#78c8ff]/50 to-transparent" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
