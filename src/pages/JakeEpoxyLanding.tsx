import React, { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, Globe, Star, ShieldCheck, Zap, ChevronDown } from 'lucide-react';
import { LeadCaptureGlassForm } from '../components/LeadCaptureGlassForm';

export default function JakeEpoxyLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll over the entire 400vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // --- SCENE 1: LIVING ROOM (0% to 33% Scroll) ---
  const scale1 = useTransform(scrollYProgress, [0, 0.33], [1, 1.5]);
  const opacity1 = useTransform(scrollYProgress, [0.25, 0.33], [1, 0]);
  const textY1 = useTransform(scrollYProgress, [0, 0.33], [0, -50]);
  const textOp1 = useTransform(scrollYProgress, [0, 0.25, 0.33], [1, 1, 0]);

  // --- SCENE 2: LUXURY GARAGE (33% to 66% Scroll) ---
  const scale2 = useTransform(scrollYProgress, [0.33, 0.66], [1, 1.5]);
  const opacity2 = useTransform(scrollYProgress, [0.58, 0.66], [1, 0]);
  const textY2 = useTransform(scrollYProgress, [0.33, 0.48, 0.66], [50, 0, -50]);
  const textOp2 = useTransform(scrollYProgress, [0.33, 0.43, 0.58, 0.66], [0, 1, 1, 0]);

  // --- SCENE 3: COMMERCIAL & LEAD CAPTURE (66% to 100% Scroll) ---
  const scale3 = useTransform(scrollYProgress, [0.66, 1], [1, 1.1]);
  const textY3 = useTransform(scrollYProgress, [0.66, 0.85, 1], [50, 0, 0]);
  const textOp3 = useTransform(scrollYProgress, [0.66, 0.8, 1], [0, 1, 1]);

  return (
    <div className="bg-black text-white font-inter selection:bg-[#D4AF37]/30">
      <Helmet>
        <title>Jake Epoxy | El Paso's Premier Custom Luxurious Epoxy Flooring</title>
        <meta name="description" content="State of the art custom luxurious epoxy flooring and countertops in El Paso, TX. The only installer with a personal Resin product line, traveling nationwide for celebrities, commercial, and residential projects." />
        <meta name="keywords" content="Epoxy Flooring El Paso, Custom Epoxy, Luxury Countertops, Jake Epoxy, Nationwide Resin Installer, Celebrity Epoxy Installer, Live Job Site Trainings El Paso" />
        
        {/* Open Graph / Social */}
        <meta property="og:title" content="Jake Epoxy | Floors That Define Luxury" />
        <meta property="og:description" content="El Paso's exclusive luxury epoxy installer. Custom flooring, premium countertops, and the only installer with a custom resin product line." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://resinacademics.com/jakeepoxy" />
      </Helmet>

      {/* 400vh Scroll Container */}
      <div ref={containerRef} className="relative w-full h-[400vh] bg-black">
        
        {/* The Sticky Viewport */}
        <div className="sticky top-0 w-full h-screen overflow-hidden">

          {/* SCENE 3: COMMERCIAL (BOTTOM LAYER) */}
          <motion.div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: 'url(/assets/epoxy/commercial.png)', scale: scale3 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          </motion.div>
          
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-auto" 
            style={{ y: textY3, opacity: textOp3 }}
          >
            <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 backdrop-blur-md mb-6">
                  <Globe className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-semibold tracking-widest text-[#D4AF37] uppercase">Commercial & Nationwide</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 drop-shadow-2xl">
                  Built to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">Outlast.</span>
                </h2>
                <p className="text-xl md:text-2xl text-white/80 max-w-2xl leading-relaxed mb-8">
                  From high-end lounges to 50,000 sqft industrial warehouses. I am the only installer in town with a proprietary resin line formulated for extreme durability.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <div className="flex items-center gap-2 text-sm text-white/70 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                    <Zap className="w-4 h-4 text-[#D4AF37]" /> Live Job Site Trainings
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Satisfaction Guaranteed
                  </div>
                </div>
              </div>
              
              {/* Lead Capture Form embedded in the final scene */}
              <div className="flex-1 w-full max-w-lg z-50">
                <LeadCaptureGlassForm />
              </div>
            </div>
          </motion.div>


          {/* SCENE 2: GARAGE (MIDDLE LAYER) */}
          <motion.div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: 'url(/assets/epoxy/garage.png)', scale: scale2, opacity: opacity2 }}
          >
            <div className="absolute inset-0 bg-black/50 bg-gradient-to-t from-black via-transparent to-black" />
          </motion.div>
          
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none" 
            style={{ y: textY2, opacity: textOp2 }}
          >
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
                <Star className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold tracking-widest text-white uppercase">The Luxury Garage</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 drop-shadow-2xl">
                Showroom Quality. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500">Industrial Strength.</span>
              </h2>
              <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                Metallic flake systems and hyper-durable coatings designed to handle heavy exotic vehicles while reflecting light perfectly. Tailored precisely to your aesthetic.
              </p>
            </div>
          </motion.div>


          {/* SCENE 1: LIVING ROOM (TOP LAYER) */}
          <motion.div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: 'url(/assets/epoxy/living_room.png)', scale: scale1, opacity: opacity1 }}
          >
            <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black via-transparent to-black" />
          </motion.div>
          
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none" 
            style={{ y: textY1, opacity: textOp1 }}
          >
            <div className="max-w-4xl mx-auto mt-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 backdrop-blur-md mb-6">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-semibold tracking-widest text-[#D4AF37] uppercase">El Paso's #1 Resin Authority</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 drop-shadow-2xl">
                Floors That <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37]">Define Luxury.</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                Handcrafted custom epoxy floors and premium countertops. From celebrity homes to architectural masterpieces.
              </p>
            </div>

            <motion.div 
              className="absolute bottom-12 flex flex-col items-center gap-2"
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <span className="text-[10px] tracking-[0.3em] text-white/50 uppercase font-semibold">Scroll to Walk Through</span>
              <div className="w-8 h-12 border border-white/20 rounded-full flex justify-center p-2 backdrop-blur-sm">
                <div className="w-1 h-3 bg-[#D4AF37] rounded-full" />
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>

    </div>
  );
}
