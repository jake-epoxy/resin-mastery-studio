import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Sparkles, Phone, ArrowLeft, Image as ImageIcon } from "lucide-react";

export default function PortfolioGallery() {
  const { id } = useParams(); // The installer's user_id
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPortfolio();
    }
  }, [id]);

  async function fetchPortfolio() {
    setLoading(true);
    // Fetch the installer's public profile data
    const { data, error } = await supabase
      .from("installer_profiles")
      .select("company_name, company_phone, full_name, portfolio_images")
      .eq("user_id", id)
      .single();

    if (data && !error) {
      setProfile(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-inter">
        <Sparkles className="animate-spin text-[#ffffff]" size={40} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white font-inter p-6 text-center">
        <ImageIcon size={64} className="text-white/20 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Portfolio Not Found</h1>
        <p className="text-white/50 mb-8 max-w-md">This contractor does not exist or has not published their portfolio yet.</p>
        <Link to="/" className="px-6 py-3 bg-blue-500/10 hover:bg-white/20 rounded-xl transition-colors">Return to Resin OS</Link>
      </div>
    );
  }

  // Ensure portfolio_images is always an array
  const images = profile.portfolio_images || [];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-inter">
      {/* Dynamic Header */}
      <header className="bg-[#111] border-b border-white/10 py-10 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-[#ffffff]/5 blur-[100px] pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
           <h1 className="text-4xl md:text-5xl font-space font-bold tracking-tight mb-4">
             {profile.company_name || profile.full_name}'s AI Portfolio
           </h1>
           <p className="text-white/60 text-lg mb-6 max-w-2xl mx-auto">
             Visualize your future floor before it's ever poured. These concepts were designed exclusively by {profile.company_name || profile.full_name} using Resin OS AI.
           </p>
           {profile.company_phone && (
             <a href={`tel:${profile.company_phone}`} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-full transition-transform hover:scale-105">
               <Phone size={18} /> Call to Book: {profile.company_phone}
             </a>
           )}
        </div>
      </header>

      {/* Gallery Grid */}
      <main className="max-w-6xl mx-auto p-6 py-12">
        {images.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
            <ImageIcon className="mx-auto text-white/20 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">No Visualizations Yet</h3>
            <p className="text-white/50">This contractor has not added any AI concepts to their public portfolio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {images.map((img: string, idx: number) => (
                <div 
                  key={idx} 
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-white/10"
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`Floor Concept ${idx+1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                     <p className="text-white font-bold">Concept {idx + 1}</p>
                  </div>
                </div>
             ))}
          </div>
        )}
      </main>

      {/* Fullscreen Lightbox */}
      {activeImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
          onClick={() => setActiveImage(null)}
        >
           <img src={activeImage} className="max-w-full max-h-full rounded-xl shadow-2xl" alt="Enlarged floor concept" />
        </div>
      )}

      {/* Passive Marketing Hook */}
      <footer className="py-12 text-center border-t border-white/10 mt-12 bg-black">
        <p className="text-white/30 text-sm mb-2">Powered by Resin OS</p>
        <Link to="/" className="text-[#ffffff]/70 hover:text-[#ffffff] hover:underline font-bold transition-colors">
          Are you an epoxy contractor? Get the software.
        </Link>
      </footer>
    </div>
  );
}
