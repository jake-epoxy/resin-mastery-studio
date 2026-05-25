import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Calendar, Clock, User, Mail, Phone, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";

export default function BookingLive() {
  const { slug } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    async function fetchSlug() {
      if (!slug) return;
      // Mobile keyboards often auto-capitalize the URL, so enforce lowercase 
      const safeSlug = slug.toLowerCase();
      const { data } = await supabase.from('installer_profiles').select('*').eq('booking_slug', safeSlug).single();
      setProfile(data);
      setLoading(false);
    }
    fetchSlug();
  }, [slug]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedDate || !selectedTime) return;

    setBookingStatus('submitting');
    try {
      // Create local ISO string for scheduled_at
      const scheduled_at = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

      await fetch('/api/book-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installer_id: profile.user_id,
          client_name: name,
          client_email: email,
          client_phone: phone,
          project_details: projectDetails,
          scheduled_at
        })
      });

      setBookingStatus('success');
    } catch (err) {
      console.error(err);
      setBookingStatus('idle');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-inter"><Loader2 className="animate-spin text-purple-500" size={32} /></div>;
  if (!profile) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-inter">No booking profile found for this link.</div>;

  const availability = profile.booking_availability || {};
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dates = Object.keys(availability).sort().filter(d => d >= todayStr);

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 font-inter">
      <div className="max-w-4xl mx-auto bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Left Col: Info */}
        <div className="md:w-1/3 bg-black/40 p-8 border-r border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center mb-6 shadow-inner">
            <Calendar size={28} className="text-purple-400" />
          </div>
          <h1 className="text-2xl font-space font-bold mb-2">{profile.company_name || 'Consultation'}</h1>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">Book a 30-minute consultation call to discuss your upcoming epoxy project.</p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <Clock size={16} className="text-white/30" /> 30 Minutes
            </div>
            {selectedDate && selectedTime && (
              <div className="flex items-start gap-3 text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <Calendar size={16} className="shrink-0 mt-0.5" /> 
                <span>
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}<br/>
                  at {selectedTime}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Booking Flow */}
        <div className="md:w-2/3 p-8">
          {bookingStatus === 'success' ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
               <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                 <CheckCircle2 size={40} className="text-emerald-400" />
               </div>
               <h2 className="text-2xl font-space font-bold text-white">Booking Confirmed!</h2>
               <p className="text-white/50">Your consultation is scheduled. An invitation has been sent to {email}.</p>
            </div>
          ) : !selectedDate ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-xl font-bold mb-6">Select a Date</h2>
              {dates.length === 0 ? (
                <p className="text-white/40 italic">No available dates found.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dates.map(date => {
                    const d = new Date(date);
                    // Adjust to local timezone correctly for display
                    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
                    return (
                      <button 
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className="bg-black/40 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 rounded-xl p-4 text-center transition-all group"
                      >
                        <span className="block text-xs uppercase text-white/50 font-bold mb-1 group-hover:text-purple-300 transition-colors">{d.toLocaleDateString('en-US', {weekday: 'short'})}</span>
                        <span className="block text-lg font-bold text-white">{d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : !selectedTime ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button onClick={() => setSelectedDate(null)} className="text-xs text-white/40 hover:text-white mb-6 uppercase tracking-wider font-bold flex items-center gap-1"><ChevronRight className="rotate-180" size={14} /> Back to dates</button>
              <h2 className="text-xl font-bold mb-6">Select a Time</h2>
              <div className="grid grid-cols-3 gap-3">
                {(availability[selectedDate] || []).map((time: string) => {
                  const [h, m] = time.split(':');
                  let hour = parseInt(h, 10);
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  if (hour === 0) hour = 12;
                  if (hour > 12) hour -= 12;
                  const displayTime = `${hour}:${m} ${ampm}`;
                  
                  return (
                    <button 
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className="bg-black/40 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 rounded-xl p-4 text-center text-lg font-bold transition-all"
                    >
                      {displayTime}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button onClick={() => setSelectedTime(null)} className="text-xs text-white/40 hover:text-white mb-6 uppercase tracking-wider font-bold flex items-center gap-1"><ChevronRight className="rotate-180" size={14} /> Back to times</button>
              <h2 className="text-xl font-bold mb-6">Your Details</h2>
              <form onSubmit={handleBook} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-purple-500 outline-none transition-colors" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Address" className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-purple-500 outline-none transition-colors" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone Number" className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-purple-500 outline-none transition-colors" />
                </div>
                <div className="relative">
                  <textarea value={projectDetails} onChange={e=>setProjectDetails(e.target.value)} placeholder="Briefly describe your project (e.g. 2-car garage, metallic epoxy)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-colors h-24 resize-none" />
                </div>
                <button 
                  type="submit" 
                  disabled={bookingStatus === 'submitting'}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
                >
                  {bookingStatus === 'submitting' ? <Loader2 className="animate-spin" size={20} /> : "Confirm Booking"}
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
