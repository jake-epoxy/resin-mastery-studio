import React, { useState, useRef } from 'react';
import { Check, X, ShieldCheck, PenTool, Loader2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const PartnershipAgreement = () => {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [acceptedRoute, setAcceptedRoute] = useState<string | null>(null);
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
      if (contractRef.current) {
        const canvas = await html2canvas(contractRef.current, { 
          scale: 2,
          backgroundColor: '#0f172a', // slate-900 background to match the theme
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
          selected_route: selectedRoute,
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
            subject: `New Partnership Agreement Signed: ${formData.fullName}`,
            html: `
              <h2>New Partnership Agreement Signed</h2>
              <p><strong>Name:</strong> ${formData.fullName}</p>
              <p><strong>Company:</strong> ${formData.companyName || 'N/A'}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Phone:</strong> ${formData.phone || 'N/A'}</p>
              <p><strong>Selected Route:</strong> ${selectedRoute === 'partner' ? 'Resin Academics Partner' : 'Traditional Subcontractor'}</p>
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

      setAcceptedRoute(selectedRoute);
      setSelectedRoute(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while signing.');
    } finally {
      setIsCapturing(false);
      setIsSubmitting(false);
    }
  };

  if (acceptedRoute) {
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
            You have selected the <span className="text-amber-400 font-semibold">{acceptedRoute === 'partner' ? 'Resin Academics Partner' : 'Traditional Subcontractor'}</span> route.
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

  if (selectedRoute) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 py-16 px-4 font-sans flex flex-col items-center animate-in fade-in duration-300">
        <div className="max-w-3xl w-full space-y-8" ref={contractRef}>
          
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-white">Finalize Agreement</h1>
            <p className="text-slate-400">
              You are signing as a <span className="text-amber-500 font-bold">{selectedRoute === 'partner' ? 'Resin Academics Partner' : 'Traditional Subcontractor'}</span>.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">Contract Terms</h3>
            
            {selectedRoute === 'subcontractor' ? (
              <div className="space-y-4 text-slate-300 text-sm">
                <p><strong>Route:</strong> Traditional Subcontractor</p>
                <p><strong>Compensation:</strong> $650 Flat Rate</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Base travel and assistance compensation.</li>
                  <li>Clear, defined hourly/labor expectations.</li>
                  <li className="text-red-400">NO authorization to film or photograph the project.</li>
                  <li className="text-red-400">NO rights to use the completed floor for personal or business advertising.</li>
                  <li className="text-red-400">EXCLUDED from the Resin Academics Mentorship Program.</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-4 text-slate-300 text-sm">
                <p><strong>Route:</strong> Resin Academics Partner</p>
                <p><strong>Compensation:</strong> $400 Stipend + $5,000 Mentorship Value</p>
                <ul className="list-disc pl-5 space-y-2 text-emerald-400/90">
                  <li>Base travel and assistance stipend ($400).</li>
                  <li className="font-bold text-white">FULL 1-on-1 Resin Academics Mentorship & Training Experience.</li>
                  <li>FULL authorization to document, film, and photograph the entire installation.</li>
                  <li>FULL commercial rights to advertise this premium floor in your own portfolio to secure high-paying epoxy clients.</li>
                </ul>
              </div>
            )}
            
            <p className="text-xs text-slate-500 italic mt-4">
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
              onClick={() => setSelectedRoute(null)}
              className="flex-1 py-4 rounded-xl font-bold text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              Back to Options
            </button>
            <button 
              onClick={handleSignContract}
              disabled={isSubmitting}
              className="flex-[2] py-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Finalizing PDF...</> : 'Sign & Complete Agreement'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-16 px-4 font-sans flex flex-col items-center">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Project Agreement & Role Selection: <br className="hidden md:block" />
            <span className="text-amber-500">Cleveland Installation</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto pt-2">
            Please review the two operational routes below and select your preferred involvement for this project.
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* Option 1: The Traditional Subcontractor Route */}
          <div className="relative group bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 flex flex-col transition-all duration-300 hover:bg-slate-900/60 hover:border-slate-700 hover:shadow-2xl hover:-translate-y-1">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2">The Traditional Subcontractor Route</h2>
              <p className="text-slate-400 font-medium tracking-wide uppercase text-xs">Strictly Hourly / Labor Focus</p>
              <div className="mt-8 flex items-baseline">
                <span className="text-5xl font-bold text-white">$650</span>
                <span className="text-slate-400 ml-2 font-medium">Flat Rate</span>
              </div>
            </div>

            <div className="space-y-5 flex-grow text-sm md:text-base">
              <div className="flex items-start">
                <Check className="w-6 h-6 text-emerald-500/80 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-300">Base travel and assistance compensation.</span>
              </div>
              <div className="flex items-start">
                <Check className="w-6 h-6 text-emerald-500/80 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-300">Clear, defined hourly/labor expectations.</span>
              </div>
              
              <div className="pt-6 mt-6 border-t border-slate-800/60 space-y-5">
                <div className="flex items-start">
                  <X className="w-6 h-6 text-red-500/80 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-slate-400">NO authorization to film or photograph the project.</span>
                </div>
                <div className="flex items-start">
                  <X className="w-6 h-6 text-red-500/80 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-slate-400">NO rights to use the completed floor for personal or business advertising.</span>
                </div>
                <div className="flex items-start">
                  <X className="w-6 h-6 text-red-500/80 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-slate-400">EXCLUDED from the Resin Academics Mentorship Program ($5,000 value).</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedRoute('subcontractor')}
              className="mt-10 w-full py-4 rounded-xl font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white transition-all duration-300 border border-slate-700 focus:ring-2 focus:ring-slate-600 focus:outline-none"
            >
              Select This Route
            </button>
          </div>

          {/* Option 2: The Resin Academics Partner Route */}
          <div className="relative group bg-slate-900/60 backdrop-blur-md border border-amber-500/30 rounded-3xl p-8 flex flex-col transition-all duration-300 hover:bg-slate-900/80 hover:border-amber-500/60 hover:shadow-[0_0_40px_rgba(245,158,11,0.1)] hover:-translate-y-1">
            {/* Premium badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
              Recommended
            </div>

            <div className="mb-8 mt-2">
              <h2 className="text-2xl font-semibold text-white mb-2">The Resin Academics Partner Route</h2>
              <p className="text-amber-400/90 font-medium tracking-wide uppercase text-xs">Portfolio Expansion & Mentorship</p>
              <p className="text-[10px] text-amber-500/60 mt-1 uppercase tracking-widest">(Grandfathered Status)</p>
              <div className="mt-8 flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-white">$400</span>
                  <span className="text-slate-400 ml-2 font-medium">Stipend</span>
                </div>
                <div className="text-amber-400/90 text-sm mt-2 font-medium bg-amber-500/10 inline-block w-max px-3 py-1 rounded-md border border-amber-500/20">
                  + $5,000 Mentorship Value
                </div>
              </div>
            </div>

            <div className="space-y-5 flex-grow text-sm md:text-base">
              <div className="flex items-start">
                <Check className="w-6 h-6 text-emerald-400 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-200">Base travel and assistance stipend ($400).</span>
              </div>
              <div className="flex items-start">
                <Check className="w-6 h-6 text-emerald-400 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-white font-medium">FULL 1-on-1 Resin Academics Mentorship & Training Experience ($5,000 value).</span>
              </div>
              <div className="flex items-start">
                <Check className="w-6 h-6 text-emerald-400 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-200">FULL authorization to document, film, and photograph the entire installation.</span>
              </div>
              <div className="flex items-start">
                <Check className="w-6 h-6 text-emerald-400 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-200">FULL commercial rights to advertise this premium floor in your own portfolio to secure high-paying epoxy clients.</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedRoute('partner')}
              className="mt-10 w-full py-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none"
            >
              Select This Route
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-slate-800/60 pt-8 mt-4">
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            By selecting an option above, you agree to abide by the media and commercial rights outlined in the respective tier.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnershipAgreement;
