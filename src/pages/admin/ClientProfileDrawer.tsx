import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, Trash2, Save, FileText, ExternalLink, Copy, ChevronDown, AlertTriangle, Pencil, Send, Banknote } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export default function ClientProfileDrawer({ client, onClose, onUpdate }: any) {
  const { toast } = useToast();
  
  const [status, setStatus] = useState(client?.status || 'New Lead');
  const [projectType, setProjectType] = useState(client?.project_type || '');
  const [totalValue, setTotalValue] = useState(client?.total_value || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [address, setAddress] = useState(client?.address || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Linked Quotes
  const [linkedQuotes, setLinkedQuotes] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editServiceType, setEditServiceType] = useState('');
  const [editDepositPct, setEditDepositPct] = useState('50');
  const [editLegalTerms, setEditLegalTerms] = useState('');
  const [savingQuote, setSavingQuote] = useState(false);
  const [resendMode, setResendMode] = useState(false);

  useEffect(() => {
    if (client) {
      setStatus(client.status);
      setProjectType(client.project_type);
      setTotalValue(client.total_value || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setAddress(client.address || '');
      fetchLinkedQuotes();
    }
  }, [client]);

  if (!client) return null;

  async function fetchLinkedQuotes() {
    setLoadingQuotes(true);
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLinkedQuotes(data);
    }
    setLoadingQuotes(false);
  }

  async function handleSave() {
    setIsSaving(true);
    const { error } = await supabase
      .from('clients')
      .update({
        status,
        project_type: projectType,
        total_value: totalValue ? Number(totalValue) : null,
        email,
        phone,
        address
      })
      .eq('id', client.id);

    setIsSaving(false);
    
    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile Saved", description: "The CRM pipeline has been updated." });
      onUpdate();
      onClose();
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to permanently delete this lead?")) return;
    
    setIsDeleting(true);
    const { error } = await supabase.from('clients').delete().eq('id', client.id);
    setIsDeleting(false);

    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead Deleted", description: "The pipeline has been cleared." });
      onUpdate();
      onClose();
    }
  }

  async function handleQuoteStatusChange(quoteId: string, newStatus: string) {
    const { error } = await supabase
      .from('quotes')
      .update({ status: newStatus })
      .eq('id', quoteId);

    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quote Updated", description: `Status changed to "${newStatus}"` });
      fetchLinkedQuotes();
    }
  }

  async function handleDeleteQuote(quoteId: string) {
    if (!window.confirm("Permanently delete this quote? This cannot be undone.")) return;

    const { error } = await supabase.from('quotes').delete().eq('id', quoteId);

    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quote Deleted", description: "The proposal has been permanently removed." });
      fetchLinkedQuotes();
    }
  }

  function copyQuoteLink(quoteId: string) {
    navigator.clipboard.writeText(`https://www.resinacademics.com/quote-live/${quoteId}`);
    toast({ title: "Link Copied", description: "Quote link copied to clipboard!" });
  }

  async function handleManualPayment(q: any) {
    const currentMilestonesPaid = q.config?.milestones_paid || 0;
    const totalMilestones = q.config?.payment_schedule?.milestones?.length || 2;
    
    if (currentMilestonesPaid >= totalMilestones) {
       toast({ title: "Already Paid", description: "This quote has already been paid in full." });
       return;
    }

    const isDeposit = currentMilestonesPaid === 0;
    const milestoneLabel = isDeposit ? "Material Deposit (Milestone 1)" : `Payment ${currentMilestonesPaid + 1}`;
    const newStatus = isDeposit ? "Paid" : "Paid In Full";
    const newMilestoneValue = currentMilestonesPaid + 1;

    if (!window.confirm(`Are you sure you want to manually record ${milestoneLabel} as Paid via Cash/Check? This will instantly update the client's live portal.`)) return;

    // Use existing config, default 'opened_at' to now if not set so read receipts don't break
    const updatedConfig = { ...q.config, milestones_paid: newMilestoneValue };
    
    const { error } = await supabase
      .from('quotes')
      .update({ status: newStatus, config: updatedConfig })
      .eq('id', q.id);

    if (error) {
       toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
       toast({ title: "Payment Secured", description: `${milestoneLabel} manually marked as Paid.` });
       fetchLinkedQuotes();
    }
  }

  const getStatusColor = (s: string) => {
    switch(s?.toLowerCase()) {
      case 'paid in full': case 'paid': case 'won': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'opened': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'sent': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
      >
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#0a0a0a] border-l border-white/10 h-full p-8 overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-space font-bold text-white">{client.first_name} {client.last_name}</h2>
              <p className="text-white/50 text-sm">Created {new Date(client.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Contact Actions */}
          <div className="flex gap-4 mb-8">
            <a href={`tel:${phone}`} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-colors border border-white/5 pointer-events-auto cursor-pointer">
              <Phone size={16} /> <span className="text-sm font-bold">Call Lead</span>
            </a>
            <a href={`mailto:${email}`} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-colors border border-white/5 pointer-events-auto cursor-pointer">
              <Mail size={16} /> <span className="text-sm font-bold">Email</span>
            </a>
          </div>

          <hr className="border-white/5 mb-8" />

          {/* CRM Editor */}
          <div className="space-y-6">
            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Pipeline Status</label>
               <select 
                 value={status} 
                 onChange={(e) => setStatus(e.target.value)}
                 className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#78c8ff] outline-none"
               >
                 <option value="New Lead">New Lead</option>
                 <option value="Quoted">Quoted / Follow Up</option>
                 <option value="Won">Won / Deposit Paid</option>
                 <option value="Completed">✅ Completed / Archived</option>
                 <option value="Lost">❌ Lost / Dead Lead</option>
               </select>
            </div>

            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Project Type</label>
               <input 
                 value={projectType} 
                 onChange={(e) => setProjectType(e.target.value)}
                 className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#78c8ff] outline-none"
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Email</label>
                 <input 
                   type="email"
                   value={email} 
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#78c8ff] outline-none"
                 />
              </div>
              <div>
                 <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Phone</label>
                 <input 
                   type="tel"
                   value={phone} 
                   onChange={(e) => setPhone(e.target.value)}
                   className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#78c8ff] outline-none"
                 />
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Property Address</label>
               <input 
                 value={address} 
                 onChange={(e) => setAddress(e.target.value)}
                 className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#78c8ff] outline-none"
               />
            </div>

            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Total Financial Value</label>
               <div className="relative">
                 <span className="absolute left-4 top-3 text-white/50">$</span>
                 <input 
                   type="number"
                   value={totalValue} 
                   onChange={(e) => setTotalValue(e.target.value)}
                   className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-[#78c8ff] outline-none"
                   placeholder="0.00"
                 />
               </div>
            </div>

            {/* ============================================ */}
            {/* Linked Quotes & Documents Section            */}
            {/* ============================================ */}
            <div className="pt-4">
              <hr className="border-white/5 mb-6" />
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
                <FileText size={14} /> Linked Quotes & Documents
              </label>

              {loadingQuotes ? (
                <div className="text-white/30 text-sm py-4 text-center">Loading quotes...</div>
              ) : linkedQuotes.length === 0 ? (
                <div className="bg-white/5 border border-white/5 rounded-xl p-6 text-center">
                  <FileText size={24} className="text-white/15 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">No quotes linked to this client yet.</p>
                  <p className="text-white/25 text-xs mt-1">Generate one from the Quote Generator tab.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedQuotes.map((q) => (
                    <div key={q.id} className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                      {/* Quote Summary Row */}
                      <button
                        onClick={() => setExpandedQuoteId(expandedQuoteId === q.id ? null : q.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold text-sm truncate">
                              {q.config?.service_type || 'Quote'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(q.status)}`}>
                              {q.status || 'Draft'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/40">
                            <span className="font-space font-bold text-white/70">${q.total_amount?.toLocaleString()}</span>
                            <span>•</span>
                            <span>{new Date(q.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ChevronDown 
                          size={16} 
                          className={`text-white/30 transition-transform ${expandedQuoteId === q.id ? 'rotate-180' : ''}`} 
                        />
                      </button>

                      {/* Expanded Actions */}
                      {expandedQuoteId === q.id && (
                        <div className="border-t border-white/5 p-4 space-y-4 bg-black/30">
                          
                          {/* Inline Editor */}
                          {editingQuoteId === q.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Service Type</label>
                                <input
                                  value={editServiceType}
                                  onChange={(e) => setEditServiceType(e.target.value)}
                                  className="w-full bg-black border border-[#78c8ff]/30 rounded-lg px-3 py-2 text-sm text-white focus:border-[#78c8ff] outline-none"
                                  placeholder="e.g. Premium Flake System"
                                />
                              </div>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Total Amount</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2 text-white/40 text-sm">$</span>
                                    <input
                                      type="number"
                                      value={editAmount}
                                      onChange={(e) => setEditAmount(e.target.value)}
                                      className="w-full bg-black border border-[#78c8ff]/30 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:border-[#78c8ff] outline-none"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                                <div className="w-24">
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Deposit %</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="10"
                                      max="100"
                                      value={editDepositPct}
                                      onChange={(e) => setEditDepositPct(e.target.value)}
                                      className="w-full bg-black border border-[#78c8ff]/30 rounded-lg px-3 py-2 text-sm text-white focus:border-[#78c8ff] outline-none"
                                    />
                                    <span className="absolute right-3 top-2 text-white/40 text-sm">%</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Contract Terms</label>
                                <textarea
                                  value={editLegalTerms}
                                  onChange={(e) => setEditLegalTerms(e.target.value)}
                                  rows={4}
                                  className="w-full bg-black border border-[#78c8ff]/30 rounded-lg px-3 py-2 text-xs text-white/80 focus:border-[#78c8ff] outline-none resize-none leading-relaxed"
                                  placeholder="One term per line..."
                                />
                                <p className="text-[9px] text-white/30 mt-1">One term per line. These appear on the client's contract.</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  disabled={savingQuote}
                                  onClick={async () => {
                                    setSavingQuote(true);
                                    const updatedConfig = { 
                                      ...q.config, 
                                      service_type: editServiceType,
                                      deposit_pct: Number(editDepositPct),
                                      legal_terms: editLegalTerms
                                    };
                                    const { error } = await supabase
                                      .from('quotes')
                                      .update({ total_amount: Number(editAmount), config: updatedConfig })
                                      .eq('id', q.id);

                                    if (error) {
                                      setSavingQuote(false);
                                      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
                                      return;
                                    }

                                    // If resendMode, also email the client
                                    if (resendMode && q.client_email) {
                                      try {
                                        const brandName = q.config?.brand_name || 'Your Contractor';
                                        const logoUrl = q.config?.logo_url || '';
                                        await fetch('/api/send-email', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            to: q.client_email,
                                            cc: q.installer_email,
                                            subject: `Updated Proposal from ${brandName}`,
                                            html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.05);">
<tr><td style="padding:40px 40px 20px;text-align:center;">
${logoUrl ? '<img src="'+logoUrl+'" alt="'+brandName+'" style="max-height:60px;border-radius:8px;margin-bottom:20px;"/>' : ''}
<h1 style="margin:0;font-size:24px;color:#111827;">Updated Proposal</h1>
</td></tr>
<tr><td style="padding:0 40px 20px;">
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;text-align:center;">
<p style="margin:0;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Revised Total</p>
<p style="margin:8px 0 0;font-size:32px;font-weight:700;color:#3b82f6;">$${Number(editAmount).toLocaleString()}</p>
<p style="margin:8px 0 0;font-size:14px;color:#94a3b8;">${editServiceType || 'Premium System'}</p>
</div>
</td></tr>
<tr><td style="padding:0 40px 30px;">
<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#334155;">Hello${q.client?.first_name ? ' ' + q.client.first_name : ''},<br><br>Your proposal has been updated with revised terms. Please review the changes and sign at your convenience.</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-top:20px;">
<a href="https://www.resinacademics.com/quote-live/${q.id}" style="display:inline-block;padding:14px 32px;background:#111827;color:#fff;font-size:16px;font-weight:600;text-decoration:none;border-radius:6px;">View Updated Proposal</a>
</td></tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`
                                          })
                                        });
                                        toast({ title: 'Saved & Resent', description: `Updated proposal emailed to client.` });
                                      } catch {
                                        toast({ title: 'Saved but email failed', description: 'Quote updated, but the notification email could not be sent.', variant: 'destructive' });
                                      }
                                    } else {
                                      toast({ title: 'Quote Updated', description: 'Amount and service type saved.' });
                                    }

                                    setSavingQuote(false);
                                    setEditingQuoteId(null);
                                    setResendMode(false);
                                    fetchLinkedQuotes();
                                  }}
                                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                                    resendMode
                                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                      : 'bg-[#78c8ff] hover:bg-[#78c8ff]/80 text-black'
                                  }`}
                                >
                                  {resendMode ? <Send size={13} /> : <Save size={13} />}
                                  {savingQuote ? 'Saving...' : resendMode ? 'Save & Resend' : 'Save Only'}
                                </button>
                                <button
                                  onClick={() => { setEditingQuoteId(null); setResendMode(false); }}
                                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white/50 border border-white/10 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Quick Status Change */}
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Change Quote Status</label>
                                <select
                                  value={q.status || 'Draft'}
                                  onChange={(e) => handleQuoteStatusChange(q.id, e.target.value)}
                                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#78c8ff] outline-none"
                                >
                                  <option value="Draft">Draft</option>
                                  <option value="Sent">Sent</option>
                                  <option value="Opened">Opened</option>
                                  <option value="Quoted">Quoted</option>
                                  <option value="Won">Won / Deposit Paid</option>
                                  <option value="Paid In Full">Paid In Full</option>
                                </select>
                              </div>

                              {/* Manual Cash Payment Button */}
                              {(!q.config?.milestones_paid || q.config?.milestones_paid < (q.config?.payment_schedule?.milestones?.length || 2)) && (
                                <button
                                  onClick={() => handleManualPayment(q)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-lg transition-colors"
                                >
                                  <Banknote size={16} /> Mark Next Payment Paid (Cash/Check)
                                </button>
                              )}

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2">
                                {/* Edit & Resend — only for unsigned quotes */}
                                {!q.config?.signed_at && ['Sent', 'Opened', 'Quoted'].includes(q.status) && (
                                  <button
                                    onClick={() => {
                                      setEditingQuoteId(q.id);
                                      setEditAmount(q.total_amount?.toString() || '');
                                      setEditServiceType(q.config?.service_type || '');
                                      setEditDepositPct(q.config?.deposit_pct?.toString() || '50');
                                      setEditLegalTerms(q.config?.legal_terms || '');
                                      setResendMode(true);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-sm font-bold text-emerald-400 border border-emerald-500/20 transition-colors"
                                  >
                                    <Send size={14} /> Edit & Resend Updated Proposal
                                  </button>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingQuoteId(q.id);
                                      setEditAmount(q.total_amount?.toString() || '');
                                      setEditServiceType(q.config?.service_type || '');
                                      setEditDepositPct(q.config?.deposit_pct?.toString() || '50');
                                      setEditLegalTerms(q.config?.legal_terms || '');
                                      setResendMode(false);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#78c8ff]/10 hover:bg-[#78c8ff]/20 rounded-lg text-xs font-bold text-[#78c8ff] border border-[#78c8ff]/20 transition-colors"
                                  >
                                    <Pencil size={13} /> Edit
                                  </button>
                                  <a
                                    href={`/quote-live/${q.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/5 hover:bg-blue-500/10 rounded-lg text-xs font-bold text-white/70 border border-white/10 transition-colors"
                                  >
                                    <ExternalLink size={13} /> View
                                  </a>
                                  <button
                                    onClick={() => copyQuoteLink(q.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/5 hover:bg-blue-500/10 rounded-lg text-xs font-bold text-white/70 border border-white/10 transition-colors"
                                  >
                                    <Copy size={13} /> Link
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuote(q.id)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs font-bold text-red-400 border border-red-500/10 transition-colors"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Signed Contract Indicator */}
                          {q.config?.signed_at && (
                            <div className="flex items-center gap-2 text-xs text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/10 rounded-lg px-3 py-2">
                              <span>✅ Contract signed on {new Date(q.config.signed_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="pt-8 flex flex-col gap-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                <Save size={18} /> {isSaving ? "Saving..." : "Save Profile Changes"}
              </button>

              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-700 transition-colors text-sm shadow-lg"
              >
                <Trash2 size={16} /> {isDeleting ? "Deleting..." : "⚠️ Permanently Delete Lead"}
              </button>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
