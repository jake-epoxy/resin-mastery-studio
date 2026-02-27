import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Award } from "lucide-react";

const CertificationSection = () => {
  const ref = useScrollReveal();

  return (
    <section className="py-32 px-6 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="animate-scroll-reveal">
          <Award className="w-16 h-16 text-primary mx-auto mb-8 animate-pulse-glow" strokeWidth={1} />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold font-display text-primary text-glow-strong leading-tight mb-6 animate-scroll-reveal" style={{ transitionDelay: "0.1s" }}>
          Get Certified
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10 animate-scroll-reveal" style={{ transitionDelay: "0.2s" }}>
          Upon completing your training, you'll receive an official Resin Academics certification — proof of your expertise
          and a mark of quality your clients can trust.
        </p>
        <div className="w-24 h-px line-gradient mx-auto animate-scroll-reveal" style={{ transitionDelay: "0.3s" }} />
      </div>
    </section>
  );
};

export default CertificationSection;
