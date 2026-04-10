import { useState, useRef, useEffect } from "react";
import { Camera, Wand2, Download, RotateCcw, Sparkles, ChevronDown, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const LOADING_MESSAGES = [
  "Firing up the OpenAI Vision engine... 🔍",
  "Scanning original lighting physics... 🌞",
  "Isolating the floor boundaries natively... 🎨",
  "Protecting the walls, grass, and sky... 🛡️",
  "Generating gorgeous photorealistic flakes... 💎",
  "Rendering 4k reflections... ✨",
  "Just a few more seconds, this is incredible... ⏳",
  "Almost there... 🚀",
];

const COATING_STYLES = [
  { id: 'marble-epoxy', name: 'Marble Epoxy', description: 'Realistic marble veining with deep gloss', colors: ['Pearl White w/ Grey Veins', 'All Black w/ White Veins', 'Carrara White w/ Gold Veins', 'Dark Gray w/ Silver Veins', 'Cream w/ Brown Veins'] },
  { id: 'metallic-epoxy', name: 'Metallic Epoxy', description: 'High-gloss swirling metallic finish', colors: ['Charcoal & Silver', 'Copper & Bronze', 'Pearl White', 'Ocean Blue', 'Champagne Gold'] },
  { id: 'flake-epoxy', name: 'Flake Epoxy', description: 'Vinyl flake broadcast with clear topcoat', colors: ['Multi-Color Granite', 'Saddle Tan', 'Midnight Black', 'Domino', 'Earth Tone'] },
  { id: 'solid-epoxy', name: 'Solid Color Epoxy', description: 'Mirror-smooth single color finish', colors: ['Medium Gray', 'Beige', 'Light Gray', 'Black', 'White'] },
  { id: 'quartz-epoxy', name: 'Quartz Broadcast', description: 'Natural quartz aggregate in clear resin', colors: ['Tan & Brown', 'Gray Blend', 'Sahara', 'Mojave', 'Alpine'] },
  { id: 'polished-concrete', name: 'Polished Concrete', description: 'Ground & polished exposed aggregate', colors: ['Natural Gray', 'Salt & Pepper', 'Cream', 'Dark Charcoal', 'Warm Concrete'] },
];

export default function Visualizer() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // display version (full data URI)
  const [rawBase64, setRawBase64] = useState<string | null>(null); // raw base64 string (no prefix) for API
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // UI State
  const [selectedStyle, setSelectedStyle] = useState(COATING_STYLES[0]);
  const [selectedColor, setSelectedColor] = useState(COATING_STYLES[0].colors[0]);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [customNotes, setCustomNotes] = useState('');

  // Rotating Messages
  useEffect(() => {
    if (!isGenerating) return;
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 10MB", variant: "destructive" });
      return;
    }

    // Resize the image on a canvas to 1024x1024 to keep file size small
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d')!;
        
        // Draw the image scaled to fill 1024x1024
        ctx.drawImage(img, 0, 0, 1024, 1024);
        
        // Get the full data URI for display
        const dataUri = canvas.toDataURL('image/jpeg', 0.85);
        setUploadedImage(dataUri);
        
        // Strip the "data:image/jpeg;base64," prefix to get raw base64 for the API
        const base64Only = dataUri.split(',')[1];
        setRawBase64(base64Only);
        
        setGeneratedImage(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!rawBase64) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: rawBase64,
          coatingStyle: selectedStyle.id,
          colorDescription: selectedColor,
          customNotes: customNotes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast({ title: "Generation Failed", description: data.error, variant: "destructive" });
      } else if (data.image) {
        setGeneratedImage(data.image); // DALL-E returns URL natively, but our API might return base64
        toast({ title: "Visualization Complete!" });
      }
    } catch (err: any) {
      toast({ title: "Network Error", description: err.message, variant: "destructive" });
    }

    setIsGenerating(false);
  }

  function handleDownload() {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `openai-quoteos-visualizer-${selectedStyle.id}-${Date.now()}.png`;
    link.target = "_blank";
    link.click();
  }

  function handleReset() {
    setUploadedImage(null);
    setRawBase64(null);
    setGeneratedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto font-inter">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30">
            <Wand2 size={24} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-space">OpenAI 100% Hands-Free AR</h1>
            <p className="text-white/50 text-sm">GPT-4 Vision + DALL-E 3 Holistic Recreation Engine</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Upload & Controls */}
        <div className="space-y-5">
          
          <div 
            className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300 ${
              uploadedImage 
                ? 'border-emerald-500/30 bg-black/50' 
                : 'border-white/10 bg-white/[0.02] cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5'
            }`}
            style={{ 
              minHeight: '320px', 
              aspectRatio: 'auto' 
            }}
            onClick={() => { if (!uploadedImage) fileInputRef.current?.click(); }}
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            
            {uploadedImage ? (
              <>
                <img 
                  src={uploadedImage} 
                  className="w-full h-full object-contain pointer-events-none" 
                  alt="Original" 
                />
                
                <div className="absolute top-2 right-2 z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="p-2 rounded-lg text-red-400 bg-red-400/10 hover:bg-red-400/20 backdrop-blur-md transition-colors"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                  <Camera size={28} className="text-white/40" />
                </div>
                <p className="text-white font-bold text-lg mb-1">Upload Photo</p>
                <p className="text-white/40 text-sm max-w-xs">No brushing required.</p>
              </div>
            )}
          </div>

          {/* Style Selector */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="relative">
              <button 
                onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                className="w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-left hover:border-emerald-500/40 transition-colors"
              >
                <div>
                  <p className="text-white font-bold text-sm">{selectedStyle.name}</p>
                </div>
                <ChevronDown size={16} className={`text-white/40 transition-transform ${showStyleDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showStyleDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl">
                  {COATING_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => {
                        setSelectedStyle(style);
                        setSelectedColor(style.colors[0]);
                        setShowStyleDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0`}
                    >
                      <p className="text-white font-bold text-sm">{style.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedStyle.colors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedColor === color
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>

            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Custom notes (optional): e.g. 'add a slight purple tint' or 'subtle veins, not heavy'"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-emerald-500/40 transition-colors"
              rows={2}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!uploadedImage || isGenerating}
            className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isGenerating ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #10b981, #3b82f6)',
              color: '#fff',
            }}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="animate-pulse">{LOADING_MESSAGES[loadingMsgIndex]}</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate DALL-E 3 Vibe
              </>
            )}
          </button>
        </div>

        {/* Right: Result */}
        <div className="space-y-4">
          <div className="relative border border-white/10 rounded-2xl overflow-hidden bg-black/30" style={{ minHeight: '320px', aspectRatio: '1/1' }}>
            {generatedImage ? (
              <>
                <img src={generatedImage} alt="AI Generated visualization" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">{selectedStyle.name}</p>
                      <p className="text-white/60 text-xs">{selectedColor}</p>
                    </div>
                    <button onClick={handleDownload} className="px-4 py-2 bg-white/10 backdrop-blur rounded-lg text-white text-sm font-bold hover:bg-white/20 transition-colors flex items-center gap-2">
                      <Download size={14} /> Save
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
                  <Sparkles size={32} className="text-emerald-400/50" />
                </div>
                <p className="text-white/50 font-bold mb-1">OpenAI Recreation Engine</p>
                <p className="text-white/30 text-sm max-w-xs mt-2">
                  Upload an image. ChatGPT evaluates the lighting and architecture, then automatically reconstructs the entire photograph with the new luxurious epoxy floor. No masking needed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
