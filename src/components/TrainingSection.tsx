import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Monitor, Users, ChevronRight } from "lucide-react";

interface TrainingSectionProps {
  onEnroll?: (program: "online" | "in-person") => void;
}

const TrainingSection = ({ onEnroll }: TrainingSectionProps) => {
  const ref = useScrollReveal();

  return (
    <section className="py-32 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 animate-scroll-reveal">
            How We Train
          </p>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-primary text-glow leading-tight animate-scroll-reveal" style={{ transitionDelay: "0.1s" }}>
            Your Path, Your Pace
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Online */}
          <div className="animate-scroll-reveal-left group p-10 rounded-sm border border-border bg-card hover:border-glow transition-all duration-500">
            <Monitor className="w-12 h-12 text-muted-foreground mb-6 group-hover:text-primary transition-colors" strokeWidth={1.2} />
            <h3 className="text-2xl font-display font-bold text-primary mb-1">Online 1-on-1</h3>
            <p className="text-[#78c8ff] text-lg font-display font-bold mb-4">$1,500</p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Learn from anywhere with live virtual 1-on-1 sessions. Get direct instructor support, step-by-step video lessons, and lifetime access.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-8">
              {["Live virtual 1-on-1 sessions", "Step-by-step video library", "Direct instructor messaging", "Certification upon completion"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
            {onEnroll && (
              <button
                onClick={() => onEnroll("online")}
                className="group/btn inline-flex items-center gap-2 px-6 py-2.5 text-sm font-display font-semibold border border-[#78c8ff]/30 text-[#78c8ff] rounded-sm hover:bg-[#78c8ff]/10 hover:border-[#78c8ff]/50 transition-all duration-300"
              >
                Enroll Now
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* In-person */}
          <div className="animate-scroll-reveal-right group p-10 rounded-sm border border-[#78c8ff]/20 bg-card hover:border-glow transition-all duration-500 relative">
            {/* Popular badge */}
            <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-[#78c8ff] text-black text-[10px] tracking-[0.15em] uppercase font-bold">
              Most Popular
            </div>
            <Users className="w-12 h-12 text-muted-foreground mb-6 group-hover:text-primary transition-colors" strokeWidth={1.2} />
            <h3 className="text-2xl font-display font-bold text-primary mb-1">In-Person 1-on-1</h3>
            <p className="text-[#78c8ff] text-lg font-display font-bold mb-4">$5,000</p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Get personalized, hands-on instruction with a dedicated traveling artist. Real-world projects, tools training, and priority certification.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-8">
              {["Everything in Online — plus:", "Hands-on with traveling artist", "Real-world project experience", "Priority certification track"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
            {onEnroll && (
              <button
                onClick={() => onEnroll("in-person")}
                className="group/btn inline-flex items-center gap-2 px-6 py-2.5 text-sm font-display font-semibold bg-[#78c8ff] text-black rounded-sm hover:shadow-[0_0_25px_rgba(120,200,255,0.4)] transition-all duration-300 hover:scale-105"
              >
                Enroll Now
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrainingSection;
