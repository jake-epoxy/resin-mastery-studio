import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  PlaySquare, 
  Search, 
  MapPin, 
  Globe, 
  Phone, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Download, 
  Mail, 
  FileText, 
  Bot, 
  ArrowRight,
  Star,
  CheckCircle,
  X
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import CalendarManager from "./CalendarManager";

// Recommended keywords for quick searching
const RECOMMENDED_BADGES = [
  { label: "🚗 Car Dealerships", query: "Car Dealerships" },
  { label: "🏢 Warehouses", query: "Warehouses" },
  { label: "🛠️ Auto Garages", query: "Auto Repair Shops" },
  { label: "🏋️ Gyms & Fitness", query: "Gyms" },
  { label: "🛍️ Showrooms", query: "Retail Showrooms" },
  { label: "🍷 Art Galleries", query: "Art Galleries" },
];

const COATING_STYLES = [
  { id: 'marble-epoxy', name: 'Marble Epoxy', description: 'Deep gloss marble veining', colors: ['Pearl White w/ Grey Veins', 'Carrara White w/ Gold Veins', 'Dark Gray w/ Silver Veins'] },
  { id: 'metallic-epoxy', name: 'Metallic Epoxy', description: 'Swirling deep reflective metal', colors: ['Charcoal & Silver', 'Copper & Bronze', 'Ocean Blue'] },
  { id: 'flake-epoxy', name: 'Flake Epoxy', description: 'Vinyl flake granite broadcast', colors: ['Multi-Color Granite', 'Midnight Black', 'Earth Tone'] },
  { id: 'solid-epoxy', name: 'Solid Color Epoxy', description: 'Sleek single color gloss', colors: ['Medium Gray', 'Light Gray', 'White'] },
];

interface BusinessPhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

interface Business {
  id: string;
  displayName?: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  rating?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  primaryTypeDisplayName?: {
    text: string;
  };
  photos?: BusinessPhoto[];
}

export default function Autopilot() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Search States
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "Car Dealerships";
  const initialLocation = searchParams.get("location") || "";
  const autoStart = searchParams.get("auto") === "true";

  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [isScanning, setIsScanning] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [scanMessageIndex, setScanMessageIndex] = useState(0);

  // Carousel Photo Index Map
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({});

  // Visualization Modal States
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [selectedPhotoName, setSelectedPhotoName] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(COATING_STYLES[0]);
  const [selectedColor, setSelectedColor] = useState(COATING_STYLES[0].colors[0]);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [visualizedImage, setVisualizedImage] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState("");

  const SCAN_MESSAGES = [
    "Spinning up radar array... 📡",
    "Querying Google Places Database... 🔍",
    "Locating businesses matching criteria... 🗺️",
    "Filtering listings for garage and floor photos... 📸",
    "Extracting details: website, ratings, phone... 📞",
    "Formatting local lead directory... 🚀",
  ];

  // Rotate loading message
  useEffect(() => {
    if (!isScanning) return;
    setScanMessageIndex(0);
    const interval = setInterval(() => {
      setScanMessageIndex((prev) => (prev + 1) % SCAN_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isScanning]);

  const [activeTab, setActiveTab] = useState<'prospector' | 'calendar'>('prospector');

  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (autoStart && query && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      handleScan();
    }
  }, [autoStart, query]);

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsScanning(true);
    setBusinesses([]);
    
    try {
      const response = await fetch('/api/places-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location }),
      });

      const data = await response.json();

      if (data.error) {
        toast({ title: "Scan Failed", description: data.error, variant: "destructive" });
      } else if (data.places && data.places.length > 0) {
        setBusinesses(data.places);
        // Initialize carousel indices to 0
        const initialIndices: Record<string, number> = {};
        data.places.forEach((biz: Business) => {
          initialIndices[biz.id] = 0;
        });
        setCarouselIndex(initialIndices);
        toast({ title: "Scan Complete!", description: `Found ${data.places.length} matching businesses.` });
      } else {
        toast({ title: "No listings found", description: "Try expanding your keywords or search radius." });
      }
    } catch (err: any) {
      toast({ title: "Network Error", description: err.message, variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  // Carousel Navigation helpers
  const nextPhoto = (bizId: string, maxPhotos: number) => {
    setCarouselIndex((prev) => {
      const current = prev[bizId] || 0;
      return {
        ...prev,
        [bizId]: (current + 1) % maxPhotos,
      };
    });
  };

  const prevPhoto = (bizId: string, maxPhotos: number) => {
    setCarouselIndex((prev) => {
      const current = prev[bizId] || 0;
      return {
        ...prev,
        [bizId]: (current - 1 + maxPhotos) % maxPhotos,
      };
    });
  };

  // Triggering the Visualizer Pop-up
  const openVisualizer = (biz: Business, photoName: string) => {
    setSelectedBiz(biz);
    setSelectedPhotoName(photoName);
    setSelectedStyle(COATING_STYLES[0]);
    setSelectedColor(COATING_STYLES[0].colors[0]);
    setVisualizedImage(null);
    setCustomNotes("");
    setIsVisualizing(false);
  };

  const handleVisualize = async () => {
    if (!selectedPhotoName) return;
    setIsVisualizing(true);
    setVisualizedImage(null);

    try {
      // Step 1: Request proxy to get base64 string
      const proxyRes = await fetch(`/api/places-photo?name=${encodeURIComponent(selectedPhotoName)}&base64=true`);
      const proxyData = await proxyRes.json();

      if (proxyData.error) {
        throw new Error(proxyData.error);
      }

      const rawBase64 = proxyData.image.split(',')[1];

      // Step 2: Request the AI visualizer
      const vizRes = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: rawBase64,
          coatingStyle: selectedStyle.id,
          colorDescription: selectedColor,
          customNotes: customNotes.trim() || undefined,
        }),
      });

      const vizData = await vizRes.json();

      if (vizData.error) {
        throw new Error(vizData.error);
      }

      setVisualizedImage(vizData.image);
      toast({ title: "Visualization Ready!" });
    } catch (err: any) {
      toast({ title: "AI Error", description: err.message || "Failed to render floor", variant: "destructive" });
    } finally {
      setIsVisualizing(false);
    }
  };

  const handleDownload = () => {
    if (!visualizedImage) return;
    const link = document.createElement("a");
    link.href = visualizedImage;
    link.download = `resin-os-lead-pitch-${selectedBiz?.displayName?.text || 'business'}.png`;
    link.click();
  };

  const handleBuildQuote = () => {
    if (!visualizedImage || !selectedBiz) return;
    
    // Pass visualizer state to quote generator
    sessionStorage.setItem('viz_image', visualizedImage);
    sessionStorage.setItem('viz_style', selectedStyle.name);
    sessionStorage.setItem('viz_color', selectedColor);
    sessionStorage.setItem('autopilot_client_name', selectedBiz.displayName?.text || '');
    sessionStorage.setItem('autopilot_client_phone', selectedBiz.nationalPhoneNumber || '');
    sessionStorage.setItem('autopilot_client_website', selectedBiz.websiteUri || '');
    sessionStorage.setItem('autopilot_client_address', selectedBiz.formattedAddress || '');

    toast({ title: "Heading to Quote Generator", description: "Pre-filling client and custom render." });
    navigate('/admin/quote');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-inter">
      {/* Sleek Glassmorphic Header */}
      <div className="relative mb-8 p-6 md:p-8 bg-gradient-to-r from-blue-900/30 via-slate-900/30 to-purple-900/30 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-500/30 shadow-inner mt-1">
              <PlaySquare size={32} className="text-blue-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-black text-white font-space tracking-tight">Lead Autopilot</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 border border-blue-500/30 rounded">Stage 1</span>
              </div>
              <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
                Scan your local market for commercial properties, warehouses, and car lots. Extract high-resolution showroom photos from Google, automatically render epoxy visualizations, and compile premium proposals to pitch clients.
              </p>
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-2 self-start md:self-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Google Places API Active</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 relative z-10 border-b border-white/10 pb-1">
          <button 
            onClick={() => setActiveTab('prospector')}
            className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'prospector' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' : 'text-white/50 hover:text-white/80'}`}
          >
            Lead Prospector
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'calendar' ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5' : 'text-white/50 hover:text-white/80'}`}
          >
            Calendar Dashboard
          </button>
        </div>
      </div>

      {activeTab === 'prospector' && (
        <>
          {/* Futuristic Scan Dashboard */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 mb-8 shadow-xl">
        <form onSubmit={handleScan} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Query */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2 px-1">Find Business Type</label>
              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus-within:border-blue-500/40 transition-colors">
                <Search size={18} className="text-white/30 mr-3 shrink-0" />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Car Dealerships, Warehouses, Garages..."
                  className="bg-transparent text-white text-sm outline-none placeholder:text-white/30 w-full"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2 px-1">In Location / City</label>
              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus-within:border-blue-500/40 transition-colors">
                <MapPin size={18} className="text-white/30 mr-3 shrink-0" />
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Chicago, IL or Austin, TX (Optional)"
                  className="bg-transparent text-white text-sm outline-none placeholder:text-white/30 w-full"
                />
              </div>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {RECOMMENDED_BADGES.map((badge) => (
              <button
                key={badge.query}
                type="button"
                onClick={() => setQuery(badge.query)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  query === badge.query 
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                    : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white'
                }`}
              >
                {badge.label}
              </button>
            ))}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isScanning}
            className="w-full mt-4 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span className="animate-pulse">{SCAN_MESSAGES[scanMessageIndex]}</span>
              </>
            ) : (
              <>
                <Bot size={20} className="group-hover:translate-x-0.5 transition-transform" />
                Scan Local Markets
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Grid List of Businesses */}
      {isScanning ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-400 animate-spin" />
          <p className="text-white/40 text-sm font-medium animate-pulse">Running geo-targeted search coordinates...</p>
        </div>
      ) : businesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => {
            const hasPhotos = biz.photos && biz.photos.length > 0;
            const currentIdx = carouselIndex[biz.id] || 0;
            const currentPhoto = hasPhotos ? biz.photos![currentIdx] : null;

            return (
              <div 
                key={biz.id} 
                className="bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-white/20 transition-all group"
              >
                {/* Photo Carousel Area */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden shrink-0">
                  {currentPhoto ? (
                    <>
                      <img 
                        src={`/api/places-photo?name=${encodeURIComponent(currentPhoto.name)}&maxHeightPx=300`} 
                        alt={biz.displayName?.text || 'Business'} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Carousel HUD Overlays */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] text-white/70 font-semibold uppercase">
                        GMB Photo {currentIdx + 1}/{biz.photos?.length}
                      </div>

                      {biz.photos!.length > 1 && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); prevPhoto(biz.id, biz.photos!.length); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 hover:bg-black/80 rounded-full border border-white/10 text-white transition-colors"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); nextPhoto(biz.id, biz.photos!.length); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 hover:bg-black/80 rounded-full border border-white/10 text-white transition-colors"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </>
                      )}

                      {/* Visualizer Trigger Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <button
                          onClick={() => openVisualizer(biz, currentPhoto.name)}
                          className="px-4 py-2 bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xl transition-all scale-95 group-hover:scale-100 hover:bg-blue-600 pointer-events-auto"
                        >
                          <Sparkles size={14} />
                          Visualize Epoxy
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-white/20">
                      <Bot size={40} className="mb-2 opacity-50" />
                      <span className="text-xs font-semibold">No GMB Photos Available</span>
                    </div>
                  )}
                </div>

                {/* Business Info Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-white text-lg font-space leading-snug line-clamp-1">{biz.displayName?.text}</h3>
                      {biz.rating && (
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 shrink-0">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-bold text-white">{biz.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Badge */}
                    <span className="inline-block px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10px] uppercase rounded-full tracking-wider mb-3">
                      {biz.primaryTypeDisplayName?.text || "Commercial Lead"}
                    </span>

                    {/* Contact Rows */}
                    <div className="space-y-1.5 text-xs text-white/50 font-medium">
                      {biz.formattedAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="shrink-0 mt-0.5 text-white/30" />
                          <span className="line-clamp-2">{biz.formattedAddress}</span>
                        </div>
                      )}
                      {biz.nationalPhoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="shrink-0 text-white/30" />
                          <span>{biz.nationalPhoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center gap-2 pt-2">
                    {biz.websiteUri ? (
                      <a 
                        href={biz.websiteUri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-center text-white/80 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Globe size={13} /> Visit Site
                      </a>
                    ) : (
                      <div className="flex-1 py-2 px-3 bg-white/[0.01] border border-dashed border-white/5 rounded-lg text-xs text-white/20 text-center font-semibold">
                        No Website
                      </div>
                    )}

                    {currentPhoto && (
                      <button
                        onClick={() => openVisualizer(biz, currentPhoto.name)}
                        className="flex-1 py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={13} /> Pitch Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <PlaySquare size={28} className="text-white/30 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Search Your Local Area</h2>
          <p className="text-white/40 text-sm max-w-sm">
            Enter a location and business style above to sweep Google Maps for local commercial garages and floor spaces.
          </p>
        </div>
      )}

      {/* Dynamic Overlay Visualization Modal */}
      {selectedBiz && selectedPhotoName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => { if (!isVisualizing) setSelectedBiz(null); }}
          />

          {/* Dialog Panel */}
          <div className="relative z-10 bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 flex flex-col">
            <button 
              onClick={() => setSelectedBiz(null)}
              disabled={isVisualizing}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold font-space text-white flex items-center gap-2 mb-1">
                <Sparkles size={20} className="text-blue-400" />
                Epoxy Visualization Simulator
              </h2>
              <p className="text-white/50 text-xs">
                Swapping out floors at: <strong className="text-white">{selectedBiz.displayName?.text}</strong>
              </p>
            </div>

            {/* Main Visualizer Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Left Column: Input controls and original image */}
              <div className="space-y-4">
                <div className="relative border border-white/10 rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">
                  <img 
                    src={`/api/places-photo?name=${encodeURIComponent(selectedPhotoName)}&maxHeightPx=400`} 
                    alt="Original" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-bold text-white/70 tracking-widest uppercase">
                    Before (Original GMB Photo)
                  </div>
                </div>

                {/* Dropdown controls */}
                <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Coating Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {COATING_STYLES.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => {
                            setSelectedStyle(style);
                            setSelectedColor(style.colors[0]);
                          }}
                          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left ${
                            selectedStyle.id === style.id 
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' 
                              : 'bg-black/30 text-white/50 border-white/5 hover:border-white/10 hover:text-white'
                          }`}
                        >
                          <div>{style.name}</div>
                          <div className="text-[9px] font-medium opacity-50 truncate mt-0.5">{style.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Pigment Color</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedStyle.colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all border ${
                            selectedColor === color 
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' 
                              : 'bg-black/30 text-white/40 border-white/5 hover:border-white/10'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Custom Render Directives</label>
                    <textarea 
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="e.g. 'Highly reflective finish' or 'Clean up dirt on borders'"
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-blue-500/40 resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleVisualize}
                  disabled={isVisualizing}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isVisualizing ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Rendering high-gloss veining...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Simulate Epoxy Floor
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: AI Result Preview */}
              <div className="relative border border-white/10 rounded-xl bg-black/40 flex flex-col justify-between overflow-hidden" style={{ minHeight: '300px' }}>
                {visualizedImage ? (
                  <>
                    <div className="relative flex-1 aspect-video lg:aspect-auto">
                      <img 
                        src={visualizedImage} 
                        alt="Rendered result" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500/80 rounded text-[9px] font-bold text-white tracking-widest uppercase flex items-center gap-1 shadow-md">
                        <CheckCircle size={10} />
                        After (AI Epoxy Render)
                      </div>
                    </div>

                    <div className="p-4 bg-[#0d0d0d] border-t border-white/10 space-y-3 shrink-0">
                      <div>
                        <h4 className="text-white font-bold text-sm">{selectedStyle.name}</h4>
                        <p className="text-white/50 text-xs">{selectedColor}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleDownload}
                          className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download size={13} />
                          Save Mockup
                        </button>
                        <button
                          onClick={handleBuildQuote}
                          className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-inner"
                        >
                          <FileText size={13} />
                          Pitch Proposal
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                      <Bot size={28} className="text-blue-400/50" />
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1">AI Pitch Simulator Ready</h4>
                    <p className="text-white/30 text-xs max-w-xs mt-1">
                      Choose a coating and click "Simulate Epoxy Floor". Our neural networks swap original raw concrete for a rich polished resin coat, keeping existing walls and props intact!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'calendar' && (
        <CalendarManager />
      )}
    </div>
  );
}
