import { useEffect, useRef } from "react";

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    // Observe element and all children with scroll-reveal classes
    const targets = el.querySelectorAll(
      ".animate-scroll-reveal, .animate-scroll-reveal-left, .animate-scroll-reveal-right, .animate-scroll-scale, .animate-scroll-fade"
    );
    targets.forEach((t) => observer.observe(t));
    if (
      el.classList.contains("animate-scroll-reveal") ||
      el.classList.contains("animate-scroll-reveal-left") ||
      el.classList.contains("animate-scroll-reveal-right") ||
      el.classList.contains("animate-scroll-scale") ||
      el.classList.contains("animate-scroll-fade")
    ) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
