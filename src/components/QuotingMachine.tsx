import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Color data sourced from https://mud2marble.xyz/                   */
/* ------------------------------------------------------------------ */

interface ColorSwatch {
    name: string;
    hex: string;
    image?: string;
}

type SystemType = "metallic" | "flake";
type SpaceType = "residential" | "commercial";

const metallicPigments: ColorSwatch[] = [
    { name: "Brass", hex: "#b5a642" },
    { name: "Bright White", hex: "#f5f5f5" },
    { name: "Cambridge Blue", hex: "#a3c1ad" },
    { name: "Chestnut", hex: "#954535" },
    { name: "Copper", hex: "#b87333" },
    { name: "Earth Gray", hex: "#6b6b6b" },
    { name: "Forest Green", hex: "#228b22" },
    { name: "Green Apple", hex: "#8db600" },
    { name: "Gun Metal", hex: "#2a3439" },
    { name: "Magic Yellow", hex: "#f5d300" },
    { name: "Ocean Blue", hex: "#0077be" },
    { name: "Orange Gold", hex: "#c9760c" },
    { name: "Orange Red", hex: "#ff4500" },
    { name: "Pearl", hex: "#eae0c8" },
    { name: "Pink", hex: "#e8a0bf" },
    { name: "Purple", hex: "#6a0dad" },
    { name: "Sand", hex: "#c2b280" },
    { name: "Shimmer Gold", hex: "#d4af37" },
    { name: "Silver", hex: "#c0c0c0" },
    { name: "Sky Blue", hex: "#87ceeb" },
    { name: "Titanium", hex: "#878681" },
    { name: "Violet", hex: "#7f00ff" },
    { name: "Wine Red", hex: "#722f37" },
    { name: "Emerald Green", hex: "#50c878" },
    { name: "Rum", hex: "#80461b" },
    { name: "Butterscotch", hex: "#e09540" },
    { name: "Mint Green", hex: "#98fb98" },
    { name: "Wave Blue", hex: "#0369a1" },
    { name: "Ultra Sparkle Glitter", hex: "#e8e8f0" },
    { name: "Yellow Glow", hex: "#d4e157" },
];

const flakeChips: ColorSwatch[] = [
    { name: "Blue Granite", hex: "#7a8a78", image: "/flakes/blue-granite.png" },
    { name: "Quartzite", hex: "#c4b9a8", image: "/flakes/quartzite.png" },
    { name: "Turquoise", hex: "#6b8079", image: "/flakes/turquoise.png" },
    { name: "Slate", hex: "#5e706a", image: "/flakes/slate.png" },
    { name: "Shale", hex: "#8a8172", image: "/flakes/shale.png" },
    { name: "Claystone", hex: "#b89e82", image: "/flakes/claystone.png" },
    { name: "Limestone", hex: "#9a8e80", image: "/flakes/limestone.png" },
    { name: "Blacktop", hex: "#2d2a2a", image: "/flakes/blacktop.png" },
];

type Step = 1 | 2 | 3 | 4 | 5;

const QuotingMachine = () => {
    const ref = useScrollReveal();
    const [step, setStep] = useState<Step>(1);
    const [system, setSystem] = useState<SystemType | null>(null);

    // Metallic: multi-select; Flake: single-select
    const [selectedColors, setSelectedColors] = useState<ColorSwatch[]>([]);
    const [selectedFlakeColor, setSelectedFlakeColor] = useState<ColorSwatch | null>(null);

    const [spaceType, setSpaceType] = useState<SpaceType>("residential");
    const [sqft, setSqft] = useState(400);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        zip: "",
        notes: "",
    });
    const [submitted, setSubmitted] = useState(false);

    const currentSwatches = system === "metallic" ? metallicPigments : flakeChips;

    const goTo = (s: Step) => setStep(s);
    const goNext = () => setStep((s) => Math.min(s + 1, 5) as Step);
    const goPrev = () => setStep((s) => Math.max(s - 1, 1) as Step);

    // Toggle a metallic pigment color on/off
    const toggleMetallicColor = (color: ColorSwatch) => {
        setSelectedColors((prev) => {
            const exists = prev.find((c) => c.name === color.name);
            if (exists) return prev.filter((c) => c.name !== color.name);
            if (prev.length >= 5) return prev; // max 5 colors
            return [...prev, color];
        });
    };

    // Price estimation
    const priceRange = useMemo(() => {
        const low = sqft * 10;
        const high = sqft * 20;
        return { low, high };
    }, [sqft]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.phone || !formData.zip) {
            alert("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        // Build a nice summary of the quote for the email
        const colorSummary = system === "metallic"
            ? selectedColors.map(c => c.name).join(", ")
            : selectedFlakeColor?.name || "None";

        try {
            const response = await fetch("https://formsubmit.co/ajax/PourMastersLLC@gmail.com", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    _subject: `🏠 New Quote Request — ${system === "metallic" ? "Metallic Epoxy" : "Flake System"} | ${formData.name}`,
                    "Customer Name": formData.name,
                    "Email": formData.email,
                    "Phone": formData.phone,
                    "Zip Code": formData.zip,
                    "Floor System": system === "metallic" ? "Metallic Epoxy" : "Flake System",
                    "Selected Colors": colorSummary,
                    "Space Type": spaceType === "residential" ? "Residential" : "Commercial",
                    "Square Footage": `${sqft.toLocaleString()} sqft`,
                    "Estimated Range": `$${priceRange.low.toLocaleString()} – $${priceRange.high.toLocaleString()}`,
                    "Project Notes": formData.notes || "None",
                    _template: "table",
                }),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                alert("Something went wrong. Please try again or email us directly at PourMastersLLC@gmail.com.");
            }
        } catch {
            alert("Network error. Please try again or email us directly at PourMastersLLC@gmail.com.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to build a gradient from selected metallic colors
    const getMetallicGradient = () => {
        if (selectedColors.length === 0) return "#1a1a1a";
        if (selectedColors.length === 1) return selectedColors[0].hex;
        const stops = selectedColors
            .map((c, i) => `${c.hex} ${Math.round((i / (selectedColors.length - 1)) * 100)}%`)
            .join(", ");
        return `linear-gradient(135deg, ${stops})`;
    };

    // Get the active color(s) display for summary
    const activeColorNames = system === "metallic"
        ? selectedColors.map((c) => c.name).join(", ")
        : selectedFlakeColor?.name || "";

    // Total steps differ: metallic has preview step; flake skips it
    const stepLabels =
        system === "metallic"
            ? ["System", "Colors", "Preview", "Details", "Contact"]
            : ["System", "Color", "Preview", "Details", "Contact"];

    return (
        <section id="quote" className="py-32 px-6 relative" ref={ref}>
            <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 animate-scroll-reveal">
                        Instant Estimate
                    </p>
                    <h2
                        className="text-4xl md:text-5xl font-bold font-display text-primary text-glow-strong leading-tight animate-scroll-reveal"
                        style={{ transitionDelay: "0.1s" }}
                    >
                        Build Your Quote
                    </h2>
                    <p
                        className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4 animate-scroll-reveal"
                        style={{ transitionDelay: "0.2s" }}
                    >
                        Explore colors from{" "}
                        <a
                            href="https://mud2marble.xyz/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#78c8ff] hover:underline"
                        >
                            Mud2Marble
                        </a>{" "}
                        and see your floor come to life.
                    </p>
                </div>

                {/* Progress steps */}
                <div
                    className="flex items-center justify-center gap-2 mb-12 animate-scroll-reveal"
                    style={{ transitionDelay: "0.25s" }}
                >
                    {stepLabels.map((label, i) => {
                        const stepNum = (i + 1) as Step;
                        const isActive = step === stepNum;
                        const isComplete = step > stepNum;
                        return (
                            <div key={label} className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (stepNum <= step) goTo(stepNum);
                                    }}
                                    className={`
                    w-9 h-9 rounded-full text-xs font-display font-semibold flex items-center justify-center transition-all duration-500
                    ${isActive ? "bg-[#78c8ff] text-black shadow-[0_0_20px_rgba(120,200,255,0.5)]" : ""}
                    ${isComplete ? "bg-[#78c8ff]/30 text-[#78c8ff] border border-[#78c8ff]/40" : ""}
                    ${!isActive && !isComplete ? "bg-secondary text-muted-foreground border border-border" : ""}
                  `}
                                >
                                    {isComplete ? "✓" : stepNum}
                                </button>
                                <span
                                    className={`text-xs tracking-wide hidden sm:inline ${isActive ? "text-[#78c8ff]" : "text-muted-foreground"
                                        }`}
                                >
                                    {label}
                                </span>
                                {i < stepLabels.length - 1 && (
                                    <div
                                        className={`w-8 md:w-16 h-px ${isComplete ? "bg-[#78c8ff]/40" : "bg-border"
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Machine body */}
                <div
                    className="quoting-machine rounded-lg border border-border bg-card/80 backdrop-blur-sm overflow-hidden animate-scroll-reveal"
                    style={{ transitionDelay: "0.3s" }}
                >
                    {/* ===== STEP 1: Choose System ===== */}
                    {step === 1 && (
                        <div className="p-8 md:p-12 step-transition">
                            <h3 className="text-2xl font-display font-semibold text-primary mb-2">
                                Choose Your Floor System
                            </h3>
                            <p className="text-muted-foreground text-sm mb-8">
                                Select the type of epoxy coating system for your space.
                            </p>
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Metallic */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSystem("metallic");
                                        setSelectedColors([]);
                                        setSelectedFlakeColor(null);
                                        goNext();
                                    }}
                                    className={`group relative p-8 rounded-lg border text-left transition-all duration-500 hover:scale-[1.02] ${system === "metallic"
                                        ? "border-[#78c8ff]/60 bg-[#78c8ff]/5"
                                        : "border-border hover:border-[#78c8ff]/30"
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400/20 to-cyan-400/20 flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-[#78c8ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-display font-semibold text-primary mb-2">
                                        Metallic Epoxy
                                    </h4>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        High-gloss, reflective metallic finishes with swirling patterns.
                                        Choose multiple colors for custom blends.
                                    </p>
                                    <div className="flex gap-1 mt-4">
                                        {metallicPigments.slice(0, 8).map((c) => (
                                            <div
                                                key={c.name}
                                                className="w-4 h-4 rounded-full border border-white/10"
                                                style={{ background: c.hex }}
                                            />
                                        ))}
                                        <span className="text-xs text-muted-foreground self-center ml-1">
                                            +{metallicPigments.length - 8}
                                        </span>
                                    </div>
                                </button>

                                {/* Flake */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSystem("flake");
                                        setSelectedColors([]);
                                        setSelectedFlakeColor(null);
                                        goNext();
                                    }}
                                    className={`group relative p-8 rounded-lg border text-left transition-all duration-500 hover:scale-[1.02] ${system === "flake"
                                        ? "border-[#78c8ff]/60 bg-[#78c8ff]/5"
                                        : "border-border hover:border-[#78c8ff]/30"
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-stone-400/20 to-amber-400/20 flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-[#78c8ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-display font-semibold text-primary mb-2">
                                        Flake System
                                    </h4>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Natural stone-look & chip broadcast coatings. Durable,
                                        slip-resistant, and timeless.
                                    </p>
                                    <div className="flex gap-1 mt-4">
                                        {flakeChips.map((c) => (
                                            <div
                                                key={c.name}
                                                className="w-4 h-4 rounded-full border border-white/10"
                                                style={{ background: c.hex }}
                                            />
                                        ))}
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 2: Pick Colors ===== */}
                    {step === 2 && (
                        <div className="p-8 md:p-12 step-transition">
                            <h3 className="text-2xl font-display font-semibold text-primary mb-2">
                                {system === "metallic" ? "Choose Your Colors" : "Choose Your Color"}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-2">
                                {system === "metallic"
                                    ? "Select up to 5 metallic pigments to blend on your floor. Click to toggle."
                                    : "Select a flake chip or stone blend for your floor."}
                            </p>

                            {/* Selected colors indicator (metallic only) */}
                            {system === "metallic" && selectedColors.length > 0 && (
                                <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-[#78c8ff]/5 border border-[#78c8ff]/20">
                                    <span className="text-xs text-muted-foreground">Selected:</span>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedColors.map((c) => (
                                            <span
                                                key={c.name}
                                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border border-[#78c8ff]/30 bg-[#78c8ff]/10 text-[#78c8ff]"
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full border border-white/20"
                                                    style={{ background: c.hex }}
                                                />
                                                {c.name}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleMetallicColor(c)}
                                                    className="ml-0.5 hover:text-white"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {selectedColors.length}/5
                                    </span>
                                </div>
                            )}

                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                {currentSwatches.map((color) => {
                                    const isSelected =
                                        system === "metallic"
                                            ? selectedColors.some((c) => c.name === color.name)
                                            : selectedFlakeColor?.name === color.name;

                                    return (
                                        <button
                                            key={color.name}
                                            type="button"
                                            onClick={() => {
                                                if (system === "metallic") {
                                                    toggleMetallicColor(color);
                                                } else {
                                                    setSelectedFlakeColor(color);
                                                    goNext();
                                                }
                                            }}
                                            className={`group relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-300 hover:scale-110 hover:z-10 ${isSelected
                                                ? "border-[#78c8ff] bg-[#78c8ff]/10 shadow-[0_0_15px_rgba(120,200,255,0.3)]"
                                                : "border-border/50 hover:border-[#78c8ff]/40"
                                                }`}
                                        >
                                            <div className="relative">
                                                <div
                                                    className="w-10 h-10 rounded-full border-2 border-white/10 swatch-dot overflow-hidden"
                                                    style={color.image ? {
                                                        backgroundColor: '#d4d0c8',
                                                        backgroundImage: `url(${color.image})`,
                                                        backgroundSize: '250%',
                                                        backgroundPosition: 'center 40%',
                                                    } : { background: color.hex }}
                                                />
                                                {isSelected && system === "metallic" && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#78c8ff] flex items-center justify-center">
                                                        <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground text-center leading-tight group-hover:text-primary transition-colors">
                                                {color.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between mt-8">
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    className="px-6 py-2 text-sm border border-border text-muted-foreground rounded-sm hover:border-[#78c8ff]/30 hover:text-primary transition-all duration-300"
                                >
                                    ← Back
                                </button>
                                {system === "metallic" && selectedColors.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        className="px-8 py-2 text-sm bg-[#78c8ff] text-black font-display font-semibold rounded-sm hover:shadow-[0_0_20px_rgba(120,200,255,0.4)] transition-all duration-300 hover:scale-105"
                                    >
                                        Next — Preview Your Floor →
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 3: Preview (with space type for metallic) ===== */}
                    {step === 3 && (
                        <div className="p-8 md:p-12 step-transition">
                            <h3 className="text-2xl font-display font-semibold text-primary mb-2">
                                Preview Your Floor
                            </h3>
                            <p className="text-muted-foreground text-sm mb-8">
                                {system === "metallic"
                                    ? `Your ${selectedColors.length}-color metallic pigment blend.`
                                    : `Check out the ${selectedFlakeColor?.name} stone flake blend below.`}
                            </p>

                            {/* Metallic pigment preview card */}
                            {system === "metallic" && selectedColors.length > 0 && (
                                <div className="flex justify-center mb-10">
                                    <div
                                        className="relative max-w-sm w-full group"
                                        style={{ perspective: '800px' }}
                                    >
                                        <div
                                            className="rounded-2xl overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]"
                                            style={{
                                                boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(120,200,255,0.08)',
                                            }}
                                        >
                                            {/* Metallic swirl swatch */}
                                            <div
                                                className="relative w-full aspect-square"
                                                style={{
                                                    background: selectedColors.length === 1
                                                        ? `radial-gradient(ellipse at 30% 40%, ${selectedColors[0].hex} 0%, ${selectedColors[0].hex}88 60%, ${selectedColors[0].hex}44 100%)`
                                                        : selectedColors.length === 2
                                                            ? `conic-gradient(from 45deg at 50% 50%, ${selectedColors[0].hex}, ${selectedColors[1].hex}, ${selectedColors[0].hex}, ${selectedColors[1].hex}, ${selectedColors[0].hex})`
                                                            : `conic-gradient(from 30deg at 50% 50%, ${selectedColors.map(c => c.hex).join(', ')}, ${selectedColors[0].hex})`,
                                                    filter: 'contrast(1.1) saturate(1.2)',
                                                }}
                                            >
                                                {/* Metallic shimmer overlay */}
                                                <div
                                                    className="absolute inset-0"
                                                    style={{
                                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 40%, rgba(255,255,255,0.15) 60%, transparent 80%, rgba(255,255,255,0.2) 100%)',
                                                        mixBlendMode: 'overlay',
                                                    }}
                                                />
                                                {/* Swirl texture */}
                                                <div
                                                    className="absolute inset-0"
                                                    style={{
                                                        background: `radial-gradient(circle at 25% 35%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 75% 65%, rgba(0,0,0,0.15) 0%, transparent 50%)`,
                                                    }}
                                                />
                                            </div>

                                            {/* Bottom label strip */}
                                            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0c0c18] border-t border-[#78c8ff]/15">
                                                <div className="flex items-center gap-2">
                                                    {selectedColors.map((c) => (
                                                        <div
                                                            key={c.name}
                                                            className="w-3 h-3 rounded-full ring-1 ring-white/20"
                                                            style={{ background: c.hex }}
                                                        />
                                                    ))}
                                                    <span className="text-sm font-display font-medium text-primary tracking-wide ml-1">
                                                        {selectedColors.map(c => c.name).join(' + ')}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                                    Metallic Pigment
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Flake blend preview card */}
                            {system === "flake" && selectedFlakeColor?.image && (
                                <div className="flex justify-center mb-10">
                                    <div
                                        className="relative max-w-sm w-full group"
                                        style={{ perspective: '800px' }}
                                    >
                                        {/* Floating card */}
                                        <div
                                            className="rounded-2xl overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]"
                                            style={{
                                                boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(120,200,255,0.08)',
                                            }}
                                        >
                                            {/* Image area — clean white */}
                                            <div className="bg-white">
                                                <img
                                                    src={selectedFlakeColor.image}
                                                    alt={`${selectedFlakeColor.name} flake blend`}
                                                    className="w-full h-auto block"
                                                />
                                            </div>

                                            {/* Bottom label strip */}
                                            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0c0c18] border-t border-[#78c8ff]/15">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full ring-1 ring-white/20"
                                                        style={{ background: selectedFlakeColor.hex }}
                                                    />
                                                    <span className="text-sm font-display font-medium text-primary tracking-wide">
                                                        {selectedFlakeColor.name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                                    Stone Flake Blend
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between mt-8">
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    className="px-6 py-2 text-sm border border-border text-muted-foreground rounded-sm hover:border-[#78c8ff]/30 hover:text-primary transition-all duration-300"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="px-8 py-2 text-sm bg-[#78c8ff] text-black font-display font-semibold rounded-sm hover:shadow-[0_0_20px_rgba(120,200,255,0.4)] transition-all duration-300 hover:scale-105"
                                >
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 4: Square Footage & Price Estimate ===== */}
                    {step === 4 && (
                        <div className="p-8 md:p-12 step-transition">
                            <h3 className="text-2xl font-display font-semibold text-primary mb-2">
                                Project Details & Estimate
                            </h3>
                            <p className="text-muted-foreground text-sm mb-10">
                                Adjust the square footage to see an estimated price range.
                            </p>

                            {/* Square footage slider */}
                            <div className="max-w-lg mx-auto mb-10">
                                <label className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-muted-foreground">Project Size</span>
                                    <span className="text-sm font-display font-semibold text-primary">
                                        {sqft.toLocaleString()} sq ft
                                    </span>
                                </label>
                                <input
                                    type="range"
                                    min={100}
                                    max={5000}
                                    step={50}
                                    value={sqft}
                                    onChange={(e) => setSqft(Number(e.target.value))}
                                    className="w-full accent-[#78c8ff] quote-range"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>100 sqft</span>
                                    <span>5,000 sqft</span>
                                </div>
                            </div>

                            {/* Price estimate card */}
                            <div className="max-w-lg mx-auto rounded-lg border border-[#78c8ff]/20 bg-[#78c8ff]/5 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                            Estimated Price Range
                                        </p>
                                        <p className="text-3xl md:text-4xl font-display font-bold text-primary text-glow">
                                            ${priceRange.low.toLocaleString()} – ${priceRange.high.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Rate</p>
                                        <p className="text-sm font-display font-semibold text-[#78c8ff]">
                                            $10 – $20 / sqft
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Final pricing depends on surface condition, prep work required, number of colors,
                                    coating system, and location. A Certified Installer will provide an exact quote.
                                </p>
                            </div>

                            {/* Summary */}
                            <div className="max-w-lg mx-auto mt-6 flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground">
                                    {system === "metallic" ? "⚡ Metallic Epoxy" : "🪨 Flake System"}
                                </div>
                                {system === "metallic" && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground capitalize">
                                        {spaceType === "residential" ? "🏠" : "🏢"} {spaceType}
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground">
                                    {system === "metallic" ? (
                                        <>
                                            {selectedColors.slice(0, 3).map((c) => (
                                                <span
                                                    key={c.name}
                                                    className="w-3 h-3 rounded-full inline-block"
                                                    style={{ background: c.hex }}
                                                />
                                            ))}
                                            {selectedColors.length > 3 && <span>+{selectedColors.length - 3}</span>}
                                        </>
                                    ) : (
                                        <>
                                            <span
                                                className="w-3 h-3 rounded-full inline-block"
                                                style={{ background: selectedFlakeColor?.hex }}
                                            />
                                            {selectedFlakeColor?.name}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between mt-10">
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    className="px-6 py-2 text-sm border border-border text-muted-foreground rounded-sm hover:border-[#78c8ff]/30 hover:text-primary transition-all duration-300"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="px-8 py-2 text-sm bg-[#78c8ff] text-black font-display font-semibold rounded-sm hover:shadow-[0_0_20px_rgba(120,200,255,0.4)] transition-all duration-300 hover:scale-105"
                                >
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 5: Contact & Submit ===== */}
                    {step === 5 && !submitted && (
                        <div className="p-8 md:p-12 step-transition">
                            <h3 className="text-2xl font-display font-semibold text-primary mb-2">
                                Get Your Quote
                            </h3>
                            <p className="text-muted-foreground text-sm mb-8">
                                Fill in your details and we'll connect you with a Certified Installer.
                            </p>

                            {/* Summary bar */}
                            <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-lg bg-secondary/50 border border-border/50">
                                <div className="flex items-center gap-2">
                                    {system === "metallic" ? (
                                        selectedColors.map((c) => (
                                            <div
                                                key={c.name}
                                                className="w-4 h-4 rounded-full border border-white/20"
                                                style={{ background: c.hex }}
                                            />
                                        ))
                                    ) : (
                                        <div
                                            className="w-4 h-4 rounded-full border border-white/20"
                                            style={{ background: selectedFlakeColor?.hex }}
                                        />
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                        <span className="text-primary font-medium">{activeColorNames}</span>
                                        {" · "}
                                        {system === "metallic" ? "Metallic Epoxy" : "Flake System"}
                                        {system === "metallic" && ` · ${spaceType}`}
                                        {" · "}
                                        {sqft.toLocaleString()} sqft
                                        {" · "}
                                        <span className="text-[#78c8ff]">
                                            ${priceRange.low.toLocaleString()}–${priceRange.high.toLocaleString()}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-primary placeholder:text-muted-foreground text-sm focus:outline-none focus:border-[#78c8ff]/50 focus:shadow-[0_0_10px_rgba(120,200,255,0.15)] transition-all duration-300"
                                />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-primary placeholder:text-muted-foreground text-sm focus:outline-none focus:border-[#78c8ff]/50 focus:shadow-[0_0_10px_rgba(120,200,255,0.15)] transition-all duration-300"
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-primary placeholder:text-muted-foreground text-sm focus:outline-none focus:border-[#78c8ff]/50 focus:shadow-[0_0_10px_rgba(120,200,255,0.15)] transition-all duration-300"
                                />
                                <input
                                    type="text"
                                    placeholder="Zip Code"
                                    value={formData.zip}
                                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-primary placeholder:text-muted-foreground text-sm focus:outline-none focus:border-[#78c8ff]/50 focus:shadow-[0_0_10px_rgba(120,200,255,0.15)] transition-all duration-300"
                                />
                            </div>
                            <textarea
                                placeholder="Project Notes (optional)"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full mt-4 px-4 py-3 rounded-lg bg-secondary border border-border text-primary placeholder:text-muted-foreground text-sm focus:outline-none focus:border-[#78c8ff]/50 focus:shadow-[0_0_10px_rgba(120,200,255,0.15)] transition-all duration-300 resize-none"
                            />

                            <div className="flex justify-between mt-8">
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    className="px-6 py-2 text-sm border border-border text-muted-foreground rounded-sm hover:border-[#78c8ff]/30 hover:text-primary transition-all duration-300"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-10 py-3 text-sm bg-[#78c8ff] text-black font-display font-semibold rounded-sm hover:shadow-[0_0_25px_rgba(120,200,255,0.5)] transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {isSubmitting ? "Sending..." : "Request Quote"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== Submitted state ===== */}
                    {submitted && (
                        <div className="p-12 md:p-20 text-center step-transition">
                            <div className="w-16 h-16 rounded-full bg-[#78c8ff]/10 border border-[#78c8ff]/30 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#78c8ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-display font-semibold text-primary text-glow mb-4">
                                Quote Requested!
                            </h3>
                            <p className="text-muted-foreground max-w-md mx-auto mb-2">
                                A Certified Installer near you will be contacting you shortly with a high-quality, realistic render of how your space would look with your desired colors.
                            </p>
                            <p className="text-sm text-[#78c8ff] font-display font-semibold">
                                Estimated: ${priceRange.low.toLocaleString()} – ${priceRange.high.toLocaleString()} for {sqft.toLocaleString()} sqft
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setSystem(null);
                                    setSelectedColors([]);
                                    setSelectedFlakeColor(null);
                                    setSpaceType("residential");
                                    setSqft(400);
                                    setFormData({ name: "", email: "", phone: "", zip: "", notes: "" });
                                    setSubmitted(false);
                                }}
                                className="mt-8 px-8 py-3 text-sm border border-[#78c8ff]/30 text-[#78c8ff] rounded-sm hover:bg-[#78c8ff]/10 transition-all duration-300"
                            >
                                Start New Quote
                            </button>
                        </div>
                    )}
                </div>

                {/* Powered by Mud2Marble badge */}
                <div className="mt-6 text-center">
                    <a
                        href="https://mud2marble.xyz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-[#78c8ff] transition-colors duration-300"
                    >
                        Colors powered by Mud2Marble
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
};

export default QuotingMachine;
