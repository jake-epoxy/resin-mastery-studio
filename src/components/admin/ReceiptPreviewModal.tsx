import { useState, useEffect, useMemo } from "react";
import { X, Send, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";

export default function ReceiptPreviewModal({ quote, client, onClose, onSuccess }: any) {
  const { toast } = useToast();
  
  const brandName = quote?.config?.brand_name || quote?.installer_email?.split('@')[0].toUpperCase() || 'us';
  const logoUrl = quote?.config?.logo_url || '';
  
  const isFull = quote?.status === 'Paid In Full';
  
  // Smart logic for amount: If Paid In Full, assume they are receipting the *remaining balance* (e.g. 50% left) 
  // rather than the full invoice amount, assuming the deposit was already receipted.
  // The user can edit this field anyway.
  const defaultDepositPct = quote?.config?.deposit_pct || 50;
  const depositAmount = quote?.total_amount * (defaultDepositPct / 100);
  const remainingAmount = quote?.total_amount - depositAmount;
  
  const initialAmount = isFull ? remainingAmount : depositAmount;
  const initialTotalText = isFull ? 'Remaining Balance Paid' : 'Deposit Paid';

  const [subject, setSubject] = useState(`Official Receipt from ${brandName}`);
  const [headerTitle, setHeaderTitle] = useState('Payment Receipt');
  const [totalText, setTotalText] = useState(initialTotalText);
  const [amountValue, setAmountValue] = useState(initialAmount.toString());
  
  // Godmode Overrides
  const [contractorName, setContractorName] = useState(brandName);
  const [contractorEmail, setContractorEmail] = useState(quote?.installer_email || '');
  const [clientName, setClientName] = useState(`${client?.first_name || ''} ${client?.last_name || ''}`.trim());
  const [clientEmail, setClientEmail] = useState(client?.email || '');
  const [projectType, setProjectType] = useState(quote?.config?.service_type || 'Premium System');

  // Hoist the serial number generation so we can display it in the preview
  const receiptSerial = useMemo(() => {
    const shortId = quote?.id ? quote.id.split('-')[0].toUpperCase() : Math.random().toString(36).substr(2, 6).toUpperCase();
    return `RCPT-${shortId}-${Date.now().toString().slice(-6)}`;
  }, [quote?.id]);

  const [bodyText, setBodyText] = useState(`Hello ${client?.first_name || 'there'},\n\nThis email serves as an official receipt for your recent payment. Thank you for your business!`);
  const [btnText, setBtnText] = useState('View Contract & Details');
  
  const [isSending, setIsSending] = useState(false);

  if (!quote) return null;

  async function handleSend() {
    setIsSending(true);
    try {
      const timestampStr = new Date().toLocaleString();

      // 2. Generate PDF
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("OFFICIAL PAYMENT RECEIPT", 10, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Receipt #: ${receiptSerial}`, 10, 30);
      doc.text(`Date: ${timestampStr}`, 10, 38);
      
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text("Contractor Information", 10, 52);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Company: ${contractorName}`, 10, 60);
      doc.text(`Email: ${contractorEmail || 'N/A'}`, 10, 66);
      
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text("Client Information", 10, 80);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Name: ${clientName}`, 10, 88);
      doc.text(`Email: ${clientEmail || 'N/A'}`, 10, 94);
      
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text("Payment Details", 10, 108);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Project Type: ${projectType}`, 10, 116);
      doc.text(`Total Project Value: $${(quote.total_amount || 0).toLocaleString()}`, 10, 122);
      doc.text(`Payment Status: ${isFull ? 'Paid In Full' : 'Deposit Paid'}`, 10, 128);
      
      doc.setTextColor(0);
      doc.setFontSize(16);
      doc.text(`${totalText}: $${Number(amountValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 10, 142);
      
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`This document is an official record of payment for tax and legal purposes.`, 10, 155);

      const receiptPdfBase64 = doc.output('datauristring').split(',')[1];

      // 3. Attachments
      let attachments: any[] = [];
      if (quote.config?.digital_footprint_pdf) {
        attachments.push({
          filename: `Contract_${client?.last_name || 'Executed'}.pdf`,
          content: quote.config.digital_footprint_pdf
        });
      }
      
      attachments.push({
        filename: `Receipt_${receiptSerial}.pdf`,
        content: receiptPdfBase64
      });

      // Convert newlines in bodyText to <br> for HTML email
      const formattedBody = bodyText.replace(/\n/g, '<br>');

      const res = await fetch('/api/send-email', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: client?.email,
            cc: quote.installer_email,
            subject: subject,
            attachments,
            html: `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              ${logoUrl ? '<img src="' + logoUrl + '" alt="' + contractorName + '" style="max-height: 60px; border-radius: 8px; margin-bottom: 20px;" />' : ''}
              <h1 style="margin: 0; font-size: 24px; color: #111827; letter-spacing: -0.5px;">${headerTitle}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 10px; color: #166534; font-family: monospace;">${receiptSerial}</p>
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 1px;">${totalText}</p>
                <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 700; color: #15803d;">$${Number(amountValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #166534;">${projectType}</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #166534; font-weight: 600;">Status: ${isFull ? 'Paid In Full' : 'Deposit Paid'}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #334155;">
                ${formattedBody}
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
        toast({ title: "Receipt Sent", description: `Emailed official receipt to ${client?.email}` });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast({ title: "Error sending email", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Network Error", variant: "destructive" });
    }
    setIsSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f0f0f] w-full max-w-5xl h-full max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Editor */}
        <div className="w-full md:w-[450px] bg-[#111] border-r border-white/10 flex flex-col h-full shrink-0">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
            <div>
              <h2 className="text-xl font-space font-bold text-white flex items-center gap-2"><FileText size={20} className="text-[#78c8ff]"/> Build Receipt</h2>
              <p className="text-white/50 text-xs mt-1">Review & customize before sending.</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-white/50 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Email Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Email Subject Line</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#78c8ff] outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount Value */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Amount Paid</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-white/40">$</span>
                  <input
                    type="number"
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:border-[#78c8ff] outline-none transition font-mono font-bold text-[#34d399]"
                  />
                </div>
              </div>
              
              {/* Receipt Label */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Receipt Label</label>
                <input
                  value={totalText}
                  onChange={(e) => setTotalText(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#78c8ff] outline-none transition"
                />
              </div>
            </div>

            {/* Custom Message Body */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Message Body</label>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={6}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#78c8ff] outline-none transition resize-none"
                placeholder="Type a personal note..."
              />
              <p className="text-[10px] text-white/40 mt-2 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500"/> The signed contract PDF will automatically be attached.
              </p>
            </div>

            {/* Godmode Fields */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-2">Override Ledger Info</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Contractor Name</label>
                  <input value={contractorName} onChange={(e) => setContractorName(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#78c8ff] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Contractor Email</label>
                  <input value={contractorEmail} onChange={(e) => setContractorEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#78c8ff] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Client Name</label>
                  <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#78c8ff] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Client Email</label>
                  <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#78c8ff] outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Project Type</label>
                  <input value={projectType} onChange={(e) => setProjectType(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#78c8ff] outline-none" />
                </div>
              </div>
            </div>

            {/* Total Value Summary (Reference) */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex justify-between items-center">
               <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Total Project Value:</span>
               <span className="text-blue-300 font-mono font-bold">${quote?.total_amount?.toLocaleString()}</span>
            </div>

          </div>

          <div className="p-6 border-t border-white/10 bg-black/40">
            <button
              onClick={handleSend}
              disabled={isSending || !amountValue}
              className="w-full flex items-center justify-center gap-2 bg-[#78c8ff] hover:bg-white text-black py-4 rounded-xl font-bold transition shadow-[0_0_20px_rgba(120,200,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:shadow-none"
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isSending ? "Sending..." : "Send Official Receipt"}
            </button>
          </div>
        </div>

        {/* Right Side: Live HTML Preview (Simulated Email) */}
        <div className="hidden md:flex flex-1 bg-[#e2e8f0] flex-col relative overflow-y-auto p-12 items-center">
           <div className="w-full max-w-[600px] bg-white rounded-xl shadow-xl overflow-hidden shrink-0">
             <div className="p-10 text-center">
               {logoUrl && <img src={logoUrl} alt={contractorName} className="max-h-[60px] rounded-lg mb-5 mx-auto" />}
               <h1 className="m-0 text-2xl text-[#111827] tracking-tight">{headerTitle}</h1>
             </div>
             
             <div className="px-10 pb-5">
               <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-6 text-center">
                 <p className="m-0 mb-2 text-[10px] text-[#166534] font-mono">{receiptSerial}</p>
                 <p className="m-0 text-xs font-semibold text-[#166534] uppercase tracking-wider">{totalText}</p>
                 <p className="mt-2 mb-0 text-[32px] font-bold text-[#15803d]">${Number(amountValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                 <p className="mt-2 mb-0 text-sm text-[#166534]">{projectType}</p>
                 <p className="mt-2 mb-0 text-xs font-semibold text-[#166534]">Status: {isFull ? 'Paid In Full' : 'Deposit Paid'}</p>
               </div>
             </div>

             <div className="px-10 pb-10">
               <p className="m-0 mb-4 text-base leading-relaxed text-[#334155] whitespace-pre-wrap">
                 {bodyText}
               </p>
               <div className="pt-5 text-center">
                 <div className="inline-block px-8 py-3.5 bg-[#111827] text-white font-semibold rounded-md">
                   {btnText}
                 </div>
               </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
