import { useScrollReveal } from "@/hooks/useScrollReveal";
import { TrendingUp, Share2, Target } from "lucide-react";

const features = [
  {
    icon: Share2,
    title: "Social Media Strategy",
    description: "Build a consistent presence using organic content that converts followers into clients.",
  },
  {
    icon: Target,
    title: "Paid Advertising",
    description: "Learn proven paid strategies to generate high-quality leads and scale your business.",
  },
  {
    icon: TrendingUp,
    title: "Consistent Growth",
    description: "Develop systems that keep your pipeline full and your schedule booked week after week.",
  },
];

const MarketingSection = () => {
  const ref = useScrollReveal();

  return (
    <section className="py-32 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 animate-scroll-reveal">
            Beyond the Craft
          </p>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-primary text-glow leading-tight animate-scroll-reveal" style={{ transitionDelay: "0.1s" }}>
            Marketing Mastery
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed animate-scroll-reveal" style={{ transitionDelay: "0.2s" }}>
            Knowing the craft is only half the battle. We teach you how to market your skills,
            attract clients, and build a thriving business.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="animate-scroll-reveal group text-center p-8"
              style={{ transitionDelay: `${0.15 * (i + 1)}s` }}
            >
              <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center mx-auto mb-6 group-hover:border-glow transition-all duration-500">
                <feature.icon className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-display font-semibold text-primary mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketingSection;
