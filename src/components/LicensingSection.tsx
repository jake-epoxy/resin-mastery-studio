import { useState } from "react";
import { BookOpen, Video, Package, MapPin, TrendingUp, Award, ChevronRight, Check, Handshake } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const PILLARS = [
    {
        icon: BookOpen,
        title: "Full Curriculum License",
        description: "Teach the complete Resin Academics course material — floor coatings, countertops, wall systems, and business fundamentals.",
    },
    {
        icon: Video,
        title: "Video & Photo Library",
        description: "Access our entire tutorial library, project photos, and marketing content to train students and promote your location.",
    },
    {
        icon: Package,
        title: "Mud2Marble Products",
        description: "Exclusive distributor pricing on our private label resin products. Your students become your customers.",
    },
    {
        icon: MapPin,
        title: "Protected Territory",
        description: "No other licensed Resin Academics location in your market. Your area, your students, zero competition from us.",
    },
    {
        icon: TrendingUp,
        title: "Marketing & SEO Package",
        description: "Local landing page, social media templates, and AI-optimized SEO to dominate search results in your territory.",
    },
    {
        icon: Award,
        title: "Certification Authority",
        description: "Issue official Resin Academics certifications to your graduates. Your students leave job-ready and credential-backed.",
    },
];

const LicensingSection = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", location: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Save lead locally
        const newLead = { ...formData, date: new Date().toISOString(), type: "licensing" };
        const saved = JSON.parse(localStorage.getItem("licensingLeads") || "[]");
        localStorage.setItem("licensingLeads", JSON.stringify([...saved, newLead]));

        try {
            await fetch("https://formsubmit.co/ajax/PourMastersLLC@gmail.com", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    _subject: `🤝 Licensing Inquiry | ${formData.name} — ${formData.location}`,
                    "Name": formData.name,
                    "Email": formData.email,
                    "Phone": formData.phone,
                    "Location/Market": formData.location,
                    "Message": formData.message,
                    "Source": "Licensing Partnership Application",
                    _template: "table",
                }),
            });
        } catch (error) {
            console.error("Failed to send licensing inquiry", error);
        } finally {
            setIsSubmitting(false);
            setIsSuccess(true);
        }
    };

    return (
        <section className="py-24 relative overflow-hidden bg-background">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#78c8ff08_1px,transparent_1px),linear-gradient(to_bottom,#78c8ff08_1px,transparent_1px)] bg-[size:6rem_6rem] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-scroll-reveal">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium tracking-wide mb-6">
                        <Handshake className="w-4 h-4" />
                        PARTNERSHIP OPPORTUNITY
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                        Open a Licensed{" "}
                        <span className="bg-gradient-to-r from-[#78c8ff] via-white to-[#78c8ff] bg-clip-text text-transparent">
                            Resin Academics
                        </span>{" "}
                        Training Center
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                        Bring professional epoxy training to your market. No franchise fees. No royalties.
                        Just a proven curriculum, premium products, and a brand that's already dominating search.
                    </p>
                </div>

                {/* Dual Revenue Callout */}
                <div className="max-w-4xl mx-auto mb-16 animate-scroll-reveal">
                    <div className="relative rounded-2xl border border-accent/20 bg-accent/5 p-8 md:p-10 overflow-hidden">
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                                One License. Two Revenue Streams.
                            </h3>
                            <p className="text-muted-foreground text-lg mb-6">
                                Your students become your customers. Teach them the craft, then supply
                                them with the products they need to build their business.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-white/5">
                                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                                        <Award className="w-4 h-4 text-accent" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Training Revenue</p>
                                        <p className="text-sm text-muted-foreground">Charge per student for hands-on certification classes using our proven curriculum</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-white/5">
                                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                                        <Package className="w-4 h-4 text-accent" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Product Revenue</p>
                                        <p className="text-sm text-muted-foreground">Exclusive distributor pricing on Mud2Marble private label resin — sell at full retail</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6 Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
                    {PILLARS.map((pillar, i) => (
                        <div
                            key={i}
                            className="group relative p-6 rounded-xl border border-white/5 bg-zinc-950/50 hover:border-accent/30 transition-all duration-500 animate-scroll-reveal"
                            style={{ transitionDelay: `${i * 0.1}s` }}
                        >
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(120,200,255,0.2)] transition-shadow duration-500">
                                    <pillar.icon className="w-6 h-6 text-accent" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2">{pillar.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* How It Works */}
                <div className="max-w-4xl mx-auto mb-16 animate-scroll-reveal">
                    <h3 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">
                        How It Works
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: "01", title: "Apply", desc: "Tell us about your market, your experience, and your vision. We're selective — we want partners who are serious." },
                            { step: "02", title: "Train", desc: "Come to our facility for an intensive training bootcamp. Learn the curriculum, products, and how to run a profitable training center." },
                            { step: "03", title: "Launch", desc: "Open your doors with a full curriculum, product supply chain, marketing assets, and the Resin Academics brand behind you." },
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="text-5xl font-bold text-accent/20 mb-3 font-display">{item.step}</div>
                                <h4 className="text-xl font-bold text-foreground mb-2">{item.title}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center animate-scroll-reveal">
                    <div className="relative inline-block">
                        <div className="absolute -inset-4 bg-accent/10 blur-2xl rounded-full pointer-events-none" />
                        <button
                            onClick={() => { setIsOpen(true); setIsSuccess(false); }}
                            className="relative px-10 py-5 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg rounded-xl transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(120,200,255,0.4)] flex items-center gap-3 mx-auto"
                        >
                            <Handshake className="w-5 h-5" />
                            Apply for a License
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                        Limited territories available. Serious inquiries only.
                    </p>
                </div>
            </div>

            {/* Application Form Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-lg bg-zinc-950 border-white/10 shadow-2xl">
                    {isSuccess ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                                <Check className="w-8 h-8 text-green-400" />
                            </div>
                            <DialogTitle className="text-2xl font-bold text-white">Application Received</DialogTitle>
                            <DialogDescription className="text-lg text-zinc-400">
                                We'll review your application and reach out within 48 hours. Keep an eye on your inbox.
                            </DialogDescription>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors w-full"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-white">Apply for a License</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    Tell us about yourself and the market you want to serve. We'll follow up within 48 hours.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-left">
                                <div className="space-y-2">
                                    <label htmlFor="lic-name" className="text-sm font-medium text-zinc-300">Full Name</label>
                                    <input
                                        id="lic-name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="lic-email" className="text-sm font-medium text-zinc-300">Email</label>
                                        <input
                                            id="lic-email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lic-phone" className="text-sm font-medium text-zinc-300">Phone</label>
                                        <input
                                            id="lic-phone"
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="lic-location" className="text-sm font-medium text-zinc-300">Target Market / City</label>
                                    <input
                                        id="lic-location"
                                        type="text"
                                        required
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                                        placeholder="e.g. Dallas, TX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="lic-message" className="text-sm font-medium text-zinc-300">Tell us about yourself</label>
                                    <textarea
                                        id="lic-message"
                                        rows={3}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                                        placeholder="Your background, experience, and why you're interested..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 mt-4 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Submitting..." : <>Submit Application <ChevronRight className="w-4 h-4" /></>}
                                </button>
                            </form>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default LicensingSection;
