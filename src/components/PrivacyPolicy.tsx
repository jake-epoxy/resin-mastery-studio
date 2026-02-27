import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#0c0c18] text-white pt-24 pb-12 px-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Shield className="w-8 h-8 text-[#78c8ff]" />
                    <h1 className="text-3xl font-display font-bold">Privacy Policy</h1>
                </div>

                <div className="space-y-6 text-zinc-300 font-sans leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
                        <p>
                            We collect information from you when you register on our site, place an order, subscribe to our newsletter, respond to a survey, fill out a form, or use our interactive features. When ordering or registering on our site, as appropriate, you may be asked to enter your name, email address, mailing address, phone number, or credit card information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
                        <p>
                            Any of the information we collect from you may be used in one of the following ways:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>To personalize your experience (your information helps us to better respond to your individual needs).</li>
                            <li>To improve our website (we continually strive to improve our website offerings based on the information and feedback we receive from you).</li>
                            <li>To improve customer service (your information helps us to more effectively respond to your customer service requests and support needs).</li>
                            <li>To process transactions. Your information, whether public or private, will not be sold, exchanged, transferred, or given to any other company for any reason whatsoever, without your consent, other than for the express purpose of delivering the purchased product or service requested.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. Use of Cookies</h2>
                        <p>
                            We use cookies to help us remember and process the items in your shopping cart, understand and save your preferences for future visits, keep track of advertisements and compile aggregate data about site traffic and site interaction so that we can offer better site experiences and tools in the future.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Third-Party Links</h2>
                        <p>
                            Occasionally, at our discretion, we may include or offer third-party products or services on our website. These third-party sites have separate and independent privacy policies. We therefore have no responsibility or liability for the content and activities of these linked sites.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Consent</h2>
                        <p>
                            By using our site, you consent to our website's privacy policy.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-white/10 mt-12">
                        <button
                            onClick={() => window.history.back()}
                            className="text-[#78c8ff] hover:text-white transition-colors"
                        >
                            &larr; Return to main site
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
