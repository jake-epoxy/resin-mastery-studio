import React, { useState, useRef } from 'react';
import { PenTool, Loader2, Award } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const FoundingPartnerAgreement = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedSig, setCapturedSig] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    date: new Date().toLocaleDateString()
  });

  const sigCanvas = useRef<any>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const pdfSigImgRef = useRef<HTMLImageElement>(null);

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
      setErrorMsg('Please provide your full legal name and email.');
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
      
      // Directly inject into the PDF DOM node to bypass React's async rendering cycle
      if (pdfSigImgRef.current) {
        pdfSigImgRef.current.src = signatureData;
      }
      
      // Wait a tick for image to decode in the browser
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 1. Generate PDF
      let pdfBase64 = '';
      if (pdfRef.current) {
        // Temporarily make it visible for html2canvas to capture reliably
        pdfRef.current.style.display = 'block';
        
        const canvas = await html2canvas(pdfRef.current, { 
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          windowWidth: 800
        });
        
        pdfRef.current.style.display = 'none';

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // If it's taller than one page, jsPDF handles it if we just add the image, 
        // but it might cut off. Since it's scaled to 800px, it should fit on 1-2 pages.
        // For simplicity, we just dump it on one long page or let it scale.
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        pdfBase64 = pdf.output('datauristring').split(',')[1];
        pdf.save(`Founding_Partner_Agreement_${formData.fullName.replace(/\s+/g, '_')}.pdf`);
      }

      // 2. Save to Supabase (Official Partners)
      const { error: dbError } = await supabase
        .from('official_partners')
        .insert([{
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          selected_route: 'Founding Partner (Jason Waller)',
          signature_data: signatureData
        }]);

      if (dbError) {
        console.error("DB Error:", dbError);
      }

      // 3. Send Email Notification
      if (pdfBase64) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: ['Pourmastersllc@gmail.com', formData.email],
            subject: `Founding Partner Agreement Executed: ${formData.fullName}`,
            html: `
              <h2>Founding Partner Agreement Executed</h2>
              <p><strong>Partner:</strong> ${formData.fullName}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Phone:</strong> ${formData.phone || 'N/A'}</p>
              <p><strong>Status:</strong> VIP Founding Partner</p>
              <p>A copy of the legally binding Founding Partner agreement is attached to this email.</p>
            `,
            attachments: [
              {
                filename: `Founding_Partner_Agreement_${formData.fullName.replace(/\s+/g, '_')}.pdf`,
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
      <div className="min-h-screen bg-[#050505] text-slate-200 py-16 px-4 font-sans flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full text-center space-y-6 bg-[#0a0a0a] border border-amber-500/30 rounded-3xl p-12 shadow-[0_0_50px_rgba(245,158,11,0.1)] animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-5 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <Award className="w-16 h-16 text-[#050505]" />
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 tracking-tight">
            Partnership Executed
          </h2>
          <p className="text-lg text-slate-400 max-w-lg mx-auto pt-4">
            Welcome to the inner circle. Your status as a <span className="text-amber-400 font-bold">Founding Partner</span> is officially active.
          </p>
          <div className="pt-8 mt-4 border-t border-white/10">
            <p className="text-slate-500 text-sm">
              A copy of the Founding Partner Agreement has been securely logged and emailed to you and Resin Academics. Let's build an empire.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-3xl p-10 space-y-8 relative z-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center space-y-3">
            <div className="inline-block px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Classified</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white">VIP Access Verification</h2>
            <p className="text-slate-400 text-sm">Please enter your authorized access code to view the Founding Partner agreement.</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (accessCode.toUpperCase() === 'TYSON26' || accessCode.toUpperCase() === 'FOUNDER') {
              setIsAuthenticated(true);
            } else {
              setAccessError(true);
              setTimeout(() => setAccessError(false), 2000);
            }
          }} className="space-y-4">
            <input 
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="ENTER CODE"
              className={`w-full bg-[#050505] border ${accessError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-4 text-center text-white font-bold tracking-[0.3em] uppercase focus:outline-none focus:border-amber-500 transition-colors`}
            />
            <button 
              type="submit"
              className="w-full py-4 rounded-xl font-bold text-[#050505] bg-amber-500 hover:bg-amber-400 transition-colors uppercase tracking-wider text-sm"
            >
              Unlock Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 py-16 px-4 font-sans flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8 animate-in fade-in duration-500" ref={contractRef}>
        
        {/* Document Header */}
        <div className="text-center space-y-6 border-b border-amber-500/20 pb-10">
          <div className="inline-block px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Official Document</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight">
            Resin Academics: <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
              Founding Partner & Brand Ambassador Agreement
            </span>
          </h1>
          <div className="flex justify-center gap-4 text-sm font-medium tracking-widest uppercase text-slate-400 pt-4">
            <span>Effective Date: {formData.date}</span>
            <span>•</span>
            <span className="text-amber-400/80">Partner: Jason Waller</span>
          </div>
        </div>

        {/* Contract Body */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 md:p-12 space-y-12 shadow-2xl">
          
          {/* Section 1 */}
          <section className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-amber-500 border-b border-white/10 pb-2">Section 1: The Partnership Status</h3>
            <ul className="space-y-3 text-slate-300 leading-relaxed list-disc pl-5">
              <li>
                This agreement acknowledges Jason Waller's initial <strong>$3,500 investment</strong> into the organization, granting him lifetime status as a Resin Academics Founding Partner.
              </li>
              <li>
                We confirm that as a Founding Partner, Jason Waller retains <strong>100% of the profits</strong> for any independent epoxy jobs he secures and completes on his own. Resin Academics claims absolutely no royalties or percentages on his independent physical labor.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-amber-500 border-b border-white/10 pb-2">Section 2: Rights & Authorizations</h3>
            <ul className="space-y-3 text-slate-300 leading-relaxed list-disc pl-5">
              <li>
                Jason Waller is fully authorized to represent himself publicly and professionally as a <strong>Resin Academics Certified Partner</strong>.
              </li>
              <li>
                Jason retains full commercial rights to use photos and videos of all collaborative floors (including the Cleveland, Ohio project) within his personal portfolio and marketing materials to secure his own future clients.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h3 className="text-xl font-serif font-bold text-amber-500 border-b border-white/10 pb-2">Section 3: Ambassador Duties & The Value Exchange</h3>
            <p className="text-slate-300 italic mb-4">
              In exchange for royalty-free independence and grandfathered benefits, Jason Waller agrees to act as a Brand Ambassador for Resin Academics under the following terms:
            </p>
            <ul className="space-y-4 text-slate-300 leading-relaxed">
              <li className="flex items-start">
                <span className="text-amber-500 mr-3 font-bold">•</span>
                <div>
                  <strong className="text-white">Content Collaboration:</strong> Jason agrees to actively participate on-camera during collaborative jobs, allowing Resin Academics full rights in perpetuity to use his likeness, voice, and footage for marketing, social media, and course material.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-3 font-bold">•</span>
                <div>
                  <strong className="text-white">Network Collaboration:</strong> Jason agrees to leverage his high-level network (including relationships such as the Mike Tyson connection) to secure high-profile collaborative floors, which will be executed jointly alongside Resin Academics.
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-3 font-bold">•</span>
                <div>
                  <strong className="text-white">Software Adoption:</strong> Jason agrees to utilize "Resin OS" as his primary operational software, allowing Resin Academics to utilize his success and business growth as an official public Case Study.
                </div>
              </li>
            </ul>
          </section>

        </div>

        {/* Execution Block */}
        <div className="bg-[#0a0a0a] border border-amber-500/20 rounded-2xl p-8 md:p-12 space-y-8 shadow-[0_0_40px_rgba(245,158,11,0.05)]">
          <div className="text-center pb-4">
            <h3 className="text-2xl font-serif font-bold text-white">Section 4: Execution</h3>
            <p className="text-sm text-slate-400 mt-2">By completing the fields below, both parties acknowledge and agree to the terms outlined in this document.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Full Legal Name *</label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Jason Waller"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Email Address *</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="jason@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Date</label>
              <input 
                type="text" 
                disabled
                value={formData.date}
                className="w-full bg-[#050505] border border-white/5 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-white/5">
            <div className="flex justify-between items-center">
              <label className="text-xs text-amber-500 uppercase tracking-widest font-bold flex items-center gap-2">
                <PenTool size={16} /> Digital Signature
              </label>
              <button onClick={clearSignature} className="text-xs text-slate-500 hover:text-white uppercase font-bold tracking-wider transition-colors">
                Clear
              </button>
            </div>
            
            <div className="bg-white rounded-xl border-4 border-[#050505] overflow-hidden relative shadow-inner h-48 w-full flex items-center justify-center ring-1 ring-white/10">
              {isCapturing && capturedSig ? (
                <img src={capturedSig} alt="Digital Signature" className="max-w-full max-h-full object-contain" />
              ) : (
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{ className: 'w-full h-full cursor-crosshair bg-white' }}
                />
              )}
              {(!isCapturing && !sigCanvas.current?.isEmpty()) || (isCapturing && capturedSig) ? (
                <div className="absolute bottom-3 left-5 text-[10px] text-slate-400 uppercase font-bold pointer-events-none tracking-widest">
                  Digitally Signed by {formData.fullName || 'Signer'}
                </div>
              ) : null}
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
              {errorMsg}
            </div>
          )}

          <div className="pt-6" data-html2canvas-ignore="true">
            <button 
              onClick={handleSignContract}
              disabled={isSubmitting}
              className="w-full py-5 rounded-xl font-bold text-[#050505] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 text-lg uppercase tracking-wider"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={24} /> Generating Legal PDF...</>
              ) : (
                'Accept & Execute Founding Partnership'
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Hidden PDF Render Target - Strictly for professional B&W document export */}
      <div 
        ref={pdfRef} 
        className="fixed top-[200vh] left-0 w-[800px] bg-white text-black p-12 font-serif z-[-100] hidden"
      >
        <div className="text-center mb-8 border-b-2 border-black pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Resin Academics</h1>
          <h2 className="text-xl font-bold text-gray-800">Founding Partner & Brand Ambassador Agreement</h2>
          <p className="mt-4 text-sm font-sans text-gray-600">Effective Date: {formData.date} &nbsp;|&nbsp; Partner: Jason Waller</p>
        </div>

        <div className="space-y-6 font-sans text-sm leading-relaxed text-gray-900">
          <div>
            <h3 className="font-bold text-lg font-serif mb-2 border-b border-gray-300 pb-1">Section 1: The Partnership Status</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>This agreement acknowledges Jason Waller's initial <strong>$3,500 investment</strong> into the organization, granting him lifetime status as a Resin Academics Founding Partner.</li>
              <li>We confirm that as a Founding Partner, Jason Waller retains <strong>100% of the profits</strong> for any independent epoxy jobs he secures and completes on his own. Resin Academics claims absolutely no royalties or percentages on his independent physical labor.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg font-serif mb-2 border-b border-gray-300 pb-1">Section 2: Rights & Authorizations</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Jason Waller is fully authorized to represent himself publicly and professionally as a <strong>Resin Academics Certified Partner</strong>.</li>
              <li>Jason retains full commercial rights to use photos and videos of all collaborative floors (including the Cleveland, Ohio project) within his personal portfolio and marketing materials to secure his own future clients.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg font-serif mb-2 border-b border-gray-300 pb-1">Section 3: Ambassador Duties & The Value Exchange</h3>
            <p className="italic mb-2">In exchange for royalty-free independence and grandfathered benefits, Jason Waller agrees to act as a Brand Ambassador for Resin Academics under the following terms:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Content Collaboration:</strong> Jason agrees to actively participate on-camera during collaborative jobs, allowing Resin Academics full rights in perpetuity to use his likeness, voice, and footage for marketing, social media, and course material.</li>
              <li><strong>Network Collaboration:</strong> Jason agrees to leverage his high-level network (including relationships such as the Mike Tyson connection) to secure high-profile collaborative floors, which will be executed jointly alongside Resin Academics.</li>
              <li><strong>Software Adoption:</strong> Jason agrees to utilize "Resin OS" as his primary operational software, allowing Resin Academics to utilize his success and business growth as an official public Case Study.</li>
            </ul>
          </div>

          <div className="pt-8 mt-8 border-t-2 border-black">
            <h3 className="font-bold text-lg font-serif mb-4">Section 4: Execution</h3>
            <p className="mb-8">By signing below, both parties acknowledge and agree to the terms outlined in this document.</p>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="font-bold mb-1">Full Legal Name:</p>
                <p className="p-2 border-b border-gray-400 bg-gray-50">{formData.fullName || ' '}</p>
              </div>
              <div>
                <p className="font-bold mb-1">Email Address:</p>
                <p className="p-2 border-b border-gray-400 bg-gray-50">{formData.email || ' '}</p>
              </div>
              <div>
                <p className="font-bold mb-1">Phone Number:</p>
                <p className="p-2 border-b border-gray-400 bg-gray-50">{formData.phone || ' '}</p>
              </div>
              <div>
                <p className="font-bold mb-1">Date:</p>
                <p className="p-2 border-b border-gray-400 bg-gray-50">{formData.date}</p>
              </div>
            </div>

            <div className="mt-12">
              <p className="font-bold mb-4 text-gray-600 uppercase tracking-widest text-xs">Digital Signature</p>
              <div className="w-full h-40 border-2 border-gray-300 bg-gray-50 flex items-center justify-center p-4">
                <img ref={pdfSigImgRef} alt="Signature" className="max-w-full max-h-full object-contain" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Digitally Signed by {formData.fullName || 'Signer'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoundingPartnerAgreement;
