import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Instagram } from "lucide-react";

const AboutSection = () => {
    const ref = useScrollReveal();

    return (
        <section id="about" className="py-0 relative" ref={ref}>
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
                {/* Left: Image */}
                <div className="relative overflow-hidden animate-scroll-reveal-left" style={{ transitionDelay: "0.1s" }}>
                    <img
                        src="/jake-hero.jpg"
                        alt="Jake Flores — Founder of Resin Academics"
                        className="w-full h-full object-cover min-h-[500px] lg:min-h-full"
                    />
                    {/* Gradient overlay for text readability on mobile */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c18] via-[#0c0c18]/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0c0c18]" />
                </div>

                {/* Right: Story */}
                <div className="relative flex items-center bg-[#0c0c18] px-8 md:px-16 py-16 lg:py-0 -mt-32 lg:mt-0 z-10">
                    <div className="max-w-lg">
                        <p className="text-[#78c8ff] text-xs tracking-[0.3em] uppercase mb-4 font-semibold animate-scroll-fade" style={{ transitionDelay: "0.2s" }}>
                            Meet Your Instructor
                        </p>
                        <h2 className="text-4xl md:text-5xl font-bold font-display text-white leading-tight mb-6 animate-scroll-reveal" style={{ transitionDelay: "0.3s" }}>
                            Jake Flores
                        </h2>
                        <div className="space-y-4 animate-scroll-reveal" style={{ transitionDelay: "0.4s" }}>
                            <p className="text-zinc-300 text-lg leading-relaxed">
                                I didn't start with connections. I didn't start with money. I started with a <span className="text-white font-semibold">bucket of epoxy and a dream.</span>
                            </p>
                            <p className="text-zinc-400 leading-relaxed">
                                Now I run Resin Academics — where I teach real people how to master custom resin flooring, countertops, and vertical applications. This isn't some online course where you watch videos and hope for the best. I put you <span className="text-white font-semibold">in the room, hands on the floor</span>, learning the exact techniques that built my career.
                            </p>
                            <p className="text-zinc-400 leading-relaxed">
                                My students don't just learn epoxy — they learn how to <span className="text-white font-semibold">build a six-figure business</span> from scratch. From design methods to client acquisition, I give you everything I wish someone gave me when I started.
                            </p>
                            <p className="text-zinc-300 text-lg font-semibold italic">
                                "This isn't for everyone. This is for the ones who refuse to stay average."
                            </p>
                        </div>

                        {/* Social + CTA */}
                        <div className="flex flex-wrap items-center gap-4 mt-8 animate-scroll-reveal" style={{ transitionDelay: "0.5s" }}>
                            <a
                                href="#upcoming-class"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.querySelector("#upcoming-class")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-[#78c8ff] text-black font-display font-bold rounded-xl hover:bg-[#5ab8ff] hover:scale-[1.02] transition-all duration-300 shadow-[0_0_30px_rgba(120,200,255,0.2)]"
                            >
                                Train With Me
                            </a>
                            <a
                                href="https://www.instagram.com/jake.epoxy/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 border border-white/15 rounded-xl text-zinc-400 hover:text-white hover:border-white/30 transition-all duration-300"
                            >
                                <Instagram className="w-4 h-4" />
                                @jake.epoxy
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
