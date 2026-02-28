import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Monitor, Users, ChevronRight, Play, Clock, Sparkles } from "lucide-react";

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Self-Paced Video Course — PRE-SALE */}
          <div className="animate-scroll-reveal group p-10 rounded-sm border border-amber-500/30 bg-card hover:border-amber-500/50 transition-all duration-500 relative order-first lg:order-none">
            {/* Pre-Sale badge */}
            <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] tracking-[0.15em] uppercase font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Founding Member Pre-Sale
            </div>
            <Play className="w-12 h-12 text-muted-foreground mb-6 group-hover:text-amber-400 transition-colors" strokeWidth={1.2} />
            <h3 className="text-2xl font-display font-bold text-primary mb-1">Self-Paced Course</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <p className="text-amber-400 text-lg font-display font-bold">$197</p>
              <p className="text-muted-foreground text-sm line-through">$497</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">60% OFF</span>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Watch at your own speed. Every technique, every business lesson — recorded and ready when you are. Founding members lock in this price forever.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-8">
              {["Full video tutorial library", "All modules — beginner to advanced", "Business & pricing strategies", "Lifetime access + future updates"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="space-y-3">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Stan Store link coming soon! DM @jake.epoxy on Instagram to pre-order now.");
                }}
                className="group/btn w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-display font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-sm hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all duration-300 hover:scale-105"
              >
                Pre-Order Now
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </a>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Launching soon — only 25 founding spots</span>
              </div>
            </div>
          </div>

          {/* Online 1-on-1 */}
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

          {/* In-person 1-on-1 */}
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
