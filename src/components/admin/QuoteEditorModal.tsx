import { useState, useEffect } from "react";
import { X, Send, Save, Loader2, Eye, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";
const SCHEDULE_PRESETS: Record<string, { name: string; emoji: string; desc: string; milestones: { label: string; pct: number }[] }> = {
  '50_50': { name: '50 / 50', emoji: '⚖️', desc: '50% deposit, balance on completion', milestones: [{ label: 'Material Deposit', pct: 50 }, { label: 'Balance Due on Completion', pct: 50 }] },
  '100_upfront': { name: '100% Upfront', emoji: '💰', desc: 'Full payment before work begins', milestones: [{ label: 'Full Payment Before Start', pct: 100 }] },
  'staggered': { name: '20 / 40 / 40', emoji: '📊', desc: '20% deposit, 40% at start, 40% on completion', milestones: [{ label: 'Booking Deposit', pct: 20 }, { label: 'Due When Work Begins', pct: 40 }, { label: 'Balance Due on Completion', pct: 40 }] },
  'custom': { name: 'Custom', emoji: '✏️', desc: 'Build your own payment milestones', milestones: [{ label: 'Deposit', pct: 30 }, { label: 'Mid-Project', pct: 30 }, { label: 'Final Balance', pct: 40 }] },
};

export default function QuoteEditorModal({ quote, onClose, onUpdate }: any) {
  const { toast } = useToast();
  const [serviceType, setServiceType] = useState(quote?.config?.service_type || "");
  const [amount, setAmount] = useState(quote?.total_amount?.toString() || "");
  
  // Payment Schedule State
  const initialScheduleType = SCHEDULE_PRESETS[quote?.config?.payment_schedule?.type] ? quote.config.payment_schedule.type : '50_50';
  const [scheduleType, setScheduleType] = useState(initialScheduleType);
  const activeMilestones = quote?.config?.payment_schedule?.milestones || SCHEDULE_PRESETS[initialScheduleType]?.milestones || SCHEDULE_PRESETS['50_50'].milestones;
  const [customMilestones, setCustomMilestones] = useState<{label: string, pct: number}[]>(
    initialScheduleType === 'custom' ? activeMilestones : SCHEDULE_PRESETS['custom'].milestones
  );

  const [legalTerms, setLegalTerms] = useState(quote?.config?.legal_terms || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // For forcing iframe refresh
  const [refreshKey, setRefreshKey] = useState(0);

  if (!quote) return null;

  async function handleSave(resendMode: boolean) {
    if (resendMode) setIsResending(true);
    else setIsSaving(true);

    try {
      const selectedMilestones = scheduleType === 'custom' ? customMilestones : (SCHEDULE_PRESETS[scheduleType]?.milestones || SCHEDULE_PRESETS['50_50'].milestones);
      const updatedConfig = {
        ...quote.config,
        service_type: serviceType,
        deposit_pct: selectedMilestones[0]?.pct || 50,
        payment_schedule: {
          type: scheduleType,
          milestones: selectedMilestones
        },
        legal_terms: legalTerms
      };

      const { error } = await supabase
        .from('quotes')
        .update({ total_amount: Number(amount), config: updatedConfig })
        .eq('id', quote.id);

      if (error) throw error;

      // Force iframe to reload to show changes
      setRefreshKey(prev => prev + 1);

      if (resendMode && quote.client_email) {
        const brandName = quote.config?.brand_name || 'Your Contractor';
        const logoUrl = quote.config?.logo_url || '';
        const bodyText = `Hello${quote.client?.first_name ? ' ' + quote.client.first_name : ''},<br><br>Your proposal has been updated with revised terms at your request. Please review the changes and sign at your convenience.`;
        
        const res = await fetch('/api/send-email', {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: quote.client_email,
            cc: quote.installer_email,
            subject: `Updated Proposal from ${brandName}`,
            html: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              ${logoUrl ? '<img src="' + logoUrl + '" alt="' + brandName + '" style="max-height: 60px; border-radius: 8px; margin-bottom: 20px;" />' : ''}
              <h1 style="margin: 0; font-size: 24px; color: #111827; letter-spacing: -0.5px;">Official Proposal Updated</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center;">
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Revised Project Total</p>
                <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 700; color: #3b82f6;">$${Number(amount).toLocaleString()}</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8;">${serviceType || 'Premium System'}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #334155;">
                ${bodyText}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <a href="https://www.resinacademics.com/quote-live/${quote.id}" style="display: inline-block; padding: 14px 32px; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">View Updated Proposal</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
          })
        });

        if (res.ok) {
          toast({ title: "Saved & Resent", description: "Updated proposal emailed to client." });
        } else {
          toast({ title: "Saved but email failed", description: "Quote updated, but notification email failed.", variant: "destructive" });
        }
      } else {
        toast({ title: "Quote Updated", description: "Changes saved. The preview has been updated." });
      }

      onUpdate();
      if (resendMode) onClose();

    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update quote.", variant: "destructive" });
    }

    setIsSaving(false);
    setIsResending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f0f0f] w-full max-w-6xl h-full max-h-[90vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Editor */}
        <div className="w-full md:w-[400px] bg-[#111] border-r border-white/10 flex flex-col h-full shrink-0">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
            <div>
              <h2 className="text-xl font-space font-bold text-white">Edit Proposal</h2>
              <p className="text-white/50 text-xs">Modifying quote for {quote.client?.first_name}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-white/50 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Service Type</label>
              <input
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#78c8ff] outline-none transition"
                placeholder="e.g. Premium Flake System"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Total Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-white/40">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:border-[#78c8ff] outline-none transition"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Payment Terms</label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#78c8ff] outline-none transition appearance-none"
                >
                  <option value="custom">Custom Schedule</option>
                  {Object.entries(SCHEDULE_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>{preset.name} ({preset.desc})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visual payment breakdown preview */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#78c8ff]"></div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Payment Breakdown</p>
              </div>
              <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
                {(scheduleType === 'custom' ? customMilestones : (SCHEDULE_PRESETS[scheduleType]?.milestones || SCHEDULE_PRESETS['50_50'].milestones)).map((m, i) => {
                  const colors = ['#78c8ff', '#a78bfa', '#34d399', '#fbbf24'];
                  return <div key={i} style={{ width: `${m.pct}%`, backgroundColor: colors[i % colors.length] }} className="rounded-full transition-all" />;
                })}
              </div>
              <div className="space-y-2">
                {(scheduleType === 'custom' ? customMilestones : (SCHEDULE_PRESETS[scheduleType]?.milestones || SCHEDULE_PRESETS['50_50'].milestones)).map((m, i) => {
                  const colors = ['#78c8ff', '#a78bfa', '#34d399', '#fbbf24'];
                  const val = Number(amount) * (m.pct / 100);
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }}></div>
                        {scheduleType === 'custom' ? (
                          <input
                            value={m.label}
                            onChange={(e) => {
                              const updated = [...customMilestones];
                              updated[i] = { ...updated[i], label: e.target.value };
                              setCustomMilestones(updated);
                            }}
                            className="bg-transparent border-b border-white/10 text-white/80 text-xs focus:outline-none focus:border-[#78c8ff] w-36 py-0.5"
                          />
                        ) : (
                          <span className="text-white/60">{m.label}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {scheduleType === 'custom' ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1" max="100"
                              value={m.pct}
                              onChange={(e) => {
                                const updated = [...customMilestones];
                                updated[i] = { ...updated[i], pct: Number(e.target.value) };
                                setCustomMilestones(updated);
                              }}
                              className="w-12 bg-transparent border-b border-white/10 text-white text-xs text-right focus:outline-none focus:border-[#78c8ff] py-0.5"
                            />
                            <span className="text-white/30">%</span>
                          </div>
                        ) : (
                          <span className="text-white/40">{m.pct}%</span>
                        )}
                        <span className="font-mono font-bold text-white">${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {scheduleType === 'custom' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setCustomMilestones([...customMilestones, { label: 'New Milestone', pct: 10 }])}
                    className="text-[10px] bg-white/5 hover:bg-white/10 text-white/50 px-3 py-1.5 rounded-lg border border-white/10 transition-colors font-bold"
                  >
                    + Add Milestone
                  </button>
                  {customMilestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCustomMilestones(customMilestones.slice(0, -1))}
                      className="text-[10px] bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-500/30 transition-colors font-bold ml-auto"
                    >
                      - Remove Last
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Contract Terms</label>
              <textarea
                value={legalTerms}
                onChange={(e) => setLegalTerms(e.target.value)}
                rows={8}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#78c8ff] outline-none transition resize-none"
                placeholder="One term per line..."
              />
              <p className="text-[10px] text-white/30 mt-2 leading-relaxed">
                Enter each legal term on a new line. These will be added to the digital footprint contract and affect the client's signature.
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-white/10 bg-black/40 space-y-3">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving || isResending}
              className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-bold transition disabled:opacity-50 border border-white/5"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? "Saving..." : "Save & Refresh Preview"}
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={isSaving || isResending}
              className="w-full flex items-center justify-center gap-2 bg-[#78c8ff] hover:bg-white text-black py-4 rounded-xl font-bold transition shadow-lg disabled:opacity-50"
            >
              {isResending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isResending ? "Processing..." : "Resend Updated Quote"}
            </button>
          </div>
        </div>

        {/* Right Side: Live iframe preview */}
        <div className="hidden md:flex flex-1 bg-black flex-col relative items-center justify-center">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
             <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 text-xs font-mono text-white/70">
                <Eye size={14} className="text-[#78c8ff]" /> LIVE PREVIEW
             </div>
             <button onClick={() => setRefreshKey(k=>k+1)} className="bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 text-white/70 hover:text-white transition">
                <RefreshCw size={14} />
             </button>
          </div>
          
          <iframe 
            key={refreshKey}
            src={`https://www.resinacademics.com/quote-live/${quote.id}`} 
            className="w-full h-full bg-white rounded-r-2xl"
            title="Quote Preview"
          />
        </div>
      </div>
    </div>
  );
}
