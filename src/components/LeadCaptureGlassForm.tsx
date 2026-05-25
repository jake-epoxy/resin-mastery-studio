import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { logLeadToSheets } from '../lib/logLead';
import { supabase } from '../lib/supabase';

type Step = 'name' | 'phone' | 'service' | 'success';

interface FormState {
  name: string;
  phone: string;
  service: string;
}

export function LeadCaptureGlassForm() {
  const [step, setStep] = useState<Step>('name');
  const [formData, setFormData] = useState<FormState>({ name: '', phone: '', service: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'name' && formData.name.trim()) setStep('phone');
    else if (step === 'phone' && formData.phone.trim()) setStep('service');
  };

  const handleSubmit = async (service: string) => {
    setIsSubmitting(true);
    const finalData = { ...formData, service };
    setFormData(finalData);
    
    // Log directly to CRM via fetch to book-consultation endpoint without scheduled_at
      // Primary: Log directly to Supabase CRM
      const { data: profile } = await supabase.from('installer_profiles').select('user_id').eq('booking_slug', 'jake').single();
      
      if (profile?.user_id) {
        const [firstName, ...lastNames] = finalData.name.split(' ');
        await supabase.from('clients').insert({
          installer_id: profile.user_id,
          first_name: firstName,
          last_name: lastNames.join(' ') || '',
          phone: finalData.phone,
          project_type: service,
          source: 'JakeEpoxy Landing Page',
          status: 'Lead'
        });
      }

      // Secondary: Log to Google Sheets for redundancy
      logLeadToSheets({
        name: finalData.name,
        phone: finalData.phone,
        source: `Website - /jakeepoxy - ${service}`,
      });
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');
    }, 1500);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Dynamic Glowing Aura */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
      
      <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          
          {step === 'name' && (
            <motion.form
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleNext}
              className="flex flex-col gap-6"
            >
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Let's build something masterpiece.</h3>
                <p className="text-white/60 text-sm">Enter your name to start your exclusive consultation.</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="First & Last Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!formData.name.trim()}
                className="w-full bg-white text-black font-bold rounded-xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                Continue <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.form>
          )}

          {step === 'phone' && (
            <motion.form
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleNext}
              className="flex flex-col gap-6"
            >
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">What's the best number to reach you?</h3>
                <p className="text-white/60 text-sm">I'll personally reach out to discuss your project.</p>
              </div>
              <div className="relative">
                <input
                  type="tel"
                  autoFocus
                  required
                  placeholder="(555) 555-5555"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('name')}
                  className="px-6 py-4 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!formData.phone.trim()}
                  className="flex-1 bg-white text-black font-bold rounded-xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  Continue <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.form>
          )}

          {step === 'service' && (
            <motion.div
              key="service"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">What are you looking for?</h3>
                <p className="text-white/60 text-sm">Select a service to finalize your request.</p>
              </div>
              
              <div className="flex flex-col gap-3">
                {['Custom Luxurious Epoxy Flooring', 'Premium Epoxy Countertops', 'Live Job Site Training'].map((service) => (
                  <button
                    key={service}
                    onClick={() => handleSubmit(service)}
                    disabled={isSubmitting}
                    className="w-full text-left bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 rounded-xl px-5 py-4 text-white transition-all group flex items-center justify-between"
                  >
                    <span className="font-medium">{service}</span>
                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  disabled={isSubmitting}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  Go Back
                </button>
                {isSubmitting && (
                  <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" /> Finalizing...
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-4 py-8"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-3xl font-bold text-white tracking-tight">You're on the list.</h3>
              <p className="text-white/60">
                Jake will be reviewing your request and will reach out to {formData.phone} shortly.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
