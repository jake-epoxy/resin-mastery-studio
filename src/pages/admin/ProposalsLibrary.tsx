import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Download, Send, CheckCircle2, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";

export default function ProposalsLibrary() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  async function fetchQuotes() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('quotes')
      .select('*, client:clients(first_name, last_name, email, phone)')
      .eq('installer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setQuotes(data);
    }
    setLoading(false);
  }

  const handleCopyLink = (id: string) => {
    navigator.clipboard.writeText(`https://www.resinacademics.com/quote-live/${id}`);
    toast({ title: "Link Copied", description: "Quote link copied to clipboard!" });
  };

  const handleResend = async (quote: any) => {
    setResendingId(quote.id);
    try {
      const isFinal = quote.status === 'Won';
      const brandName = quote.config?.brand_name || quote.installer_email?.split('@')[0].toUpperCase() || 'us';
      const logoUrl = quote.config?.logo_url || '';
      
      const subject = isFinal ? `Final Invoice from ${brandName}` : `Reminder: Your Custom Quote from ${brandName}`;
      const headerTitle = isFinal ? 'Final Balance Due' : 'Following Up On Your Quote';
      const totalText = isFinal ? 'Remaining Balance' : 'Project Total';
      const amountValue = isFinal ? (quote.total_amount * 0.5) : quote.total_amount;
      
      const bodyText = isFinal 
        ? `Hello ${quote.client?.first_name || 'there'},<br><br>Thank you so much for your business! Your installation is complete and the final balance is now due. You can securely pay the remaining balance using the original encrypted link below.`
        : `Hello ${quote.client?.first_name || 'there'},<br><br>Just floating this back to the top of your inbox. Let us know if you have any questions about the proposal!`;
        
      const btnText = isFinal ? 'View & Pay Invoice' : 'View & Sign Secure Proposal';
      
      const res = await fetch('/api/send-email', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: quote.client?.email,
            cc: quote.installer_email,
            subject: subject,
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
              <h1 style="margin: 0; font-size: 24px; color: #111827; letter-spacing: -0.5px;">${headerTitle}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center;">
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">${totalText}</p>
                <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 700; color: #3b82f6;">$${amountValue?.toLocaleString()}</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8;">${quote.config?.service_type || 'Premium System'}</p>
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
                    <a href="https://www.resinacademics.com/quote-live/${quote.id}" style="display: inline-block; padding: 14px 32px; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">${btnText}</a>
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
        toast({ title: isFinal ? "Invoice Sent" : "Reminder Sent", description: `Emailed to ${quote.client?.email}` });
      } else {
        toast({ title: "Error sending email", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Network Error", variant: "destructive" });
    }
    setResendingId(null);
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'paid in full': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'paid': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'won': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'opened': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'sent': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'; // Draft
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12 font-inter text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-space font-bold tracking-tight mb-2">Proposals Vault</h1>
            <p className="text-white/50 text-sm">Manage all sent quotes, track read receipts, and collect final payments.</p>
          </div>
          <button onClick={fetchQuotes} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-blue-500/10 transition">
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/50">
            <Loader2 className="animate-spin mr-2" /> Loading Vault...
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#111] border border-white/5 rounded-2xl">
            <FileText size={48} className="text-white/20 mb-4" />
            <p className="text-white/60">No proposals generated yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {quotes.map((quote) => (
              <div key={quote.id} className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-colors flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                
                {/* Client & Date */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">{quote.client?.first_name} {quote.client?.last_name || 'Client'}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(quote.status)}`}>
                      {quote.status || 'Draft'}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm font-mono truncate">{quote.client?.email}</p>
                  <p className="text-white/30 text-xs">Created: {new Date(quote.created_at).toLocaleDateString()}</p>
                </div>

                {/* Money & Read Receipts */}
                <div className="flex-1 lg:text-center space-y-1">
                  <p className="text-2xl font-space font-bold text-[#ffffff]">${quote.total_amount?.toLocaleString()}</p>
                  {quote.config?.opened_at && quote.status !== 'Won' && quote.status !== 'Paid In Full' && (
                    <p className="text-xs text-blue-400 font-mono tracking-tight">
                      Last Viewed: {new Date(quote.config.opened_at).toLocaleDateString()}
                    </p>
                  )}
                  {quote.status === 'Won' && (
                    <p className="text-xs text-emerald-400 font-mono tracking-tight flex items-center justify-center lg:justify-center gap-1">
                      <CheckCircle2 size={12}/> Deposit Cleared
                    </p>
                  )}
                  {(quote.status === 'Paid In Full' || quote.status === 'Paid') && (
                    <p className="text-xs text-emerald-400 font-mono tracking-tight flex items-center justify-center lg:justify-center gap-1">
                      <CheckCircle2 size={12}/> Invoice Closed
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <button onClick={() => handleCopyLink(quote.id)} className="flex-1 lg:flex-none p-3 lg:px-4 bg-white/5 hover:bg-blue-500/10 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-colors" title="Copy Smart Link">
                    <Copy size={16} className="text-white/70" />
                  </button>
                  
                  <a href={`/quote-live/${quote.id}`} target="_blank" rel="noreferrer" className="flex-1 lg:flex-none p-3 lg:px-4 bg-white/5 hover:bg-blue-500/10 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-colors" title="View Secure Document">
                    <ExternalLink size={16} className="text-[#ffffff]" />
                  </a>

                  {quote.status === 'Won' ? (
                    <>
                      <button onClick={() => handleResend(quote)} disabled={resendingId === quote.id} className="flex flex-1 lg:flex-none items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                        {resendingId === quote.id ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Invoice Balance</>}
                      </button>
                      {quote.config?.digital_footprint_pdf && (
                        <a href={`data:application/pdf;base64,${quote.config.digital_footprint_pdf}`} download={`Contract_${quote.client?.last_name || 'Executed'}.pdf`} className="flex-1 lg:flex-none p-3 lg:px-4 bg-[#ffffff]/10 hover:bg-[#ffffff]/20 text-[#ffffff] rounded-xl flex items-center justify-center gap-2 border border-[#ffffff]/30 transition-colors">
                          <Download size={16} />
                        </a>
                      )}
                    </>
                  ) : quote.status === 'Paid In Full' || quote.status === 'Paid' ? (
                    <>
                      {quote.config?.digital_footprint_pdf && (
                        <a href={`data:application/pdf;base64,${quote.config.digital_footprint_pdf}`} download={`Contract_${quote.client?.last_name || 'Executed'}.pdf`} className="flex flex-1 lg:flex-none items-center justify-center gap-2 px-8 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors">
                          <Download size={16} /> Receipt PDF
                        </a>
                      )}
                    </>
                  ) : (
                    <button onClick={() => handleResend(quote)} disabled={resendingId === quote.id} className="flex flex-1 lg:flex-none items-center justify-center gap-2 px-5 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
                      {resendingId === quote.id ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Remind</>}
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
