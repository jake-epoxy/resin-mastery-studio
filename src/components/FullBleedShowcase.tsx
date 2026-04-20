import { ArrowRight, Bot, Banknote, CalendarCheck } from "lucide-react";

const showcases = [
    {
        id: "quote",
        image: "/gallery/countertop-floor.jpg",
        icon: <Banknote className="w-8 h-8 text-[#78c8ff]" />,
        title: "Smart Quoting Engine",
        subtitle: "Generate Proposals in 60 Seconds",
        description: "Don't spend hours writing estimates. Build flawless, professional quotes on your phone right at the kitchen table. Win the job before your competitor even opens their laptop.",
    },
    {
        id: "crm",
        image: "/gallery/living-room-marble.jpg",
        icon: <Bot className="w-8 h-8 text-[#ff2a2a]" />,
        title: "Automated Client CRM",
        subtitle: "Never Let A Lead Go Cold",
        description: "Our AI tracks your leads, sends automated follow-ups, and alerts you when a client opens your quote. Complete visibility into your entire sales pipeline.",
    },
    {
        id: "ops",
        image: "/gallery/staircase-install.jpg",
        icon: <CalendarCheck className="w-8 h-8 text-[#a78bfa]" />,
        title: "Operations Hub",
        subtitle: "Schedule Installs & Collect Payments",
        description: "Transform your chaotic whiteboards into a streamlined digital calendar. Collect deposits instantly and manage your entire workforce seamlessly from one dashboard.",
    },
];

const FullBleedShowcase = () => {
    return (
        <div className="relative bg-[#050505]">
            {showcases.map((item, index) => (
                <div 
                    key={`bg-${item.id}`} 
                    className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]"
                    style={{ zIndex: index * 10 }}
                >
                    {/* Shadow overlay to create depth when the next curtain scrolls over this one */}
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#050505] to-transparent z-20 pointer-events-none opacity-80" />
                    
                    <img
                        src={item.image}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                    
                    {/* Dark gradient mapping for incredible SaaS contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/40 to-transparent" />
                    
                    {/* Content */}
                    <div className="relative z-30 w-full max-w-6xl mx-auto px-6 h-full flex flex-col justify-center">
                        <div className="absolute left-6 md:left-12 lg:left-24 top-1/2 -translate-y-1/2 max-w-xl">
                            <div className="mb-6 p-4 inline-flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                {item.icon}
                            </div>
                            <h3 className="text-[#78c8ff] text-sm tracking-[0.25em] uppercase mb-4 font-bold drop-shadow-md">
                                {item.subtitle}
                            </h3>
                            <h2 className="text-5xl md:text-6xl font-bold font-display text-white leading-tight mb-6 tracking-tight drop-shadow-xl">
                                {item.title}
                            </h2>
                            <p className="text-zinc-300 text-lg md:text-xl leading-relaxed mb-8 drop-shadow-md">
                                {item.description}
                            </p>
                            <a
                                href="#quote-engine"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.querySelector("#quote-engine")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all hover:bg-zinc-200"
                            >
                                Explore Feature
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FullBleedShowcase;
