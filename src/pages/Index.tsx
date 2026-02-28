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
