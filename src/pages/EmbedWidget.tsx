import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Upload, Phone, CheckCircle2, Wand2, RefreshCcw, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function EmbedWidget() {
  const { installerId } = useParams();
  
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [base64Photo, setBase64Photo] = useState<string | null>(null);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lead Gate State
  const [hasPassedGate, setHasPassedGate] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Style config
  const [coatingStyle, setCoatingStyle] = useState("flake-epoxy");
  const [colorDescription, setColorDescription] = useState("charcoal grey and white");

  const MAX_LIMIT = 3;
  const [tokensUsed, setTokensUsed] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('ai_widget_tokens');
    const passed = localStorage.getItem('ai_widget_unlocked');
    if (saved) setTokensUsed(parseInt(saved, 10));
    if (passed === 'true') setHasPassedGate(true);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setBase64Photo(b64.split(',')[1]); 
      setPhotoUrl(URL.createObjectURL(file));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installerId) return;

    setIsLoading(true);
    // Hit the secure serverless endpoint to bypass RLS
    try {
      const resp = await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installer_id: installerId,
          first_name: firstName,
          last_name: lastName,
          phone: phoneNumber
        })
      });

      if (!resp.ok) {
        throw new Error('Failed to submit info');
      }
    } catch(err) {
      setError("Failed to verify contact info.");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    localStorage.setItem('ai_widget_unlocked', 'true');
    setHasPassedGate(true);
  };

  const triggerAI = async () => {
    if (tokensUsed >= MAX_LIMIT) {
      setError("Preview limit reached! Your contractor has received your info and will reach out shortly for a formal quote. They have access to unlimited high-resolution AI renders to show you more examples!");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Photo,
          coatingStyle,
          colorDescription,
          customNotes: ""
        }),
      });

      if (!response.ok) {
         const data = await response.json();
         throw new Error(data.error || "Visualization failed");
      }

      const data = await response.json();
      setRenderedUrl(data.image);
      
      const newCount = tokensUsed + 1;
      setTokensUsed(newCount);
      localStorage.setItem('ai_widget_tokens', newCount.toString());

    } catch (err: any) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-inter">
       {!photoUrl ? (
          <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
             <div className="w-20 h-20 bg-[#ffffff]/10 rounded-full flex items-center justify-center mb-6">
                <Wand2 size={32} className="text-[#ffffff]" />
             </div>
             <h2 className="text-2xl font-black tracking-tight mb-2">AI Floor Visualizer</h2>
             <p className="text-white/60 mb-8 max-w-sm">Take a photo of your dirty garage, patio, or warehouse floor to see it transformed instantly.</p>
             
             <label className="bg-[#ffffff] text-black font-bold py-4 px-8 rounded-xl cursor-pointer hover:bg-white transition-colors shadow-[0_0_30px_rgba(255, 255, 255,0.3)]">
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <span className="flex items-center gap-2"><Upload size={20} /> Upload Photo</span>
             </label>
             {error && <p className="text-emerald-400 text-sm mt-4">{error}</p>}
          </div>
       ) : (
          <div className="flex flex-col min-h-screen relative">
             <div className="flex-1 relative bg-[#111]">
                <img src={renderedUrl || photoUrl} alt="Floor" className="absolute inset-0 w-full h-full object-cover" />
                
                {/* Dark Gradient Overlay for UI legibility */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none" />

                <AnimatePresence>
                   {!hasPassedGate && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-20"
                      >
                         <form onSubmit={handleLeadSubmit} className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                            <div className="flex justify-center mb-6">
                               <div className="w-16 h-16 bg-[#ffffff]/20 text-[#ffffff] rounded-full flex items-center justify-center">
                                  <Lock size={28} />
                               </div>
                            </div>
                            <h3 className="text-2xl font-black text-center mb-2">Unlock AI Render</h3>
                            <p className="text-center text-white/50 text-sm mb-6">Enter your info below to unlock your free 4K visualizations and receive the unwatermarked photos.</p>
                            
                            <div className="space-y-4">
                               <div className="grid grid-cols-2 gap-3">
                                  <input required value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First Name" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#ffffff] outline-none" />
                                  <input required value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last Name" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#ffffff] outline-none" />
                               </div>
                               <input required type="tel" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} placeholder="Phone Number" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#ffffff] outline-none" />
                               
                               <button disabled={isLoading} className="w-full bg-[#ffffff] text-black font-bold py-3 rounded-xl disabled:opacity-50">
                                  {isLoading ? 'Verifying...' : 'Unlock Visualizer'}
                               </button>
                            </div>
                         </form>
                      </motion.div>
                   )}
                </AnimatePresence>

                {isLoading && hasPassedGate && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-[#ffffff]">
                    <div className="w-12 h-12 border-4 border-[#ffffff] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold tracking-widest uppercase text-sm animate-pulse">Rendering Design...</p>
                  </div>
                )}
             </div>

             {/* Controls Bar */}
             <div className="bg-[#050505] p-5 pb-[env(safe-area-inset-bottom)] border-t border-white/10 relative z-30 shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
                {error && <p className="text-emerald-400 text-xs text-center mb-3">{error}</p>}
                
                <div className="flex gap-3 mb-4">
                   <select 
                     value={coatingStyle} 
                     onChange={e => setCoatingStyle(e.target.value)}
                     className="flex-1 bg-[#111] border border-blue-500/30 text-white rounded-xl px-3 py-3 text-sm focus:border-[#ffffff] outline-none"
                   >
                     <option value="flake-epoxy">Vinyl Flake</option>
                     <option value="marble-epoxy">Marble Epoxy</option>
                     <option value="metallic-epoxy">Metallic Swirl</option>
                     <option value="solid-epoxy">Solid Color</option>
                   </select>
                   <input 
                     type="text" 
                     value={colorDescription}
                     onChange={e => setColorDescription(e.target.value)}
                     placeholder="e.g. Cobalt Blue"
                     className="flex-1 bg-[#111] border border-blue-500/30 text-white rounded-xl px-3 py-3 text-sm focus:border-[#ffffff] outline-none"
                   />
                </div>

                <div className="flex gap-2">
                   <button 
                     onClick={triggerAI}
                     disabled={isLoading || tokensUsed >= MAX_LIMIT}
                     className="flex-1 bg-[#ffffff] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white disabled:opacity-50"
                   >
                     <Wand2 size={18} /> Render Floor
                   </button>
                   <label className="bg-blue-500/10 border border-blue-500/30 text-white p-4 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20">
                     <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                     <RefreshCcw size={18} />
                   </label>
                </div>
                
                <div className="mt-3 text-center text-white/30 text-[10px] font-bold uppercase tracking-widest flex justify-center items-center gap-1">
                   {tokensUsed} / {MAX_LIMIT} Previews Used 
                   {tokensUsed >= MAX_LIMIT && <span className="text-emerald-400 ml-1">Limit Reached</span>}
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
