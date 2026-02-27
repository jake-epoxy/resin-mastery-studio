import { useScrollReveal } from "@/hooks/useScrollReveal";

interface CTASectionProps {
  onEnrollClick?: () => void;
}

const CTASection = ({ onEnrollClick }: CTASectionProps) => {
  const ref = useScrollReveal();

  return (
    <section id="contact" className="py-32 px-6 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold font-display text-primary text-glow-strong leading-tight mb-4 text-center animate-scroll-reveal">
          Ready to Start?
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-16 text-center animate-scroll-reveal" style={{ transitionDelay: "0.1s" }}>
          Whether you need a stunning floor or want to build a career — we've got you.
        </p>

        <div className="grid md:grid-cols-2 gap-6 animate-scroll-reveal" style={{ transitionDelay: "0.2s" }}>
          {/* Card 1: Get a Quote */}
          <a
            href="#quote"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#quote")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group relative p-8 rounded-xl border border-border/50 bg-secondary/30 backdrop-blur-sm transition-all duration-500 hover:border-[#78c8ff]/40 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(120,200,255,0.08)] text-left"
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-lg bg-[#78c8ff]/10 border border-[#78c8ff]/20 flex items-center justify-center mb-5 group-hover:bg-[#78c8ff]/15 transition-colors duration-300">
              <svg className="w-7 h-7 text-[#78c8ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>

            <h3 className="text-xl font-display font-semibold text-primary mb-2">
              Get a Floor Quote
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              I'm a homeowner or business looking for a premium epoxy or flake floor installed by a certified pro.
            </p>

            <span className="inline-flex items-center gap-2 text-sm font-display font-medium text-[#78c8ff] group-hover:gap-3 transition-all duration-300">
              Build My Quote
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </a>

          {/* Card 2: Become a Student */}
          <button
            type="button"
            onClick={onEnrollClick}
            className="group relative p-8 rounded-xl border border-border/50 bg-secondary/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/40 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.06)] text-left"
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors duration-300">
              <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>

            <h3 className="text-xl font-display font-semibold text-primary mb-2">
              Become a Certified Installer
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              I want to learn the craft, get certified by Resin Academics, and start my own epoxy flooring business.
            </p>

            <span className="inline-flex items-center gap-2 text-sm font-display font-medium text-primary group-hover:gap-3 transition-all duration-300">
              Enroll Now
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
