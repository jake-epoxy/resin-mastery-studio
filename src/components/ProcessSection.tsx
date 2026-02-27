import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
    {
        number: "01",
        title: "Surface Prep",
        description: "Diamond grinding, crack repair, and moisture testing. The foundation of every flawless floor.",
        accent: "#78c8ff",
    },
    {
        number: "02",
        title: "Design",
        description: "Color selection, pattern mapping, and metallic pigment blending. This is where art meets science.",
        accent: "#a78bfa",
    },
    {
        number: "03",
        title: "The Pour",
        description: "Hands-on application of base coat, metallic epoxy, and custom manipulation techniques.",
        accent: "#f472b6",
    },
    {
        number: "04",
        title: "Seal & Protect",
        description: "UV-stable polyaspartic topcoat for a mirror-finish that lasts decades, not months.",
        accent: "#34d399",
    },
];

const ProcessSection = () => {
    const ref = useScrollReveal();

    return (
        <section className="py-32 px-6 relative overflow-hidden" ref={ref}>
            {/* Decorative orbs */}
            <div className="glow-orb w-64 h-64 bg-[#78c8ff] top-20 -left-32" />
            <div className="glow-orb w-48 h-48 bg-[#a78bfa] bottom-20 -right-24" style={{ animationDelay: "3s" }} />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-20">
                    <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 animate-scroll-fade">
                        Our System
                    </p>
                    <h2 className="text-4xl md:text-5xl font-bold font-display leading-tight animate-scroll-scale" style={{ transitionDelay: "0.1s" }}>
                        <span className="text-gradient-animated">Precision in Every Step</span>
                    </h2>
                    <p className="text-zinc-400 text-lg mt-4 max-w-xl mx-auto animate-scroll-reveal" style={{ transitionDelay: "0.2s" }}>
                        Every project follows the same proven system that ensures consistently stunning results.
                    </p>
                </div>

                {/* Process Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((step, i) => (
                        <div
                            key={step.number}
                            className="glass-card rounded-2xl p-6 relative group animate-scroll-reveal"
                            style={{ transitionDelay: `${0.2 + i * 0.12}s` }}
                        >
                            {/* Step Number */}
                            <div
                                className="text-6xl font-display font-black opacity-10 absolute top-4 right-6 transition-opacity duration-500 group-hover:opacity-20"
                                style={{ color: step.accent }}
                            >
                                {step.number}
                            </div>

                            {/* Accent line */}
                            <div
                                className="w-8 h-1 rounded-full mb-5"
                                style={{ background: step.accent }}
                            />

                            <h3 className="text-xl font-display font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>

                            {/* Bottom glow line on hover */}
                            <div
                                className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `linear-gradient(90deg, transparent, ${step.accent}, transparent)` }}
                            />
                        </div>
                    ))}
                </div>

                {/* Connecting shimmer line */}
                <div className="hidden lg:block w-full shimmer-line mt-8" />
            </div>
        </section>
    );
};

export default ProcessSection;
