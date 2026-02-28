import { useState, useEffect } from "react";
import { Check, Download, FileText, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

const StarterKitSection = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Add global helper to export leads easily
        (window as any).exportStarterKitLeads = () => {
            const leads = JSON.parse(localStorage.getItem("starterKitLeads") || "[]");
            if (leads.length === 0) {
                console.log("No leads to export yet.");
                return;
            }

            console.table(leads);

            const csv = [
                "Name,Email,Phone,Date",
                ...leads.map((l: any) => `"${l.name}","${l.email}","${l.phone}","${l.date}"`)
            ].join("\n");

            const a = document.createElement("a");
            a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
            a.download = "starter_kit_leads.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            console.log("CSV downloaded successfully!");
        };
    }, []);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Save lead to localStorage
        const newLead = { name, email, phone, date: new Date().toISOString() };
        const savedLeads = JSON.parse(localStorage.getItem("starterKitLeads") || "[]");
        localStorage.setItem("starterKitLeads", JSON.stringify([...savedLeads, newLead]));

        setIsSubmitting(true);

        try {
            // Send data to email
            await fetch("https://formsubmit.co/ajax/PourMastersLLC@gmail.com", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    _subject: `📚 New Starter Kit Download | ${name}`,
                    "Customer Name": name,
                    "Email": email,
                    "Phone": phone,
                    "Source": "Starter Kit Download Form",
                    _template: "table",
                }),
            });
        } catch (error) {
            console.error("Failed to send email notification", error);
            // We still let them download the kit even if the email notification fails
        } finally {
            setIsSubmitting(false);

            // Download the PDF directly from our own server — no Google Drive login issues
            const downloadUrl = "/Epoxy_Business_Starter_Kit_by_Jake_Epoxy.pdf";

            // Detect in-app browsers (Instagram, Facebook, TikTok, etc.)
            const ua = navigator.userAgent || "";
            const isInAppBrowser = /FBAN|FBAV|Instagram|Line|Twitter|TikTok|Snapchat|Pinterest/i.test(ua);

            if (isInAppBrowser) {
                // For in-app browsers: open in system browser where downloads work
                window.open(downloadUrl, "_system");
                setTimeout(() => {
                    window.location.href = downloadUrl;
                }, 300);
            } else {
                // Standard browsers: direct download
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.download = "Epoxy_Business_Starter_Kit_by_Jake_Epoxy.pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            setIsSuccess(true);
        }
    };

    return (
        <section className="py-24 relative overflow-hidden bg-background">
            {/* Background glow effects */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">

                    {/* Left Column: Content */}
                    <div className="space-y-8 animate-scroll-reveal-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium tracking-wide">
                            <Download className="w-4 h-4" />
                            FREE DOWNLOAD
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                                The Epoxy Business <br />
                                <span className="text-accent">Starter Kit</span>
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Everything you need to know before your first pour — from the tools you need to how to land your first client.
                            </p>
                        </div>

                        <ul className="space-y-4">
                            {[
                                "How I started with $0 and a girlfriend's desk",
                                "The exact tools you need (under $350)",
                                "What every service pays — real numbers",
                                "5 mistakes that will ruin your first job",
                                "How to get your first client with no portfolio",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                    <div className="mt-1 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-accent" />
                                    </div>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="space-y-4 pt-4">
                            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                <DialogTrigger asChild>
                                    <button className="w-full sm:w-auto px-8 py-4 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg transition-all transform hover:scale-105 hover:shadow-[0_0_20px_rgba(120,200,255,0.4)] flex items-center justify-center gap-2">
                                        <Download className="w-5 h-5" />
                                        Download the Free Starter Kit
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 shadow-2xl">
                                    {isSuccess ? (
                                        <div className="text-center py-8 space-y-4">
                                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                                                <Check className="w-8 h-8 text-green-400" />
                                            </div>
                                            <DialogTitle className="text-2xl font-bold text-white">Success!</DialogTitle>
                                            <DialogDescription className="text-lg text-zinc-400">
                                                Your download should start automatically. If it doesn't, it may open in a new browser window.
                                            </DialogDescription>
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors w-full"
                                            >
                                                Close Window
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl font-bold text-white">Get the Starter Kit</DialogTitle>
                                                <DialogDescription className="text-zinc-400">
                                                    Enter your details below to instantly download the PDF.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-left">
                                                <div className="space-y-2">
                                                    <label htmlFor="name" className="text-sm font-medium text-zinc-300">Full Name</label>
                                                    <input
                                                        id="name"
                                                        type="text"
                                                        required
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                                                        placeholder="John Doe"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="email" className="text-sm font-medium text-zinc-300">Email Address</label>
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        required
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                                                        placeholder="john@example.com"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="phone" className="text-sm font-medium text-zinc-300">Phone Number</label>
                                                    <input
                                                        id="phone"
                                                        type="tel"
                                                        required
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                                                        placeholder="(555) 123-4567"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="w-full py-3 mt-4 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSubmitting ? "Sending..." : <>Send My Starter Kit <ChevronRight className="w-4 h-4" /></>}
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </DialogContent>
                            </Dialog>
                            <p className="text-xs text-muted-foreground/70">
                                No spam. Just real game. Unsubscribe anytime.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Visual Mockup */}
                    <div className="relative animate-scroll-reveal-right mt-12 lg:mt-0">
                        {/* Soft decorative ring */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square border border-white/5 rounded-full" />

                        {/* Floating Document Card */}
                        <div className="relative z-10 mx-auto max-w-[320px] w-full perspective-[1000px]">
                            <div
                                className="relative w-full aspect-[3/4] rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col pt-10 transition-all duration-700 ease-out overflow-hidden transform hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
                                style={{ transform: "rotateY(-10deg) rotateX(10deg)" }}
                            >
                                {/* PDF Header styling */}
                                <div className="px-8 flex-1">
                                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-6 border border-accent/30 shadow-[0_0_15px_rgba(120,200,255,0.2)] text-accent">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold tracking-tight text-white mb-2 leading-tight">
                                        The Epoxy Business Starter Kit
                                    </h3>
                                    <p className="text-sm text-accent/80 font-medium">By Jake Epoxy</p>

                                    <div className="mt-8 space-y-4 opacity-70">
                                        <div className="h-2 w-3/4 bg-white/20 rounded-full" />
                                        <div className="h-2 w-full bg-white/10 rounded-full" />
                                        <div className="h-2 w-5/6 bg-white/10 rounded-full" />
                                        <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                                    </div>
                                </div>

                                {/* Footer stats on the PDF card */}
                                <div className="px-6 py-5 bg-black/40 border-t border-white/10 backdrop-blur-md grid grid-cols-3 gap-2 mt-auto">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-white text-shadow-sm">40K+</p>
                                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium mt-1">Followers</p>
                                    </div>
                                    <div className="text-center border-l border-r border-white/10">
                                        <p className="text-lg font-bold text-white text-shadow-sm">25M+</p>
                                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium mt-1">Views</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-white text-shadow-sm">5</p>
                                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium mt-1">Years Exp.</p>
                                    </div>
                                </div>

                                {/* Shimmer effect inside the card */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent w-[200%] h-full pointer-events-none opacity-50"
                                    style={{ transform: "translateX(-100%)", animation: "shimmer 3s infinite" }}
                                />
                            </div>

                            {/* Backglow layer */}
                            <div className="absolute top-4 -bottom-4 -left-4 -right-4 bg-accent/20 rounded-xl blur-3xl -z-10 opacity-60 pointer-events-none" />
                        </div>
                    </div>

                </div>
            </div>

            {/* Inline style for the shimmer animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes shimmer {
          100% {
            transform: translateX(50%);
          }
        }
      `}} />
        </section>
    );
};

export default StarterKitSection;
