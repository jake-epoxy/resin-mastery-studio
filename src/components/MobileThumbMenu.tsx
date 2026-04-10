import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Wrench,
    GraduationCap,
    Calculator,
    Package,
    Phone,
    Menu,
    X,
    CalendarDays,
    Sparkles,
} from "lucide-react";

interface MenuItem {
    label: string;
    icon: React.ReactNode;
    target: string;
}

const MENU_ITEMS: MenuItem[] = [
    { label: "Contact", icon: <Phone size={22} />, target: "#contact" },
    { label: "Starter Kit", icon: <Package size={22} />, target: "#starter-kit" },
    { label: "Get a Quote", icon: <Calculator size={22} />, target: "#quote" },
    { label: "Programs", icon: <GraduationCap size={22} />, target: "#programs" },
    { label: "Services", icon: <Wrench size={22} />, target: "#services" },
    { label: "Enroll Now", icon: <Sparkles size={22} />, target: "action:enroll" },
];

interface MobileThumbMenuProps {
    onEnrollClick?: () => void;
    onClassSignUp?: () => void;
}

const MobileThumbMenu = ({ onEnrollClick, onClassSignUp }: MobileThumbMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Show FAB after intro animation (approx 3s delay)
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    // Prevent background scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none'; // Prevents mobile pull-to-refresh
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen]);

    const vibrate = useCallback((pattern: number | number[] = 15) => {
        if (navigator.vibrate) navigator.vibrate(pattern);
    }, []);

    const handleAction = (target: string) => {
        vibrate();
        setIsOpen(false);
        if (target === "action:enroll" && onEnrollClick) {
            onEnrollClick();
            return;
        }
        if (target === "action:class-signup" && onClassSignUp) {
            onClassSignUp();
            return;
        }
        if (target === "top") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    const handleToggle = () => {
        vibrate(10);
        setIsOpen((prev) => !prev);
    };

    if (!isVisible) return null;

    return (
        <div
            ref={menuRef}
            className="fixed bottom-6 right-5 z-[9999] md:hidden"
            id="mobile-thumb-menu"
        >
            {/* Backdrop overlay */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            />

            {/* Menu items container */}
            <div className={`relative flex flex-col-reverse items-end gap-3 mb-3 max-h-[70vh] overflow-y-auto overflow-x-hidden p-2 -mr-2 no-scrollbar pointer-events-auto ${isOpen ? "z-50" : "-z-10"}`}>
                {MENU_ITEMS.map((item) => {
                    return (
                        <button
                            key={item.label}
                            onClick={() => handleAction(item.target)}
                            className={`fab-menu-item group flex items-center gap-3 transition-all duration-200 ease-out origin-bottom shrink-0 ${isOpen ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-4 scale-95 pointer-events-none"}`}
                            aria-label={item.label}
                        >
                            {/* Label pill */}
                            <span className="px-3 py-1.5 rounded-lg text-sm font-semibold tracking-wide text-white bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg whitespace-nowrap">
                                {item.label}
                            </span>

                            {/* Icon circle */}
                            <span className="flex items-center justify-center w-12 h-12 shrink-0 rounded-full bg-[#111] border border-white/20 text-[#78c8ff] shadow-xl active:scale-95 transition-all">
                                {item.icon}
                            </span>
                        </button>
                    );
                })}

                {/* SaaS Platform CTA Banner */}
                <button
                    onClick={() => { navigate('/admin'); setIsOpen(false); }}
                    className={`fab-menu-item flex items-center gap-3 transition-all duration-200 ease-out origin-bottom shrink-0 mt-2 ${isOpen ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-4 scale-95 pointer-events-none"}`}
                    aria-label="Subscribe to Platform"
                >
                    <span className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold tracking-wide text-white bg-gradient-to-r from-[#78c8ff]/30 to-[#a78bfa]/30 border border-[#78c8ff]/30 shadow-xl whitespace-nowrap backdrop-blur-xl">
                        <Sparkles size={18} className="text-white" />
                        Subscribe to Platform
                    </span>
                </button>

                {/* Tagline */}
                <div
                    className={`fab-menu-item text-right mr-1 shrink-0 mb-2 transition-all duration-300 ease-out ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                    <p className="text-xs tracking-[0.25em] uppercase font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#78c8ff] via-[#a78bfa] to-[#f472b6]">
                        Automate Your Business
                    </p>
                </div>
            </div>

            {/* Toggle button — dark with animated gradient ring */}
            <div className="relative ml-auto w-[60px] h-[60px]">
                {/* Animated gradient ring */}
                <div className="absolute inset-0 rounded-full fab-ring-glow" />

                <button
                    onClick={handleToggle}
                    className="relative flex items-center justify-center w-[60px] h-[60px] rounded-full bg-[#0e0e1a] border border-white/15 text-white/80 shadow-[0_0_20px_rgba(255,255,255,0.12),0_0_40px_rgba(255,255,255,0.05),0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300 z-10 hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.18),0_0_50px_rgba(255,255,255,0.08),0_4px_30px_rgba(0,0,0,0.5)]"
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isOpen}
                >
                    <span
                        className="absolute transition-all duration-300"
                        style={{
                            opacity: isOpen ? 0 : 1,
                            transform: isOpen ? "rotate(-90deg) scale(0.5)" : "rotate(0) scale(1)",
                        }}
                    >
                        <Menu size={26} strokeWidth={2.5} />
                    </span>
                    <span
                        className="absolute transition-all duration-300"
                        style={{
                            opacity: isOpen ? 1 : 0,
                            transform: isOpen ? "rotate(0) scale(1)" : "rotate(90deg) scale(0.5)",
                        }}
                    >
                        <X size={26} strokeWidth={2.5} />
                    </span>
                </button>
            </div>
        </div>
    );
};

export default MobileThumbMenu;
