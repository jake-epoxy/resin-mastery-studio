import React, { Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import { MapPin, Globe, Star, ShieldCheck, Zap } from 'lucide-react';
import { LeadCaptureGlassForm } from '../components/LeadCaptureGlassForm';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function JakeEpoxyLanding() {
  return (
    <div className="bg-black min-h-screen text-white font-inter overflow-x-hidden selection:bg-purple-500/30">
      <Helmet>
        <title>Jake Epoxy | El Paso's Premier Custom Luxurious Epoxy Flooring</title>
        <meta name="description" content="State of the art custom luxurious epoxy flooring and countertops in El Paso, TX. The only installer with a personal Resin product line, traveling nationwide for celebrities, commercial, and residential projects." />
        <meta name="keywords" content="Epoxy Flooring El Paso, Custom Epoxy, Luxury Countertops, Jake Epoxy, Nationwide Resin Installer, Celebrity Epoxy Installer, Live Job Site Trainings El Paso" />
        
        {/* Open Graph / Social */}
        <meta property="og:title" content="Jake Epoxy | The Apex of Resin Artistry" />
        <meta property="og:description" content="El Paso's exclusive luxury epoxy installer. Custom flooring, premium countertops, and the only installer with a custom resin product line." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://resinacademics.com/jakeepoxy" />
        
        {/* Structured Data for SEO Dominance */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Jake Epoxy",
            "description": "El Paso's premier custom luxurious epoxy flooring and countertops installer. Travels nationwide for celebrity, commercial, and residential clients.",
            "url": "https://resinacademics.com/jakeepoxy",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "El Paso",
              "addressRegion": "TX",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "31.7619",
              "longitude": "-106.4850"
            },
            "areaServed": ["El Paso, TX", "Nationwide"],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Epoxy Services",
              "itemListElement": [
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Custom Luxurious Epoxy Flooring" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Premium Epoxy Countertops" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Live Job Site Training" } }
              ]
            }
          })}
        </script>
      </Helmet>

      {/* Hero Section with 3D Background */}
      <div className="relative min-h-screen w-full flex flex-col justify-center overflow-hidden">
        
        {/* 3D Spline Canvas */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen">
          <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-black via-purple-900/20 to-black animate-pulse" />}>
            <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
          </Suspense>
        </div>

        {/* Floating Grid overlay */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full py-20 flex flex-col lg:flex-row items-center gap-16">
          
          <motion.div 
            className="flex-1 text-center lg:text-left"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-white/80 uppercase">El Paso's #1 Resin Authority</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40">
              The Future of <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">Luxurious Surfaces.</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              We engineer custom, state-of-the-art epoxy flooring and premium countertops. From celebrity homes to commercial giants nationwide, we don't just install—we redefine.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center lg:justify-start gap-4">
              <div className="flex items-center gap-2 text-sm text-white/50 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                <Globe className="w-4 h-4 text-purple-400" /> Nationwide Travel
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                <Star className="w-4 h-4 text-yellow-400" /> Celebrity & Commercial
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Own Resin Product Line
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="flex-1 w-full max-w-lg"
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <LeadCaptureGlassForm />
          </motion.div>

        </div>
      </div>

      {/* Expertise Section */}
      <div className="relative py-32 border-t border-white/10 bg-black/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Unrivaled Craftsmanship.</h2>
            <p className="text-white/50 max-w-2xl mx-auto">I am the only installer in El Paso with a personal line of proprietary resin products, and the only one actively conducting live job-site training for the next generation of artisans.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Custom Luxurious Floors", icon: <Star className="w-6 h-6" />, desc: "Metallic sweeps, flawless flakes, and hyper-durable industrial coatings tailored precisely to your aesthetic." },
              { title: "Premium Countertops", icon: <MapPin className="w-6 h-6" />, desc: "Transform outdated surfaces into seamless, marble-replicating works of art that are heat, scratch, and impact resistant." },
              { title: "Live Job Site Training", icon: <Zap className="w-6 h-6" />, desc: "The only installer in El Paso training other contractors on real, active job sites using my own proprietary resin line." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
