import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Send, Search, UserPlus, CheckCircle, Mail } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  originalImage: string;
  generatedImage: string;
  coatingStyle: string;
  coatingColor: string;
}

// Helper: upload a data URI or base64 image to Supabase Storage and return a public URL
async function uploadImageToStorage(dataUri: string, filename: string): Promise<string | null> {
  try {
    // Handle both data URIs and raw base64
    let base64 = dataUri;
    let mimeType = 'image/png';
    if (dataUri.startsWith('data:')) {
      const parts = dataUri.split(',');
      base64 = parts[1];
      const mimeMatch = parts[0].match(/data:(.*?);/);
      if (mimeMatch) mimeType = mimeMatch[1];
    }

    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const path = `visualizations/${filename}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('business-assets')
      .upload(path, blob, { contentType: mimeType, upsert: true });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from('business-assets').getPublicUrl(path);
    return publicUrl;
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
}

export default function SendVisualizationModal({ isOpen, onClose, originalImage, generatedImage, coatingStyle, coatingColor }: Props) {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [showAddNew, setShowAddNew] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [isSavingClient, setIsSavingClient] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedClient(null);
      setShowAddNew(false);
      setIsSent(false);
      setNewClient({ firstName: "", lastName: "", email: "", phone: "" });
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, address')
        .eq('installer_id', user.id)
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);
      setSearchResults((data as Client[]) || []);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleSaveNewClient() {
    if (!newClient.firstName || !newClient.lastName || !newClient.email) {
      toast({ title: "Missing Info", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setIsSavingClient(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('clients').insert([{
      installer_id: user.id,
      first_name: newClient.firstName,
      last_name: newClient.lastName,
      email: newClient.email,
      phone: newClient.phone || null,
      status: "New Lead"
    }]).select().single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setSelectedClient(data as Client);
      setShowAddNew(false);
      toast({ title: "Client Saved!", description: `${newClient.firstName} added to your pipeline.` });
    }
    setIsSavingClient(false);
  }

  async function handleSendEmail() {
    if (!selectedClient?.email) {
      toast({ title: "No Email", description: "This client has no email address.", variant: "destructive" });
      return;
    }

    setIsSending(true);

    try {
      // Upload both images to Supabase Storage so they render in email
      toast({ title: "Uploading images..." });
      const [beforeUrl, afterUrl] = await Promise.all([
        originalImage ? uploadImageToStorage(originalImage, 'before') : Promise.resolve(null),
        uploadImageToStorage(generatedImage, 'after'),
      ]);

      if (!afterUrl) {
        toast({ title: "Upload Failed", description: "Could not upload images. Try again.", variant: "destructive" });
        setIsSending(false);
        return;
      }

      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; padding: 0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 32px; text-align: center;">
            <p style="color: rgba(255,255,255,0.7); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Resin OS</p>
            <h1 style="color: white; font-size: 24px; margin: 0 0 8px 0;">Your Floor Visualization</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">AI-generated preview of your new ${coatingStyle}</p>
          </div>
          <div style="padding: 24px;">
            ${beforeUrl ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
              <tr>
                <td width="48%" style="vertical-align: top;">
                  <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; text-align: center; font-weight: bold;">Before</p>
                  <img src="${beforeUrl}" alt="Before" style="width: 100%; border-radius: 10px; display: block;" />
                </td>
                <td width="4%"></td>
                <td width="48%" style="vertical-align: top;">
                  <p style="color: #10b981; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; text-align: center; font-weight: bold;">After</p>
                  <img src="${afterUrl}" alt="After" style="width: 100%; border-radius: 10px; display: block;" />
                </td>
              </tr>
            </table>
            ` : `
            <img src="${afterUrl}" alt="Floor Visualization" style="width: 100%; border-radius: 12px; margin-bottom: 20px; display: block;" />
            `}
            <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Coating Style</p>
              <p style="color: white; font-size: 16px; font-weight: bold; margin: 0 0 12px 0;">${coatingStyle}</p>
              <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Color</p>
              <p style="color: white; font-size: 16px; font-weight: bold; margin: 0;">${coatingColor}</p>
            </div>
            <p style="color: #666; font-size: 13px; text-align: center; margin: 0;">
              This visualization was generated using AI and is for illustrative purposes. Actual results may vary slightly.
            </p>
          </div>
        </div>
      `;

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedClient.email,
          subject: `Your Floor Visualization — ${coatingStyle} (${coatingColor})`,
          html: emailHtml,
        }),
      });

      const result = await response.json();
      if (result.error) {
        toast({ title: "Email Failed", description: result.error, variant: "destructive" });
      } else {
        setIsSent(true);
        toast({ title: "Email Sent!", description: `Visualization sent to ${selectedClient.email}` });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsSending(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex justify-between items-center p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail size={18} className="text-emerald-400" /> Email to Client
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <p className="text-white font-bold text-lg">Sent!</p>
              <p className="text-white/50 text-sm mt-1">Email delivered to {selectedClient?.email}</p>
              <button onClick={onClose} className="mt-6 px-6 py-2 bg-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/20 transition-colors">
                Close
              </button>
            </div>
          ) : (
            <>
              {selectedClient ? (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-white font-bold text-sm">{selectedClient.first_name} {selectedClient.last_name}</p>
                    <p className="text-emerald-300/70 text-xs">{selectedClient.email}</p>
                  </div>
                  <button onClick={() => { setSelectedClient(null); setSearchQuery(""); }} className="text-white/40 hover:text-white text-xs">Change</button>
                </div>
              ) : showAddNew ? (
                <div className="space-y-3">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wider">New Client</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input autoFocus value={newClient.firstName} onChange={e => setNewClient({ ...newClient, firstName: e.target.value })} placeholder="First Name" className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                    <input value={newClient.lastName} onChange={e => setNewClient({ ...newClient, lastName: e.target.value })} placeholder="Last Name" className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                  </div>
                  <input type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} placeholder="Email (required)" className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                  <input type="tel" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} placeholder="Phone (optional)" className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddNew(false)} className="flex-1 py-2.5 bg-white/5 rounded-xl text-white/60 text-sm font-bold hover:bg-white/10 transition-colors">Cancel</button>
                    <button onClick={handleSaveNewClient} disabled={isSavingClient} className="flex-1 py-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl text-sm font-bold hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                      {isSavingClient ? "Saving..." : "Save Client"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search client by name or email..." className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors" />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                      {searchResults.map(client => (
                        <button key={client.id} onClick={() => { setSelectedClient(client); setSearchQuery(""); setSearchResults([]); }} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                          <p className="text-white font-bold text-sm">{client.first_name} {client.last_name}</p>
                          <p className="text-white/40 text-xs">{client.email || "No email"}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                    <p className="text-white/30 text-xs text-center py-2">No clients found</p>
                  )}
                  <button onClick={() => setShowAddNew(true)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 rounded-xl text-white/60 text-sm font-bold hover:bg-white/10 transition-colors">
                    <UserPlus size={14} /> Add New Client
                  </button>
                </div>
              )}

              {selectedClient && (
                <div className="space-y-3">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Email Preview</p>
                  <div className="bg-[#111] border border-white/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-white/40">To:</span>
                      <span className="text-white">{selectedClient.email}</span>
                    </div>
                    <div className="border-t border-white/5 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        {originalImage && (
                          <div>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1 text-center">Before</p>
                            <img src={originalImage} alt="Before" className="w-full h-20 object-cover rounded-lg" />
                          </div>
                        )}
                        <div>
                          <p className="text-emerald-400 text-[10px] uppercase tracking-wider mb-1 text-center">After</p>
                          <img src={generatedImage} alt="After" className="w-full h-20 object-cover rounded-lg" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSendEmail}
                    disabled={isSending}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff' }}
                  >
                    {isSending ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading & Sending...</>
                    ) : (
                      <><Send size={16} /> Send Before & After</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
