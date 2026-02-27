import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const galleryImages = [
    { src: "/gallery/countertop-floor.jpg", alt: "Black marble countertop & white epoxy floor" },
    { src: "/gallery/living-room-marble.jpg", alt: "Living room marble-effect epoxy floor" },
    { src: "/gallery/floor-1.jpg", alt: "Custom metallic epoxy floor design" },
    { src: "/gallery/staircase-install.jpg", alt: "Epoxy staircase installation in progress" },
    { src: "/gallery/floor-2.jpg", alt: "Premium resin floor installation" },
    { src: "/gallery/kitchen-in-progress.jpg", alt: "Kitchen epoxy floor — live install" },
    { src: "/gallery/floor-3.jpg", alt: "High-gloss epoxy floor finish" },
    { src: "/gallery/shower-floor.jpg", alt: "Custom epoxy shower floor" },
    { src: "/gallery/floor-4.jpg", alt: "Artistic epoxy floor pattern" },
    { src: "/gallery/floor-5.jpg", alt: "Professional epoxy floor project" },
    { src: "/gallery/floor-6.jpg", alt: "Custom resin floor coating" },
];

const GallerySection = () => {
    const ref = useScrollReveal();
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const nextImage = () => setLightboxIndex((prev) => prev !== null ? (prev + 1) % galleryImages.length : 0);
    const prevImage = () => setLightboxIndex((prev) => prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : 0);

    return (
        <section id="gallery" className="py-32 px-6 relative" ref={ref}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#78c8ff]/[0.02] to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 animate-scroll-fade">
                        Our Work
                    </p>
                    <h2
                        className="text-4xl md:text-5xl font-bold font-display leading-tight animate-scroll-scale"
                        style={{ transitionDelay: "0.1s" }}
                    >
                        <span className="text-gradient-animated">Learn to Do Work Like This</span>
                    </h2>
                    <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto animate-scroll-reveal" style={{ transitionDelay: "0.2s" }}>
                        Real projects from Resin Academics students and instructor Jake Flores.
                    </p>
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleryImages.map((img, i) => (
                        <div
                            key={img.src}
                            className={`group relative overflow-hidden rounded-xl cursor-pointer ${i % 3 === 0 ? "animate-scroll-reveal-left" : i % 3 === 2 ? "animate-scroll-reveal-right" : "animate-scroll-reveal"
                                }`}
                            style={{ transitionDelay: `${0.15 + i * 0.1}s` }}
                            onClick={() => openLightbox(i)}
                        >
                            {/* Image */}
                            <div className="aspect-[4/3] overflow-hidden">
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <p className="text-white text-sm font-medium">{img.alt}</p>
                                    <p className="text-[#78c8ff] text-xs mt-1">Click to enlarge</p>
                                </div>
                            </div>

                            {/* Border glow on hover */}
                            <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-[#78c8ff]/30 transition-colors duration-300 pointer-events-none" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
                    {/* Close */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors z-10"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {/* Prev */}
                    <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
                    >
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>

                    {/* Image */}
                    <img
                        src={galleryImages[lightboxIndex].src}
                        alt={galleryImages[lightboxIndex].alt}
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Next */}
                    <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
                    >
                        <ChevronRight className="w-6 h-6 text-white" />
                    </button>

                    {/* Counter */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-zinc-400 text-sm">
                        {lightboxIndex + 1} / {galleryImages.length}
                    </div>
                </div>
            )}
        </section>
    );
};

export default GallerySection;
