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
  const [isLoading, setIsLoading] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check Dev Status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === "jakeflowers222@gmail.com") {
        setIsDev(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsDev(session?.user?.email === "jakeflowers222@gmail.com");
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

  // Hide the internal contractor bot on client-facing URLs
  const isClientFacingUrl = 
    location.pathname.startsWith('/quote-live') || 
    location.pathname.startsWith('/review') || 
    location.pathname.startsWith('/portfolio') || 
    location.pathname.startsWith('/quote-form') || 
    location.pathname.startsWith('/widget');

  if (isClientFacingUrl) {
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
    setMessages([
      {
        role: "assistant",
        content: `What would you like to know about **${toolName}**? I can walk you through how to use it, explain features, or answer any questions.`,
      },
    ]);
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't process that. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Connection error. Make sure the app is deployed or running locally.",
        },
      ]);
    }
    setIsLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Simple markdown-ish renderer for bold text
  function renderContent(text: string) {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <>
      {/* Floating Action Button - Simplified for guaranteed visibility */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-12 right-6 z-[9999] w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(120,200,255,0.6)] hover:scale-105 transition-all group border-2 border-white/20"
          style={{
            background: "linear-gradient(135deg, #78c8ff 0%, #a78bfa 50%, #f472b6 100%)",
          }}
          id="assistant-fab"
          aria-label="Open Assistant"
        >
          <Sparkles size={28} className="text-white drop-shadow-xl" strokeWidth={2.5} />
          {/* Pulse ring wrapper */}
          <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-white" />
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
                        ? "Resin OS Assistant"
                        : "What would you like to do?"}
                    </h3>
                    <p className="text-white/40 text-[11px]">
                      {mode === "chat"
                        ? "Ask me anything about the platform"
                        : "Navigate tools or ask for help"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              {mode === "tools" ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {/* Quick Chat CTA */}
                  <button
                    onClick={() => {
                      setMode("chat");
                      setMessages([
                        {
                          role: "assistant",
                          content:
                            "Hey! 👋 I'm your Resin OS assistant. I can help you with anything — how to generate quotes, manage leads, use the AI visualizer, or any epoxy business questions. What's on your mind?",
                        },
                      ]);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#78c8ff]/10 to-[#a78bfa]/10 border border-[#78c8ff]/20 hover:border-[#78c8ff]/40 transition-all group mb-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#78c8ff] to-[#a78bfa] flex items-center justify-center shrink-0">
                      <MessageCircle
                        size={18}
                        className="text-white"
                      />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white font-bold text-sm">
                        Ask a Question
                      </p>
                      <p className="text-white/40 text-xs">
                        Chat with AI about tools, techniques, or
                        business
                      </p>
                    </div>
                    <Send
                      size={14}
                      className="text-white/20 group-hover:text-[#78c8ff] transition-colors"
                    />
                  </button>

                  {/* Tool Grid */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-1 pt-1 pb-2">
                    Your Toolkit
                  </p>
                  {/* Render Standard Tools */}
                  {TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = location.pathname === tool.path;
                    return (
                      <div
                        key={tool.path}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group cursor-pointer ${
                          isActive
                            ? "bg-white/[0.07] border border-white/10"
                            : "hover:bg-white/[0.04] border border-transparent"
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: `${tool.color}15`,
                            border: `1px solid ${tool.color}25`,
                          }}
                        >
                          <Icon
                            size={18}
                            style={{ color: tool.color }}
                          />
                        </div>

                        {/* Text — click navigates */}
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => handleNavigate(tool.path)}
                        >
                          <p className="text-white font-bold text-sm truncate flex items-center gap-2">
                            {tool.name}
                            {isActive && (
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Active
                              </span>
                            )}
                          </p>
                          <p className="text-white/40 text-xs truncate">
                            {tool.desc}
                          </p>
                        </div>

                        {/* Help button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAskAboutTool(tool.name);
                          }}
                          className="p-2 rounded-lg text-white/20 hover:text-[#78c8ff] hover:bg-[#78c8ff]/10 transition-all shrink-0"
                          title={`Ask about ${tool.name}`}
                        >
                          <MessageCircle size={14} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Clone AI - Visible to all but "Coming Soon" for non-devs */}
                  <div
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                      isDev ? "cursor-pointer hover:bg-white/[0.04] border border-transparent" : "opacity-60 cursor-not-allowed border border-dashed border-white/10"
                    } ${location.pathname === "/admin/clone" ? "bg-white/[0.07] border-white/10" : ""}`}
                    onClick={() => {
                      if (isDev) handleNavigate("/admin/clone");
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: "#ec489915", border: "1px solid #ec489925" }}
                    >
                      <Wand2 size={18} style={{ color: "#ec4899" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate flex items-center gap-2">
                        Clone AI
                        {!isDev && (
                          <span className="text-[8px] bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Pending Meta Approval
                          </span>
                        )}
                        {isDev && location.pathname === "/admin/clone" && (
                          <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                        )}
                      </p>
                      <div className="text-white/40 text-[11px] leading-relaxed mt-1">
                        {!isDev ? (
                          <>
                            <span className="block mb-1">
                              Train an authentic AI persona that clones exactly how you type and talk in your DMs. It seamlessly engages prospects and dispatches leads so nobody can tell they're talking to an AI.
                            </span>
                            <span className="block text-white/60 font-bold italic">
                              * Resin OS is currently the ONLY Epoxy SaaS platform in the world testing this autonomous DM & SMS dispatch technology.
                            </span>
                          </>
                        ) : (
                          <span className="truncate block">Train an AI clone to answer calls and dispatch leads.</span>
                        )}
                      </div>
                    </div>
                    {isDev && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAskAboutTool("Clone AI");
                        }}
                        className="p-2 rounded-lg text-white/20 hover:text-[#78c8ff] hover:bg-[#78c8ff]/10 transition-all shrink-0"
                      >
                        <MessageCircle size={14} />
                      </button>
                    )}
                  </div>

                  {/* God Mode - Only for Jake */}
                  {isDev && (
                    <div
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group cursor-pointer ${
                        location.pathname === "/admin/super"
                          ? "bg-red-900/10 border border-red-500/20"
                          : "hover:bg-red-900/5 border border-transparent"
                      }`}
                      onClick={() => handleNavigate("/admin/super")}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: "#ef444415", border: "1px solid #ef444425" }}
                      >
                        <ShieldAlert size={18} className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate flex items-center gap-2">
                          God Mode
                          <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Dev Only
                          </span>
                        </p>
                        <p className="text-red-400/50 text-xs truncate">
                          Global CRM analytics & platform overrides.
                        </p>
                      </div>
                    </div>
                  )}
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
                          {msg.role === "assistant" ? (
                            <div className="whitespace-pre-wrap">
                              {renderContent(msg.content)}
                            </div>
                          ) : (
                            msg.content
                          )}
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
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#78c8ff]/50 transition-colors">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
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
                      Powered by Resin OS AI · Responses may vary
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
