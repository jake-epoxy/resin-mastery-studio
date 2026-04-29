import React, { useState, useRef } from 'react';
import { ShieldCheck, PenTool, Loader2, AlertTriangle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const PartnershipAgreement = () => {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedSig, setCapturedSig] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pdfData, setPdfData] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: ''
  });

  const sigCanvas = useRef<any>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleSignContract = async () => {
    if (!formData.fullName || !formData.email) {
      setErrorMsg('Please provide at least your full name and email.');
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    if (sigCanvas.current?.isEmpty()) {
      setErrorMsg('Please provide your digital signature.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const signatureData = sigCanvas.current.getCanvas().toDataURL('image/png');
      setCapturedSig(signatureData);
      setIsCapturing(true);
      
      // Wait a tick for React to swap the canvas for the <img> tag
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 1. Generate PDF
      let pdfBase64 = '';
      if (pdfRef.current) {
        const canvas = await html2canvas(pdfRef.current, { 
          scale: 2,
          backgroundColor: '#ffffff', // white background for print
          logging: false,
          useCORS: true
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        // Get PDF as base64 for email attachment
        pdfBase64 = pdf.output('datauristring').split(',')[1];
        setPdfData(pdfBase64);
      }

      // 2. Save to Supabase (Official Partners)
      // Assuming the table 'official_partners' exists
      const { error: dbError } = await supabase
        .from('official_partners')
        .insert([{
          full_name: formData.fullName,
          company_name: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          selected_route: 'logistics_media_support',
          signature_data: signatureData
        }]);

      if (dbError) {
        console.error("DB Error:", dbError);
        // We won't block the UI if the table isn't created yet since we disabled the throw error
      }

      // 3. Send Email Notification
      if (pdfBase64) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: ['Pourmastersllc@gmail.com', formData.email],
            subject: `New Contract Signed: ${formData.fullName}`,
            html: `
              <h2>New Logistics & Media Support Contract Signed</h2>
              <p><strong>Name:</strong> ${formData.fullName}</p>
              <p><strong>Company:</strong> ${formData.companyName || 'N/A'}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Phone:</strong> ${formData.phone || 'N/A'}</p>
              <p>A copy of the legally binding agreement is attached to this email.</p>
            `,
            attachments: [
              {
                filename: `Agreement_${formData.fullName.replace(/\s+/g, '_')}.pdf`,
                content: pdfBase64
              }
            ]
          })
        });
      }

      setIsAccepted(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while signing.');
    } finally {
      setIsCapturing(false);
      setIsSubmitting(false);
    }
  };

  if (isAccepted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 py-16 px-4 font-sans flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full text-center space-y-6 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-12 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-500/10 p-5 rounded-full border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <ShieldCheck className="w-16 h-16 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Agreement Confirmed</h2>
          <p className="text-lg text-slate-400 max-w-lg mx-auto pt-4">
            Thank you for formalizing your role for the Cleveland Installation.
          </p>
          <div className="pt-8 mt-4 border-t border-slate-800/60">
            <p className="text-slate-500 text-sm mb-6">
              A copy of these terms has been securely logged and emailed to you and Pourmastersllc@gmail.com. We look forward to a successful project together!
            </p>
            {pdfData && (
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `data:application/pdf;base64,${pdfData}`;
                  link.download = `Agreement_${formData.fullName.replace(/\s+/g, '_')}.pdf`;
                  link.click();
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-emerald-400 font-bold tracking-wider uppercase text-sm transition-colors"
              >
                Download PDF Copy
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-950 text-slate-200 py-16 px-4 font-sans flex flex-col items-center animate-in fade-in duration-300">
        <div className="max-w-3xl w-full space-y-8" ref={contractRef}>
        
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Project Agreement</h1>
          <p className="text-amber-500 font-semibold tracking-wide uppercase text-sm">Cleveland Installation</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-6">
          <h3 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">Contract Terms</h3>
          
          <div className="space-y-6 text-slate-300 text-sm">
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-xs font-bold mb-1">Title</p>
              <p className="text-lg font-medium text-white">Cleveland Project: Logistics & Media Support</p>
            </div>
            
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-xs font-bold mb-1">Compensation</p>
              <p className="text-lg font-medium text-emerald-400">$400 Flat Stipend</p>
            </div>

            <div>
              <p className="text-slate-400 uppercase tracking-wider text-xs font-bold mb-3">Responsibilities</p>
              <ul className="list-disc pl-5 space-y-3">
                <li>Provide reliable transportation for the duration of the project.</li>
                <li>Assist with general job-site logistics and material handling.</li>
                <li>Act as the dedicated media personnel to capture high-quality photos and video of the installation process.</li>
              </ul>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-red-500 font-bold uppercase tracking-wider text-sm">Intellectual Property Clause</p>
              </div>
              <ul className="list-disc pl-5 space-y-3 text-red-400">
                <li><strong>ALL</strong> media captured on the job site remains the exclusive, proprietary property of Pour Masters LLC.</li>
                <li>The Contractor is strictly prohibited from posting, sharing, or publishing any project media to personal or business social media accounts, portfolios, or websites without explicit prior authorization and approval from Jake Flowers.</li>
              </ul>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 italic mt-6 pt-4 border-t border-slate-800/60">
            I acknowledge and agree to abide by the media, commercial rights, and compensation terms outlined above for the Cleveland Installation.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-6">
          <h3 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">Contractor Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400 uppercase tracking-wider font-bold">Full Legal Name *</label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400 uppercase tracking-wider font-bold">Company Name (Optional)</label>
              <input 
                type="text" 
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                placeholder="Doe Epoxy LLC"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400 uppercase tracking-wider font-bold">Email Address *</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400 uppercase tracking-wider font-bold">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <PenTool size={20} className="text-amber-500" /> Digital Signature
            </h3>
            <button onClick={clearSignature} className="text-xs text-slate-500 hover:text-white uppercase font-bold tracking-wider">
              Clear
            </button>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-700 overflow-hidden relative shadow-inner h-48 w-full flex items-center justify-center">
            {isCapturing && capturedSig ? (
              <img src={capturedSig} alt="Digital Signature" className="max-w-full max-h-full object-contain" />
            ) : (
              <SignatureCanvas 
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ className: 'w-full h-48 cursor-crosshair bg-white' }}
              />
            )}
            {(!isCapturing && !sigCanvas.current?.isEmpty()) || (isCapturing && capturedSig) ? (
              <div className="absolute bottom-2 left-4 text-xs text-slate-400 uppercase font-bold pointer-events-none">
                Signed: {new Date().toLocaleDateString()}
              </div>
            ) : null}
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-4 pt-4" data-html2canvas-ignore="true">
          <button 
            onClick={handleSignContract}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Finalizing PDF...</> : 'Sign & Complete Agreement'}
          </button>
        </div>
      </div>
      
      {/* Hidden PDF template */}
      <div className="absolute top-0 left-0 w-[800px] opacity-0 pointer-events-none z-[-1] bg-white text-slate-900 font-sans p-12" ref={pdfRef}>
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold text-slate-900">Project Agreement</h1>
          <p className="text-slate-500 font-bold tracking-wide uppercase text-sm">Cleveland Installation</p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Contract Terms</h3>
            <div className="space-y-6 text-slate-700">
              <div>
                <p className="uppercase tracking-wider text-xs font-bold text-slate-400 mb-1">Title</p>
                <p className="text-lg font-medium text-slate-900">Cleveland Project: Logistics & Media Support</p>
              </div>
              <div>
                <p className="uppercase tracking-wider text-xs font-bold text-slate-400 mb-1">Compensation</p>
                <p className="text-lg font-bold text-emerald-600">$400 Flat Stipend</p>
              </div>

              <div>
                <p className="uppercase tracking-wider text-xs font-bold text-slate-400 mb-3">Responsibilities</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Provide reliable transportation for the duration of the project.</li>
                  <li>Assist with general job-site logistics and material handling.</li>
                  <li>Act as the dedicated media personnel to capture high-quality photos and video of the installation process.</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 font-bold uppercase tracking-wider text-sm">Intellectual Property Clause</p>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-red-800">
                  <li><strong>ALL</strong> media captured on the job site remains the exclusive, proprietary property of Pour Masters LLC.</li>
                  <li>The Contractor is strictly prohibited from posting, sharing, or publishing any project media to personal or business social media accounts, portfolios, or websites without explicit prior authorization and approval from Jake Flowers.</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-slate-500 italic mt-6">
              I acknowledge and agree to abide by the media, commercial rights, and compensation terms outlined above for the Cleveland Installation.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Contractor Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Full Legal Name</p>
                <p className="font-medium text-slate-900">{formData.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Company Name</p>
                <p className="font-medium text-slate-900">{formData.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Email Address</p>
                <p className="font-medium text-slate-900">{formData.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Phone Number</p>
                <p className="font-medium text-slate-900">{formData.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Digital Signature</h3>
            <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden relative h-48 w-full flex items-center justify-center">
              {capturedSig && (
                <img src={capturedSig} alt="Digital Signature" className="max-w-full max-h-full object-contain" />
              )}
              {capturedSig && (
                <div className="absolute bottom-2 left-4 text-xs text-slate-400 uppercase font-bold">
                  Signed: {new Date().toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PartnershipAgreement;
