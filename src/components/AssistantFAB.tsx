import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  LayoutDashboard,
  ContactRound,
  Calculator,
  Wand2,
  PlaySquare,
  LifeBuoy,
  FileText,
  HardHat,
  Factory,
  Landmark,
  ShoppingBag,
  Settings,
  Loader2,
  ArrowLeft,
  Sparkles,
  Bot,
  ShieldAlert,
  Paperclip,
  RefreshCcw,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const TOOLS = [
  {
    name: "Command Center",
    path: "/admin",
    icon: LayoutDashboard,
    color: "#78c8ff",
    desc: "Your sales pipeline, revenue stats, and lead tracking hub.",
  },
  {
    name: "Lead Center",
    path: "/admin/leads",
    icon: ContactRound,
    color: "#78c8ff",
    desc: "Full CRM — manage every incoming lead in one place.",
  },
  {
    name: "Quote Generator",
    path: "/admin/quote",
    icon: Calculator,
    color: "#a78bfa",
    desc: "Create branded, interactive PDF proposals in seconds.",
  },
  {
    name: "AI Visualizer",
    path: "/admin/visualizer",
    icon: Wand2,
    color: "#f472b6",
    desc: "Show clients a photorealistic preview of their new floor.",
  },
  {
    name: "Lead Autopilot",
    path: "/admin/autopilot",
    icon: PlaySquare,
    color: "#3b82f6",
    desc: "Scan local business floors, visualize, and generate outreach pitches.",
  },
  {
    name: "Proposals",
    path: "/admin/proposals",
    icon: FileText,
    color: "#a78bfa",
    desc: "Track sent quotes — read receipts, signatures, and payments.",
  },
  {
    name: "Workforce Hub",
    path: "/admin/workforce",
    icon: HardHat,
    color: "#facc15",
    desc: "Manage your crew, subcontractors, and installation teams.",
  },
  {
    name: "Ops & Dispatch",
    path: "/admin/ops",
    icon: Factory,
    color: "#fb923c",
    desc: "Schedule jobs, manage dispatch, and coordinate logistics.",
  },
  {
    name: "Banking & Payouts",
    path: "/admin/finances",
    icon: Landmark,
    color: "#4ade80",
    desc: "Revenue analytics, payment history, and Stripe payouts.",
  },
  {
    name: "Mastery Support",
    path: "/admin/academy",
    icon: LifeBuoy,
    color: "#38bdf8",
    desc: "Training resources, videos, and installation guides.",
  },
  {
    name: "Mud2Marble Store",
    path: "/admin/marketplace",
    icon: ShoppingBag,
    color: "#c084fc",
    desc: "Order epoxy, flakes, metallic pigments, and tools.",
  },
  {
    name: "Settings",
    path: "/admin/settings",
    icon: Settings,
    color: "#94a3b8",
    desc: "Account, branding, notifications, and subscription.",
  },
];

export default function AssistantFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"tools" | "chat">("tools");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchMessages = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('assistant_messages')
        .select('role, content')
        .eq('user_id', uid)
        .order('created_at', { ascending: true });
      
      if (!error && data && data.length > 0) {
        setMessages(data as ChatMessage[]);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // Check Dev Status & Load Messages
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === "jakeflowers222@gmail.com") {
        setIsDev(true);
      }
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchMessages(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsDev(session?.user?.email === "jakeflowers222@gmail.com");
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchMessages(session.user.id);
      } else {
        setUserId(null);
        setMessages([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when switching to chat
  useEffect(() => {
    if (mode === "chat" && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [mode, isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Only show the internal contractor bot on authenticated workspace routes
  const isInternalRoute = 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/field');

  if (!isInternalRoute) {
    return null;
  }

  function handleOpen() {
    setIsOpen(true);
    setMode("tools");
  }

  function handleClose() {
    setIsOpen(false);
  }

  function handleNavigate(path: string) {
    navigate(path);
    setIsOpen(false);
  }

  function handleAskAboutTool(toolName: string) {
    setMode("chat");
    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `What would you like to know about **${toolName}**? I can walk you through how to use it, explain features, or answer any questions.`,
      },
    ]);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/chat-uploads/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('business-assets').getPublicUrl(filePath);

      setPendingAttachments((prev) => [...prev, publicUrl]);

    } catch (err) {
      console.error("Upload error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't upload that file right now." }]);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function sendChatRequest(currentMessages: ChatMessage[]) {
    // Build userContext dynamically from localStorage
    const track = localStorage.getItem('resin_guided_track') || 'beginner';
    const tasks = {
      "Task 1": localStorage.getItem("resin_task_" + (track === 'advanced' ? "Setup_Quote_Engine" : "Watch_Day_1_Primer")) === 'true',
      "Task 2": localStorage.getItem("resin_task_" + (track === 'advanced' ? "Closing_Scripts" : "Order_Starter_Kit")) === 'true',
      "Task 3": localStorage.getItem("resin_task_" + (track === 'advanced' ? "Controlled_Veining" : "Spray_Paint_Technique")) === 'true',
    };

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    try {
      const res = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages,
          userContext: { track, tasks, token },
        }),
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const botMessage: ChatMessage = {
        role: "assistant",
        content: data.reply || "I didn't quite catch that. Try again broski.",
      };

      setMessages((prev) => [...prev, botMessage]);

      if (userId) {
        supabase.from('assistant_messages').insert({ user_id: userId, role: 'assistant', content: botMessage.content }).then();
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error." }]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend() {
    if ((!input.trim() && pendingAttachments.length === 0) || isLoading) return;

    let currentMessages = [...messages];

    for (const url of pendingAttachments) {
      const sysMsg: ChatMessage = { role: "user", content: `[SYSTEM: User uploaded a file: ${url}]` };
      currentMessages.push(sysMsg);
      if (userId) {
        supabase.from('assistant_messages').insert({ user_id: userId, role: 'user', content: sysMsg.content }).then();
      }
    }

    if (input.trim()) {
      const userMessage: ChatMessage = { role: "user", content: input.trim() };
      currentMessages.push(userMessage);
      if (userId) {
        supabase.from('assistant_messages').insert({ user_id: userId, role: 'user', content: userMessage.content }).then();
      }
    }

    setMessages(currentMessages);
    setInput("");
    setPendingAttachments([]);
    setIsLoading(true);

    await sendChatRequest(currentMessages);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Simple markdown-ish renderer for bold text
  function renderContent(text: string) {
    const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("[") && part.includes("](")) {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const [_, label, url] = match;
          return (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:text-[#60a5fa] underline font-medium cursor-pointer">
              {label}
            </a>
          );
        }
      }
      if (part.startsWith("[SYSTEM: User uploaded a file:")) {
        const match = part.match(/\[SYSTEM: User uploaded a file: (.*?)\]/);
        if (match) {
          const url = match[1];
          if (url.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
            return (
              <div key={i} className="my-2 border border-black/10 rounded-lg overflow-hidden bg-black/5">
                <img src={url} alt="Uploaded file" className="w-full max-h-48 object-cover" />
              </div>
            );
          }
          return (
            <div key={i} className="my-2 flex items-center gap-2 p-2 bg-black/5 rounded-md border border-black/10">
              <Paperclip size={14} className="opacity-70" />
              <a href={url} target="_blank" rel="noopener noreferrer" className="underline font-medium break-all">
                Uploaded Document
              </a>
            </div>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <>
      {/* Floating Action Button - Expanded to be more prominent */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-8 right-6 z-[9999] h-14 pl-4 pr-5 rounded-full flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(120,200,255,0.6)] hover:scale-105 transition-all group border-2 border-white/20 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #78c8ff 0%, #a78bfa 50%, #f472b6 100%)",
          }}
          id="assistant-fab"
          aria-label="Open AI Expert"
        >
          <div className="bg-white/20 p-2 rounded-full shadow-inner">
            <Bot size={20} className="text-white drop-shadow-xl" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-white text-sm whitespace-nowrap tracking-wide drop-shadow-md">Jake's AI Clone</span>
          {/* Pulse ring wrapper */}
          <div className="absolute inset-0 rounded-full animate-pulse opacity-30 bg-white mix-blend-overlay pointer-events-none" />
        </button>
      )}

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-3 md:inset-auto md:bottom-6 md:right-6 md:w-[440px] md:h-[85vh] md:max-h-[700px] z-[9999] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{
                boxShadow:
                  "0 0 80px rgba(120, 200, 255, 0.08), 0 25px 60px rgba(0,0,0,0.6)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0 bg-[#0a0a0a]">
                <div className="flex items-center gap-3">
                  {mode === "chat" && (
                    <button
                      onClick={() => setMode("tools")}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #78c8ff, #a78bfa)",
                    }}
                  >
                    {mode === "chat" ? (
                      <Bot size={16} className="text-white" />
                    ) : (
                      <Sparkles size={16} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">
                      {mode === "chat"
                        ? "Jake's AI Clone"
                        : "What would you like to do?"}
                    </h3>
                    <p className="text-white/40 text-[11px]">
                      {mode === "chat"
                        ? "Ask me anything about the platform"
                        : "Navigate tools or ask for help"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {mode === "chat" && messages.length > 0 && (
                    <button
                      onClick={() => setMessages([])}
                      className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                      title="Clear chat screen"
                    >
                      <RefreshCcw size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              {mode === "tools" ? (
                <div className="flex-1 flex flex-col p-4 bg-[#0a0a0a]">
                  {/* Central AI CTA */}
                  <div className="flex-1 flex flex-col items-center justify-center mb-6 mt-4">
                    <div className="relative mb-6">
                       <div className="absolute inset-0 bg-gradient-to-r from-[#78c8ff] to-[#a78bfa] rounded-full blur-2xl opacity-40 animate-pulse"></div>
                       <div className="relative w-24 h-24 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center shadow-2xl">
                         <Bot size={40} className="text-white drop-shadow-lg" />
                       </div>
                    </div>
                    <h2 className="text-2xl font-space font-bold text-white mb-2 text-center">Jake's AI Clone</h2>
                    <p className="text-white/40 text-sm text-center mb-8 max-w-[280px]">Your personal guide for business secrets, quote generation, and epoxy techniques.</p>
                    <button
                      onClick={() => {
                        setMode("chat");
                        if (messages.length === 0) {
                          setMessages([
                            {
                              role: "assistant",
                              content: "What up broski! I'm Jake's AI Clone. I know everything Jake knows about epoxy, client acquisition, closing scripts, and spray paint veining. What are we building today?",
                            },
                          ]);
                        }
                      }}
                      className="px-8 py-4 rounded-full bg-white text-black font-bold flex items-center gap-3 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                    >
                      <MessageCircle size={20} /> Start Conversation
                    </button>
                  </div>

                  {/* Horizontal Tools Wheel */}
                  <div className="shrink-0 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-1 mb-3">
                      Swipe Tools
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {/* Render Standard Tools */}
                      {TOOLS.map((tool) => {
                        const Icon = tool.icon;
                        const isActive = location.pathname === tool.path;
                        return (
                          <div
                            key={tool.path}
                            onClick={() => handleNavigate(tool.path)}
                            className={`min-w-[140px] w-[140px] flex-shrink-0 snap-center flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all border ${
                              isActive
                                ? "bg-white/[0.08] border-[#78c8ff]/30 shadow-[0_0_15px_rgba(120,200,255,0.1)]"
                                : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                            }`}
                          >
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform hover:scale-110"
                              style={{ backgroundColor: `${tool.color}15`, border: `1px solid ${tool.color}25` }}
                            >
                              <Icon size={22} style={{ color: tool.color }} />
                            </div>
                            <p className="text-white font-bold text-sm text-center mb-1 w-full truncate">{tool.name}</p>
                            <p className="text-white/40 text-[10px] text-center line-clamp-2 leading-snug">{tool.desc}</p>
                          </div>
                        );
                      })}

                      {/* Clone AI */}
                      <div
                        onClick={() => { if (isDev) handleNavigate("/admin/clone"); }}
                        className={`min-w-[140px] w-[140px] flex-shrink-0 snap-center flex flex-col items-center justify-center p-4 rounded-2xl transition-all border ${
                          isDev ? "cursor-pointer bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10" : "opacity-60 cursor-not-allowed bg-white/[0.01] border-dashed border-white/10"
                        } ${location.pathname === "/admin/clone" ? "bg-white/[0.08] border-[#ec4899]/30" : ""}`}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform hover:scale-110"
                          style={{ backgroundColor: "#ec489915", border: "1px solid #ec489925" }}
                        >
                          <Wand2 size={22} style={{ color: "#ec4899" }} />
                        </div>
                        <p className="text-white font-bold text-sm text-center mb-1 w-full truncate">Clone AI</p>
                        <p className="text-white/40 text-[10px] text-center line-clamp-2 leading-snug">
                          {isDev ? "Train an AI clone to answer calls and dispatch leads." : "Pending Meta Approval"}
                        </p>
                      </div>

                      {/* God Mode - Only for Jake */}
                      {isDev && (
                        <div
                          onClick={() => handleNavigate("/admin/super")}
                          className={`min-w-[140px] w-[140px] flex-shrink-0 snap-center flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all border ${
                            location.pathname === "/admin/super"
                              ? "bg-red-900/10 border-red-500/30"
                              : "bg-red-900/5 border-transparent hover:border-red-500/20"
                          }`}
                        >
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform hover:scale-110"
                            style={{ backgroundColor: "#ef444415", border: "1px solid #ef444425" }}
                          >
                            <ShieldAlert size={22} className="text-red-500" />
                          </div>
                          <p className="text-white font-bold text-sm text-center mb-1 w-full truncate">God Mode</p>
                          <p className="text-red-400/50 text-[10px] text-center line-clamp-2 leading-snug">Global CRM analytics & platform overrides.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Chat Mode */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex ${
                          msg.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-[#78c8ff] text-black rounded-br-md font-medium"
                              : "bg-white/[0.06] text-white/80 rounded-bl-md border border-white/5"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">
                            {renderContent(msg.content)}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white/[0.06] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                          <Loader2
                            size={14}
                            className="animate-spin text-[#78c8ff]"
                          />
                          <span className="text-white/40 text-sm">
                            Thinking...
                          </span>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Bar */}
                  <div className="shrink-0 border-t border-white/10 p-3 bg-[#0a0a0a]">
                    {pendingAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {pendingAttachments.map((url, i) => {
                          const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i);
                          return (
                            <div key={i} className="relative group rounded-md overflow-hidden border border-white/20 bg-white/5 w-12 h-12 flex items-center justify-center">
                              {isImage ? (
                                <img src={url} className="w-full h-full object-cover" />
                              ) : (
                                <Paperclip size={16} className="text-white/50" />
                              )}
                              <button 
                                onClick={() => setPendingAttachments(prev => prev.filter((_, index) => index !== i))}
                                className="absolute top-0 right-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} className="text-white" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#78c8ff]/50 transition-colors">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload}
                        accept="image/*,application/pdf"
                        className="hidden" 
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingFile || isLoading}
                        title="Upload photo or PDF contract"
                        className="p-2 rounded-lg transition-all disabled:opacity-30 hover:bg-[#78c8ff]/20 text-white/50 hover:text-[#78c8ff]"
                      >
                        {isUploadingFile ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                      </button>
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything or upload a file..."
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30 resize-none min-h-[40px] max-h-[120px] py-2"
                        rows={1}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 rounded-lg transition-all disabled:opacity-30 hover:bg-[#78c8ff]/20 text-[#78c8ff]"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                    <p className="text-[9px] text-white/20 text-center mt-2">
                      Powered by Jake's AI Clone - Responses may vary
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
