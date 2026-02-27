import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight } from "lucide-react";

const showcases = [
    {
        image: "/gallery/countertop-floor.jpg",
        title: "Custom Floors & Countertops",
        subtitle: "Where Art Meets Architecture",
        description: "High-gloss metallic epoxy that transforms any space into a masterpiece. Every pour is one of a kind.",
        align: "left" as const,
    },
    {
        image: "/gallery/living-room-marble.jpg",
        title: "Residential Transformations",
        subtitle: "Entire Homes, Reimagined",
        description: "From living rooms to kitchens — we don't just coat floors, we design experiences that stop people in their tracks.",
        align: "right" as const,
    },
    {
        image: "/gallery/staircase-install.jpg",
        title: "Hands-On Training",
        subtitle: "Learn By Doing, Not Watching",
        description: "Our students don't sit in classrooms. They get on the floor, mix the epoxy, and create real work — guided step by step.",
        align: "left" as const,
    },
];

const FullBleedShowcase = () => {
    const ref = useScrollReveal();

    return (
        <div ref={ref}>
            {showcases.map((item, i) => (
                <section
                    key={item.title}
                    className="relative min-h-[70vh] flex items-center overflow-hidden"
                >
                    {/* Full-bleed Background Image */}
                    <div className="absolute inset-0">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        {/* Dark overlay */}
                        <div className={`absolute inset-0 ${item.align === "left"
                                ? "bg-gradient-to-r from-[#0c0c18]/95 via-[#0c0c18]/70 to-[#0c0c18]/30"
                                : "bg-gradient-to-l from-[#0c0c18]/95 via-[#0c0c18]/70 to-[#0c0c18]/30"
                            }`} />
                    </div>

                    {/* Content */}
                    <div className={`relative z-10 max-w-6xl mx-auto px-8 md:px-16 py-24 w-full flex ${item.align === "right" ? "justify-end" : "justify-start"
                        }`}>
                        <div className="max-w-lg">
                            <p
                                className="text-[#78c8ff] text-xs tracking-[0.3em] uppercase mb-3 font-semibold animate-scroll-fade"
                                style={{ transitionDelay: `${0.1 + i * 0.05}s` }}
                            >
                                {item.subtitle}
                            </p>
                            <h2
                                className={`text-4xl md:text-5xl lg:text-6xl font-bold font-display text-white leading-tight mb-6 ${item.align === "left" ? "animate-scroll-reveal-left" : "animate-scroll-reveal-right"
                                    }`}
                                style={{ transitionDelay: `${0.2 + i * 0.05}s` }}
                            >
                                {item.title}
                            </h2>
                            <p
                                className="text-zinc-300 text-lg leading-relaxed mb-8 animate-scroll-reveal"
                                style={{ transitionDelay: `${0.3 + i * 0.05}s` }}
                            >
                                {item.description}
                            </p>
                            <a
                                href="#upcoming-class"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.querySelector("#upcoming-class")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="inline-flex items-center gap-2 text-[#78c8ff] font-semibold hover:text-white transition-colors group animate-scroll-reveal"
                                style={{ transitionDelay: `${0.4 + i * 0.05}s` }}
                            >
                                Start Your Journey
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
};

export default FullBleedShowcase;
