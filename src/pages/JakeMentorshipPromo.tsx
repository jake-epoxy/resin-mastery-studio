import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Video, 
  PhoneCall, 
  Award, 
  Calendar, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  ChevronRight, 
  CheckCircle,
  HelpCircle,
  Mail,
  Phone,
  User,
  Zap,
  Check,
  Loader2
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export default function JakeMentorshipPromo() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    zoomDate: "",
    zoomTime: ""
  });

  // Dynamic Countdown to May 31, 2026 23:59:59 (Sunday night)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const targetDate = new Date("2026-05-31T23:59:59-06:00").getTime(); // Mountain Time / El Paso

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft(prev => ({ ...prev, isExpired: true }));
        clearInterval(timer);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.zoomDate || !formData.zoomTime) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all contact info and select a Zoom schedule.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Fetch Jake's user ID
      const { data: profile, error: profileErr } = await supabase
        .from('installer_profiles')
        .select('user_id')
        .eq('booking_slug', 'jake')
        .single();

      if (profileErr || !profile) {
        throw new Error("Could not connect to Jake's profile.");
      }

      // 2. Insert directly as an Epoxy Student Lead in the CRM
      const [firstName, ...lastNames] = formData.name.split(' ');
      const formattedDate = new Date(formData.zoomDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });

      const { error: insertErr } = await supabase
        .from('clients')
        .insert({
          installer_id: profile.user_id,
          first_name: firstName,
          last_name: lastNames.join(' ') || '',
          email: formData.email,
          phone: formData.phone,
          project_type: "Epoxy Launchpad Student ($900)",
          address: `Zoom Session 1: ${formattedDate} @ ${formData.zoomTime}`,
          source: "Mentorship Flash Sale Page",
          status: "New Lead"
        });

      if (insertErr) throw insertErr;

      // 3. Send instant email notification to Jake
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'jakeflowers222@gmail.com',
            subject: `🔥 NEW $900 STUDENT SIGNUP: ${formData.name}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #111; background-color: #f9f9f9; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #e2d1a6;">
                <h2 style="color: #b8860b; border-bottom: 2px solid #b8860b; padding-bottom: 10px; margin-top: 0;">New Launchpad Student Spot Reserved!</h2>
                <p style="font-size: 15px; margin: 15px 0; line-height: 1.5;">A new student has locked in their $900 weekend rate and booked their first Zoom coaching session.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr>
                    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; width: 150px; font-size: 14px;">Name:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 14px; color: #333;">${formData.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; font-size: 14px;">Email:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 14px; color: #333;"><a href="mailto:${formData.email}" style="color: #3b82f6; text-decoration: none;">${formData.email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; font-size: 14px;">Phone:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 14px; color: #333;"><a href="tel:${formData.phone}" style="color: #3b82f6; text-decoration: none;">${formData.phone}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; font-size: 14px;">Zoom Date:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 14px; color: #333; font-weight: bold;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd; font-size: 14px;">Zoom Time:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 14px; color: #333; font-weight: bold;">${formData.zoomTime} MT</td>
                  </tr>
                </table>
                
                <p style="margin-top: 30px; font-size: 11px; color: #777; line-height: 1.4; border-top: 1px solid #eee; pt-15px;">
                  This lead has been automatically inserted into your Resin OS Lead Center under the type 'Epoxy Launchpad Student ($900)' with 'New Lead' status.
                </p>
              </div>
            `
          })
        });
      } catch (emailErr) {
        console.error("Failed to dispatch notification email:", emailErr);
      }

      // 4. Send instant confirmation email to the student
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.email,
            subject: `🎉 Your Epoxy Mentorship Spot is Locked In!`,
            html: `
              <div style="font-family: sans-serif; padding: 25px; color: #111; background-color: #f9f9f9; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #d4af37;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="font-size: 32px;">🎉</span>
                  <h1 style="color: #b8860b; margin: 10px 0 0 0; font-family: sans-serif; font-weight: 900; letter-spacing: 1px;">JAKE EPOXY MASTERY</h1>
                  <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #777; margin: 5px 0 0 0;">THE 30-DAY BUSINESS LAUNCHPAD</p>
                </div>
                
                <p style="font-size: 16px; font-weight: bold; margin-top: 25px; color: #111;">Welcome to the family, ${firstName}!</p>
                <p style="font-size: 14px; line-height: 1.6; color: #444; margin: 15px 0;">
                  You have successfully locked in the exclusive **$900 weekend flash rate** (saving 87% off the standard $2,499 pricing). You are officially on the fast track to launching your own high-ticket epoxy flooring business and landing your first client quick!
                </p>
                
                <div style="background-color: #fff; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <h3 style="color: #b8860b; margin-top: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your First Zoom Session Details:</h3>
                  <p style="font-size: 15px; font-weight: bold; margin: 5px 0; color: #111;">${formattedDate}</p>
                  <p style="font-size: 13px; margin: 5px 0; color: #666; font-weight: 600;">Time: ${formData.zoomTime} MT</p>
                  <p style="font-size: 11px; color: #888; margin-top: 10px; font-style: italic; border-top: 1px solid #f9f9f9; padding-top: 8px;">
                    *Jake will personally text you at <strong>${formData.phone}</strong> shortly to send you the direct Zoom meeting link!
                  </p>
                </div>
                
                <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #111; margin-top: 25px;">What You Just Unlocked:</h3>
                <ul style="padding-left: 20px; font-size: 13px; color: #555; line-height: 1.8;">
                  <li><strong>Lifetime Video Tutorials:</strong> Full masterclass on concrete prep, veining, flake, and solids.</li>
                  <li><strong>3 Private Zoom Sessions:</strong> Step-by-step 1-on-1 coaching directly with Jake.</li>
                  <li><strong>Lifetime FaceTime Mentorship:</strong> Direct line to Jake for jobsite support during live installs.</li>
                  <li><strong>Product Sources & Marketing:</strong> Exclusive supplier list and high-converting ad copy templates.</li>
                  <li><strong>6 Months of Resin OS Premium Free:</strong> Full access to CRM, Quote Generator, and AI Prospector.</li>
                </ul>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666; font-weight: 500;">
                  <p style="margin: 0; font-style: italic;">Excited to build this empire with you.</p>
                  <p style="margin: 5px 0 0 0; color: #b8860b; font-weight: bold; letter-spacing: 1px;">— JAKE FLOWERS</p>
                </div>
              </div>
            `
          })
        });
      } catch (confirmErr) {
        console.error("Failed to send student confirmation email:", confirmErr);
      }
      
      setIsSuccess(true);
      toast({
        title: "Spot Locked In!",
        description: "You have reserved your mentorship spot. Jake will text you shortly to confirm!"
      });

    } catch (err: any) {
      console.error(err);
      toast({
        title: "Connection Error",
        description: err.message || "Failed to submit reservation. Please try again.",
        variant: "destructive"
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-inter overflow-x-hidden relative">
      
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-gradient-to-b from-[#d4af37]/5 via-transparent to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[150px] pointer-events-none" />

      {/* Floating Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8860b] flex items-center justify-center border border-[#d4af37]/30 shadow-md">
            <Sparkles size={16} className="text-black" />
          </div>
          <span className="font-space font-black text-[#d4af37] tracking-wider text-base uppercase">JAKE EPOXY MASTERY</span>
        </div>
        <span className="px-3 py-1 text-[10px] font-bold tracking-widest text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full uppercase">
          EXCLUSIVE ACCELERATOR
        </span>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-12 md:pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-semibold text-white/80 tracking-wide shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-ping" />
            Weekend Flash Sale: May 29th — May 31st Only
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-7xl font-space font-black text-white tracking-tight leading-none max-w-4xl mx-auto">
            The 30-Day Epoxy <br />
            <span className="bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] bg-clip-text text-transparent drop-shadow-md">
              Business Launchpad
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed font-medium">
            Stop trying the slow route. Lock in this weekend's flash rate and get the exact materials, marketing secrets, and 1-on-1 personal mentorship to land your first $10k client fast.
          </p>

          {/* Countdown Clock Grid */}
          <div className="pt-8 max-w-md mx-auto">
            <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
              
              <div className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-4 flex items-center justify-center gap-1.5">
                <Clock size={14} className="animate-spin-slow" /> Price Lock-In Countdown
              </div>

              {timeLeft.isExpired ? (
                <div className="text-red-400 font-bold text-lg uppercase tracking-wider py-2">
                  Flash Sale Closed — Pricing Returned to $2,499
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Days", val: timeLeft.days },
                    { label: "Hours", val: timeLeft.hours },
                    { label: "Mins", val: timeLeft.minutes },
                    { label: "Secs", val: timeLeft.seconds },
                  ].map((t, i) => (
                    <div key={i} className="bg-black/40 border border-white/5 rounded-xl p-3">
                      <div className="text-2xl md:text-3xl font-space font-black text-white">{String(t.val).padStart(2, '0')}</div>
                      <div className="text-[9px] uppercase font-bold tracking-wider text-white/30 mt-0.5">{t.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Section: Value Stack + Form */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left: Value Stack details (7 columns) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-space font-bold text-white tracking-tight">What You Get in the Full Package:</h2>
            <p className="text-sm text-white/40 leading-relaxed max-w-md">
              Everything you need to bypass standard commercial entry barriers, learn premium coating applications, and operate like a CEO.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: <Video className="text-[#d4af37]" size={24} />,
                title: "Lifetime Tutorial Vault",
                desc: "High-definition, step-by-step videos detailing professional concrete preparation, tooling selection, primer coats, custom veining, and vinyl flake broadcast."
              },
              {
                icon: <Video className="text-[#d4af37]" size={24} />,
                title: "3 Private Zoom 1-on-1 Sessions",
                desc: "Exclusive deep dives directly with Jake. We'll set up your legal business framework, walk you through the absolute basics, and map out your blueprint."
              },
              {
                icon: <PhoneCall className="text-[#d4af37]" size={24} />,
                title: "Lifetime Jobsite Mentorship",
                desc: "Never go it alone. You get a direct line to Jake. Facing a weird concrete crack or coating delay on a live install? Give him a call or FaceTime on the spot."
              },
              {
                icon: <Zap className="text-[#d4af37]" size={24} />,
                title: "Product Sources & Advanced Marketing",
                desc: "Instant access to premium supplier lists (stop buying retail!) and the exact Facebook/Instagram ad templates that consistently bring in high-ticket leads."
              },
              {
                icon: <Award className="text-[#d4af37]" size={24} />,
                title: "6 Months of Resin OS Premium Free",
                desc: "Full, unlimited access to the Resin OS CRM, Quote Generator, Proposals Hub, and the powerful AI Prospector tool ($600 value!) completely free."
              }
            ].map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                key={idx}
                className="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-[#d4af37]/20 transition-all group"
              >
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-[#d4af37]/10 group-hover:border-[#d4af37]/20 transition-all shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-white font-bold text-base group-hover:text-[#d4af37] transition-colors">{item.title}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pricing Value Callout */}
          <div className="p-6 bg-gradient-to-r from-[#d4af37]/10 to-transparent border-l-4 border-[#d4af37] rounded-r-2xl space-y-2">
            <h4 className="text-[#d4af37] font-bold text-sm uppercase tracking-wider">Total Value Stack: $7,298</h4>
            <p className="text-white font-extrabold text-lg">Lock-in Special: $900</p>
            <p className="text-white/50 text-xs leading-relaxed">
              Paying $900 for lifetime mentorship, 1-on-1 Zooms, and software means you are fully equipped from Day 1. One single garage or warehouse job pays for the entire package 5-10 times over.
            </p>
          </div>
        </div>

        {/* Right: Glassmorphic Booking Form (5 columns) */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-28">
            <div className="relative">
              {/* Glow border */}
              <div className="absolute -inset-1 bg-gradient-to-b from-[#d4af37]/25 to-blue-500/10 rounded-3xl blur-2xl opacity-40 pointer-events-none" />
              
              <div className="relative bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 blur-[60px] rounded-full pointer-events-none" />

                <AnimatePresence mode="wait">
                  {!isSuccess ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Price Badge */}
                      <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-1 rounded-full border border-[#d4af37]/20">LOCK IN SPOT</span>
                          <h3 className="text-white/40 text-xs font-semibold mt-2">Mentorship Flash Offer</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-white/40 text-xs line-through block font-medium">$2,499</span>
                          <span className="text-3xl font-space font-black text-white">$900</span>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/55 mb-2 px-1">Your Full Name</label>
                          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#d4af37]/40 transition-colors">
                            <User size={16} className="text-white/30 mr-3 shrink-0" />
                            <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="e.g. John Doe"
                              className="bg-transparent text-white text-xs outline-none placeholder:text-white/20 w-full"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/55 mb-2 px-1">Email Address</label>
                          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#d4af37]/40 transition-colors">
                            <Mail size={16} className="text-white/30 mr-3 shrink-0" />
                            <input 
                              type="email" 
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="e.g. john@example.com"
                              className="bg-transparent text-white text-xs outline-none placeholder:text-white/20 w-full"
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-white/55 mb-2 px-1">Phone Number</label>
                          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#d4af37]/40 transition-colors">
                            <Phone size={16} className="text-white/30 mr-3 shrink-0" />
                            <input 
                              type="tel" 
                              required
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="e.g. (555) 123-4567"
                              className="bg-transparent text-white text-xs outline-none placeholder:text-white/20 w-full"
                            />
                          </div>
                        </div>

                        {/* Scheduling: Pick Date */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/55 mb-2 px-1">Zoom Date</label>
                            <input 
                              type="date"
                              required
                              value={formData.zoomDate}
                              onChange={(e) => setFormData({ ...formData, zoomDate: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white text-xs outline-none focus:border-[#d4af37]/40 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/55 mb-2 px-1">Preferred Time</label>
                            <select 
                              required
                              value={formData.zoomTime}
                              onChange={(e) => setFormData({ ...formData, zoomTime: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white text-xs outline-none focus:border-[#d4af37]/40 transition-colors appearance-none"
                            >
                              <option value="" disabled className="bg-black">Select Time</option>
                              {["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM", "7:00 PM"].map((t) => (
                                <option key={t} value={t} className="bg-black text-white">{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSubmitting || timeLeft.isExpired}
                          className="w-full mt-4 py-4 bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#e5c158] hover:to-[#c69a24] text-black font-black text-sm uppercase tracking-widest rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(212,175,55,0.25)] flex items-center justify-center gap-1.5"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 size={16} className="animate-spin text-black" />
                              Locking In Spot...
                            </>
                          ) : (
                            <>
                              <Check size={16} strokeWidth={3} className="text-black" />
                              Lock In $900 Rate
                            </>
                          )}
                        </button>
                      </form>

                      <p className="text-[10px] text-white/20 text-center font-bold uppercase tracking-widest">
                        🛡️ 100% Secure · Jake Will Text You to Confirm
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8 space-y-6"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle size={32} className="text-emerald-400" />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-space font-black text-white">Your Spot is Reserved!</h3>
                        <p className="text-white/60 text-xs leading-relaxed max-w-xs mx-auto">
                          Jake has been notified and you have been added as an official Epoxy Launchpad Student.
                        </p>
                      </div>

                      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-left space-y-2 max-w-xs mx-auto">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Scheduled Zoom Call</h4>
                        <p className="text-white font-bold text-sm">
                          {new Date(formData.zoomDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-white/50 text-xs font-semibold">{formData.zoomTime} MT</p>
                      </div>

                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">
                        Hold tight—Jake will personally text you on <strong className="text-white font-black">{formData.phone}</strong> shortly to confirm and send the Zoom link!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-xs text-white/30 font-semibold uppercase tracking-widest relative z-10 bg-black/40">
        <p>© 2026 JAKE EPOXY MASTERY · ALL RIGHTS RESERVED</p>
        <p className="mt-2 text-[10px] text-white/15">EL PASO, TX & NATIONWIDE</p>
      </footer>
    </div>
  );
}

// Extra spinning animation utility for clock icon
const style = document.createElement('style');
style.textContent = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }
`;
document.head.appendChild(style);
