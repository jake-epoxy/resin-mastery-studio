import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FullBleedShowcase from "@/components/FullBleedShowcase";
import AboutSection from "@/components/AboutSection";
import ServicesSection from "@/components/ServicesSection";
import ProcessSection from "@/components/ProcessSection";
import GallerySection from "@/components/GallerySection";
import ROICalculator from "@/components/ROICalculator";
import UpcomingClassSection from "@/components/UpcomingClassSection";
import TrainingSection from "@/components/TrainingSection";
import CertificationSection from "@/components/CertificationSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import MarketingSection from "@/components/MarketingSection";
import { Link } from "react-router-dom";
import InstallerMapSection from "@/components/InstallerMapSection";
import QuotingMachine from "@/components/QuotingMachine";
import CTASection from "@/components/CTASection";
import StarterKitSection from "@/components/StarterKitSection";
import Footer from "@/components/Footer";
import EnrollmentPortal from "@/components/EnrollmentPortal";
import IntroScreen from "@/components/IntroScreen";
import { useEffect, useState, useCallback } from "react";

const Index = () => {
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollProgram, setEnrollProgram] = useState<"online" | "in-person" | null>(null);

  const openEnrollment = useCallback((program?: "online" | "in-person") => {
    setEnrollProgram(program ?? null);
    setEnrollOpen(true);
  }, []);

  useEffect(() => {
    // Initialize scroll reveal for hero section (already in view)
    const heroElements = document.querySelectorAll(
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

    heroElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="bg-background min-h-screen">
      <IntroScreen />
      <Navbar onEnrollClick={() => openEnrollment()} />
      <HeroSection />
      <FullBleedShowcase />
      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" />
      <AboutSection />
      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" />
      <div id="services">
        <ServicesSection />
      </div>
      <div className="w-full max-w-4xl mx-auto shimmer-line animate-scroll-fade" />
      <ProcessSection />
      <div className="w-full max-w-4xl mx-auto shimmer-line animate-scroll-fade" />
      <GallerySection />
      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" />
      <ROICalculator />
      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" />
      <UpcomingClassSection />
      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" />
      <div id="programs">
        <TrainingSection onEnroll={openEnrollment} />
        <CertificationSection />
      </div>
      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" />
      {/* Testimonials hidden until reviews are ready */}
      {/* <TestimonialsSection /> */}
      {/* <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" /> */}
      <MarketingSection />
      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" />

      {/* Licensing Partnership Teaser */}
      <section className="py-20 relative overflow-hidden bg-background animate-scroll-reveal">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#78c8ff05_1px,transparent_1px),linear-gradient(to_bottom,#78c8ff05_1px,transparent_1px)] bg-[size:6rem_6rem] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium tracking-wide mb-6">🤝 PARTNERSHIP OPPORTUNITY</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Open a Licensed{" "}
            <span className="bg-gradient-to-r from-[#78c8ff] via-white to-[#78c8ff] bg-clip-text text-transparent">Training Center</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Bring Resin Academics to your market. Teach our curriculum, sell our products, own your territory.
            No franchise fees. No royalties.
          </p>
          <Link
            to="/licensing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(120,200,255,0.4)] text-lg"
          >
            Learn More
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>

      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" />
      <div id="map">
        <InstallerMapSection />
      </div>
      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" />
      <div id="quote">
        <QuotingMachine />
      </div>
      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" />
      <div id="starter-kit">
        <StarterKitSection />
      </div>
      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade" />
      <CTASection onEnrollClick={() => openEnrollment()} />
      <Footer />

      {/* Enrollment Portal Modal */}
      <EnrollmentPortal
        isOpen={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        preselectedProgram={enrollProgram}
      />
    </main>
  );
};

export default Index;
