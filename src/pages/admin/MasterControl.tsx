import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ShieldAlert, TrendingUp, Building, Download, Share2, FileSignature, Send, Copy, Loader2, FileUp, X } from "lucide-react";

export default function MasterControl() {
  const [installers, setInstallers] = useState<any[]>([]);
  const [officialPartners, setOfficialPartners] = useState<any[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [totalGmv, setTotalGmv] = useState(0);
  const [loading, setLoading] = useState(true);

  const [newSignups, setNewSignups] = useState(0);
  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    program: "Private Epoxy / Resin Training",
    date: "",
    price: "",
    agreementUrl: "",
    agreementName: "",
  });
  const [sendingStudentLink, setSendingStudentLink] = useState(false);
  const [uploadingStudentAgreement, setUploadingStudentAgreement] = useState(false);

  useEffect(() => {
    fetchGlobalData();
  }, []);

  async function fetchGlobalData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email })
      });

      if (!res.ok) throw new Error("Failed to fetch superadmin stats");

      const data = await res.json();
      const installersData = data.installers;
      const count = data.totalClients;
      const gmv = data.totalGmv;

    if (installersData) {
      setInstallers(installersData);
      
      // God Mode Analytics
      const lastVisitStr = localStorage.getItem("lastGodModeVisit");
      if (lastVisitStr) {
        const lastVisitDate = new Date(lastVisitStr);
        const newCount = installersData.filter(i => new Date(i.created_at) > lastVisitDate).length;
        setNewSignups(newCount);
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newCount = installersData.filter(i => new Date(i.created_at) > yesterday).length;
        setNewSignups(newCount);
      }
      
      // Save current timestamp for next visit
      localStorage.setItem("lastGodModeVisit", new Date().toISOString());
    }

    if (count !== undefined && count !== null) setTotalClients(count);
    if (gmv !== undefined && gmv !== null) setTotalGmv(gmv);

    // Fetch Official Partners
    try {
      const { data: partnersData, error: partnersErr } = await supabase
        .from('official_partners')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!partnersErr && partnersData) {
        setOfficialPartners(partnersData);
      }
    } catch (e) {
      console.log("Official partners table might not exist yet", e);
    }

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  function downloadCSV() {
    if (installers.length === 0) return;
    
    const headers = ['Company Name', 'Full Name', 'Phone', 'Generations', 'Quotes', 'Subscription Active', 'Joined Date'];
    
    const csvRows = installers.map(i => {
      return [
        `"${i.company_name || ''}"`,
        `"${i.full_name || ''}"`,
        `"${i.company_phone || ''}"`,
        i.generation_count || 0,
        i.quote_count || 0,
        i.subscription_active || false,
        `"${new Date(i.created_at).toLocaleDateString()}"`
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...csvRows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contractors_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const buildStudentLink = () => {
    const origin = window.location.origin;
    const params = new URLSearchParams();
    if (studentForm.name.trim()) params.set("name", studentForm.name.trim());
    if (studentForm.email.trim()) params.set("email", studentForm.email.trim());
    if (studentForm.program.trim()) params.set("program", studentForm.program.trim());
    if (studentForm.date.trim()) params.set("date", studentForm.date.trim());
    if (studentForm.price.trim()) params.set("price", studentForm.price.trim());
    if (studentForm.agreementUrl) params.set("agreement", studentForm.agreementUrl);
    if (studentForm.agreementName) params.set("agreementName", studentForm.agreementName);
    return `${origin}/student-onboarding?${params.toString()}`;
  };

  const copyStudentLink = async () => {
    await navigator.clipboard.writeText(buildStudentLink());
  };

  const handleStudentAgreementUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a PDF file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Please keep the PDF under 3 MB so the completed signed copy can be emailed.");
      return;
    }

    setUploadingStudentAgreement(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your admin session expired. Please sign in again.");

      const safeName = file.name.replace(/[^a-z0-9_.-]/gi, "_");
      const filePath = `${user.id}/student-agreements/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage
        .from("business-assets")
        .upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: "application/pdf" });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("business-assets").getPublicUrl(filePath);
      setStudentForm((current) => ({ ...current, agreementUrl: publicUrl, agreementName: file.name }));
    } catch (err: any) {
      alert(err.message || "Could not upload the student agreement.");
    } finally {
      setUploadingStudentAgreement(false);
    }
  };

  const sendStudentLink = async () => {
    if (!studentForm.email.trim()) {
      alert("Student email is required.");
      return;
    }
    setSendingStudentLink(true);
    try {
      const link = buildStudentLink();
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: studentForm.email.trim(),
          cc: "jakeflowers222@gmail.com",
          subject: "Complete Your Resin Academics Student Onboarding",
          html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:32px;border-radius:12px;">
    <h1 style="margin:0 0 12px;color:#111827;font-size:24px;">Student Onboarding</h1>
    <p style="color:#334155;font-size:16px;line-height:1.6;">${studentForm.name ? `Hey ${studentForm.name},` : "Hey,"}</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Please complete your Resin Academics training onboarding form before class.</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;"><strong>Program:</strong> ${studentForm.program || "Private Epoxy / Resin Training"}</p>
    ${studentForm.date ? `<p style="color:#334155;font-size:16px;line-height:1.6;"><strong>Training Date:</strong> ${studentForm.date}</p>` : ""}
    ${studentForm.price ? `<p style="color:#334155;font-size:16px;line-height:1.6;"><strong>Class Price:</strong> $${Number(studentForm.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>` : ""}
    ${studentForm.agreementUrl ? `<p style="color:#334155;font-size:16px;line-height:1.6;">Your training agreement is included in the onboarding form for review and signature.</p>` : ""}
    <p style="margin:28px 0;"><a href="${link}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:700;">Complete Onboarding</a></p>
    <p style="color:#94a3b8;font-size:13px;">If the button does not open, copy and paste this link:<br>${link}</p>
  </div>
</body>
</html>`
        })
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Could not send onboarding link.");
      }
      alert("Student onboarding link sent.");
    } catch (err: any) {
      alert(err.message || "Failed to send student onboarding link.");
    } finally {
      setSendingStudentLink(false);
    }
  };

  return (
    <div className="p-8 pb-20">
      <header className="mb-10 border-b border-emerald-500/20 pb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="text-emerald-500" size={32} />
            <h1 className="text-3xl font-space font-bold text-white tracking-tight">Super Admin Control</h1>
          </div>
          <p className="text-white/60">Global overview. You are viewing data across all multi-tenant contractor accounts.</p>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold transition-colors"
        >
          <Download size={18} />
          Export CSV
        </button>
      </header>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Building size={80} />
          </div>
          <p className="text-emerald-400/80 text-sm font-bold uppercase tracking-widest mb-2">Total Tenants</p>
          <p className="text-4xl font-space font-bold text-white">{installers.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-2">Global CRM Clients</p>
          <p className="text-4xl font-space font-bold text-white">{totalClients}</p>
          <p className="text-xs text-white/40 mt-2">Across all contractors</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-2 relative z-10">Total Application GMV</p>
          <p className="text-4xl font-space font-bold text-emerald-400 relative z-10">${typeof totalGmv === 'number' ? totalGmv.toLocaleString() : '0'}</p>
          <p className="text-xs text-white/40 mt-2 relative z-10">Direct mathematically processed volume</p>
        </div>
      </div>

      {/* New Signups Dopamine Hit */}
      {newSignups > 0 && (
        <div className="mb-12 bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl flex items-center justify-between shadow-[0_0_50px_rgba(220, 38, 38,0.15)] animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400">+{newSignups} New Accounts!</h2>
            <p className="text-emerald-400/70">Since your last login</p>
          </div>
          <div className="bg-emerald-500/20 p-4 rounded-full">
            <TrendingUp className="text-emerald-400" size={32} />
          </div>
        </div>
      )}

      {/* Jake-only Student Onboarding Sender */}
      <div className="mb-12 bg-[#0a0a0a] border border-[#78c8ff]/20 rounded-2xl p-6">
        <h2 className="text-xl font-space font-bold text-white mb-2 flex items-center gap-3">
          <FileSignature size={20} className="text-[#78c8ff]" />
          Student Onboarding Sender
        </h2>
        <p className="text-white/40 text-sm mb-5">Generate or email a student onboarding/signature form. This panel only lives in Super Admin.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
          <input value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} placeholder="Student name" className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#78c8ff]" />
          <input value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="Student email" className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#78c8ff]" />
          <input value={studentForm.program} onChange={(e) => setStudentForm({ ...studentForm, program: e.target.value })} placeholder="Program" className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#78c8ff]" />
          <input type="date" value={studentForm.date} onChange={(e) => setStudentForm({ ...studentForm, date: e.target.value })} aria-label="Training date" className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#78c8ff] [color-scheme:dark]" />
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
            <input type="number" min="0" step="0.01" value={studentForm.price} onChange={(e) => setStudentForm({ ...studentForm, price: e.target.value })} placeholder="Class price" className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm outline-none focus:border-[#78c8ff]" />
          </div>
        </div>
        <div className="mb-4 border border-dashed border-white/15 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">Custom student agreement <span className="text-white/30 font-normal">(optional)</span></p>
            <p className="text-xs text-white/40 mt-1 truncate">
              {studentForm.agreementName || "Upload your own PDF. The student's signature record will be appended to it."}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {studentForm.agreementUrl && (
              <button type="button" onClick={() => setStudentForm({ ...studentForm, agreementUrl: "", agreementName: "" })} title="Remove uploaded agreement" className="w-11 h-11 inline-flex items-center justify-center bg-white/5 hover:bg-red-500/10 text-white/50 hover:text-red-400 border border-white/10 rounded-xl">
                <X size={17} />
              </button>
            )}
            <label className="relative inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 h-11 rounded-xl font-bold cursor-pointer">
              {uploadingStudentAgreement ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
              {uploadingStudentAgreement ? "Uploading..." : studentForm.agreementUrl ? "Replace PDF" : "Upload PDF"}
              <input type="file" accept="application/pdf,.pdf" onChange={handleStudentAgreementUpload} disabled={uploadingStudentAgreement} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" />
            </label>
          </div>
        </div>
        <div className="bg-black/50 border border-white/10 rounded-xl p-3 mb-4 text-xs text-white/50 font-mono break-all">
          {buildStudentLink()}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={copyStudentLink} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-3 rounded-xl font-bold">
            <Copy size={16} /> Copy Link
          </button>
          <button onClick={sendStudentLink} disabled={sendingStudentLink} className="flex items-center justify-center gap-2 bg-[#78c8ff] hover:bg-white text-black px-4 py-3 rounded-xl font-bold disabled:opacity-50">
            {sendingStudentLink ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send Form
          </button>
        </div>
      </div>

      {/* Official Partners Library */}
      <div className="mb-12">
        <h2 className="text-xl font-space font-bold text-white mb-6 flex items-center gap-3">
          <FileSignature size={20} className="text-amber-500" />
          Official Partners Library
          {officialPartners.length > 0 && (
            <span className="text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full">
              {officialPartners.length} signed
            </span>
          )}
        </h2>
        
        {officialPartners.length === 0 ? (
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl text-center">
             <p className="text-white/40 text-sm">No official partner agreements signed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {officialPartners.map((partner) => (
                <div key={partner.id} className="bg-[#0a0a0a] border border-amber-500/20 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg">{partner.full_name}</h3>
                      <p className="text-xs text-white/50">{partner.company_name || 'No Company listed'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      partner.selected_route === 'partner' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {partner.selected_route === 'partner' ? 'Resin Academics Partner' : 'Subcontractor'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/60 mb-4 border-t border-white/5 pt-4">
                    <div>
                      <p className="font-bold text-white/40 uppercase tracking-wider text-[9px] mb-1">Email</p>
                      <p>{partner.email}</p>
                    </div>
                    <div>
                      <p className="font-bold text-white/40 uppercase tracking-wider text-[9px] mb-1">Phone</p>
                      <p>{partner.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-white/5 pt-4 mt-auto">
                    <p className="text-[10px] text-white/30">
                      Signed: {new Date(partner.created_at).toLocaleString()}
                    </p>
                    <div className="h-8 w-24 bg-white/5 rounded flex items-center justify-center overflow-hidden">
                      {partner.signature_data ? (
                        <img src={partner.signature_data} alt="Signature" className="h-full object-contain filter invert opacity-70" />
                      ) : (
                        <span className="text-[8px] text-white/30 uppercase">No Sig</span>
                      )}
                    </div>
                  </div>
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Affiliate Referrals Panel */}
      {(() => {
        const referred = installers.filter(i => i.referred_by);
        const affiliateGroups = referred.reduce((acc, curr) => {
          const slug = curr.referred_by;
          if (!acc[slug]) acc[slug] = [];
          acc[slug].push(curr);
          return acc;
        }, {} as Record<string, any[]>);
        const affiliateSlugs = Object.keys(affiliateGroups);

        return (
          <div className="mb-12">
            <h2 className="text-xl font-space font-bold text-white mb-6 flex items-center gap-3">
              <Share2 size={20} className="text-purple-400" />
              Affiliate Referrals
              {referred.length > 0 && (
                <span className="text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full">
                  {referred.length} total
                </span>
              )}
            </h2>

            {affiliateSlugs.length === 0 ? (
              <div className="bg-[#111] border border-white/10 p-6 rounded-2xl text-center">
                <p className="text-white/40 text-sm">No affiliate referrals yet. Share your link: <span className="text-purple-400">resinacademics.com/ref/doctor-epoxy</span></p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {affiliateSlugs.map(slug => {
                  const group = affiliateGroups[slug];
                  const paying = group.filter(i => i.subscription_active);
                  const commission = paying.length * 30;

                  return (
                    <div key={slug} className="bg-[#0a0a0a] border border-purple-500/20 rounded-2xl overflow-hidden">
                      {/* Affiliate header */}
                      <div className="p-5 border-b border-white/5 bg-purple-500/5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                              {slug.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{slug}</p>
                              <p className="text-[10px] text-white/40">resinacademics.com/ref/{slug}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-white">{group.length}</p>
                            <p className="text-[9px] text-white/40 uppercase tracking-wider">Signups</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-emerald-400">{paying.length}</p>
                            <p className="text-[9px] text-white/40 uppercase tracking-wider">Paying</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-purple-400">${commission}</p>
                            <p className="text-[9px] text-white/40 uppercase tracking-wider">Owed</p>
                          </div>
                        </div>
                      </div>

                      {/* Referred contractors list */}
                      <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto">
                        {group.map(installer => (
                          <div key={installer.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                            <div>
                              <p className="text-xs font-bold text-white/80">{installer.company_name || installer.full_name || 'Unnamed'}</p>
                              <p className="text-[10px] text-white/30">{new Date(installer.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              installer.subscription_active
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {installer.subscription_active ? 'Paying' : 'Trial'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        {/* Contractor Directory */}
        <div className="col-span-3">
          <h2 className="text-xl font-space font-bold text-white mb-6">Contractor Directory</h2>
          {loading ? (
            <p className="text-white/50">Decrypting global state...</p>
          ) : (
            <div className="space-y-4">
              {installers.map((installer) => (
                <div key={installer.id} className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl flex justify-between items-center hover:border-emerald-500/30 transition-colors">
                  <div>
                    <h3 className="font-bold text-white text-lg">{installer.company_name}</h3>
                    <p className="text-sm text-white/50">{installer.full_name} • {installer.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex justify-end gap-2 mb-2">
                       {installer.has_stripe ? (
                         <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest">
                           Stripe Active
                         </span>
                       ) : (
                         <span className="inline-block px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                           Pending Setup
                         </span>
                       )}
                       <span className="inline-block px-3 py-1 bg-blue-500/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/70">
                         {installer.subscription_active ? 'SUBSCRIBED' : 'FREE TIER'}
                       </span>
                    </div>
                    <p className="text-xs text-white/30">Joined {new Date(installer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {installers.length === 0 && (
                <p className="text-white/40">No contractors have signed up yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Calendar Analytics */}
        <div className="col-span-1">
          <h2 className="text-xl font-space font-bold text-white mb-6">30-Day Velocity</h2>
          <div className="bg-[#111] border border-white/10 p-5 rounded-2xl space-y-3">
             {Object.entries(installers.reduce((acc, curr) => {
                const dateStr = new Date(curr.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                acc[dateStr] = (acc[dateStr] || 0) + 1;
                return acc;
             }, {} as Record<string, number>)).slice(0, 10).map(([date, count]) => (
                <div key={date} className="flex items-center justify-between text-sm">
                  <span className="text-white/50">{date}</span>
                  <div className="flex items-center gap-2">
                     <span className="font-bold text-white">+{count as number}</span>
                  </div>
                </div>
             ))}
             {installers.length === 0 && <p className="text-xs text-white/40">No history</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
