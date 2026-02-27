import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

// Real US TopoJSON from CDN — this is actual geographic data, not an approximation
const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface InstallerPin {
  city: string;
  state: string;
  /** [longitude, latitude] — standard geo format */
  coordinates: [number, number];
}

/**
 * Real lat/lon coordinates for each installer city.
 * react-simple-maps uses the Albers USA projection to convert these
 * to pixel-perfect positions automatically — no manual x/y guessing.
 */
const installers: InstallerPin[] = [
  { city: "El Paso", state: "TX", coordinates: [-106.4248, 31.7619] },
  { city: "Oklahoma City", state: "OK", coordinates: [-97.5164, 35.4676] },
  { city: "Phoenix", state: "AZ", coordinates: [-112.074, 33.4484] },
  { city: "Boston", state: "MA", coordinates: [-71.0589, 42.3601] },
  { city: "Indianapolis", state: "IN", coordinates: [-86.1581, 39.7684] },
  { city: "Dallas", state: "TX", coordinates: [-96.797, 32.7767] },
  { city: "San Diego", state: "CA", coordinates: [-117.1611, 32.7157] },
  { city: "San Antonio", state: "TX", coordinates: [-98.4936, 29.4241] },
];

const InstallerMapSection = () => {
  const ref = useScrollReveal();
  const [hoveredPin, setHoveredPin] = useState<number | null>(null);

  return (
    <section className="py-32 px-6 relative" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 animate-scroll-reveal">
            Our Network
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold font-display text-primary text-glow-strong leading-tight animate-scroll-reveal"
            style={{ transitionDelay: "0.1s" }}
          >
            Installer Network
          </h2>
        </div>

        {/* Map container */}
        <div
          className="relative rounded-lg overflow-hidden animate-scroll-reveal"
          style={{
            transitionDelay: "0.2s",
            background: "linear-gradient(135deg, #050510 0%, #0a0a1a 50%, #050510 100%)",
            border: "1px solid rgba(120, 200, 255, 0.1)",
            boxShadow: "0 0 60px rgba(120, 200, 255, 0.05), inset 0 0 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Scan line overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(120,200,255,0.015) 2px, rgba(120,200,255,0.015) 4px)",
            }}
          />

          {/* HUD top bar */}
          <div className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-[#78c8ff]/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#78c8ff] animate-pulse" />
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#78c8ff]/60 font-mono">
                Network Active
              </span>
            </div>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#78c8ff]/40 font-mono">
              {installers.length} Active Nodes
            </span>
          </div>

          {/* The Map */}
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{ scale: 1100 }}
            width={980}
            height={580}
            style={{ width: "100%", height: "auto" }}
          >
            {/* State shapes */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rpiaturalEarth || geo.id}
                    geography={geo}
                    fill="#0d0d1a"
                    stroke="rgba(120, 200, 255, 0.18)"
                    strokeWidth={0.6}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "#11112a" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Installer Markers */}
            {installers.map((pin, i) => (
              <Marker
                key={i}
                coordinates={pin.coordinates}
                onMouseEnter={() => setHoveredPin(i)}
                onMouseLeave={() => setHoveredPin(null)}
              >
                {/* Outer pulse ring */}
                <circle
                  r={hoveredPin === i ? 18 : 14}
                  fill="none"
                  stroke="rgba(120, 200, 255, 0.3)"
                  strokeWidth={1}
                  className="animate-ping"
                  style={{
                    animationDuration: "3s",
                    animationDelay: `${i * 0.4}s`,
                    transformOrigin: "center",
                  }}
                />
                {/* Glow ring */}
                <circle
                  r={8}
                  fill="rgba(120, 200, 255, 0.08)"
                  stroke="rgba(120, 200, 255, 0.2)"
                  strokeWidth={0.5}
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(120, 200, 255, 0.4))",
                    transition: "all 0.3s ease",
                    transform: hoveredPin === i ? "scale(1.5)" : "scale(1)",
                  }}
                />
                {/* Center dot */}
                <circle
                  r={3.5}
                  fill="#78c8ff"
                  style={{
                    filter: "drop-shadow(0 0 4px rgba(120, 200, 255, 0.8))",
                    transition: "all 0.3s ease",
                    transform: hoveredPin === i ? "scale(1.4)" : "scale(1)",
                  }}
                />

                {/* Tooltip */}
                {hoveredPin === i && (
                  <g>
                    <rect
                      x={-70}
                      y={-45}
                      width={140}
                      height={36}
                      rx={6}
                      fill="rgba(8, 8, 20, 0.95)"
                      stroke="rgba(120, 200, 255, 0.3)"
                      strokeWidth={0.8}
                      style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}
                    />
                    <text
                      textAnchor="middle"
                      y={-28}
                      fill="#78c8ff"
                      fontSize={12}
                      fontWeight={600}
                      fontFamily="'Space Grotesk', sans-serif"
                    >
                      {pin.city}, {pin.state}
                    </text>
                    <text
                      textAnchor="middle"
                      y={-16}
                      fill="#888"
                      fontSize={8}
                      fontFamily="'Inter', sans-serif"
                      letterSpacing="0.1em"
                    >
                      CERTIFIED INSTALLER
                    </text>
                  </g>
                )}
              </Marker>
            ))}
          </ComposableMap>

          {/* HUD bottom bar */}
          <div className="relative z-20 flex items-center justify-between px-6 py-3 border-t border-[#78c8ff]/10">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#78c8ff]/40 font-mono">
              Albers USA Projection
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#78c8ff]/40 font-mono">
              Resin Academics © {new Date().getFullYear()}
            </span>
          </div>

          {/* Corner brackets */}
          {[
            "top-2 left-2 border-t border-l",
            "top-2 right-2 border-t border-r",
            "bottom-2 left-2 border-b border-l",
            "bottom-2 right-2 border-b border-r",
          ].map((pos) => (
            <div
              key={pos}
              className={`absolute ${pos} w-5 h-5 border-[#78c8ff]/20 pointer-events-none z-20`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstallerMapSection;
