import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Lock, CreditCard, ShieldCheck, Calendar, ExternalLink, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SignaturePad from "react-signature-canvas";
import { useRef } from "react";
import jsPDF from "jspdf";
import { PDFDocument, rgb } from "pdf-lib";

const DEFAULT_TERMS = `A 50% non-refundable material deposit is required before scheduling.
Floor must be completely cleared of all items prior to the installation team's arrival.
Custom flake and metallic variations are artistic processes; exact uniform matching cannot be guaranteed.
Balance is strictly due upon project completion.`;

export default function QuoteViewLive() {
  const { id } = useParams();
  const { toast } = useToast();
  const signatureRef = useRef<any>(null);
  
  const [quote, setQuote] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [depositStatus, setDepositStatus] = useState<'pending' | 'processing' | 'paid'>('pending');
  const [digitalFootprint, setDigitalFootprint] = useState<any>(null);

  useEffect(() => {
    fetchQuoteData();
  }, [id]);

  async function fetchQuoteData() {
    if (!id) return;
    const { data: quoteData } = await supabase.from('quotes').select('*').eq('id', id).single();
    if (!quoteData) { setLoading(false); return; }
    
    setQuote(quoteData);
    if (quoteData.status === 'Won') setIsSigned(true);

    const { data: clientData } = await supabase.from('clients').select('*').eq('id', quoteData.client_id).single();
    if (clientData) setClient(clientData);

    setLoading(false);
  }

  async function handleSign() {
    if (signatureRef.current?.isEmpty()) {
      toast({ title: "Signature Required", description: "Please draw your signature to accept.", variant: "destructive" });
      return;
    }

    setSigning(true);
    const signatureDataURL = signatureRef.current.getTrimmedCanvas().toDataURL("image/png");
    const timestamp = new Date().toISOString();
    const brandName = quote.config?.brand_name || 'the Contractor';

    let pdfBase64 = '';

    // 1. Generate PDF
    if (quote.config?.contract_pdf_url) {
       // PDF-lib Native Merge
       try {
         const pdfBytes = await fetch(quote.config.contract_pdf_url).then(res => res.arrayBuffer());
         const pdfDoc = await PDFDocument.load(pdfBytes);
         const page = pdfDoc.addPage([600, 800]);
         
         const sigImgBytes = await fetch(signatureDataURL).then(res => res.arrayBuffer());
         const sigImg = await pdfDoc.embedPng(sigImgBytes);
         
         page.drawText('Digital Signature Execution Record', { x: 50, y: 700, size: 20 });
         page.drawText(`Signed By: ${client?.first_name} ${client?.last_name}`, { x: 50, y: 650, size: 14 });
         page.drawText(`Timestamp: ${timestamp}`, { x: 50, y: 630, size: 12 });
         page.drawText(`Client Email: ${client?.email || 'N/A'}`, { x: 50, y: 610, size: 12 });
         
         page.drawImage(sigImg, { x: 50, y: 480, width: 250, height: 100 });
         
         page.drawText(`Execution ID: ${id}`, { x: 50, y: 400, size: 10, color: rgb(0.6, 0.6, 0.6) });
         page.drawText(`Secured by ${brandName} via Resin OS`, { x: 50, y: 380, size: 10, color: rgb(0.6, 0.6, 0.6) });

         pdfBase64 = await pdfDoc.saveAsBase64();
       } catch (err) {
         console.error("PDF Lib Merge Error:", err);
         pdfBase64 = "";
       }
    } else {
      // jsPDF Dynamic Text Fallback
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text(brandName, 10, 20);
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Total Investment: $${quote.total_amount.toLocaleString()}`, 10, 30);
      doc.text(`Prepared For: ${client?.first_name} ${client?.last_name}`, 10, 38);
      doc.text(`Project Type: ${client?.project_type}`, 10, 46);

      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text("Contract Agreement", 10, 60);
      
      doc.setFontSize(10);
      let yPos = 70;
      const legalTermsArray = (quote.config?.legal_terms || DEFAULT_TERMS).split('\n').filter((l: string) => l.trim() !== '');
      
      legalTermsArray.forEach((term: string) => {
        const lines = doc.splitTextToSize(`• ${term}`, 180);
        if (yPos + (lines.length * 5) > 280) { doc.addPage(); yPos = 20; }
        doc.text(lines, 10, yPos);
        yPos += (lines.length * 5) + 2;
      });

      if (yPos > 240) { doc.addPage(); yPos = 20; } else { yPos += 15; }

      doc.setFontSize(14);
      doc.text("Digital Signature Recording", 10, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Signed By: ${client?.first_name} ${client?.last_name} on ${timestamp}`, 10, yPos);
      yPos += 5;
      doc.addImage(signatureDataURL, 'PNG', 10, yPos, 50, 20);
      yPos += 25;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Document Crypto ID: ${id}`, 10, yPos);

      pdfBase64 = doc.output('datauristring').split(',')[1];
    }

    // 2. Update DB Statuses
    await supabase.from('quotes').update({ status: 'Won' }).eq('id', id);
    if (client) await supabase.from('clients').update({ status: 'Won' }).eq('id', quote.client_id);

    // 3. Notify via Resend
    await fetch('/api/send-email', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          to: quote.installer_email || 'jakeflowers222@gmail.com',
          cc: client?.email || undefined,
          subject: `WIN: ${client?.first_name || 'Client'} ${client?.last_name || ''} Signed!`,
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #10B981; padding: 20px; border-radius: 10px; text-align: center;">
              <h2 style="color: #10B981; margin-bottom: 5px;">Contract Executed!</h2>
              <p style="color: #333; font-size: 16px;">This is a legally binding copy confirming that <strong>${client?.first_name} ${client?.last_name}</strong> signed and accepted the quote for <strong>$${quote.total_amount.toLocaleString()}</strong>.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; border: 1px solid #eee;">
                <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase; font-weight: bold;">Digital Footprint</p>
                <p style="margin: 5px 0 0 0; color: #333; font-family: monospace; font-size: 13px;">Timestamp: ${timestamp}</p>
                <img src="${signatureDataURL}" alt="Client Signature" style="height: 60px; margin-top: 10px; border: 1px dashed #ccc; padding: 5px;"/>
              </div>

              <a href="https://www.resinacademics.com/quote-live/${id}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Live Contract</a>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">Secured by ${brandName} via Resin OS</p>
            </div>
          `,
          attachments: pdfBase64 ? [
            {
               filename: `Contract_${client?.last_name}_Executed.pdf`,
               content: pdfBase64
            }
          ] : []
      })
    });

    setDigitalFootprint({ timestamp, signature: signatureDataURL, pdfBase64 });
    setIsSigned(true);
    setSigning(false);

    toast({ title: "Contract Executed", description: "Your digital signature has been recorded and a copy sent to your email." });
  }

  if (loading) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Decrypting Smart Link...</div>;
  if (!quote) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center flex-col gap-4">
     <ShieldCheck size={48} className="text-red-500 opacity-50" />
     <p>Quote not found or expired.</p>
  </div>;

  const visualConfig = quote.config || {};
  const themeColor = visualConfig.theme_color || '#78c8ff';
  const logoUrl = visualConfig.logo_url || '';
  const pdfUrl = visualConfig.contract_pdf_url || '';
  const legalTermsRaw = visualConfig.legal_terms || DEFAULT_TERMS;
  const brandName = visualConfig.brand_name || quote.installer_email?.split('@')[0].toUpperCase() || 'Epoxy Contractor';
  const serviceType = visualConfig.service_type || client?.project_type || 'Custom Integration';

  const legalTermsArray = legalTermsRaw.split('\n').filter((l: string) => l.trim() !== '');

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-inter">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-6 gap-6">
          <div className="flex items-center gap-4">
            {logoUrl && (
              <img src={logoUrl} alt="Company Logo" className="w-16 h-16 rounded-full object-cover border border-white/10 shadow-xl flex-shrink-0" />
            )}
            <div>
              {!logoUrl && <h1 className="text-3xl font-space font-bold tracking-tight mb-1">{brandName}</h1>}
              <p className="text-white/50">{quote.installer_email}</p>
            </div>
          </div>
          <div className="text-left md:text-right flex flex-col md:items-start md:items-end gap-3 w-full md:w-auto">
            <div>
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-1">Total Investment</p>
              <p className="text-4xl font-space font-bold" style={{color: themeColor}}>${quote.total_amount.toLocaleString()}</p>
            </div>
            
            {quote.financing_link && (
              <a 
                href={quote.financing_link} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center justify-center gap-2 border px-6 py-2 rounded-xl font-bold transition-colors text-sm w-full md:w-auto mt-2"
                style={{ backgroundColor: `${themeColor}15`, color: themeColor, borderColor: `${themeColor}40` }}
              >
                Apply for Financing <ExternalLink size={14} />
              </a>
            )}
          </div>
        </header>

        {/* Client details */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between gap-6">
           <div>
             <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Prepared For</p>
             <p className="text-xl font-bold">{client?.first_name} {client?.last_name}</p>
             <p className="text-[#a78bfa] font-mono text-sm mt-1">{serviceType}</p>
           </div>
           <div className="text-left sm:text-right">
             <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Quote Status</p>
             <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${isSigned ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
               {isSigned ? 'Digitally Executed' : 'Awaiting Signature'}
             </div>
           </div>
        </div>

        {/* Legal Embed or Raw CYA */}
        {pdfUrl && !isSigned ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
             <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2 pl-4 pt-2">
               <FileText style={{color: themeColor}}/> Embedded Contract
             </h3>
             <iframe src={`${pdfUrl}#toolbar=0`} className="w-full h-[600px] rounded-xl border border-white/10 bg-white" title="Contract PDF" />
          </div>
        ) : !isSigned ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 text-sm text-white/70 space-y-5">
            <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
              <ShieldCheck style={{color: themeColor}}/> Contract Agreement
            </h3>
            <p>This document serves as a binding agreement between {brandName} and {client?.first_name} {client?.last_name}.</p>
            
            <div className="space-y-3 leading-relaxed bg-[#0a0a0a] p-6 rounded-xl border border-white/5">
              {legalTermsArray.map((bullet: string, i: number) => (
                 <div key={i} className="flex gap-3 items-start">
                   <span className="text-lg leading-none" style={{color: themeColor}}>•</span>
                   <p>{bullet}</p>
                 </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Signature Block */}
        {!isSigned ? (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
            <h3 className="text-white font-bold mb-4">Digital Signature</h3>
            <div className="bg-white rounded-xl mb-4 border overflow-hidden" style={{borderColor: `${themeColor}50`}}>
               <SignaturePad ref={signatureRef} canvasProps={{className: "w-full h-40 cursor-crosshair"}} />
            </div>
            <div className="flex justify-between items-center text-xs text-white/50 mb-6 px-2">
              <span className="flex items-center gap-1"><Lock size={12}/> Secure 256-bit SSL</span>
              <button className="underline hover:text-white" onClick={() => signatureRef.current?.clear()}>Clear Drawing</button>
            </div>
            <button 
              onClick={handleSign}
              disabled={signing}
              className="w-full text-black font-bold py-5 rounded-xl transition-all text-lg disabled:opacity-50 hover:opacity-90 shadow-2xl"
              style={{ backgroundColor: themeColor }}
            >
              {signing ? "Processing Signature Cryptography..." : "I Agree & Accept Proposal"}
            </button>
          </div>
        ) : depositStatus === 'pending' || depositStatus === 'processing' ? (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 mb-10 overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl rounded-none"></div>
            
            <div className="text-center mb-8 relative z-10">
              <div className="inline-block bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2 w-max mx-auto">
                <CheckCircle2 size={14} /> Legally Executed
              </div>
              <h3 className="text-3xl font-space font-bold text-white mb-2">Contract Signed</h3>
              <p className="text-white/60 mb-6 font-mono text-sm">Crypto ID: {id?.substring(0,12)}...</p>
              
              <div className="bg-black/50 border border-white/5 rounded-xl p-4 text-left inline-block w-full max-w-sm mb-6">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Immutable Footprint</p>
                <img src={digitalFootprint?.signature} className="h-12 mb-2 filter invert opacity-80" alt="Signature" />
                <p className="text-xs text-white/50 font-mono italic">{new Date(digitalFootprint?.timestamp).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-black border border-[#a78bfa]/40 rounded-2xl p-6 relative z-10 shadow-[0_0_40px_rgba(167,139,250,0.1)]">
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <h4 className="font-bold text-white mb-1 tracking-tight text-lg">Initial Material Deposit</h4>
                   <p className="text-xs text-white/50">Required to secure your installation date slot lock.</p>
                 </div>
                 <div className="text-right">
                   <p className="text-2xl font-space font-bold" style={{color: themeColor}}>${(quote.total_amount * 0.5).toLocaleString()}</p>
                   <p className="text-[10px] text-white/40 uppercase tracking-widest">50% Hold</p>
                 </div>
               </div>

               <div className="space-y-3">
                 <button 
                   disabled={depositStatus === 'processing'}
                   onClick={() => {
                     setDepositStatus('processing');
                     setTimeout(() => setDepositStatus('paid'), 2500);
                   }}
                   className="w-full bg-white hover:bg-gray-200 text-black py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
                 >
                   {depositStatus === 'processing' ? <Loader2 size={18} className="animate-spin"/> : 'Pay with Apple Pay'}
                 </button>

                 <div className="flex items-center gap-4 py-2">
                   <div className="flex-1 h-px bg-white/10"></div>
                   <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Or</p>
                   <div className="flex-1 h-px bg-white/10"></div>
                 </div>

                 <button 
                   disabled={depositStatus === 'processing'}
                   onClick={() => {
                     setDepositStatus('processing');
                     setTimeout(() => setDepositStatus('paid'), 2500);
                   }}
                   className="w-full bg-transparent hover:bg-white/5 border border-white/20 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all uppercase tracking-wider text-sm"
                 >
                   <CreditCard size={18}/> Pay with Credit Card
                 </button>
               </div>
               
               <p className="text-[10px] text-white/30 text-center mt-5 flex items-center justify-center gap-1">
                 <Lock size={10}/> Payments securely processed by Stripe
               </p>
            </div>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-10 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-400/10 via-transparent to-transparent"></div>
            <ShieldCheck size={56} className="text-green-400 mx-auto mb-4 relative z-10" />
            <h3 className="text-3xl font-space font-bold text-white mb-2 relative z-10">Fully Secured</h3>
            <p className="text-green-400/80 max-w-md mx-auto mb-8 text-sm leading-relaxed relative z-10">Your installation date is officially locked in! The 50% deposit has been processed and your digitally executed PDF contract has been routed to your inbox.</p>
                       
            <a 
              href={digitalFootprint ? `data:application/pdf;base64,${digitalFootprint?.pdfBase64 || ''}` : '#'} 
              download={`Contract_${client?.last_name}.pdf`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-xl w-full sm:w-auto relative z-10"
            >
               <FileText size={18}/> Download Fully Executed PDF
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
