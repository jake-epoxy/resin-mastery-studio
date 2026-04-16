import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { CalendarDays, Users, Factory, FileText, CheckCircle2, GripVertical, Plus, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function OperationsHub() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"board" | "calendar">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Operations Data
  const [crews, setCrews] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, any[]>>({});
  const [crewMembers, setCrewMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchClients();
    loadCrewDatabase();
  }, []);

  async function loadCrewDatabase() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const stored = localStorage.getItem(`crew_${user.id}`);
      if (stored) {
        setCrewMembers(JSON.parse(stored));
      }
    }
  }

  async function fetchClients() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all clients, but we only care about ones that are "Won" or already in Fulfillment.
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('installer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  }

  // Filter out pure leads
  const opsClients = clients.filter(c => 
    c.status === 'Won' || 
    c.status === 'Scheduled' || 
    c.status === 'In Progress' || 
    c.status === 'Curing' || 
    c.status === 'Completed'
  );

  const getCol = (status: string) => {
    // If it's just 'Won', bucket it in Scheduled as the starting point for ops
    if (status === 'Won') return 'Scheduled';
    return status;
  };

  const columns = ['Scheduled', 'In Progress', 'Curing', 'Completed'];

  const moveClient = async (id: string, newStatus: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    const { error } = await supabase.from('clients').update({ status: newStatus }).eq('id', id);
    if (error) {
      toast({ title: "Error moving job", description: error.message, variant: "destructive" });
      fetchClients();
    }
  };

  const scheduleClient = async (id: string, targetDate: string) => {
    // Update local state optimistic
    setClients(prev => prev.map(c => c.id === id ? { ...c, install_date: targetDate, status: c.status === 'Won' ? 'Scheduled' : c.status } : c));
    
    // Remote update
    const { error } = await supabase.from('clients').update({ 
       install_date: targetDate,
       status: 'Scheduled'
    }).eq('id', id);

    if (error) {
      toast({ title: "Database Sync Error", description: "Column 'install_date' might not exist yet in Supabase.", variant: "destructive" });
    } else {
      toast({ title: "Job Scheduled", description: `Assigned target date.` });
    }
  };

  const updateCrew = (id: string, crew: string) => {
    setCrews(prev => ({ ...prev, [id]: crew }));
  };

  const addNote = (id: string, newNoteText: string, author: string) => {
    if (!newNoteText.trim()) return;
    
    const newLogEntry = {
      id: crypto.randomUUID(),
      author: author || "Admin",
      text: newNoteText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setNotes(prev => {
      const existingLogs = prev[id] || [];
      return { ...prev, [id]: [...existingLogs, newLogEntry] };
    });
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8 md:mb-10">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-space font-bold text-white tracking-tight mb-1 flex items-center gap-3">
                <Factory className="text-[#ffffff]" size={28} /> Operations & Dispatch
              </h1>
              <p className="text-white/60 text-sm md:text-base">Schedule crews, track active jobs, and log daily fulfillment notes.</p>
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-[#111] border border-white/10 rounded-xl p-1 shrink-0">
               <button 
                 onClick={() => setViewMode("calendar")}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "calendar" ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white"}`}
               >
                 <CalendarDays size={16} /> Calendar
               </button>
               <button 
                 onClick={() => setViewMode("board")}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "board" ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white"}`}
               >
                 <LayoutGrid size={16} /> Kanban
               </button>
            </div>
         </div>
      </header>

      {/* Dispatch Overview / Crew Scheduler */}
      <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffffff]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3 mb-6">
           <CalendarDays className="text-[#ffffff]" size={20} />
           <h2 className="text-xl font-bold text-white">Active Dispatch Priority</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
           <div className="bg-[#111] border border-white/5 p-4 rounded-xl">
              <p className="text-xs text-white/50 font-bold uppercase tracking-widest mb-1">Total Scheduled</p>
              <p className="text-3xl font-space font-bold text-white">{opsClients.filter(c => getCol(c.status) === 'Scheduled').length}</p>
           </div>
           <div className="bg-[#111] border border-white/5 p-4 rounded-xl">
              <p className="text-xs text-[#ffffff]/50 font-bold uppercase tracking-widest mb-1">In The Field Today</p>
              <p className="text-3xl font-space font-bold text-[#ffffff]">{opsClients.filter(c => getCol(c.status) === 'In Progress').length}</p>
           </div>
           <div className="bg-[#111] border border-white/5 p-4 rounded-xl">
              <p className="text-xs text-emerald-500/50 font-bold uppercase tracking-widest mb-1">Completed (MTD)</p>
              <p className="text-3xl font-space font-bold text-emerald-400">{opsClients.filter(c => getCol(c.status) === 'Completed').length}</p>
           </div>
        </div>
      </div>

      {/* Calendar View vs Board View */}
      {viewMode === "calendar" ? (
        <CalendarView 
           opsClients={opsClients} 
           currentMonth={currentMonth}
           setCurrentMonth={setCurrentMonth}
           scheduleClient={scheduleClient}
        />
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px] snap-x">
           {columns.map(col => (
             <div key={col} className="min-w-[320px] max-w-[320px] flex flex-col snap-start shrink-0">
               <div className="flex items-center justify-between mb-4 px-1">
                 <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                    col === 'Scheduled' ? 'text-zinc-400' :
                    col === 'In Progress' ? 'text-[#ffffff]' :
                    col === 'Curing' ? 'text-orange-400' : 'text-emerald-400'
                 }`}>
                   {col} <span className="bg-blue-500/10 px-2 py-0.5 rounded-full text-xs">{opsClients.filter(c => getCol(c.status) === col).length}</span>
                 </h3>
               </div>

               <div className={`flex-1 rounded-2xl border-2 border-dashed p-3 space-y-4 ${
                  col === 'Scheduled' ? 'border-white/10 bg-white/5' :
                  col === 'In Progress' ? 'border-[#ffffff]/20 bg-[#ffffff]/5' :
                  col === 'Curing' ? 'border-orange-500/20 bg-orange-500/5' : 'border-emerald-500/20 bg-emerald-500/5'
               }`}>
                  {opsClients.filter(c => getCol(c.status) === col).map(client => (
                     <KanbanCard 
                       key={client.id} 
                       client={client} 
                       crew={crews[client.id] || ""}
                       onUpdateCrew={(crew: string) => updateCrew(client.id, crew)}
                       logs={notes[client.id] || []}
                       onAddNote={(noteText: string, author: string) => addNote(client.id, noteText, author)}
                       crewDatabase={crewMembers}
                       onMove={(direction: 'next' | 'prev') => {
                          const currentIndex = columns.indexOf(col);
                          if (direction === 'next' && currentIndex < columns.length - 1) moveClient(client.id, columns[currentIndex + 1]);
                          if (direction === 'prev' && currentIndex > 0) moveClient(client.id, columns[currentIndex - 1]);
                       }}
                       isFirst={columns.indexOf(col) === 0}
                       isLast={columns.indexOf(col) === columns.length - 1}
                     />
                  ))}
                  {opsClients.filter(c => getCol(c.status) === col).length === 0 && (
                    <div className="h-full min-h-[100px] flex items-center justify-center opacity-30">
                      <p className="text-sm">No jobs.</p>
                    </div>
                  )}
               </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}

{/* CALENDAR VIEW COMPONENT */}
function CalendarView({ opsClients, currentMonth, setCurrentMonth, scheduleClient }: any) {
  const [selectedUnscheduledJob, setSelectedUnscheduledJob] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const dateGrid = eachDayOfInterval({ start: startDate, end: endDate });

  const unscheduled = opsClients.filter((c: any) => !c.install_date && c.status !== 'Completed');

  return (
    <div className="flex flex-col xl:flex-row gap-6 mt-4">
      {/* Unscheduled Bench Sidebar */}
      <div className="w-full xl:w-80 shrink-0 bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-2xl overflow-hidden flex flex-col h-[600px]">
         <div className="mb-4 pb-4 border-b border-white/10">
            <h3 className="text-white font-bold mb-1 flex items-center gap-2"><GripVertical size={16} className="text-white/50" /> Unscheduled Bench</h3>
            <p className="text-xs text-white/50 leading-relaxed">Select a job from this queue, then click a date on the calendar to assign it.</p>
         </div>
         
         <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {unscheduled.length === 0 && (
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                 <p className="text-sm text-white/30 truncate px-4">Bench is empty.</p>
              </div>
            )}
            {unscheduled.map((client: any) => (
               <div 
                 key={client.id}
                 onClick={() => setSelectedUnscheduledJob(selectedUnscheduledJob === client.id ? null : client.id)}
                 className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedUnscheduledJob === client.id ? "bg-[#ffffff]/10 border-[#ffffff] shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "bg-[#111] border-white/5 hover:border-white/20"}`}
               >
                  <p className="font-bold text-white text-sm mb-1">{client.first_name} {client.last_name}</p>
                  <div className="flex justify-between items-end">
                    <p className="text-xs font-mono text-white/40 truncate pr-2 max-w-[150px]">{client.project_type}</p>
                    <p className="text-xs font-bold text-emerald-400">${client.total_value}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
         {/* Calendar Header */}
         <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111]">
            <h2 className="text-xl font-bold font-space text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex bg-black border border-white/10 rounded-lg overflow-hidden p-1">
               <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 text-white/50 hover:text-white transition-colors hover:bg-white/5 rounded"><ChevronLeft size={18} /></button>
               <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 text-xs font-bold text-white/70 hover:text-white transition-colors hover:bg-white/5 rounded">Today</button>
               <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 text-white/50 hover:text-white transition-colors hover:bg-white/5 rounded"><ChevronRight size={18} /></button>
            </div>
         </div>

         {/* Weekdays Row */}
         <div className="grid grid-cols-7 border-b border-white/10 bg-[#050505]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-widest text-white/40">
                 {day}
              </div>
            ))}
         </div>

         {/* Days Grid */}
         <div className="grid grid-cols-7 flex-1 bg-white/5 gap-[1px]">
            {dateGrid.map((day, idx) => {
               const dayStr = format(day, 'yyyy-MM-dd');
               // Retrieve scheduled jobs for this day
               const daysJobs = opsClients.filter((c: any) => c.install_date === dayStr);
               const isCurrentMonth = isSameMonth(day, currentMonth);
               const isToday = isSameDay(day, new Date());

               return (
                 <div 
                   key={idx} 
                   onClick={() => {
                      if (selectedUnscheduledJob) {
                         scheduleClient(selectedUnscheduledJob, dayStr);
                         setSelectedUnscheduledJob(null);
                      }
                   }}
                   className={`bg-[#0a0a0a] p-2 min-h-[100px] flex flex-col transition-colors ${!isCurrentMonth ? "opacity-50 blur-[0.5px] pointer-events-none" : "hover:bg-[#151515]"} ${selectedUnscheduledJob && isCurrentMonth ? "cursor-crosshair hover:bg-white/10 hover:border-white/30 border-2 border-transparent transition-all border-dashed" : ""}`}
                 >
                    {/* Date Num */}
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-xs font-bold w-6 h-6 flex justify-center items-center rounded-full ${isToday ? "bg-white text-black" : "text-white/40"}`}>
                         {format(day, 'd')}
                       </span>
                    </div>

                    {/* Render assigned jobs inside date cell */}
                    <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                       {daysJobs.map((job: any) => {
                          const statusColor = 
                             job.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                             job.status === 'In Progress' ? 'bg-[#ffffff]/20 text-[#ffffff] border-[#ffffff]/30' :
                             job.status === 'Curing' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                             'bg-white/10 text-white/70 border-white/10';

                          return (
                             <div key={job.id} className={`px-2 py-1.5 rounded-md border text-[10px] leading-tight truncate ${statusColor}`}>
                                <span className="font-bold">{job.first_name} {job.last_name[0]}.</span><br/>
                                <span className="opacity-70 font-mono tracking-tighter">{job.project_type}</span>
                             </div>
                          );
                       })}
                    </div>
                 </div>
               );
            })}
         </div>
      </div>
    </div>
  );
}

function KanbanCard({ client, crew, onUpdateCrew, logs, onAddNote, crewDatabase, onMove, isFirst, isLast }: any) {
  const [tempNote, setTempNote] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("Admin");

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 shadow-lg hover:border-white/30 transition-all group"
    >
      <div className="flex justify-between items-start mb-2">
         <h4 className="font-bold text-white text-sm cursor-grab active:cursor-grabbing flex items-center gap-2">
            <GripVertical size={14} className="text-white/20" />
            {client.first_name} {client.last_name}
         </h4>
         <span className="font-space font-bold text-xs text-white/50">${client.total_value}</span>
      </div>
      <p className="text-xs text-white/60 mb-4 pl-6 line-clamp-1">{client.address || "No address provided"}</p>
      
      {/* Crew Assignment */}
      <div className="mb-3 pl-6">
        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1 mb-1">
          <Users size={10} /> Assigned Crew
        </label>
        <select 
          value={crew}
          onChange={(e) => onUpdateCrew(e.target.value)}
          className="w-full bg-[#111] border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#ffffff] appearance-none"
        >
          <option value="">-- Select Crew --</option>
          {crewDatabase.map((c: any) => (
             <option key={c.id} value={c.name}>{c.name} ({c.role})</option>
          ))}
          {crewDatabase.length === 0 && <option value="" disabled>No crew in database</option>}
        </select>
      </div>

      {/* Activity Log */}
      <div className="mb-4 pl-6">
        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1 mb-1">
          <FileText size={10} /> Activity Log
        </label>
        
        {/* Render Logs */}
        <div className="mb-2 space-y-1.5 max-h-[80px] overflow-y-auto pr-1">
          {logs.length === 0 && <p className="text-[10px] text-white/30 italic">No notes yet.</p>}
          {logs.map((L: any) => (
             <div key={L.id} className="bg-white/5 rounded p-1.5 border border-white/5">
                <div className="flex justify-between items-center mb-0.5">
                   <span className="text-[9px] font-bold text-[#ffffff]">{L.author}</span>
                   <span className="text-[8px] text-white/40">{L.timestamp}</span>
                </div>
                <p className="text-[10px] text-zinc-300 leading-tight break-words">{L.text}</p>
             </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex flex-col gap-1.5 bg-[#111] border border-white/10 p-1.5 rounded-md focus-within:border-[#ffffff] transition-colors">
          <select 
             value={noteAuthor}
             onChange={e => setNoteAuthor(e.target.value)}
             className="bg-transparent text-[9px] text-[#ffffff] font-bold focus:outline-none cursor-pointer appearance-none uppercase tracking-wider"
          >
             <option value="Admin">Admin</option>
             {crewDatabase.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
             ))}
          </select>
          <div className="flex items-end gap-1">
             <textarea 
               value={tempNote}
               onChange={(e) => setTempNote(e.target.value)}
               placeholder="Add note..." 
               rows={1}
               className="w-full bg-transparent text-xs text-white focus:outline-none resize-none leading-tight py-0.5"
             />
             <button 
               onClick={() => { onAddNote(tempNote, noteAuthor); setTempNote(""); }}
               disabled={!tempNote}
               className="bg-blue-500/10 hover:bg-[#ffffff] text-white p-1 rounded transition-colors disabled:opacity-20 shrink-0"
             >
               <Plus size={12} />
             </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-3 border-t border-white/5 pl-6">
        <button 
          onClick={() => onMove('prev')}
          disabled={isFirst}
          className="text-xs text-zinc-500 hover:text-white disabled:opacity-20"
        >
          &larr; Prev
        </button>
        <button 
          onClick={() => onMove('next')}
          disabled={isLast}
          className="text-xs font-bold text-[#ffffff] hover:text-white transition-colors disabled:opacity-20"
        >
          {isLast ? "Done" : "Next Phase &rarr;"}
        </button>
      </div>
    </motion.div>
  );
}
