import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Calendar, Users, DollarSign, Layers, PaintBucket, Paintbrush, Clock, MapPin } from "lucide-react";
import ClassRegistrationModal from "./ClassRegistrationModal";

const UpcomingClassSection = () => {
    const ref = useScrollReveal();
    const [showRegistration, setShowRegistration] = useState(false);

    return (
        <section id="upcoming-class" className="py-32 px-6 relative" ref={ref}>
            {/* Subtle background accent */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#78c8ff]/[0.02] to-transparent pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 animate-scroll-fade">
                        Limited Availability
                    </p>
                    <h2
                        className="text-4xl md:text-5xl font-bold font-display text-primary text-glow leading-tight animate-scroll-scale"
                        style={{ transitionDelay: "0.1s" }}
                    >
                        Upcoming In-Person Class
                    </h2>
                </div>

                {/* Main Card */}
                <div
                    className="animate-scroll-reveal relative rounded-2xl border border-[#78c8ff]/20 bg-card overflow-hidden"
                    style={{ transitionDelay: "0.2s" }}
                >
                    {/* Urgency Banner */}
                    <div className="bg-gradient-to-r from-[#78c8ff]/20 via-[#78c8ff]/10 to-[#78c8ff]/20 px-6 py-3 flex items-center justify-center gap-2 border-b border-[#78c8ff]/10">
                        <Users className="w-4 h-4 text-[#78c8ff]" />
                        <span className="text-sm font-semibold text-[#78c8ff] tracking-wide uppercase">
                            Only 8 Spots Available — Group Design Class
                        </span>
                    </div>

                    <div className="p-8 md:p-12">
                        {/* Top Info Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="flex items-center gap-4 animate-scroll-reveal" style={{ transitionDelay: "0.3s" }}>
                                <div className="w-12 h-12 rounded-xl bg-[#78c8ff]/10 border border-[#78c8ff]/20 flex items-center justify-center shrink-0">
                                    <Calendar className="w-6 h-6 text-[#78c8ff]" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
                                    <p className="text-white font-bold text-lg">April 2 – 4, 2026</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 animate-scroll-reveal" style={{ transitionDelay: "0.4s" }}>
                                <div className="w-12 h-12 rounded-xl bg-[#78c8ff]/10 border border-[#78c8ff]/20 flex items-center justify-center shrink-0">
                                    <Clock className="w-6 h-6 text-[#78c8ff]" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
                                    <p className="text-white font-bold text-lg">3-Day Intensive</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 animate-scroll-reveal" style={{ transitionDelay: "0.5s" }}>
                                <div className="w-12 h-12 rounded-xl bg-[#78c8ff]/10 border border-[#78c8ff]/20 flex items-center justify-center shrink-0">
                                    <DollarSign className="w-6 h-6 text-[#78c8ff]" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Investment</p>
                                    <p className="text-white font-bold text-lg">$1,650 <span className="text-sm font-normal text-muted-foreground">per person</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#78c8ff]/20 to-transparent mb-10" />

                        {/* What You'll Learn */}
                        <div className="mb-10">
                            <h3 className="text-xl font-display font-semibold text-primary mb-6 animate-scroll-reveal" style={{ transitionDelay: "0.5s" }}>
                                What You'll Master
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="group p-6 rounded-xl border border-border/50 bg-background/50 hover:border-[#78c8ff]/30 transition-all duration-300 animate-scroll-reveal" style={{ transitionDelay: "0.6s" }}>
                                    <Layers className="w-8 h-8 text-muted-foreground mb-4 group-hover:text-[#78c8ff] transition-colors" strokeWidth={1.5} />
                                    <h4 className="text-white font-semibold mb-2">Floor Design Methods</h4>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Learn advanced techniques for creating stunning epoxy floor designs from prep to final coat.
                                    </p>
                                </div>
                                <div className="group p-6 rounded-xl border border-border/50 bg-background/50 hover:border-[#78c8ff]/30 transition-all duration-300 animate-scroll-reveal" style={{ transitionDelay: "0.7s" }}>
                                    <PaintBucket className="w-8 h-8 text-muted-foreground mb-4 group-hover:text-[#78c8ff] transition-colors" strokeWidth={1.5} />
                                    <h4 className="text-white font-semibold mb-2">Countertop Design</h4>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Master high-gloss countertop coatings with professional color blending and finishing techniques.
                                    </p>
                                </div>
                                <div className="group p-6 rounded-xl border border-border/50 bg-background/50 hover:border-[#78c8ff]/30 transition-all duration-300 animate-scroll-reveal" style={{ transitionDelay: "0.8s" }}>
                                    <Paintbrush className="w-8 h-8 text-muted-foreground mb-4 group-hover:text-[#78c8ff] transition-colors" strokeWidth={1.5} />
                                    <h4 className="text-white font-semibold mb-2">Vertical Application</h4>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Explore wall coating methods and vertical surface techniques for breathtaking accent features.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="text-center animate-scroll-reveal" style={{ transitionDelay: "0.9s" }}>
                            <button
                                onClick={() => setShowRegistration(true)}
                                className="inline-flex items-center gap-2 px-10 py-4 bg-[#78c8ff] text-black font-display font-bold text-lg rounded-xl hover:bg-[#5ab8ff] hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(120,200,255,0.2)] hover:shadow-[0_0_50px_rgba(120,200,255,0.4)] cursor-pointer"
                            >
                                Reserve Your Spot
                            </button>
                            <p className="text-muted-foreground text-xs mt-4 tracking-wide">
                                Spots fill fast. Secure yours before they're gone.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Registration Modal */}
            <ClassRegistrationModal
                isOpen={showRegistration}
                onClose={() => setShowRegistration(false)}
            />
        </section>
    );
};

export default UpcomingClassSection;
