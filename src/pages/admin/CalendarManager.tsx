import { useState, useEffect } from "react";
import { Calendar, Save, Link as LinkIcon, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export default function CalendarManager() {
  const { toast } = useToast();
  const [slug, setSlug] = useState("");
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const addTimeSlot = (date: string, time: string) => {
    setAvailability(prev => {
      const slots = prev[date] || [];
      if (slots.includes(time)) return prev;
      return { ...prev, [date]: [...slots, time].sort() };
    });
  };

  const removeTimeSlot = (date: string, time: string) => {
    setAvailability(prev => {
      const slots = prev[date] || [];
      return { ...prev, [date]: slots.filter(t => t !== time) };
    });
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('installer_profiles')
        .select('booking_slug, booking_availability')
        .eq('user_id', user.id)
        .single();
        
      if (data) {
        setSlug(data.booking_slug || "");
        setAvailability(data.booking_availability || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('installer_profiles')
        .update({
          booking_slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          booking_availability: availability
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast({ title: "Saved", description: "Your calendar settings have been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-white/50 text-center animate-pulse">Loading settings...</div>;

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-xl text-white font-inter">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Calendar className="text-purple-400" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Consultation Booking Engine</h2>
          <p className="text-white/50 text-sm">Manage your custom link and availability slots.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Col: Settings */}
        <div className="space-y-6">
          <div className="bg-black/40 border border-white/10 rounded-xl p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><LinkIcon size={16} className="text-purple-400"/> Custom Booking Link</h3>
            <p className="text-xs text-white/50 mb-3">Claim your unique URL to share on Instagram, Facebook, or your website.</p>
            <div className="flex items-center bg-black/60 border border-white/10 rounded-lg overflow-hidden focus-within:border-purple-500/50 transition-colors">
              <span className="px-3 text-white/40 text-sm border-r border-white/10 bg-white/5 select-none hidden sm:block">resinacademics.com/book/</span>
              <span className="px-2 text-white/40 text-sm border-r border-white/10 bg-white/5 select-none sm:hidden">.../book/</span>
              <input 
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="your-company-name"
                className="w-full bg-transparent text-white px-3 py-2 outline-none text-sm font-bold"
              />
            </div>
          </div>
          
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} /> {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>

        {/* Right Col: Availability Editor */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-5">
           <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Clock size={16} className="text-purple-400"/> Specific Date Availability</h3>
           <p className="text-xs text-white/50 mb-4">Click dates below to manually add time slots where you are available for calls or estimates. (In V2 this will sync automatically with Google Calendar).</p>
           
           <div className="grid grid-cols-7 gap-2 mb-4">
              {Array.from({length: 30}).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const isoStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === isoStr;
                const hasSlots = availability[isoStr]?.length > 0;
                
                return (
                  <button 
                    key={isoStr}
                    onClick={() => setSelectedDate(isoStr)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-xl border transition-all ${isSelected ? 'border-purple-400 bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : hasSlots ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-black/40 hover:border-white/30'}`}
                  >
                    <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-purple-300' : hasSlots ? 'text-emerald-400' : 'text-white/40'}`}>{date.toLocaleDateString('en-US', {weekday: 'short'})}</span>
                    <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-white/80'}`}>{date.getDate()}</span>
                    {hasSlots && <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1"></div>}
                  </button>
                );
              })}
           </div>

           {selectedDate ? (
             <div className="bg-black/60 border border-white/10 rounded-xl p-4">
               <h4 className="text-white font-bold text-sm mb-3">Time Slots for {new Date(selectedDate).toLocaleDateString()}</h4>
               <div className="flex flex-wrap gap-2 mb-4">
                 {(availability[selectedDate] || []).map((time, idx) => (
                   <div key={idx} className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
                     {time}
                     <button onClick={() => removeTimeSlot(selectedDate, time)} className="hover:text-white transition-colors">&times;</button>
                   </div>
                 ))}
                 {!(availability[selectedDate]?.length > 0) && <span className="text-xs text-white/30 italic py-1">No slots configured.</span>}
               </div>

               <div className="flex gap-2">
                 <input 
                   type="time" 
                   id="newTimeInput"
                   className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400 [color-scheme:dark]"
                 />
                 <button 
                   onClick={() => {
                     const input = document.getElementById('newTimeInput') as HTMLInputElement;
                     if (input.value) addTimeSlot(selectedDate, input.value);
                   }}
                   className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 rounded-lg transition-colors"
                 >
                   Add Slot
                 </button>
               </div>
             </div>
           ) : (
             <div className="text-center text-white/30 text-sm italic py-8 border border-dashed border-white/10 rounded-lg">
                Select a date above to configure available time slots.
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
