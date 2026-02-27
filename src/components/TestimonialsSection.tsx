import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Star, Quote } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface Testimonial {
    name: string;
    location: string;
    quote: string;
    rating: number;
    initials: string;
}

const testimonials: Testimonial[] = [
    {
        name: "Nick W.",
        location: "Oklahoma City, OK",
        quote: "Review coming soon — check back shortly.",
        rating: 5,
        initials: "NW",
    },
    {
        name: "Jason W.",
        location: "Indianapolis, IN",
        quote: "Review coming soon — check back shortly.",
        rating: 5,
        initials: "JW",
    },
    {
        name: "Artem I.",
        location: "Dallas, TX",
        quote: "Review coming soon — check back shortly.",
        rating: 5,
        initials: "AI",
    },
    {
        name: "Adan A.",
        location: "El Paso, TX",
        quote: "Review coming soon — check back shortly.",
        rating: 5,
        initials: "AA",
    },
    {
        name: "Charles E.",
        location: "San Diego, CA",
        quote: "Review coming soon — check back shortly.",
        rating: 5,
        initials: "CE",
    },
    {
        name: "JP O.",
        location: "San Antonio, TX",
        quote: "Review coming soon — check back shortly.",
        rating: 5,
        initials: "JP",
    },
];

const TestimonialsSection = () => {
    const ref = useScrollReveal();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Auto-rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Scroll carousel to active card
    useEffect(() => {
        if (scrollRef.current) {
            const card = scrollRef.current.children[activeIndex] as HTMLElement;
            if (card) {
                scrollRef.current.scrollTo({
                    left: card.offsetLeft - scrollRef.current.offsetWidth / 2 + card.offsetWidth / 2,
                    behavior: "smooth",
                });
            }
        }
    }, [activeIndex]);

    return (
        <section className="py-32 px-6 relative overflow-hidden" ref={ref}>
            <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 animate-scroll-reveal">
                        Real Results
                    </p>
                    <h2
                        className="text-4xl md:text-5xl font-bold font-display text-primary text-glow-strong leading-tight animate-scroll-reveal"
                        style={{ transitionDelay: "0.1s" }}
                    >
                        What Our Graduates Say
                    </h2>
                    <p
                        className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4 animate-scroll-reveal"
                        style={{ transitionDelay: "0.2s" }}
                    >
                        Hear from certified installers who leveled up their careers through Resin Academics.
                    </p>
                </div>

                {/* Testimonial Cards — Horizontal Scroll */}
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide animate-scroll-reveal"
                    style={{
                        transitionDelay: "0.3s",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    {testimonials.map((t, i) => (
                        <div
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={`group flex-shrink-0 w-[340px] snap-center rounded-xl border p-8 transition-all duration-500 cursor-pointer ${activeIndex === i
                                    ? "border-[#78c8ff]/40 bg-[#78c8ff]/[0.04] shadow-[0_0_40px_rgba(120,200,255,0.08)] scale-[1.02]"
                                    : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.025]"
                                }`}
                        >
                            {/* Quote icon */}
                            <Quote
                                className={`w-8 h-8 mb-5 transition-colors duration-300 ${activeIndex === i ? "text-[#78c8ff]/50" : "text-white/[0.08]"
                                    }`}
                                strokeWidth={1}
                            />

                            {/* Quote text */}
                            <p className="text-muted-foreground text-sm leading-relaxed mb-8 min-h-[80px] italic">
                                "{t.quote}"
                            </p>

                            {/* Stars */}
                            <div className="flex gap-1 mb-4">
                                {Array.from({ length: t.rating }).map((_, j) => (
                                    <Star
                                        key={j}
                                        className={`w-4 h-4 transition-colors duration-300 ${activeIndex === i ? "text-[#78c8ff] fill-[#78c8ff]" : "text-[#78c8ff]/40 fill-[#78c8ff]/40"
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                {/* Avatar with initials */}
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 ${activeIndex === i
                                            ? "bg-[#78c8ff]/20 text-[#78c8ff] border border-[#78c8ff]/30"
                                            : "bg-white/5 text-muted-foreground border border-white/10"
                                        }`}
                                >
                                    {t.initials}
                                </div>
                                <div>
                                    <p
                                        className={`text-sm font-display font-semibold transition-colors duration-300 ${activeIndex === i ? "text-primary" : "text-muted-foreground"
                                            }`}
                                    >
                                        {t.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground/60">{t.location}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dot indicators */}
                <div className="flex items-center justify-center gap-2 mt-8">
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={`rounded-full transition-all duration-300 ${activeIndex === i
                                    ? "w-8 h-2 bg-[#78c8ff]"
                                    : "w-2 h-2 bg-white/15 hover:bg-white/25"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
