import { useEffect, useRef, useCallback, useMemo } from "react";

interface MetallicFloorCanvasProps {
    colors: string[];
    width?: number;
    height?: number;
    className?: string;
}

/** Convert hex (#RRGGBB) → [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return [0, 0, 0];
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/** Linearly interpolate between two RGB colours */
function lerpColor(
    a: [number, number, number],
    b: [number, number, number],
    t: number
): [number, number, number] {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ];
}

/**
 * High-quality metallic epoxy floor preview.
 *
 * Uses an AI-generated grayscale base image (`/epoxy-base.png`) as the
 * veining template. The luminance of each pixel is mapped to the user's
 * chosen colour palette, producing a crisp, photorealistic result.
 *
 * Dark areas  → first colour in the palette  (the "base" resin)
 * Light veins → last colour                 (the "vein" pigment)
 *
 * A subtle glossy vignette and specular streak are composited on top.
 */
const MetallicFloorCanvas = ({
    colors,
    width = 800,
    height = 500,
    className = "",
}: MetallicFloorCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    const rgbColors = useMemo(() => colors.map(hexToRgb), [colors]);

    /* ------------------------------------------------------------------ */
    /*  Core render – runs every time the colour selection changes         */
    /* ------------------------------------------------------------------ */
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img || rgbColors.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = width;
        const h = height;
        canvas.width = w;
        canvas.height = h;

        // Draw the base image stretched to fill the canvas
        ctx.drawImage(img, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        /* ---------------------------------------------------------------
         * Colour-mapping pass
         *
         * The AI base image is silver/white veins on dark charcoal.
         * Luminance naturally ranges ~0.05 (dark base) to ~0.95 (bright vein).
         * We map this full range to the user's colour palette.
         * --------------------------------------------------------------- */

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Perceived luminance (0-1)
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            // Smoothstep for richer contrast  
            const t = lum * lum * (3 - 2 * lum);

            let outR: number, outG: number, outB: number;

            if (rgbColors.length === 1) {
                // Single colour – dark base is a very deep shade, veins are the pure colour
                const c = rgbColors[0];
                // Base at 15% brightness, veins at 110% (slightly overdriven for pop)
                const factor = 0.15 + t * 0.95;
                outR = Math.min(255, c[0] * factor);
                outG = Math.min(255, c[1] * factor);
                outB = Math.min(255, c[2] * factor);
            } else if (rgbColors.length === 2) {
                // Two colours – first colour is the base, second is the veins
                // Use a stronger S-curve for more separation between the two
                const s = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
                const blended = lerpColor(rgbColors[0], rgbColors[1], s);
                // Modulate brightness so dark areas are deeper
                const brightness = 0.4 + t * 0.7;
                outR = Math.min(255, blended[0] * brightness);
                outG = Math.min(255, blended[1] * brightness);
                outB = Math.min(255, blended[2] * brightness);
            } else {
                // 3+ colours – distribute evenly across the luminance gradient
                const idx = t * (rgbColors.length - 1);
                const lo = Math.floor(idx);
                const hi = Math.min(lo + 1, rgbColors.length - 1);
                const frac = idx - lo;
                // Smoothstep the fraction for cleaner bands
                const sf = frac * frac * (3 - 2 * frac);
                const blended = lerpColor(rgbColors[lo], rgbColors[hi], sf);
                const brightness = 0.35 + t * 0.75;
                outR = Math.min(255, blended[0] * brightness);
                outG = Math.min(255, blended[1] * brightness);
                outB = Math.min(255, blended[2] * brightness);
            }

            data[i] = Math.round(outR);
            data[i + 1] = Math.round(outG);
            data[i + 2] = Math.round(outB);
            data[i + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);

        /* ---------------------------------------------------------------
         * Post-processing overlays (glossy floor finish)
         * --------------------------------------------------------------- */

        // 1. Radial vignette – darkens corners, brightens centre
        const vignette = ctx.createRadialGradient(
            w / 2, h / 2, w * 0.25,
            w / 2, h / 2, w * 0.75
        );
        vignette.addColorStop(0, "rgba(255,255,255,0.06)");
        vignette.addColorStop(0.6, "rgba(0,0,0,0)");
        vignette.addColorStop(1, "rgba(0,0,0,0.35)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        // 2. Diagonal specular highlight streak (simulates light reflecting off glossy floor)
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-Math.PI / 6);
        const streak = ctx.createLinearGradient(0, -h, 0, h);
        streak.addColorStop(0.38, "rgba(255,255,255,0)");
        streak.addColorStop(0.48, "rgba(255,255,255,0.12)");
        streak.addColorStop(0.52, "rgba(255,255,255,0.12)");
        streak.addColorStop(0.62, "rgba(255,255,255,0)");
        ctx.fillStyle = streak;
        ctx.fillRect(-w, -h, w * 2, h * 2);
        ctx.restore();

    }, [rgbColors, width, height]);

    /* ------------------------------------------------------------------ */
    /*  Load the base image once, then render whenever colours change      */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            imageRef.current = img;
            render();
        };
        img.src = "/epoxy-base.png";
    }, []); // load once

    // Re-render when colours change (image already loaded)
    useEffect(() => {
        if (imageRef.current) {
            requestAnimationFrame(render);
        }
    }, [render]);

    return (
        <canvas
            ref={canvasRef}
            className={`rounded-lg ${className}`}
            style={{ width: "100%", height: "auto" }}
        />
    );
};

export default MetallicFloorCanvas;
