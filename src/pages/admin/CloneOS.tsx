import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Loader2, Bot, User, Settings2, Save, MessageSquare, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function CloneOS() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchConversations();
    fetchSettings();
  }, []);

  // Fetch messages when selected conversation changes
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      // Subscribe to new messages for this conversation
      const channel = supabase
        .channel('messages_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'clone_messages', filter: `conversation_id=eq.${activeConvId}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  // Subscribe to new conversations
  useEffect(() => {
      const convChannel = supabase
        .channel('conversations_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'clone_conversations' },
          () => {
            fetchConversations();
          }
        )
        .subscribe();
        
      return () => {
          supabase.removeChannel(convChannel);
      }
  }, []);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('clone_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    
    if (data) {
      setConversations(data);
      if (!activeConvId && data.length > 0) {
        setActiveConvId(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('clone_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('clone_settings')
      .select('*')
      .eq('id', 'default')
      .single();
    
    if (data) {
      setSystemPrompt(data.system_prompt);
      setIsActive(data.is_active);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase
      .from('clone_settings')
      .update({ system_prompt: systemPrompt, is_active: isActive })
      .eq('id', 'default');
      
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("AI Model Updated Successfully");
    }
    setSavingSettings(false);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;

  return (
    <div className="lg:h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4 lg:overflow-hidden text-neutral-200 pb-4">
      
      {/* LEFT PANE: Conversations */}
      <div className="w-full lg:w-72 bg-[#111] border border-red-500/10 rounded-2xl flex flex-col overflow-hidden shrink-0 h-[300px] lg:h-auto">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-500" /> Inbox
          </h2>
          <div className="text-xs text-white/50">{conversations.length} Active</div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`w-full text-left p-3 rounded-xl transition-all border ${activeConvId === conv.id ? 'bg-red-500/10 border-red-500/30' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}`}
            >
              <div className="text-sm font-medium mb-1 truncate flex items-center justify-between">
                <span>IG: {conv.instagram_id}</span>
                {conv.needs_human && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
              </div>
              <div className="text-xs text-white/50 truncate">
                Updated {new Date(conv.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="p-4 text-center text-sm text-white/40">No conversations yet.</div>
          )}
        </div>
      </div>

      {/* CENTER PANE: Chat Feed */}
      <div className="flex-1 flex flex-col bg-[#111] border border-red-500/10 rounded-2xl overflow-hidden min-w-0 min-h-[500px] lg:min-h-0">
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <Bot className="w-5 h-5 text-red-500" />
          <h2 className="font-bold truncate">God Mode Monitor</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!activeConvId && (
            <div className="h-full flex items-center justify-center text-white/40 text-sm">
              Select a conversation to view memory.
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-start mr-auto' : 'items-end ml-auto'}`}>
              <div className="text-xs text-white/40 mb-1 flex items-center gap-1 mx-1">
                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-red-500" />}
                {msg.role === 'user' ? 'Customer' : 'Clone OS'}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#1a1a1a] border border-white/10' : 'bg-red-500/10 border border-red-500/20 text-red-100'}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        
        {/* Manual Override input could go here later */}
        <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
           <div className="text-xs text-white/40 flex items-center gap-2 justify-center">
              <ShieldAlert className="w-4 h-4 text-red-500" /> To step in manually, reply directly in the Instagram app.
           </div>
        </div>
      </div>

      {/* RIGHT PANE: Internal AI Settings */}
      <div className="w-full lg:w-80 bg-[#111] border border-red-500/10 rounded-2xl flex flex-col overflow-hidden shrink-0 h-[400px] lg:h-auto mt-4 lg:mt-0">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-red-500" />
          <h2 className="font-bold">AI Brain Settings</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
            <div>
              <div className="text-sm font-bold">Autopilot</div>
              <div className="text-xs text-white/50">Allow AI to reply automatically</div>
            </div>
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isActive ? 'bg-red-500' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-h-[300px]">
            <label className="text-sm font-bold text-white/80">System Prompt / Pricing</label>
            <textarea 
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-xs text-white/70 focus:outline-none focus:border-red-500 leading-relaxed resize-none"
              placeholder="Enter instructions..."
            />
          </div>

          <button 
            onClick={saveSettings}
            disabled={savingSettings}
            className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 flex-shrink-0"
          >
            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Deploy to Clone OS
          </button>
        </div>
      </div>
      
    </div>
  );
}
