import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useRef, useState, useCallback } from "react";
import { Play, MapPin } from "lucide-react";

interface VideoTestimonial {
    src: string;
    poster: string;
    name: string;
    location: string;
    label: string;
}

const testimonials: VideoTestimonial[] = [
    {
        src: "/quote-assets/corpus-christi-testimonial.mp4",
        poster: "/quote-assets/corpus-christi-poster.jpg",
        name: "Gigi B.",
        location: "Corpus Christi, TX",
        label: "Custom White Metallic Epoxy",
    },
    {
        src: "/quote-assets/denver-testimonial.mp4",
        poster: "/quote-assets/denver-poster.jpg",
        name: "Client Testimonial",
        location: "Denver, CO",
        label: "Full Floor Transformation",
    },
    {
        src: "/quote-assets/el-paso-testimonial.mp4",
        poster: "/quote-assets/el-paso-poster.jpg",
        name: "Client Testimonial",
        location: "El Paso, TX",
        label: "Residential Epoxy Floor",
    },
];

/* ------------------------------------------------------------------ */
/*  Individual Video Card                                              */
/* ------------------------------------------------------------------ */
function VideoCard({ t, index }: { t: VideoTestimonial; index: number }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        setIsPlaying(true);
        video.play().catch(() => setIsPlaying(false));
    }, []);

    const handleVideoEnd = useCallback(() => {
        setIsPlaying(false);
        const video = videoRef.current;
        if (video) {
            video.currentTime = 0;
        }
    }, []);

    return (
        <div
            className="testimonial-video-card group animate-scroll-reveal"
            style={{ transitionDelay: `${0.15 + index * 0.12}s` }}
        >
            {/* Video Container */}
            <div className="testimonial-video-wrapper" onClick={!isPlaying ? handlePlay : undefined}>
                <video
                    ref={videoRef}
                    preload="none"
                    playsInline
                    src={t.src}
                    controls={isPlaying}
                    poster={t.poster}
                    onEnded={handleVideoEnd}
                    onPause={() => {
                        const video = videoRef.current;
                        if (video && video.currentTime > 0 && !video.ended) return;
                        setIsPlaying(false);
                    }}
                    className="testimonial-video"
                />

                {/* Poster overlay with play button */}
                {!isPlaying && (
                    <div className="testimonial-poster-overlay">
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-[1]" />

                        {/* Play button */}
                        <button
                            className="testimonial-play-btn"
                            aria-label={`Play testimonial from ${t.name}`}
                        >
                            <div className="testimonial-play-ring" />
                            <Play className="w-6 h-6 text-white fill-white relative z-10 ml-0.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="testimonial-card-info">
                <h3 className="text-white font-display font-semibold text-base tracking-tight">
                    {t.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3 h-3 text-[#78c8ff]/70" />
                    <span className="text-[#78c8ff]/70 text-xs font-medium">{t.location}</span>
                </div>
                <p className="text-muted-foreground text-xs mt-1.5">{t.label}</p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */
const TestimonialsSection = () => {
    const ref = useScrollReveal();

    return (
        <section id="testimonials" className="py-32 px-6 relative overflow-hidden" ref={ref}>
            {/* Background accents */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#78c8ff]/[0.015] to-transparent pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#78c8ff]/[0.03] blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 animate-scroll-fade">
                        Real Results
                    </p>
                    <h2
                        className="text-4xl md:text-5xl font-bold font-display leading-tight animate-scroll-scale"
                        style={{ transitionDelay: "0.1s" }}
                    >
                        <span className="text-gradient-animated">Hear It From Our Clients</span>
                    </h2>
                    <p
                        className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto animate-scroll-reveal"
                        style={{ transitionDelay: "0.2s" }}
                    >
                        Real stories from real clients — see the results and hear what they have to say.
                    </p>
                </div>

                {/* Video Grid */}
                <div className="testimonial-video-grid">
                    {testimonials.map((t, i) => (
                        <VideoCard key={t.src} t={t} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
