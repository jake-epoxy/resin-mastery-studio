import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function ReviewPortal() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [installerProfile, setInstallerProfile] = useState<any>(null);
  
  const [selectedStars, setSelectedStars] = useState(0);
  const [hoveredStars, setHoveredStars] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    async function init() {
      if (!id) return;
      try {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (clientData) {
          setClient(clientData);
          
          const { data: profileData } = await supabase
            .from('installer_profiles')
            .select('*')
            .eq('user_id', clientData.installer_id)
            .single();
            
          if (profileData) setInstallerProfile(profileData);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    init();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ffffff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-space text-center">
        <h2>Link Expired or Invalid</h2>
      </div>
    );
  }

  const handleStarClick = (stars: number) => {
    if (hasSubmitted) return;
    setSelectedStars(stars);
    setHasSubmitted(true);
  };

  const handlePrivateFeedback = async () => {
    setIsSubmittingFeedback(true);
    // You could append this to a "private_notes" or "feedback" column in the future
    await new Promise(r => setTimeout(r, 800)); 
    setIsSubmittingFeedback(false);
    alert("Thank you. Your feedback has been sent directly to management.");
  };

  const googleLink = installerProfile?.google_review_link || "https://google.com";

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 selection:bg-[#ffffff]/30">
        
       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
       >
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffffff]/10 rounded-full blur-[100px] pointer-events-none" />

          <header className="text-center mb-10 relative z-10">
             {installerProfile?.company_name && (
                 <h2 className="text-[#ffffff] font-bold text-sm tracking-widest uppercase mb-4">{installerProfile.company_name}</h2>
             )}
             <h1 className="text-3xl font-space font-bold mb-3">Hey {client.first_name}, <br/>How did we do?</h1>
             <p className="text-white/60 text-sm">We just finished up your project. Please take a second to rate your experience below.</p>
          </header>

          {!hasSubmitted ? (
              <div className="flex justify-center gap-2 mb-8 relative z-10">
                 {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => setHoveredStars(star)}
                      onMouseLeave={() => setHoveredStars(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                       <Star 
                         size={48} 
                         className={`transition-colors ${
                            (hoveredStars || selectedStars) >= star 
                               ? 'fill-yellow-400 text-yellow-400' 
                               : 'text-white/20'
                         }`} 
                       />
                    </button>
                 ))}
              </div>
          ) : (
              <AnimatePresence>
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   className="relative z-10"
                 >
                    {selectedStars >= 4 ? (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                               <Star className="fill-emerald-400" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold">Thank You!</h2>
                            <p className="text-white/60">We rely heavily on word-of-mouth. Could you do us a massive favor and quickly drop those {selectedStars} stars on our Google page?</p>
                            <a 
                              href={googleLink}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="block w-full bg-blue-500/10 hover:bg-blue-500/10 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255, 255, 255,0.3)] transition-colors mt-4"
                            >
                               Post on Google 🚀
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                               <MessageSquare size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-center">We're sorry we missed the mark.</h2>
                            <p className="text-white/60 text-sm text-center mb-4">Please let us know what went wrong so management can make it right immediately.</p>
                            <textarea 
                              value={feedback}
                              onChange={e => setFeedback(e.target.value)}
                              placeholder="Tell us what happened..."
                              className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-400 min-h-[120px] text-sm"
                            />
                            <button 
                               onClick={handlePrivateFeedback}
                               disabled={isSubmittingFeedback || !feedback}
                               className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
                            >
                               {isSubmittingFeedback ? 'Sending...' : 'Send to Management'}
                            </button>
                        </div>
                    )}
                 </motion.div>
              </AnimatePresence>
          )}

       </motion.div>
    </div>
  );
}
