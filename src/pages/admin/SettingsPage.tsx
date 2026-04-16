import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Settings, Save, CheckCircle2, Loader2, Sparkles, Building, DollarSign } from "lucide-react";

const ALL_SERVICES = [
  { key: "flake",        label: "Flake",        emoji: "🔷", defaultPrice: 6.50,  desc: "Full broadcast vinyl flake systems", unit: "/sq ft" },
  { key: "metallic",     label: "Metallic",     emoji: "✨", defaultPrice: 8.50,  desc: "Designer metallic pigment coatings", unit: "/sq ft" },
  { key: "quartz",       label: "Quartz",       emoji: "🔶", defaultPrice: 7.50,  desc: "Broadcast quartz granule systems", unit: "/sq ft" },
  { key: "grind_seal",   label: "Grind & Seal", emoji: "💎", defaultPrice: 4.00,  desc: "Diamond grind with clear sealer", unit: "/sq ft" },
  { key: "polishing",    label: "Polishing",    emoji: "🪩", defaultPrice: 5.50,  desc: "Concrete polishing & densifier", unit: "/sq ft" },
  { key: "single_color", label: "Single Color", emoji: "🎨", defaultPrice: 5.00,  desc: "Solid color epoxy systems", unit: "/sq ft" },
  { key: "countertops",  label: "Countertops",  emoji: "🏗️", defaultPrice: 65.00, desc: "Epoxy countertop overlays", unit: "/lin ft" },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");

  // Service pricing
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [servicePricing, setServicePricing] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    ALL_SERVICES.forEach(s => { initial[s.key] = s.defaultPrice.toString(); });
    return initial;
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('installer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      setFullName(profile.full_name || "");
      setCompanyName(profile.company_name || "");
      setCompanyPhone(profile.company_phone || "");

      // Load service pricing
      if (profile.service_pricing && Object.keys(profile.service_pricing).length > 0) {
        const keys = new Set<string>(Object.keys(profile.service_pricing));
        setSelectedServices(keys);
        const prices: Record<string, string> = {};
        ALL_SERVICES.forEach(s => {
          prices[s.key] = profile.service_pricing[s.key]?.toString() || s.defaultPrice.toString();
        });
        setServicePricing(prices);
      } else {
        // Legacy accounts — use base_flake_price and base_metallic_price
        const legacySet = new Set<string>();
        const prices: Record<string, string> = {};
        ALL_SERVICES.forEach(s => { prices[s.key] = s.defaultPrice.toString(); });

        if (profile.base_flake_price) {
          legacySet.add("flake");
          prices.flake = profile.base_flake_price.toString();
        }
        if (profile.base_metallic_price) {
          legacySet.add("metallic");
          prices.metallic = profile.base_metallic_price.toString();
        }
        if (legacySet.size === 0) { legacySet.add("flake"); legacySet.add("metallic"); }
        setSelectedServices(legacySet);
        setServicePricing(prices);
      }
    }
    setLoading(false);
  }

  function toggleService(key: string) {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setSaved(false);
  }

  function updatePrice(key: string, value: string) {
    setServicePricing(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Build pricing object from selected services
    const pricingObject: Record<string, number> = {};
    selectedServices.forEach(key => {
      pricingObject[key] = parseFloat(servicePricing[key]) || 0;
    });

    const { error } = await supabase
      .from('installer_profiles')
      .update({
        full_name: fullName,
        company_name: companyName,
        company_phone: companyPhone,
        base_flake_price: parseFloat(servicePricing.flake) || 6.50,
        base_metallic_price: parseFloat(servicePricing.metallic) || 8.50,
        service_pricing: pricingObject,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings Saved!" });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-white/30" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-20 max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-space font-bold text-white tracking-tight mb-2 flex items-center gap-3">
          <Settings className="text-[#78c8ff]" size={28} /> Settings
        </h1>
        <p className="text-white/60">Manage your business profile and baseline service pricing.</p>
      </header>

      {/* Business Profile Section */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-space font-bold text-white flex items-center gap-2 mb-6">
          <Building size={18} className="text-[#78c8ff]" /> Business Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setSaved(false); }}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#78c8ff] transition-colors"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Company Name</label>
            <input
              value={companyName}
              onChange={(e) => { setCompanyName(e.target.value); setSaved(false); }}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#78c8ff] transition-colors"
              placeholder="Texas Resin Solutions"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Business Phone</label>
            <input
              value={companyPhone}
              onChange={(e) => { setCompanyPhone(e.target.value); setSaved(false); }}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#78c8ff] transition-colors"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Service Pricing Section */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-space font-bold text-white flex items-center gap-2 mb-2">
          <DollarSign size={18} className="text-emerald-400" /> Service Pricing
        </h2>
        <p className="text-white/40 text-sm mb-6">Toggle your active services and set your base rate. These feed directly into the Quote Generator.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_SERVICES.map((svc) => {
            const isSelected = selectedServices.has(svc.key);
            return (
              <div
                key={svc.key}
                className={`relative rounded-xl border-2 transition-all overflow-hidden ${
                  isSelected
                    ? 'border-[#78c8ff]/60 bg-[#78c8ff]/5 shadow-[0_0_20px_rgba(120,200,255,0.08)]'
                    : 'border-white/10 bg-black/30 hover:border-white/20'
                } ${svc.key === 'countertops' ? 'sm:col-span-2' : ''}`}
              >
                {/* Toggle Header */}
                <div
                  onClick={() => toggleService(svc.key)}
                  className="p-4 pb-2 flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-2xl">{svc.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-white/50'}`}>{svc.label}</p>
                    <p className="text-[10px] text-white/30 truncate">{svc.desc}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                    isSelected ? 'bg-[#78c8ff]' : 'bg-white/10'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${
                      isSelected ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </div>

                {/* Price Editor */}
                {isSelected && (
                  <div className="px-4 pb-4 pt-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={servicePricing[svc.key]}
                        onChange={(e) => updatePrice(svc.key, e.target.value)}
                        className="w-full bg-black/60 border border-[#78c8ff]/30 rounded-lg pl-7 pr-16 py-2.5 text-white font-mono focus:outline-none focus:border-[#78c8ff] transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-bold uppercase tracking-wider">
                        {svc.unit}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Defaults hint */}
        <div className="bg-[#78c8ff]/5 border border-[#78c8ff]/20 p-3 rounded-xl mt-4 flex items-start gap-3">
          <Sparkles size={14} className="text-[#78c8ff] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#78c8ff]/80 leading-relaxed">
            Changes here update your Quick-Select buttons in the Quote Generator instantly. You can still manually override the price per-quote.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-lg shadow-[0_0_25px_rgba(120,200,255,0.15)] ${
          saved
            ? 'bg-emerald-500 text-black'
            : 'bg-white text-black hover:bg-gray-200'
        } disabled:opacity-50`}
      >
        {saving ? (
          <><Loader2 className="animate-spin" size={18} /> Saving...</>
        ) : saved ? (
          <><CheckCircle2 size={18} /> Saved!</>
        ) : (
          <><Save size={18} /> Save All Changes</>
        )}
      </button>
    </div>
  );
}
