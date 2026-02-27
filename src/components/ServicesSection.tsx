import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Layers, PaintBucket, Paintbrush } from "lucide-react";

const services = [
  {
    icon: Layers,
    title: "Custom Epoxy Flooring",
    description:
      "The bread and butter. Learn the full A-to-Z process — surface prep, primer, metallic pour, and topcoat. Walk away ready to charge $5-$15/sqft and deliver jaw-dropping results.",
  },
  {
    icon: PaintBucket,
    title: "Countertop Coatings",
    description:
      "High-gloss epoxy countertops that look like marble but cost a fraction. Master color blending, edge work, and the finishing techniques that make clients say 'this can't be real.'",
  },
  {
    icon: Paintbrush,
    title: "Vertical Application",
    description:
      "Walls, backsplashes, shower panels — surfaces most installers won't touch. This is where you separate yourself from the competition and command premium prices.",
  },
];

const ServicesSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="services" className="py-32 px-6 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 animate-scroll-fade">
            What We Teach
          </p>
          <h2 className="text-4xl md:text-5xl font-bold font-display leading-tight animate-scroll-scale" style={{ transitionDelay: "0.1s" }}>
            <span className="text-gradient-animated">Hands-On Resin Training</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <div
              key={service.title}
              className={`group p-8 rounded-sm border border-border bg-card hover:border-glow transition-all duration-500 ${i === 0 ? "animate-scroll-reveal-left" : i === 2 ? "animate-scroll-reveal-right" : "animate-scroll-reveal"
                }`}
              style={{ transitionDelay: `${0.2 + 0.15 * i}s` }}
            >
              <service.icon className="w-10 h-10 text-muted-foreground mb-6 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
              <h3 className="text-xl font-display font-semibold text-primary mb-3">
                {service.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
