import { useState } from "react";
import { X, User, Mail, Phone, ArrowRight, CheckCircle } from "lucide-react";

interface ClassRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ClassRegistrationModal = ({ isOpen, onClose }: ClassRegistrationModalProps) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Send registration details to PourMastersllc@gmail.com
            await fetch("https://formsubmit.co/ajax/PourMastersllc@gmail.com", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    _subject: `🎓 New Class Registration: ${name}`,
                    message: `New registration for the April 2-4 In-Person Group Design Class ($1,650).\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`,
                }),
            });
        } catch {
            // Even if email fails, still let the user proceed to payment
            console.warn("Email notification could not be sent.");
        }

        setIsSubmitting(false);
        setSubmitted(true);

        // TODO: Replace "https://paypal.com" with your actual PayPal payment link
        setTimeout(() => {
            window.open("https://www.paypal.com/ncp/payment/NJ6HXBJ3NGLXG", "_blank");
        }, 2000);
    };

    const handleClose = () => {
        setSubmitted(false);
        setName("");
        setEmail("");
        setPhone("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-[#0c0c18] border border-[#78c8ff]/20 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_60px_rgba(120,200,255,0.1)] animate-in fade-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {!submitted ? (
                    <>
                        {/* Header */}
                        <div className="px-8 pt-8 pb-4">
                            <p className="text-[#78c8ff] text-xs tracking-[0.3em] uppercase mb-2 font-semibold">
                                April 2–4, 2026 · 8 Spots Only
                            </p>
                            <h2 className="text-2xl font-display font-bold text-white">
                                Reserve Your Spot
                            </h2>
                            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                                Fill in your details below and you'll be redirected to complete your $1,650 payment securely.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#78c8ff]/50 focus:ring-1 focus:ring-[#78c8ff]/30 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#78c8ff]/50 focus:ring-1 focus:ring-[#78c8ff]/30 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1.5">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="(555) 123-4567"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#78c8ff]/50 focus:ring-1 focus:ring-[#78c8ff]/30 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 mt-6 px-6 py-4 bg-[#78c8ff] text-black font-display font-bold text-base rounded-xl hover:bg-[#5ab8ff] hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(120,200,255,0.2)] hover:shadow-[0_0_50px_rgba(120,200,255,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Continue to Payment
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    /* Success State */
                    <div className="px-8 py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#78c8ff]/10 border border-[#78c8ff]/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-[#78c8ff]" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white mb-2">
                            You're Almost In!
                        </h2>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                            Thanks, <span className="text-white font-semibold">{name}</span>! Redirecting you to complete your secure payment now...
                        </p>
                        <div className="w-8 h-8 border-2 border-[#78c8ff]/30 border-t-[#78c8ff] rounded-full animate-spin mx-auto" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassRegistrationModal;
