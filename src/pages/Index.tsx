import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FullBleedShowcase from "@/components/FullBleedShowcase";
import AboutSection from "@/components/AboutSection";
import ServicesSection from "@/components/ServicesSection";
import ProcessSection from "@/components/ProcessSection";
import GallerySection from "@/components/GallerySection";
import ROICalculator from "@/components/ROICalculator";

import TrainingSection from "@/components/TrainingSection";
import CertificationSection from "@/components/CertificationSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import MarketingSection from "@/components/MarketingSection";
import SoftwareMarketingSection from "@/components/SoftwareMarketingSection";
import CloneAISection from "@/components/CloneAISection";
import { Link } from "react-router-dom";
import InstallerMapSection from "@/components/InstallerMapSection";
import QuoteGeneratorDemo from "@/components/QuoteGeneratorDemo";
import CTASection from "@/components/CTASection";
import StarterKitSection from "@/components/StarterKitSection";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const Index = () => {

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
    <main className="bg-background min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FullBleedShowcase />
      
      <div id="software" className="pt-20">
        <SoftwareMarketingSection />
      </div>
      
      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade my-12" />
      
      <CloneAISection />

      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade my-12" />
      
      <div id="quote-engine">
        <QuoteGeneratorDemo />
      </div>

      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade my-12" />
      
      <div id="roi">
        <ROICalculator />
      </div>

      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade my-12" />
      
      <div id="testimonials">
        <TestimonialsSection />
      </div>

      <div className="w-24 h-px line-gradient mx-auto animate-scroll-fade my-12" />
      
      <div id="pricing">
        <CTASection />
      </div>
      
      <Footer />
    </main>
  );
};

export default Index;
