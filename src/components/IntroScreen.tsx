import { useState, useEffect } from "react";
import { Terminal, ShieldCheck, ChevronRight, FileText, Map as MapIcon, Wrench, GraduationCap, Calculator } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { RainbowButton } from "@/components/ui/rainbow-button";

export default function IntroScreen() {
    const [phase, setPhase] = useState<"initializing" | "authenticating" | "granted" | "menu" | "closed">("initializing");
    const [text1, setText1] = useState("");
    const [text2, setText2] = useState("");
    const [text3, setText3] = useState("");

    // Check session storage so they only see it once per visit
    const [hasSeenIntro, setHasSeenIntro] = useState(true); // Default to true to prevent flash

    useEffect(() => {
        const seen = sessionStorage.getItem("hasSeenIntro");
        if (!seen) {
            setHasSeenIntro(false);
            startSequence();
        } else {
            setPhase("closed");
        }
    }, []);

    const startSequence = () => {
        const typeString = (setter: React.Dispatch<React.SetStateAction<string>>, str: string, delay: number, callback: () => void) => {
            let i = 0;
            const interval = setInterval(() => {
                setter(str.slice(0, i + 1));
                i++;
                if (i === str.length) {
                    clearInterval(interval);
                    setTimeout(callback, 50); // pause after typing (reduced)
                }
            }, 15); // typing speed (reduced from 40 to 15)
        };

        // Phase 1
        setTimeout(() => {
            typeString(setText1, "> SECURE CONNECTION ESTABLISHED...", 15, () => {
                setPhase("authenticating");
                setTimeout(() => {
                    typeString(setText2, "> AUTHENTICATING CREDENTIALS...", 15, () => {
                        setPhase("granted");
                        setTimeout(() => {
                            typeString(setText3, "> ACCESS GRANTED. INITIALIZING SYSTEM.", 15, () => {
                                setTimeout(() => {
                                    setPhase("menu");
                                }, 300); // reduced from 600
                            });
                        }, 100); // reduced from 200
                    });
                }, 100); // reduced from 300
            });
        }, 300); // reduced from 500
    };

    const handleLinkClick = (id: string, isContact?: boolean) => {
        setPhase("closed");
        sessionStorage.setItem("hasSeenIntro", "true");

        // Custom event or simple smooth scroll if element exists
        setTimeout(() => {
            if (isContact) {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                return;
            }
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth" });
            }
        }, 500);
    };

    const handleSkip = () => {
        setPhase("closed");
        sessionStorage.setItem("hasSeenIntro", "true");
    };

    if (hasSeenIntro && phase === "closed") return null;

    return (
        <div
            className={`fixed inset-0 z-[100] bg-[#0c0c18] text-[#78c8ff] font-mono flex flex-col transition-opacity duration-1000 ${phase === "closed" ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
                }`}
        >
            {/* Terminal typing sequence */}
            {(phase === "initializing" || phase === "authenticating" || phase === "granted") && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-3xl mx-auto">
                    <div className="relative w-full rounded-[14px] p-[2px] shadow-[0_0_40px_rgba(120,200,255,0.1)]">
                        <GlowingEffect spread={60} glow={true} disabled={false} proximity={120} inactiveZone={0} borderWidth={3} className="rounded-[14px]" />
                        <div className="relative w-full h-[300px] flex items-center justify-center overflow-hidden rounded-xl bg-[#0c0c18] border border-white/5 p-8 z-10">
                            {/* Subtle grid background for the terminal */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#78c8ff1a_1px,transparent_1px),linear-gradient(to_bottom,#78c8ff1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] z-0" />

                            <div className="w-full max-w-xl text-left space-y-4 relative z-10">
                                <div className="flex items-center gap-2 mb-8 text-[#78c8ff]/50">
                                    <Terminal className="w-5 h-5" />
                                    <span className="text-sm tracking-widest uppercase font-bold drop-shadow-[0_0_10px_rgba(120,200,255,0.3)]">Resin Academics Terminal v2.0</span>
                                </div>

                                <div className="h-6">
                                    <p className="text-lg md:text-xl font-medium tracking-wide text-[#78c8ff] drop-shadow-[0_0_5px_rgba(120,200,255,0.5)]">{text1}</p>
                                </div>
                                <div className="h-6">
                                    <p className="text-lg md:text-xl font-medium tracking-wide text-[#78c8ff] drop-shadow-[0_0_5px_rgba(120,200,255,0.5)]">{text2}</p>
                                </div>
                                <div className="h-6">
                                    <p className={`text-lg md:text-xl font-medium tracking-wide ${phase === "granted" ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" : ""}`}>
                                        {text3}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-[#78c8ff] animate-pulse">
                                    <div className="w-3 h-6 bg-[#78c8ff] shadow-[0_0_10px_rgba(120,200,255,0.8)]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Link Tree Menu */}
            {phase === "menu" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0c0c18] animate-in fade-in duration-700">

                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#78c8ff]/5 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 w-full max-w-md mx-auto space-y-8">
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-[#78c8ff]/10 rounded-2xl flex items-center justify-center border border-[#78c8ff]/20 shadow-[0_0_30px_rgba(120,200,255,0.15)] mb-6">
                                <ShieldCheck className="w-8 h-8 text-[#78c8ff]" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-sans font-bold text-white tracking-tight">
                                Access Granted
                            </h1>
                            <div className="pt-4 pb-6">
                                <RainbowButton onClick={handleSkip}>
                                    Enter Resin Academics
                                </RainbowButton>
                            </div>
                            <p className="text-sm tracking-widest uppercase text-[#78c8ff]/70 font-mono">
                                Select Destination
                            </p>
                        </div>

                        <div className="space-y-4 flex flex-col font-sans">
                            {/* Primary CTA */}
                            <div className="w-full group">
                                <button
                                    onClick={() => handleLinkClick("starter-kit")}
                                    className="relative block w-full rounded-[14px] p-[2px] hover:scale-[1.02] transition-transform duration-300 shadow-[0_0_20px_rgba(120,200,255,0.1)] hover:shadow-[0_0_30px_rgba(120,200,255,0.3)] text-left"
                                >
                                    <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                                    <div className="relative w-full h-full flex items-center justify-between overflow-hidden rounded-xl bg-[#0c0c18] p-4 z-10">
                                        <div className="absolute inset-0 bg-[#78c8ff]/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-0" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="w-10 h-10 rounded-lg bg-[#78c8ff] flex items-center justify-center shrink-0">
                                                <FileText className="w-5 h-5 text-black" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-lg">Free Starter Kit</h3>
                                                <p className="text-[#78c8ff] text-sm font-medium">Download the PDF guide</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[#78c8ff] group-hover:translate-x-1 transition-transform relative z-10" />
                                    </div>
                                </button>
                            </div>

                            {/* Secondary Links */}
                            <div className="grid grid-cols-1 gap-3">
                                <div className="w-full group">
                                    <a
                                        href="https://Mud2Marble.xyz"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative block w-full rounded-[14px] p-[1.5px] hover:scale-[1.01] transition-transform duration-300 text-left"
                                    >
                                        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={1.5} />
                                        <div className="relative w-full h-full flex items-center justify-between overflow-hidden rounded-xl bg-[#0c0c18] p-4 z-10">
                                            <div className="flex items-center gap-3 relative z-10">
                                                <svg className="w-5 h-5 text-[#78c8ff]/70 group-hover:text-[#78c8ff] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                                    <line x1="3" y1="6" x2="21" y2="6" />
                                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                                </svg>
                                                <span className="text-white font-medium">Buy Epoxy Products</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all relative z-10" />
                                        </div>
                                    </a>
                                </div>
                                <div className="w-full group">
                                    <button
                                        onClick={() => handleLinkClick("programs")}
                                        className="relative block w-full rounded-[14px] p-[1.5px] hover:scale-[1.01] transition-transform duration-300 text-left"
                                    >
                                        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={1.5} />
                                        <div className="relative w-full h-full flex items-center justify-between overflow-hidden rounded-xl bg-[#0c0c18] p-4 z-10">
                                            <div className="flex items-center gap-3 relative z-10">
                                                <GraduationCap className="w-5 h-5 text-[#78c8ff]/70 group-hover:text-[#78c8ff] transition-colors" />
                                                <span className="text-white font-medium">Explore Programs</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all relative z-10" />
                                        </div>
                                    </button>
                                </div>

                                <div className="w-full group">
                                    <button
                                        onClick={() => handleLinkClick("quote")}
                                        className="relative block w-full rounded-[14px] p-[1.5px] hover:scale-[1.01] transition-transform duration-300 text-left"
                                    >
                                        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={1.5} />
                                        <div className="relative w-full h-full flex items-center justify-between overflow-hidden rounded-xl bg-[#0c0c18] p-4 z-10">
                                            <div className="flex items-center gap-3 relative z-10">
                                                <Calculator className="w-5 h-5 text-[#78c8ff]/70 group-hover:text-[#78c8ff] transition-colors" />
                                                <span className="text-white font-medium">Get an Instant Quote</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all relative z-10" />
                                        </div>
                                    </button>
                                </div>

                                <div className="w-full group">
                                    <button
                                        onClick={() => handleLinkClick("services")}
                                        className="relative block w-full rounded-[14px] p-[1.5px] hover:scale-[1.01] transition-transform duration-300 text-left"
                                    >
                                        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={1.5} />
                                        <div className="relative w-full h-full flex items-center justify-between overflow-hidden rounded-xl bg-[#0c0c18] p-4 z-10">
                                            <div className="flex items-center gap-3 relative z-10">
                                                <Wrench className="w-5 h-5 text-[#78c8ff]/70 group-hover:text-[#78c8ff] transition-colors" />
                                                <span className="text-white font-medium">Our Services</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all relative z-10" />
                                        </div>
                                    </button>
                                </div>

                                <div className="w-full group">
                                    <button
                                        onClick={() => handleLinkClick("map")}
                                        className="relative block w-full rounded-[14px] p-[1.5px] hover:scale-[1.01] transition-transform duration-300 text-left"
                                    >
                                        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={1.5} />
                                        <div className="relative w-full h-full flex items-center justify-between overflow-hidden rounded-xl bg-[#0c0c18] p-4 z-10">
                                            <div className="flex items-center gap-3 relative z-10">
                                                <MapIcon className="w-5 h-5 text-[#78c8ff]/70 group-hover:text-[#78c8ff] transition-colors" />
                                                <span className="text-white font-medium">View Installer Map</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all relative z-10" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center justify-center gap-5 pt-6">
                            <a href="https://www.instagram.com/jake.epoxy/" target="_blank" rel="noopener noreferrer" className="group w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-[#78c8ff]/50 hover:bg-[#78c8ff]/10 transition-all duration-300" aria-label="Instagram">
                                <svg className="w-4 h-4 text-zinc-500 group-hover:text-[#78c8ff] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                            </a>
                            <a href="https://www.facebook.com/jacob.flores.453299" target="_blank" rel="noopener noreferrer" className="group w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-[#78c8ff]/50 hover:bg-[#78c8ff]/10 transition-all duration-300" aria-label="Facebook">
                                <svg className="w-4 h-4 text-zinc-500 group-hover:text-[#78c8ff] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                            </a>
                            <a href="https://www.tiktok.com/@jake.epoxy" target="_blank" rel="noopener noreferrer" className="group w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-[#78c8ff]/50 hover:bg-[#78c8ff]/10 transition-all duration-300" aria-label="TikTok">
                                <svg className="w-4 h-4 text-zinc-500 group-hover:text-[#78c8ff] transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.8a8.24 8.24 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.21z" /></svg>
                            </a>
                        </div>

                        {/* Enter Full Site Button */}
                        <div className="pt-4 text-center">
                            <button
                                onClick={handleSkip}
                                className="text-zinc-500 hover:text-white text-sm font-medium transition-colors hover:underline underline-offset-4"
                            >
                                Skip & Enter Full Site
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
