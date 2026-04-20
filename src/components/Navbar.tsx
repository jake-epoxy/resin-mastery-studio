import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Software", href: "#software" },
  { label: "Quote Engine", href: "#quote-engine" },
  { label: "Pricing", href: "#pricing" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    setTimeout(() => {
      const target = document.querySelector(href);
      target?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <>
      <nav className={`fixed top-4 left-0 right-0 z-50 transition-all duration-500 flex justify-center px-4 ${scrolled ? "translate-y-0" : "translate-y-2"}`}>
        <div className={`
          flex items-center justify-between transition-all duration-500
          ${scrolled 
            ? "w-full max-w-5xl h-16 px-6 bg-[#111111]/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-full" 
            : "w-full max-w-6xl h-24 px-2 bg-transparent border-transparent"
          }
        `}>
          <Link to="/" className="flex items-center shrink-0">
            <img 
              src="/logo.png" 
              alt="Resin Academics Logo" 
              className={`transition-all duration-500 object-contain ${scrolled ? "h-10" : "h-[70px] md:h-[90px] drop-shadow-xl"}`} 
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className="text-[13px] uppercase tracking-[0.15em] font-bold text-white/50 hover:text-white transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/admin"
              className="px-5 py-2.5 text-xs uppercase tracking-wider bg-white text-black font-bold rounded-full hover:bg-[#78c8ff] hover:text-black hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-white"
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Fullscreen Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-500 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setMobileOpen(false)} />

        {/* Menu content */}
        <div className={`relative z-10 flex flex-col items-center justify-center h-full gap-8 transition-all duration-500 ${mobileOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          {navLinks.map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.href);
              }}
              className="text-2xl uppercase tracking-[0.2em] font-bold text-white/70 hover:text-white transition-all duration-300"
              style={{ transitionDelay: `${i * 75}ms` }}
            >
              {item.label}
            </a>
          ))}

          <div className="w-16 h-px bg-white/10 my-2" />

          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="px-8 py-4 text-sm uppercase tracking-widest bg-white text-black font-bold rounded-full hover:bg-[#78c8ff] transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.15)]"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
