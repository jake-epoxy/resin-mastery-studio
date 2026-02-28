import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-16 px-6 border-t border-border" role="contentinfo">
      <div className="max-w-6xl mx-auto">
        {/* SEO-rich footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand & Description */}
          <div>
            <p className="font-display font-semibold text-primary text-lg tracking-wide mb-3">
              Resin Academics
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional epoxy flooring classes, certification courses, and hands-on training.
              Learn metallic epoxy, flake systems, countertop coatings, and how to build a profitable resin flooring business.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="font-display font-semibold text-primary text-sm tracking-wide mb-3 uppercase">Quick Links</p>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#services" className="hover:text-primary transition-colors">Our Services</a></li>
                <li><a href="#programs" className="hover:text-primary transition-colors">Training Programs</a></li>
                <li><a href="#quote" className="hover:text-primary transition-colors">Get an Instant Quote</a></li>
                <li><a href="#map" className="hover:text-primary transition-colors">Installer Map</a></li>
                <li><a href="https://Mud2Marble.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Buy Epoxy Products</a></li>
              </ul>
            </nav>
          </div>

          {/* Training Services */}
          <div>
            <p className="font-display font-semibold text-primary text-sm tracking-wide mb-3 uppercase">Training Services</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Epoxy Flooring Certification</li>
              <li>Metallic Epoxy Training</li>
              <li>Flake & Quartz Systems</li>
              <li>Countertop Coating Classes</li>
              <li>Online Epoxy Courses</li>
              <li>Business Marketing Training</li>
            </ul>
          </div>
        </div>

        {/* Social Icons Row */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <a
            href="https://www.instagram.com/jake.epoxy/"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#78c8ff]/50 hover:bg-[#78c8ff]/10 transition-all duration-300"
            aria-label="Follow Resin Academics on Instagram"
          >
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-[#78c8ff] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/jacob.flores.453299"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#78c8ff]/50 hover:bg-[#78c8ff]/10 transition-all duration-300"
            aria-label="Follow Resin Academics on Facebook"
          >
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-[#78c8ff] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a
            href="https://www.tiktok.com/@jake.epoxy"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#78c8ff]/50 hover:bg-[#78c8ff]/10 transition-all duration-300"
            aria-label="Follow Resin Academics on TikTok"
          >
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-[#78c8ff] transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.8a8.24 8.24 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.21z" />
            </svg>
          </a>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border pt-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Resin Academics. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
