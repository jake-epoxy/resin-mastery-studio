import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import LicensingSection from "@/components/LicensingSection";
import Footer from "@/components/Footer";

const LicensingPage = () => {
    useEffect(() => {
        // SEO: Update document title and meta for this page
        document.title = "Open an Epoxy Training Center | Licensing Partnership — Resin Academics";

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute("content",
                "Open a licensed Resin Academics epoxy training center in your market. No franchise fees, no royalties. Access our full curriculum, Mud2Marble products, and protected territory. Apply now."
            );
        }

        // Add page-specific structured data
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = "licensing-schema";
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BusinessEvent",
            "name": "Resin Academics Licensing Partnership Opportunity",
            "description": "Open a licensed Resin Academics epoxy flooring training center in your market. Includes full curriculum, Mud2Marble product distribution, protected territory, and certification authority.",
            "organizer": {
                "@type": "EducationalOrganization",
                "name": "Resin Academics",
                "url": "https://resinacademics.com"
            },
            "offers": {
                "@type": "Offer",
                "category": "Business Licensing",
                "description": "Licensed training center partnership with dual revenue streams — training classes and Mud2Marble product distribution.",
                "url": "https://resinacademics.com/licensing"
            },
            "location": {
                "@type": "VirtualLocation",
                "name": "Multiple Territories Available"
            }
        });
        document.head.appendChild(script);

        // Scroll reveal
        const elements = document.querySelectorAll(
            ".animate-scroll-reveal, .animate-scroll-reveal-left, .animate-scroll-reveal-right, .animate-scroll-scale, .animate-scroll-fade"
        );
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("revealed");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );
        elements.forEach((el) => observer.observe(el));

        // Scroll to top on mount
        window.scrollTo(0, 0);

        return () => {
            observer.disconnect();
            // Restore original title
            document.title = "Epoxy Flooring Classes & Certification | Resin Academics — Hands-On Training";
            const schema = document.getElementById("licensing-schema");
            if (schema) schema.remove();
        };
    }, []);

    return (
        <main className="bg-background min-h-screen">
            <Navbar />
            <div className="pt-20">
                <LicensingSection />
            </div>
            <Footer />
        </main>
    );
};

export default LicensingPage;
