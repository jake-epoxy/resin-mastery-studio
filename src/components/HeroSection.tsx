import heroBg from "@/assets/hero-bg.jpg";
import { useRef, useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Inspiring words — Nike-ad energy for epoxy floor entrepreneurs     */
/* ------------------------------------------------------------------ */
const POWER_WORDS: string[] = [
  "Create Freely",
  "Own Your Craft",
  "Build Empire",
  "Be Unstoppable",
  "Master the Art",
  "Break Free",
  "Pour Passion",
  "Level Up",
  "Go Limitless",
  "Start Now",
  "Born to Build",
  "No Ceiling",
  "Make It Yours",
  "Rise Higher",
  "Dream Bigger",
  "Your Legacy",
  "Pure Freedom",
  "Just Create",
  "The Grind",
  "Stay Hungry",
];

const FINAL_TEXT = "Resin\nAcademics";

/* ------------------------------------------------------------------ */
/*  Metallic Particle System                                          */
/* ------------------------------------------------------------------ */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;        // color hue for metallic tones
  shimmerSpeed: number;
  shimmerOffset: number;
}

function createParticles(width: number, height: number, count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2 - 0.1, // slight upward drift
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      hue: Math.random() > 0.6 ? 200 + Math.random() * 20 : 35 + Math.random() * 20, // cyan or gold
      shimmerSpeed: 0.5 + Math.random() * 2,
      shimmerOffset: Math.random() * Math.PI * 2,
    });
  }
  return particles;
}

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayText, setDisplayText] = useState(POWER_WORDS[0]);
  const [isFinal, setIsFinal] = useState(false);
  const [textOpacity, setTextOpacity] = useState(0);
  const lastScrollY = useRef(0);
  const rafRef = useRef<number>(0);
  const scrollVelocityRef = useRef(0);
  const decayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseRef = useRef({ x: -1, y: -1 });
  const particlesRef = useRef<Particle[]>([]);
  const animIdRef = useRef<number>(0);

  // ---- Scroll-reactive text logic ----
  const getWordFromScroll = useCallback((scrollY: number): string => {
    const idx = Math.floor(scrollY / 30) % POWER_WORDS.length;
    return POWER_WORDS[idx];
  }, []);

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const velocity = Math.abs(scrollY - lastScrollY.current);
      lastScrollY.current = scrollY;
      scrollVelocityRef.current = velocity;

      const lockThreshold = 50;
      if (scrollY <= lockThreshold) {
        if (!isFinal || displayText !== FINAL_TEXT) {
          setDisplayText(FINAL_TEXT);
          setIsFinal(true);
          setTextOpacity(1);
        }
      } else {
        const word = getWordFromScroll(scrollY);
        setDisplayText(word);
        setIsFinal(false);
        const t = Math.min(1, (scrollY - 50) / 550);
        setTextOpacity(1 - t * 0.35);
      }

      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
      if (scrollY > lockThreshold && scrollY < 150 && velocity < 3) {
        decayTimerRef.current = setTimeout(() => {
          if (window.scrollY < 150) window.scrollTo({ top: 0, behavior: "smooth" });
        }, 400);
      }
    });
  }, [isFinal, displayText, getWordFromScroll]);

  // ---- Intro animation ----
  useEffect(() => {
    const INTRO_DURATION = 1600;
    const startTime = performance.now();
    let lastSwitchTime = startTime;
    let cancelled = false;

    const animate = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / INTRO_DURATION);
      const fadeIn = Math.min(1, elapsed / 600);
      const eased = 1 - Math.pow(1 - progress, 5);
      const interval = 30 + eased * 150;

      if (now - lastSwitchTime >= interval) {
        const idx = Math.floor(Math.random() * POWER_WORDS.length);
        setDisplayText(POWER_WORDS[idx]);
        setIsFinal(false);
        setTextOpacity(fadeIn);
        lastSwitchTime = now;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (cancelled) return;
        setDisplayText(POWER_WORDS[Math.floor(Math.random() * POWER_WORDS.length)]);
        setTextOpacity(0.85);
        setTimeout(() => {
          if (cancelled) return;
          setDisplayText(FINAL_TEXT);
          setIsFinal(true);
          setTextOpacity(1);
        }, 150);
      }
    };

    requestAnimationFrame(animate);
    return () => { cancelled = true; };
  }, []);

  // ---- Scroll listener ----
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
    };
  }, [handleScroll]);

  // ---- Particle canvas ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = section.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);

      // Re-create particles on resize
      const count = Math.min(120, Math.floor((rect.width * rect.height) / 8000));
      particlesRef.current = createParticles(rect.width, rect.height, count);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1, y: -1 };
    };

    section.addEventListener("mousemove", handleMouse);
    section.addEventListener("mouseleave", handleMouseLeave);

    let time = 0;
    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);
      time += 0.016;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particlesRef.current) {
        // Mouse repulsion
        if (mx > 0 && my > 0) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const force = (150 - dist) / 150 * 0.8;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Drift
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02 - 0.005;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Shimmer
        const shimmer = Math.sin(time * p.shimmerSpeed + p.shimmerOffset) * 0.5 + 0.5;
        const alpha = p.opacity * (0.4 + shimmer * 0.6);

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, ${65 + shimmer * 25}%, ${alpha})`;
        ctx.fill();

        // Glow
        if (p.size > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          grd.addColorStop(0, `hsla(${p.hue}, 70%, 80%, ${alpha * 0.3})`);
          grd.addColorStop(1, `hsla(${p.hue}, 70%, 80%, 0)`);
          ctx.fillStyle = grd;
          ctx.fill();
        }
      }

      // Draw faint connection lines between nearby particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        const a = particlesRef.current[i];
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const lineAlpha = (1 - dist / 100) * 0.08;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(120, 200, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animIdRef.current = requestAnimationFrame(draw);
    };

    animIdRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener("resize", resize);
      section.removeEventListener("mousemove", handleMouse);
      section.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const lines = displayText.split("\n");
  const showFinal = displayText === FINAL_TEXT;

  return (
    <section
      ref={sectionRef}
      aria-label="Epoxy Flooring Training and Certification - Resin Academics"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0c0c18]"
    >
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-50 mix-blend-overlay"
        >
          <source src="/hero-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c18]/80 via-[#0c0c18]/50 to-[#0c0c18]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-6 font-body animate-scroll-reveal">
          Master the Craft. Build the Business.
        </p>

        {/* SEO: Always-present h1 for search engines */}
        <h1 className="sr-only">Resin Academics — Professional Epoxy Flooring Classes, Training & Certification Courses</h1>

        {/* Scroll-reactive text */}
        <div
          className="mb-8 select-none flex items-center justify-center relative w-full"
          style={{ minHeight: "clamp(120px, 18vw, 220px)" }}
        >
          {showFinal ? (
            <img
              src="/logo.png"
              alt="Resin Academics — Epoxy Flooring Training & Certification Logo"
              className="w-full max-w-[280px] md:max-w-[400px] lg:max-w-[500px] object-contain transition-all duration-700 ease-out"
              style={{
                opacity: textOpacity,
                filter: "drop-shadow(0 0 20px rgba(120,200,255,0.4))",
                transform: `scale(${0.9 + (textOpacity * 0.1)})`
              }}
            />
          ) : (
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold font-display leading-[1.05] transition-opacity duration-100"
              style={{
                opacity: textOpacity,
                color: "transparent",
                backgroundImage: "linear-gradient(135deg, #78c8ff 0%, #fff 40%, #78c8ff 70%, #b4e0ff 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                textShadow: "none",
                filter: "drop-shadow(0 0 25px rgba(120,200,255,0.25))",
              }}
            >
              {lines.map((line, i) => (
                <span key={`${line}-${i}`}>
                  {line}
                  {i < lines.length - 1 && <br />}
                </span>
              ))}
            </h1>
          )}
        </div>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 font-light animate-scroll-reveal" style={{ transitionDelay: "0.2s" }}>
          Professional epoxy flooring, countertop & wall coating training — online and in-person.
          Get certified and learn how to market your new craft.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scroll-reveal" style={{ transitionDelay: "0.3s" }}>
          <a
            href="#services"
            className="px-8 py-4 bg-primary text-primary-foreground font-display font-semibold tracking-wide rounded-sm hover:border-glow-hover transition-all duration-300 hover:scale-105"
          >
            Explore Programs
          </a>
          <a
            href="#contact"
            className="px-8 py-4 border border-primary/30 text-primary font-display font-semibold tracking-wide rounded-sm border-glow hover:border-glow-hover transition-all duration-300 hover:scale-105"
          >
            Get in Touch
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse-glow" style={{ zIndex: 10 }}>
        <span className="text-muted-foreground text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 line-gradient" />
      </div>
    </section>
  );
};

export default HeroSection;
