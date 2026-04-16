import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function LegalTerms() {
    return (
        <div className="min-h-screen bg-[#0c0c18] text-white pt-24 pb-12 px-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <FileText className="w-8 h-8 text-[#78c8ff]" />
                    <h1 className="text-3xl font-display font-bold">Legal & Terms of Service</h1>
                </div>
                
                <p className="text-zinc-400 mb-10 text-sm">Last Updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-10 text-zinc-300 font-sans leading-relaxed">
                    
                    {/* SECTION 1: BUSINESS ENTITY */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-wide">1. Business Entity & Ownership</h2>
                        <div className="bg-[#78c8ff]/5 border border-[#78c8ff]/20 p-5 rounded-xl">
                            <p className="text-sm">
                                "Resin Academics" is a platform and registered DBA operating under the parent commercial entity <strong>Pour Masters LLC</strong>.
                                All software subscriptions, training enrollments, product purchases, and associated financial transactions processed through this Website or our merchant providers (e.g., Stripe, PayPal) are legally processed, captured, and managed by Pour Masters LLC. By using this platform, you explicitly acknowledge and agree that your commercial relationship is with Pour Masters LLC.
                            </p>
                        </div>
                    </section>

                    {/* SECTION 2: REFUND POLICY */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Strictly Enforced Refund Policy</h2>
                        <p className="mb-3">
                            Due to the proprietary nature of our digital curriculum, business frameworks, and immediate access to CRM software tools, <strong>all sales are final.</strong> 
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-sm text-zinc-400">
                            <li><strong>Monthly SaaS Subscriptions:</strong> You may cancel your $97/mo software subscription at any time via your dashboard panel. If you enroll via a free trial, you are fully responsible for canceling before the trial period ends. No prorated refunds or full refunds will be issued for charges processed if you fail to cancel prior to trial expiration.</li>
                            <li><strong>In-Person Training / Masterclasses:</strong> Seats for in-person training are highly limited. Rescheduling requests must be made at least 14 days prior to the event. Cancellations inside of the 14-day window forfeit their deposit.</li>
                            <li><strong>Digital Goods & Vaults:</strong> Any purchase that grants immediate digital access to videos, PDFs, or quoting engines cannot be reversed. Chargebacks filed against legitimate digital delivery will be aggressively challenged with logs of user access and IP timestamps.</li>
                        </ul>
                    </section>

                    {/* SECTION 3: SUBSCRIPTION TERMS */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. CRM & Platform Usage</h2>
                        <p>
                            Resin Academics provides CRM tools (quoting, invoicing, client management) on an "as is" and "as available" basis. While we strive for 100% uptime, we are not liable for any lost revenue, missed jobs, or damages resulting from software downtime. You are solely responsible for the legal validity of the contracts and quotes you generate using our tools and send to your clients. 
                        </p>
                    </section>
                    
                    {/* SECTION 4: PRIVACY POLICY */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Privacy & Data Handling</h2>
                        <p className="mb-3">
                            When you subscribe or use our CRM, we collect essential data (Name, Email, Payment Info) to facilitate your account. Additionally, any client data you upload into the CRM (Your Leads, Your Quotes) remains your property. We utilize industry-standard database security (including Supabase Row Level Security) to ensure your data is isolated and protected. 
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-sm text-zinc-400">
                            <li>We do not sell your personal data or your client data to third parties.</li>
                            <li>We use necessary cookies to maintain your login session and secure your dashboard.</li>
                            <li>Payment data is tokenized and processed directly via Stripe; at no point does Pour Masters LLC hold raw credit card data on our servers.</li>
                        </ul>
                    </section>

                    {/* SECTION 5: CONSENT & AGREEMENT */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. User Consent</h2>
                        <p>
                            By submitting payment or utilizing the educational resources and software tools hosted at resinacademics.com, you explicitly agree to these Terms of Service. If you do not agree, you are prohibited from using or accessing this site.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-white/10 mt-12 flex justify-between items-center">
                        <Link
                            to="/"
                            className="text-[#78c8ff] hover:text-white transition-colors"
                        >
                            &larr; Return to main site
                        </Link>
                        <span className="text-xs text-zinc-600">Company Legal Record</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
