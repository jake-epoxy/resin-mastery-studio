interface NavbarProps {
  onEnrollClick?: () => void;
}

const Navbar = ({ onEnrollClick }: NavbarProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <img src="/logo.png" alt="Resin Academics Logo" className="h-[70px] md:h-[90px] w-auto object-contain drop-shadow-lg" />
        </a>
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Services", href: "#services" },
            { label: "Get a Quote", href: "#quote" },
            { label: "Get Started", href: "#contact" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector(item.href);
                target?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 tracking-wide"
            >
              {item.label}
            </a>
          ))}
          <button
            onClick={onEnrollClick}
            className="px-5 py-2 text-sm border border-primary/30 text-primary font-display rounded-sm border-glow hover:border-glow-hover transition-all duration-300"
          >
            Enroll Now
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
