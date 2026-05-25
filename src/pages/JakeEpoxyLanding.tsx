import React, { useRef, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { MapPin, Globe, Star, ShieldCheck, Zap, Award, Gem } from 'lucide-react';
import { LeadCaptureGlassForm } from '../components/LeadCaptureGlassForm';

/* ─── Room Configuration ─── */
const rooms = [
  {
    id: 'entryway',
    image: '/assets/epoxy/entryway.png',
    label: 'THE GRAND ENTRYWAY',
    icon: Gem,
    heading: ['Floors That', 'Define Luxury.'],
    body: 'Handcrafted custom epoxy floors and premium countertops. From celebrity homes to architectural masterpieces nationwide.',
    badges: ['El Paso\'s #1 Resin Authority', 'Nationwide Travel'],
  },
  {
    id: 'hallway',
    image: '/assets/epoxy/hallway.png',
    label: 'THE CORRIDOR',
    icon: Award,
    heading: ['Seamless.', 'Unbroken. Infinite.'],
    body: 'One continuous, mirror-like surface poured directly onto your substrate. No tiles. No seams. No grout lines. Just pure, uninterrupted luxury.',
    badges: ['Seamless Pour Technology', 'Own Resin Product Line'],
  },
  {
    id: 'garage',
    image: '/assets/epoxy/garage.png',
    label: 'THE LUXURY GARAGE',
    icon: Star,
    heading: ['Showroom Quality.', 'Industrial Strength.'],
    body: 'Metallic flake systems and hyper-durable coatings designed to handle heavy exotic vehicles while reflecting light perfectly.',
    badges: ['Celebrity & Commercial', 'Extreme Durability'],
  },
  {
    id: 'kitchen',
    image: '/assets/epoxy/kitchen.png',
    label: 'THE KITCHEN & BAR',
    icon: Globe,
    heading: ['Built to', 'Outlast.'],
    body: 'From high-end lounges to industrial warehouses. The only installer in El Paso with a proprietary resin line formulated for extreme conditions.',
    badges: ['Live Job Site Trainings', 'Satisfaction Guaranteed'],
  },
];

/* ─── Cinematic Room Component ─── */
function CinematicRoom({ room, progress }: { room: typeof rooms[0]; progress: any }) {
  // Image: starts at scale 1.15 (slightly zoomed) and zooms to 1.6 as you scroll through
  const imgScale = useTransform(progress, [0, 1], [1.15, 1.6]);
  // Image slowly drifts upward for parallax depth
  const imgY = useTransform(progress, [0, 1], ['0%', '-8%']);
  // Content fades in from 0-30%, holds, fades out 70-100%
  const contentOpacity = useTransform(progress, [0, 0.15, 0.75, 1], [0, 1, 1, 0]);
  const contentY = useTransform(progress, [0, 0.15, 0.75, 1], [80, 0, 0, -60]);
  // Vignette intensifies as we "push through"
  const vignetteOpacity = useTransform(progress, [0, 0.7, 1], [0.4, 0.5, 1]);

  const Icon = room.icon;

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Background Image with Parallax Zoom */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ scale: imgScale, y: imgY }}
      >
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${room.image})` }}
        />
      </motion.div>

      {/* Cinematic Vignette Overlay — creates the "tunnel vision" transport feel */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: vignetteOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </motion.div>

      {/* Film Grain Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
      />

      {/* Content */}
      <motion.div
        className="absolute inset-0 flex items-end pb-24 md:pb-32 px-8 md:px-16 lg:px-24 pointer-events-none"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <div className="max-w-3xl">
          {/* Room Label */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 backdrop-blur-xl mb-6">
            <Icon className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">{room.label}</span>
          </div>

          {/* Heading */}
          <h2 className="mb-6">
            {room.heading.map((line, i) => (
              <span key={i} className="block text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] drop-shadow-2xl">
                {i === room.heading.length - 1 ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37]">{line}</span>
                ) : (
                  <span className="text-white">{line}</span>
                )}
              </span>
            ))}
          </h2>

          {/* Body */}
          <p className="text-lg md:text-xl text-white/80 max-w-xl leading-relaxed mb-8 drop-shadow-lg">
            {room.body}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            {room.badges.map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-xs font-semibold text-white/70 bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Landing Page ─── */
export default function JakeEpoxyLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeRoom, setActiveRoom] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Track which room we're in for the nav dots
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(Math.floor(v * rooms.length), rooms.length - 1);
    setActiveRoom(idx);
  });

  // Per-room progress values (each room gets its own 0→1 range)
  const roomProgresses = rooms.map((_, i) => {
    const start = i / rooms.length;
    const end = (i + 1) / rooms.length;
    return useTransform(scrollYProgress, [start, end], [0, 1]);
  });

  // Per-room visibility (used for layering — room fades out at end of its segment)
  const roomVisibilities = rooms.map((_, i) => {
    const start = i / rooms.length;
    const end = (i + 1) / rooms.length;
    // Visible from start, begins fading at 85%, fully gone at 100%
    if (i < rooms.length - 1) {
      return useTransform(scrollYProgress, [start, end * 0.85, end], [1, 1, 0]);
    }
    // Last room stays visible
    return useTransform(scrollYProgress, [start, end], [1, 1]);
  });

  // "Scroll to explore" indicator fades out after first scroll
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  return (
    <div className="bg-black text-white selection:bg-[#D4AF37]/30" style={{ fontFamily: "'Inter', sans-serif" }}>
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
            "description": "El Paso's premier luxury epoxy flooring and countertop installer. The only installer with a proprietary resin product line.",
            "url": "https://resinacademics.com/jakeepoxy",
            "telephone": "+1-915-000-0000",
            "address": { "@type": "PostalAddress", "addressLocality": "El Paso", "addressRegion": "TX" },
            "areaServed": ["El Paso", "Nationwide"],
            "priceRange": "$$$"
          }
        `}</script>
      </Helmet>

      {/* ═══ Scroll Container: each room gets 150vh of scroll space ═══ */}
      <div ref={containerRef} style={{ height: `${rooms.length * 150}vh` }} className="relative">

        {/* ═══ Sticky Viewport ═══ */}
        <div className="sticky top-0 w-full h-screen overflow-hidden bg-black">

          {/* Room layers — stacked bottom to top so first room is on top */}
          {[...rooms].reverse().map((room, reversedIdx) => {
            const i = rooms.length - 1 - reversedIdx;
            return (
              <motion.div
                key={room.id}
                className="absolute inset-0"
                style={{ opacity: roomVisibilities[i], zIndex: i + 1 }}
              >
                <CinematicRoom room={room} progress={roomProgresses[i]} />
              </motion.div>
            );
          })}

          {/* ═══ Lead Capture Form — fades in during last room ═══ */}
          <motion.div
            className="absolute bottom-8 right-8 md:right-16 lg:right-24 z-50 w-full max-w-md pointer-events-auto"
            style={{
              opacity: useTransform(scrollYProgress, [0.82, 0.9], [0, 1]),
              y: useTransform(scrollYProgress, [0.82, 0.9], [60, 0]),
            }}
          >
            <LeadCaptureGlassForm />
          </motion.div>

          {/* ═══ Room Navigation Dots ═══ */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
            {rooms.map((room, i) => (
              <button
                key={room.id}
                className="group relative flex items-center justify-end"
                onClick={() => {
                  if (!containerRef.current) return;
                  const totalHeight = containerRef.current.scrollHeight - window.innerHeight;
                  const targetScroll = (i / rooms.length) * totalHeight + 1;
                  window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                }}
              >
                {/* Label on hover */}
                <span className="absolute right-6 whitespace-nowrap text-[10px] tracking-[0.15em] uppercase font-semibold text-white/0 group-hover:text-white/70 transition-all duration-300 pr-2">
                  {room.label}
                </span>
                {/* Dot */}
                <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-500 ${
                  activeRoom === i
                    ? 'bg-[#D4AF37] border-[#D4AF37] scale-125 shadow-[0_0_12px_rgba(212,175,55,0.5)]'
                    : 'bg-transparent border-white/30 hover:border-white/60'
                }`} />
              </button>
            ))}
          </div>

          {/* ═══ Scroll Indicator ═══ */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3"
            style={{ opacity: scrollIndicatorOpacity }}
          >
            <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase font-semibold">Scroll to Explore</span>
            <motion.div
              className="w-7 h-11 border border-white/20 rounded-full flex justify-center pt-2 backdrop-blur-sm"
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <div className="w-1 h-2.5 bg-[#D4AF37] rounded-full" />
            </motion.div>
          </motion.div>

          {/* ═══ Cinematic Letterbox Bars ═══ */}
          <div className="absolute top-0 left-0 right-0 h-[3vh] bg-black z-40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[3vh] bg-black z-40 pointer-events-none" />

        </div>
      </div>
    </div>
  );
}
