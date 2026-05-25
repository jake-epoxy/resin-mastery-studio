import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import { MapPin, Globe, Star, ShieldCheck, Zap, Award, Gem, ChevronDown } from 'lucide-react';
import { LeadCaptureGlassForm } from '../components/LeadCaptureGlassForm';

/* ═══════════════════════════════════════════
   ROOM DATA
   ═══════════════════════════════════════════ */
const rooms = [
  {
    id: 'entryway',
    image: '/assets/epoxy/entryway.png',
    label: 'THE GRAND ENTRYWAY',
    heading: 'Floors That Define',
    headingAccent: 'Luxury.',
    body: 'Handcrafted seamless epoxy floors and premium countertops. From celebrity homes to architectural masterpieces nationwide.',
    badges: ["El Paso's #1 Resin Authority", 'Nationwide Travel'],
  },
  {
    id: 'hallway',
    image: '/assets/epoxy/hallway.png',
    label: 'THE CORRIDOR',
    heading: 'Seamless. Unbroken.',
    headingAccent: 'Infinite.',
    body: 'One continuous, mirror-like surface poured directly onto your substrate. No tiles. No seams. No grout lines. Pure, uninterrupted luxury.',
    badges: ['Seamless Pour Technology', 'Own Resin Product Line'],
  },
  {
    id: 'garage',
    image: '/assets/epoxy/garage.png',
    label: 'THE LUXURY GARAGE',
    heading: 'Showroom Quality.',
    headingAccent: 'Industrial Strength.',
    body: 'Metallic flake systems and hyper-durable coatings designed to handle heavy exotic vehicles while reflecting light perfectly.',
    badges: ['Celebrity & Commercial', 'Extreme Durability'],
  },
  {
    id: 'kitchen',
    image: '/assets/epoxy/kitchen.png',
    label: 'THE KITCHEN & BAR',
    heading: 'Built to',
    headingAccent: 'Outlast.',
    body: 'From high-end lounges to industrial warehouses. The only installer in El Paso with a proprietary resin line formulated for extreme conditions.',
    badges: ['Live Job Site Trainings', 'Satisfaction Guaranteed'],
  },
];

/* ═══════════════════════════════════════════
   INDIVIDUAL ROOM SECTION
   Each room gets 200vh of scroll space.
   First 100vh = room visible with parallax zoom.
   Next 100vh  = "walk through doorway" transition.
   ═══════════════════════════════════════════ */
function RoomSection({ room, index, isLast }: { room: typeof rooms[0]; index: number; isLast: boolean }) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Smooth it out
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.5 });

  // --- IMAGE: Slow parallax zoom as you scroll through the room ---
  const imgScale = useTransform(smoothProgress, [0, 0.5, 1], [1.05, 1.2, 2.5]);
  const imgBrightness = useTransform(smoothProgress, [0, 0.5, 0.75, 1], [1, 1, 0.3, 0]);

  // --- TEXT: Visible in first half, fades as you "walk forward" ---
  const textOpacity = useTransform(smoothProgress, [0, 0.05, 0.35, 0.5], [0, 1, 1, 0]);
  const textY = useTransform(smoothProgress, [0, 0.05, 0.5], [60, 0, -40]);

  // --- VIGNETTE: Circular closing effect (like walking through a doorway) ---
  const vignetteSize = useTransform(smoothProgress, [0.4, 0.8], [150, 0]);
  const vignetteOpacity = useTransform(smoothProgress, [0.4, 0.6], [0, 1]);

  return (
    <div
      ref={sectionRef}
      className="relative w-full"
      style={{ height: isLast ? '100vh' : '200vh' }}
    >
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-black">
        {/* ── Background Image with Parallax Zoom ── */}
        <motion.div
          className="absolute inset-0 w-full h-full origin-center"
          style={{
            scale: imgScale,
            filter: useTransform(imgBrightness, (v) => `brightness(${v})`),
          }}
        >
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${room.image})` }}
          />
          {/* Gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
        </motion.div>

        {/* ── Doorway Vignette (circular closing) ── */}
        {!isLast && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              opacity: vignetteOpacity,
              background: useTransform(
                vignetteSize,
                (size) => `radial-gradient(circle at 50% 50%, transparent ${size}%, black ${size + 20}%)`
              ),
            }}
          />
        )}

        {/* ── Film Grain ── */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none z-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* ── Content ── */}
        <motion.div
          className="absolute inset-0 z-30 flex items-end pb-[12vh] px-8 md:px-16 lg:px-24 pointer-events-none"
          style={{ opacity: textOpacity, y: textY }}
        >
          <div className="max-w-3xl">
            {/* Room Label */}
            <motion.div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 backdrop-blur-xl mb-6"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
                {room.label}
              </span>
            </motion.div>

            {/* Heading */}
            <h2 className="mb-6">
              <span className="block text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-white drop-shadow-2xl">
                {room.heading}
              </span>
              <span className="block text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] drop-shadow-2xl">
                {room.headingAccent}
              </span>
            </h2>

            {/* Body */}
            <p className="text-base md:text-lg text-white/75 max-w-xl leading-relaxed mb-8 drop-shadow-lg">
              {room.body}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {room.badges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-2 text-[11px] font-semibold text-white/60 bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Cinematic Letterbox ── */}
        <div className="absolute top-0 left-0 right-0 h-[3.5vh] bg-black z-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[3.5vh] bg-black z-40 pointer-events-none" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FINAL CTA SECTION (after the walkthrough)
   ═══════════════════════════════════════════ */
function FinalSection() {
  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-8 py-24">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl w-full mx-auto flex flex-col lg:flex-row items-center gap-16">
        {/* Left: CTA Text */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 backdrop-blur-xl mb-6">
              <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[10px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
                Start Your Project
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
              <span className="text-white block">Let's Build Something</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] block">
                Legendary.
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-lg leading-relaxed mb-8">
              The only installer in El Paso with a proprietary resin product line.
              Celebrity, commercial, and residential — nationwide.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <div className="flex items-center gap-2 text-xs text-white/50 bg-white/5 px-4 py-2.5 rounded-full border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> Satisfaction Guaranteed
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50 bg-white/5 px-4 py-2.5 rounded-full border border-white/10">
                <Globe className="w-3.5 h-3.5 text-[#D4AF37]" /> Nationwide Travel
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Lead Form */}
        <motion.div
          className="flex-1 w-full max-w-md"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <LeadCaptureGlassForm />
        </motion.div>
      </div>

      {/* Letterbox bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[3.5vh] bg-black z-40 pointer-events-none" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   NAV DOTS + SCROLL INDICATOR
   ═══════════════════════════════════════════ */
function NavigationOverlay() {
  const [activeRoom, setActiveRoom] = useState(0);
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const roomHeight = window.innerHeight * 2; // each room is 200vh
      const idx = Math.min(Math.floor(scrollTop / roomHeight), rooms.length - 1);
      setActiveRoom(idx);
      if (scrollTop > 100) setShowScrollHint(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Room nav dots */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
        {rooms.map((room, i) => (
          <button
            key={room.id}
            className="group relative flex items-center justify-end"
            onClick={() => {
              const target = i * window.innerHeight * 2;
              window.scrollTo({ top: target, behavior: 'smooth' });
            }}
          >
            <span className="absolute right-6 whitespace-nowrap text-[9px] tracking-[0.15em] uppercase font-semibold text-white/0 group-hover:text-white/60 transition-all duration-300 pr-1">
              {room.label}
            </span>
            <div
              className={`w-2 h-2 rounded-full border transition-all duration-500 ${
                activeRoom === i
                  ? 'bg-[#D4AF37] border-[#D4AF37] scale-150 shadow-[0_0_10px_rgba(212,175,55,0.6)]'
                  : 'bg-transparent border-white/25 hover:border-white/50'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Scroll hint */}
      {showScrollHint && (
        <motion.div
          className="absolute bottom-[5vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className="text-[9px] tracking-[0.3em] text-white/35 uppercase font-semibold">
            Scroll to Walk Through
          </span>
          <motion.div
            className="w-6 h-10 border border-white/15 rounded-full flex justify-center pt-2"
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <div className="w-0.5 h-2 bg-[#D4AF37] rounded-full" />
          </motion.div>
        </motion.div>
      )}

      {/* Room counter */}
      <div className="absolute top-[5vh] left-8 md:left-16">
        <span className="text-[10px] tracking-[0.2em] text-white/30 uppercase font-mono">
          {String(activeRoom + 1).padStart(2, '0')} / {String(rooms.length).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function JakeEpoxyLanding() {
  return (
    <div className="bg-black text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Helmet>
        <title>Jake Epoxy | El Paso's Premier Custom Luxurious Epoxy Flooring</title>
        <meta name="description" content="State of the art custom luxurious epoxy flooring and countertops in El Paso, TX. The only installer with a personal Resin product line, traveling nationwide for celebrities, commercial, and residential projects." />
        <meta name="keywords" content="Epoxy Flooring El Paso, Custom Epoxy, Luxury Countertops, Jake Epoxy, Nationwide Resin Installer, Celebrity Epoxy Installer, Live Job Site Trainings El Paso" />
        <meta property="og:title" content="Jake Epoxy | Floors That Define Luxury" />
        <meta property="og:description" content="El Paso's exclusive luxury epoxy installer. Custom flooring, premium countertops, and the only installer with a custom resin product line." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://resinacademics.com/jakeepoxy" />
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Jake Epoxy",
            "description": "El Paso's premier luxury epoxy flooring and countertop installer.",
            "url": "https://resinacademics.com/jakeepoxy",
            "address": { "@type": "PostalAddress", "addressLocality": "El Paso", "addressRegion": "TX" },
            "areaServed": ["El Paso", "Nationwide"],
            "priceRange": "$$$"
          }
        `}</script>
      </Helmet>

      {/* Navigation overlay (fixed, always visible) */}
      <NavigationOverlay />

      {/* Room walkthrough sections */}
      {rooms.map((room, i) => (
        <RoomSection
          key={room.id}
          room={room}
          index={i}
          isLast={i === rooms.length - 1}
        />
      ))}

      {/* Final CTA section with lead capture */}
      <FinalSection />
    </div>
  );
}
