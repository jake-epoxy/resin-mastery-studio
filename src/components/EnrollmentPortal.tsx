import { useState, useEffect, useCallback } from "react";
import { Monitor, Users, X, Check, ChevronRight, GraduationCap, Shield, Star, Zap } from "lucide-react";

type EnrollStep = 1 | 2 | 3 | 4;
type ProgramType = "online" | "in-person" | null;

interface EnrollmentPortalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Pre-select a program when opened from a training card */
    preselectedProgram?: ProgramType;
}

const EnrollmentPortal = ({ isOpen, onClose, preselectedProgram }: EnrollmentPortalProps) => {
    const [step, setStep] = useState<EnrollStep>(1);
    const [investmentReady, setInvestmentReady] = useState(false);
    const [seriousApplicant, setSeriousApplicant] = useState(false);
    const [disqualified, setDisqualified] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<ProgramType>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        heardFrom: "",
    });

    // If a program is preselected (e.g. from training cards), skip to step 2
    useEffect(() => {
        if (isOpen && preselectedProgram) {
            setSelectedProgram(preselectedProgram);
        }
    }, [isOpen, preselectedProgram]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(1);
                setInvestmentReady(false);
                setSeriousApplicant(false);
                setDisqualified(false);
                setSelectedProgram(null);
                setIsSubmitting(false);
                setFormData({ name: "", email: "", phone: "", city: "", state: "", heardFrom: "" });
            }, 300);
        }
    }, [isOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const handleQualify = () => {
        if (!investmentReady) {
            setDisqualified(true);
            return;
        }
        setStep(2);
    };

    const handleProgramSelect = (program: ProgramType) => {
        setSelectedProgram(program);
        setStep(3);
    };

    const handleSubmit = useCallback(async () => {
        if (!formData.name || !formData.email || !formData.phone) {
            alert("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        const programLabel = selectedProgram === "online"
            ? "Online 1-on-1 Training ($1,500)"
            : "In-Person 1-on-1 Training ($5,000)";

        try {
            const response = await fetch("https://formsubmit.co/ajax/PourMastersLLC@gmail.com", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    _subject: `🎓 New Enrollment Application — ${programLabel} | ${formData.name}`,
                    "Applicant Name": formData.name,
                    "Email": formData.email,
                    "Phone": formData.phone,
                    "City": formData.city || "Not provided",
                    "State": formData.state || "Not provided",
                    "Program Selected": programLabel,
                    "Investment Ready": "Yes — confirmed $1,500+ available",
                    "How They Heard About Us": formData.heardFrom || "Not specified",
                    _template: "table",
                }),
            });

            if (response.ok) {
                setStep(4);
            } else {
                alert("Something went wrong. Please try again or email PourMastersLLC@gmail.com directly.");
            }
        } catch {
            alert("Network error. Please try again or email PourMastersLLC@gmail.com directly.");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, selectedProgram]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 overflow-y-auto rounded-xl bg-[#0a0a0f] border border-[#78c8ff]/20 shadow-[0_0_80px_rgba(120,200,255,0.08)]">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:text-primary hover:border-[#78c8ff]/30 transition-all duration-300"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Step indicator */}
                {!disqualified && step < 4 && (
                    <div className="px-8 pt-8">
                        <div className="flex items-center justify-center gap-3">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-3">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-500 ${step >= s
                                                ? "bg-[#78c8ff] text-black"
                                                : "bg-white/5 text-muted-foreground border border-white/10"
                                            }`}
                                    >
                                        {step > s ? <Check className="w-4 h-4" /> : s}
                                    </div>
                                    {s < 3 && (
                                        <div
                                            className={`w-16 h-px transition-all duration-500 ${step > s ? "bg-[#78c8ff]" : "bg-white/10"
                                                }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-center gap-3 mt-2">
                            <span className={`text-[10px] tracking-[0.15em] uppercase font-mono ${step >= 1 ? "text-[#78c8ff]" : "text-muted-foreground/50"}`}>Qualify</span>
                            <span className="w-16" />
                            <span className={`text-[10px] tracking-[0.15em] uppercase font-mono ${step >= 2 ? "text-[#78c8ff]" : "text-muted-foreground/50"}`}>Program</span>
                            <span className="w-16" />
                            <span className={`text-[10px] tracking-[0.15em] uppercase font-mono ${step >= 3 ? "text-[#78c8ff]" : "text-muted-foreground/50"}`}>Apply</span>
                        </div>
                    </div>
                )}

                {/* ============================================= */}
                {/* STEP 1 — Qualification Gate                  */}
                {/* ============================================= */}
                {step === 1 && !disqualified && (
                    <div className="p-8 md:p-12">
                        {/* Badge */}
                        <div className="flex justify-center mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#78c8ff]/10 border border-[#78c8ff]/20">
                                <Shield className="w-3.5 h-3.5 text-[#78c8ff]" />
                                <span className="text-[11px] tracking-[0.2em] uppercase text-[#78c8ff] font-mono">Exclusive Application</span>
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-display font-bold text-primary text-center mb-3">
                            Are You Ready to Invest<br />in Yourself?
                        </h2>
                        <p className="text-muted-foreground text-center max-w-lg mx-auto mb-10 text-sm leading-relaxed">
                            Resin Academics is the premier epoxy flooring school in the nation, led by a full-time traveling artist and installer. Our training isn't cheap — because the <span className="text-primary font-medium">best never is</span>.
                        </p>

                        {/* Qualification checkboxes */}
                        <div className="space-y-4 max-w-md mx-auto mb-10">
                            <button
                                onClick={() => setInvestmentReady(!investmentReady)}
                                className={`w-full flex items-start gap-4 p-5 rounded-lg border transition-all duration-300 text-left ${investmentReady
                                        ? "border-[#78c8ff]/40 bg-[#78c8ff]/5 shadow-[0_0_20px_rgba(120,200,255,0.08)]"
                                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                    }`}
                            >
                                <div
                                    className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${investmentReady
                                            ? "border-[#78c8ff] bg-[#78c8ff]"
                                            : "border-white/20"
                                        }`}
                                >
                                    {investmentReady && <Check className="w-4 h-4 text-black" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-primary">
                                        I have at least <span className="text-[#78c8ff] font-bold">$1,500</span> available to invest in my training
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        This is the minimum investment for our online program
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => setSeriousApplicant(!seriousApplicant)}
                                className={`w-full flex items-start gap-4 p-5 rounded-lg border transition-all duration-300 text-left ${seriousApplicant
                                        ? "border-[#78c8ff]/40 bg-[#78c8ff]/5 shadow-[0_0_20px_rgba(120,200,255,0.08)]"
                                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                    }`}
                            >
                                <div
                                    className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${seriousApplicant
                                            ? "border-[#78c8ff] bg-[#78c8ff]"
                                            : "border-white/20"
                                        }`}
                                >
                                    {seriousApplicant && <Check className="w-4 h-4 text-black" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-primary">
                                        I'm serious about starting or leveling up my epoxy business
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Our graduates become certified installers, not hobbyists
                                    </p>
                                </div>
                            </button>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={handleQualify}
                                className="group px-10 py-3.5 text-sm font-display font-semibold bg-[#78c8ff] text-black rounded-lg hover:shadow-[0_0_30px_rgba(120,200,255,0.4)] transition-all duration-300 hover:scale-105 flex items-center gap-2"
                            >
                                Continue Application
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================= */}
                {/* DISQUALIFIED STATE                            */}
                {/* ============================================= */}
                {disqualified && (
                    <div className="p-8 md:p-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-8 h-8 text-amber-400" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-primary mb-4">
                            Not Quite Ready Yet
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-3 text-sm leading-relaxed">
                            Resin Academics is a <span className="text-primary font-medium">premium institution</span> — the most comprehensive epoxy flooring school in the nation, led by a professional traveling artist.
                        </p>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">
                            Our online program starts at <span className="text-[#78c8ff] font-bold">$1,500</span> and in-person at <span className="text-[#78c8ff] font-bold">$5,000</span>. When you're ready to make that investment in yourself, we'll be here.
                        </p>
                        <div className="flex flex-col items-center gap-3">
                            <button
                                onClick={() => {
                                    setDisqualified(false);
                                    setInvestmentReady(false);
                                    setSeriousApplicant(false);
                                }}
                                className="px-8 py-3 text-sm font-display font-semibold bg-[#78c8ff] text-black rounded-lg hover:shadow-[0_0_25px_rgba(120,200,255,0.4)] transition-all duration-300"
                            >
                                I'm Ready — Let Me Try Again
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                Come Back Later
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================= */}
                {/* STEP 2 — Program Selection                   */}
                {/* ============================================= */}
                {step === 2 && (
                    <div className="p-8 md:p-12">
                        <h2 className="text-3xl font-display font-bold text-primary text-center mb-2">
                            Choose Your Program
                        </h2>
                        <p className="text-muted-foreground text-center mb-10 text-sm">
                            Select the training format that fits your goals.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Online 1-on-1 */}
                            <button
                                onClick={() => handleProgramSelect("online")}
                                className="group relative p-8 rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#78c8ff]/40 hover:bg-[#78c8ff]/[0.03] transition-all duration-500 text-left"
                            >
                                <Monitor className="w-10 h-10 text-muted-foreground mb-5 group-hover:text-[#78c8ff] transition-colors" strokeWidth={1.2} />
                                <h3 className="text-xl font-display font-bold text-primary mb-1">Online 1-on-1</h3>
                                <p className="text-[#78c8ff] text-2xl font-display font-bold mb-4">$1,500</p>
                                <ul className="space-y-2.5 text-sm text-muted-foreground mb-6">
                                    {[
                                        "Live virtual 1-on-1 sessions",
                                        "Step-by-step video library",
                                        "Direct instructor messaging",
                                        "Lifetime access to materials",
                                        "Certification upon completion",
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-2.5">
                                            <Check className="w-4 h-4 text-[#78c8ff]/60 mt-0.5 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex items-center gap-2 text-sm text-[#78c8ff] font-display font-semibold group-hover:gap-3 transition-all">
                                    Select Program <ChevronRight className="w-4 h-4" />
                                </div>
                            </button>

                            {/* In-Person 1-on-1 */}
                            <button
                                onClick={() => handleProgramSelect("in-person")}
                                className="group relative p-8 rounded-xl border border-[#78c8ff]/25 bg-[#78c8ff]/[0.03] hover:border-[#78c8ff]/50 hover:bg-[#78c8ff]/[0.06] transition-all duration-500 text-left shadow-[0_0_40px_rgba(120,200,255,0.05)]"
                            >
                                {/* Popular badge */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#78c8ff] text-black text-[10px] tracking-[0.15em] uppercase font-bold flex items-center gap-1.5">
                                    <Star className="w-3 h-3" /> Most Popular
                                </div>

                                <Users className="w-10 h-10 text-[#78c8ff]/70 mb-5 group-hover:text-[#78c8ff] transition-colors" strokeWidth={1.2} />
                                <h3 className="text-xl font-display font-bold text-primary mb-1">In-Person 1-on-1</h3>
                                <p className="text-[#78c8ff] text-2xl font-display font-bold mb-4">$5,000</p>
                                <ul className="space-y-2.5 text-sm text-muted-foreground mb-6">
                                    {[
                                        "Everything in Online — plus:",
                                        "Hands-on with traveling artist",
                                        "Real-world project experience",
                                        "Tools & equipment training",
                                        "Priority certification track",
                                    ].map((item, idx) => (
                                        <li key={item} className="flex items-start gap-2.5">
                                            {idx === 0 ? (
                                                <Zap className="w-4 h-4 text-[#78c8ff] mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <Check className="w-4 h-4 text-[#78c8ff]/60 mt-0.5 flex-shrink-0" />
                                            )}
                                            <span className={idx === 0 ? "text-[#78c8ff] font-medium" : ""}>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex items-center gap-2 text-sm text-[#78c8ff] font-display font-semibold group-hover:gap-3 transition-all">
                                    Select Program <ChevronRight className="w-4 h-4" />
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={() => setStep(1)}
                            className="block mx-auto mt-6 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            ← Back
                        </button>
                    </div>
                )}

                {/* ============================================= */}
                {/* STEP 3 — Application Form                    */}
                {/* ============================================= */}
                {step === 3 && (
                    <div className="p-8 md:p-12">
                        {/* Selected program badge */}
                        <div className="flex justify-center mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#78c8ff]/10 border border-[#78c8ff]/20">
                                {selectedProgram === "online" ? (
                                    <Monitor className="w-3.5 h-3.5 text-[#78c8ff]" />
                                ) : (
                                    <Users className="w-3.5 h-3.5 text-[#78c8ff]" />
                                )}
                                <span className="text-[11px] tracking-[0.15em] uppercase text-[#78c8ff] font-mono">
                                    {selectedProgram === "online" ? "Online 1-on-1 — $1,500" : "In-Person 1-on-1 — $5,000"}
                                </span>
                            </div>
                        </div>

                        <h2 className="text-3xl font-display font-bold text-primary text-center mb-2">
                            Complete Your Application
                        </h2>
                        <p className="text-muted-foreground text-center mb-8 text-sm">
                            Fill in your details and we'll reach out within 24 hours to finalize your enrollment.
                        </p>

                        <div className="max-w-lg mx-auto space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Full Name *"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-primary placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-[#78c8ff]/50 focus:shadow-[0_0_15px_rgba(120,200,255,0.1)] transition-all duration-300"
                                />
                                <input
                                    type="email"
                                    placeholder="Email Address *"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-primary placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-[#78c8ff]/50 focus:shadow-[0_0_15px_rgba(120,200,255,0.1)] transition-all duration-300"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="tel"
                                    placeholder="Phone Number *"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-primary placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-[#78c8ff]/50 focus:shadow-[0_0_15px_rgba(120,200,255,0.1)] transition-all duration-300"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-primary placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-[#78c8ff]/50 focus:shadow-[0_0_15px_rgba(120,200,255,0.1)] transition-all duration-300"
                                    />
                                    <input
                                        type="text"
                                        placeholder="State"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-primary placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-[#78c8ff]/50 focus:shadow-[0_0_15px_rgba(120,200,255,0.1)] transition-all duration-300"
                                    />
                                </div>
                            </div>
                            <select
                                value={formData.heardFrom}
                                onChange={(e) => setFormData({ ...formData, heardFrom: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-primary text-sm focus:outline-none focus:border-[#78c8ff]/50 focus:shadow-[0_0_15px_rgba(120,200,255,0.1)] transition-all duration-300 appearance-none"
                                style={{ colorScheme: "dark" }}
                            >
                                <option value="">How did you hear about us?</option>
                                <option value="Instagram">Instagram</option>
                                <option value="TikTok">TikTok</option>
                                <option value="YouTube">YouTube</option>
                                <option value="Google">Google Search</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Referral">Referral / Word of Mouth</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between max-w-lg mx-auto mt-8">
                            <button
                                onClick={() => setStep(2)}
                                className="px-6 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="group px-10 py-3.5 text-sm font-display font-semibold bg-[#78c8ff] text-black rounded-lg hover:shadow-[0_0_30px_rgba(120,200,255,0.4)] transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Application"}
                                {!isSubmitting && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================= */}
                {/* STEP 4 — Success Confirmation                */}
                {/* ============================================= */}
                {step === 4 && (
                    <div className="p-8 md:p-16 text-center">
                        <div className="w-20 h-20 rounded-full bg-[#78c8ff]/10 border border-[#78c8ff]/30 flex items-center justify-center mx-auto mb-6 animate-bounce" style={{ animationDuration: "2s" }}>
                            <GraduationCap className="w-10 h-10 text-[#78c8ff]" />
                        </div>
                        <h3 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">
                            You're In! 🎓
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-2 text-sm leading-relaxed">
                            Your application for <span className="text-[#78c8ff] font-semibold">
                                {selectedProgram === "online" ? "Online 1-on-1 Training" : "In-Person 1-on-1 Training"}
                            </span> has been received.
                        </p>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">
                            An enrollment advisor will contact you within <span className="text-primary font-medium">24 hours</span> to finalize your spot and discuss next steps.
                        </p>

                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#78c8ff]/10 border border-[#78c8ff]/20 mb-8">
                            <span className="text-sm text-[#78c8ff] font-display font-bold">
                                {selectedProgram === "online" ? "$1,500" : "$5,000"} — {selectedProgram === "online" ? "Online 1-on-1" : "In-Person 1-on-1"}
                            </span>
                        </div>

                        <div>
                            <button
                                onClick={onClose}
                                className="px-10 py-3 text-sm font-display font-semibold bg-[#78c8ff] text-black rounded-lg hover:shadow-[0_0_25px_rgba(120,200,255,0.4)] transition-all duration-300"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnrollmentPortal;
