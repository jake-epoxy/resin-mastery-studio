import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        {/* Social Icons Row */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <a
            href="https://www.instagram.com/jake.epoxy/"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#78c8ff]/50 hover:bg-[#78c8ff]/10 transition-all duration-300"
            aria-label="Instagram"
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
            aria-label="Facebook"
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
            aria-label="TikTok"
          >
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-[#78c8ff] transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.8a8.24 8.24 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.21z" />
            </svg>
          </a>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-display font-semibold text-primary text-sm tracking-wide">
            Resin Academics
          </p>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Resin Academics. All rights reserved.
            </p>
            <span className="hidden md:inline">•</span>
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
