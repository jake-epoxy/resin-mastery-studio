import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, MeshReflectorMaterial, Text, Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { LeadCaptureGlassForm } from '../components/LeadCaptureGlassForm';

/* ═══════════════════════════════════════════
   3D SCENE COMPONENTS
   ═══════════════════════════════════════════ */

/* ─── Camera Rail: moves along a path based on scroll ─── */
function CameraRig() {
  const { camera } = useThree();
  const scrollRef = useRef(0);
  const targetRef = useRef(0);

  // Define the camera path through the environment
  const path = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2, 12),     // Start: looking into the entryway
      new THREE.Vector3(0, 2, 4),      // Move into the first room
      new THREE.Vector3(0, 2, -4),     // Through to the corridor
      new THREE.Vector3(3, 2, -12),    // Turn into the garage
      new THREE.Vector3(0, 2, -20),    // Push through to the lounge
      new THREE.Vector3(0, 2, -28),    // Final position: the end
    ], false, 'catmullrom', 0.5);
  }, []);

  // Separate lookAt path (slightly ahead of camera)
  const lookAtPath = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.8, 4),
      new THREE.Vector3(0, 1.8, -4),
      new THREE.Vector3(0, 1.8, -12),
      new THREE.Vector3(0, 1.8, -20),
      new THREE.Vector3(0, 1.8, -28),
      new THREE.Vector3(0, 1.8, -36),
    ], false, 'catmullrom', 0.5);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      targetRef.current = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame(() => {
    // Smooth lerp for buttery camera movement
    scrollRef.current += (targetRef.current - scrollRef.current) * 0.05;
    const t = Math.max(0, Math.min(1, scrollRef.current));

    const pos = path.getPointAt(t);
    const lookAt = lookAtPath.getPointAt(t);

    camera.position.copy(pos);
    camera.lookAt(lookAt);
  });

  return null;
}

/* ─── Reflective Epoxy Floor ─── */
function EpoxyFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]} receiveShadow>
      <planeGeometry args={[30, 60]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={1024}
        mixBlur={0.8}
        mixStrength={15}
        roughness={0}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0a0a0a"
        metalness={0.9}
        mirror={0.75}
      />
    </mesh>
  );
}

/* ─── Room Walls (box-shaped room segment) ─── */
function RoomSegment({ position, width = 10, height = 5, depth = 12, color = '#111111', emissiveColor = '#000000', emissiveIntensity = 0 }: any) {
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.85,
    metalness: 0.1,
    emissive: new THREE.Color(emissiveColor),
    emissiveIntensity,
    side: THREE.BackSide,
  }), [color, emissiveColor, emissiveIntensity]);

  return (
    <group position={position}>
      {/* Ceiling */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} material={wallMaterial}>
        <planeGeometry args={[width, depth]} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={wallMaterial}>
        <planeGeometry args={[depth, height]} />
      </mesh>
      {/* Right wall */}
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={wallMaterial}>
        <planeGeometry args={[depth, height]} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, height / 2, -depth / 2]} material={wallMaterial}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  );
}

/* ─── Glowing Accent Light Strip (like LED trim) ─── */
function LightStrip({ position, width = 8, color = '#D4AF37' }: any) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 0.05, 0.05]} />
      <meshStandardMaterial emissive={color} emissiveIntensity={3} color={color} />
    </mesh>
  );
}

/* ─── Floating Particles for atmosphere ─── */
function Particles() {
  const count = 200;
  const mesh = useRef<any>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#D4AF37" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

/* ─── 3D Text Labels that exist in the scene ─── */
function SceneText({ position, text, fontSize = 0.5, color = '#D4AF37' }: any) {
  return (
    <Float speed={1} rotationIntensity={0} floatIntensity={0.3}>
      <Text
        position={position}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
        maxWidth={8}
        textAlign="center"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {text}
      </Text>
    </Float>
  );
}

/* ═══════════════════════════════════════════
   FULL 3D ENVIRONMENT
   ═══════════════════════════════════════════ */
function LuxuryInterior() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <fog attach="fog" args={['#000000', 5, 35]} />

      {/* Room 1: Grand Entryway */}
      <RoomSegment position={[0, 0, 4]} width={12} height={6} depth={16} color="#0d0d0d" />
      <pointLight position={[0, 5, 8]} intensity={8} color="#D4AF37" distance={15} decay={2} castShadow />
      <pointLight position={[-3, 3, 6]} intensity={3} color="#8b5cf6" distance={10} decay={2} />
      <LightStrip position={[0, 5.95, 4]} width={10} color="#D4AF37" />

      {/* Room 2: The Corridor */}
      <RoomSegment position={[0, 0, -10]} width={8} height={4.5} depth={16} color="#0a0a0a" />
      <pointLight position={[0, 4, -8]} intensity={5} color="#a855f7" distance={12} decay={2} />
      <pointLight position={[0, 4, -14]} intensity={5} color="#D4AF37" distance={12} decay={2} />
      <LightStrip position={[0, 4.45, -10]} width={6} color="#a855f7" />
      <LightStrip position={[-3.95, 2.25, -10]} width={0.05} color="#D4AF37" />
      <LightStrip position={[3.95, 2.25, -10]} width={0.05} color="#D4AF37" />

      {/* Room 3: The Showroom */}
      <RoomSegment position={[0, 0, -24]} width={14} height={5.5} depth={16} color="#0d0d0d" emissiveColor="#1a0a2e" emissiveIntensity={0.1} />
      <pointLight position={[-4, 4.5, -22]} intensity={6} color="#D4AF37" distance={12} decay={2} />
      <pointLight position={[4, 4.5, -26]} intensity={6} color="#D4AF37" distance={12} decay={2} />
      <pointLight position={[0, 3, -24]} intensity={4} color="#8b5cf6" distance={15} decay={2} />
      <LightStrip position={[0, 5.45, -24]} width={12} color="#D4AF37" />

      {/* Decorative elements in showroom */}
      <mesh position={[-5, 1.5, -26]} castShadow>
        <boxGeometry args={[1.5, 3, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[5, 1.5, -26]} castShadow>
        <boxGeometry args={[1.5, 3, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* The epoxy floor — the star of the show */}
      <EpoxyFloor />

      {/* Atmospheric particles */}
      <Particles />

      {/* Camera Rail */}
      <CameraRig />
    </>
  );
}

/* ═══════════════════════════════════════════
   SCROLL-DRIVEN HUD OVERLAY
   ═══════════════════════════════════════════ */
const scenes = [
  {
    range: [0, 0.2],
    label: 'THE GRAND ENTRYWAY',
    heading: 'Floors That Define Luxury.',
    body: 'Handcrafted seamless epoxy floors and premium countertops. From celebrity homes to architectural masterpieces.',
    badges: ['El Paso\'s #1 Resin Authority', 'Nationwide Travel'],
  },
  {
    range: [0.25, 0.45],
    label: 'THE CORRIDOR',
    heading: 'Seamless. Unbroken. Infinite.',
    body: 'One continuous, mirror-like surface poured directly onto your substrate. No tiles. No seams. No grout. Just pure, uninterrupted luxury.',
    badges: ['Seamless Pour Technology', 'Own Resin Product Line'],
  },
  {
    range: [0.5, 0.7],
    label: 'THE SHOWROOM',
    heading: 'Showroom Quality. Industrial Strength.',
    body: 'Metallic flake systems and hyper-durable coatings designed for exotic vehicles, celebrity homes, and commercial giants.',
    badges: ['Celebrity & Commercial', 'Live Job Site Training'],
  },
  {
    range: [0.78, 1],
    label: 'YOUR PROJECT',
    heading: 'Let\'s Build Something Legendary.',
    body: null,
    badges: [],
    showForm: true,
  },
];

function HUDOverlay() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeScene, setActiveScene] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      setScrollProgress(progress);

      // Determine active scene
      let found: number | null = null;
      for (let i = 0; i < scenes.length; i++) {
        const [start, end] = scenes[i].range;
        if (progress >= start && progress <= end) {
          found = i;
          break;
        }
      }
      setActiveScene(found);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scene = activeScene !== null ? scenes[activeScene] : null;

  // Calculate opacity within scene range for smooth fade
  let contentOpacity = 0;
  if (scene && activeScene !== null) {
    const [start, end] = scene.range;
    const duration = end - start;
    const localProgress = (scrollProgress - start) / duration;
    // Fade in first 20%, hold, fade out last 15%
    if (localProgress < 0.2) contentOpacity = localProgress / 0.2;
    else if (localProgress > 0.85) contentOpacity = (1 - localProgress) / 0.15;
    else contentOpacity = 1;
    contentOpacity = Math.max(0, Math.min(1, contentOpacity));
  }

  return (
    <div className="fixed inset-0 z-20 pointer-events-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Cinematic Letterbox */}
      <div className="absolute top-0 left-0 right-0 h-[4vh] bg-black z-50" />
      <div className="absolute bottom-0 left-0 right-0 h-[4vh] bg-black z-50" />

      {/* Room Nav Dots */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 pointer-events-auto">
        {scenes.map((s, i) => (
          <button
            key={i}
            className="group relative flex items-center justify-end"
            onClick={() => {
              const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
              const target = ((s.range[0] + s.range[1]) / 2) * scrollHeight;
              window.scrollTo({ top: target, behavior: 'smooth' });
            }}
          >
            <span className="absolute right-5 whitespace-nowrap text-[9px] tracking-[0.15em] uppercase font-semibold text-white/0 group-hover:text-white/60 transition-all duration-300 pr-1">
              {s.label}
            </span>
            <div className={`w-2 h-2 rounded-full border transition-all duration-500 ${
              activeScene === i
                ? 'bg-[#D4AF37] border-[#D4AF37] scale-150 shadow-[0_0_10px_rgba(212,175,55,0.6)]'
                : 'bg-transparent border-white/25 hover:border-white/50'
            }`} />
          </button>
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-[6vh] left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2"
        animate={{ opacity: scrollProgress < 0.03 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="text-[9px] tracking-[0.3em] text-white/35 uppercase font-semibold">Scroll to Walk Through</span>
        <motion.div
          className="w-6 h-10 border border-white/15 rounded-full flex justify-center pt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <div className="w-0.5 h-2 bg-[#D4AF37] rounded-full" />
        </motion.div>
      </motion.div>

      {/* Scene Content */}
      <AnimatePresence mode="wait">
        {scene && (
          <motion.div
            key={activeScene}
            className="absolute inset-0 flex items-end pb-[8vh] px-8 md:px-16 lg:px-24"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: contentOpacity, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {scene.showForm ? (
              /* Final scene: Lead Capture */
              <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-end lg:items-center gap-12 pointer-events-auto">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 backdrop-blur-xl mb-5">
                    <span className="text-[9px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">{scene.label}</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-white drop-shadow-2xl">
                    Let's Build Something{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37]">Legendary.</span>
                  </h2>
                </div>
                <div className="flex-1 w-full max-w-md">
                  <LeadCaptureGlassForm />
                </div>
              </div>
            ) : (
              /* Regular scene: selling points */
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 backdrop-blur-xl mb-5">
                  <span className="text-[9px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">{scene.label}</span>
                </div>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-white mb-5 drop-shadow-2xl">
                  {scene.heading.split('. ').map((part, i, arr) => (
                    <span key={i} className="block">
                      {i === arr.length - 1 ? (
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37]">{part}</span>
                      ) : (
                        <>{part}. </>
                      )}
                    </span>
                  ))}
                </h2>
                <p className="text-base md:text-lg text-white/70 max-w-xl leading-relaxed mb-6 drop-shadow-lg">
                  {scene.body}
                </p>
                <div className="flex flex-wrap gap-2">
                  {scene.badges.map((badge) => (
                    <div key={badge} className="flex items-center gap-2 text-[11px] font-semibold text-white/60 bg-white/5 backdrop-blur-md px-3 py-2 rounded-full border border-white/10">
                      <div className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                      {badge}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function JakeEpoxyLanding() {
  return (
    <div className="bg-black text-white">
      <Helmet>
        <title>Jake Epoxy | El Paso's Premier Custom Luxurious Epoxy Flooring</title>
        <meta name="description" content="State of the art custom luxurious epoxy flooring and countertops in El Paso, TX. The only installer with a personal Resin product line, traveling nationwide for celebrities, commercial, and residential projects." />
        <meta name="keywords" content="Epoxy Flooring El Paso, Custom Epoxy, Luxury Countertops, Jake Epoxy, Nationwide Resin Installer, Celebrity Epoxy Installer, Live Job Site Trainings El Paso" />
        <meta property="og:title" content="Jake Epoxy | Floors That Define Luxury" />
        <meta property="og:description" content="El Paso's exclusive luxury epoxy installer. Custom flooring, premium countertops, and the only installer with a custom resin product line." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://resinacademics.com/jakeepoxy" />
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Jake Epoxy",
            "description": "El Paso's premier luxury epoxy flooring and countertop installer.",
            "url": "https://resinacademics.com/jakeepoxy",
            "address": { "@type": "PostalAddress", "addressLocality": "El Paso", "addressRegion": "TX" },
            "areaServed": ["El Paso", "Nationwide"],
            "priceRange": "$$$"
          }
        `}</script>
      </Helmet>

      {/* Scroll spacer — 600vh gives plenty of room for the camera to travel */}
      <div className="h-[600vh] relative">
        {/* Fixed 3D Canvas */}
        <div className="fixed inset-0 z-10">
          <Canvas
            shadows
            camera={{ fov: 60, near: 0.1, far: 100 }}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.8 }}
          >
            <LuxuryInterior />
          </Canvas>
        </div>

        {/* HUD Overlay */}
        <HUDOverlay />
      </div>
    </div>
  );
}
