import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ShieldAlert, TrendingUp, Building, Download, Share2, FileSignature, Send, Copy, Loader2, Eye, ShieldCheck, RefreshCw, ClipboardCheck, FileCheck2, DollarSign, X, ReceiptText, Mail, Upload, CreditCard, CheckCircle2 } from "lucide-react";

export default function MasterControl() {
  const [installers, setInstallers] = useState<any[]>([]);
  const [officialPartners, setOfficialPartners] = useState<any[]>([]);
  const [studentAgreements, setStudentAgreements] = useState<any[]>([]);
  const [loadingStudentAgreements, setLoadingStudentAgreements] = useState(true);
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
    paidAmount: "",
    paidDate: "",
    nextAmount: "",
    nextDate: new Date().toISOString().slice(0, 10),
    finalDue: "",
  });
  const [sendingStudentLink, setSendingStudentLink] = useState(false);
  const [copyingStudentLink, setCopyingStudentLink] = useState(false);
  const [loggingStudentSend, setLoggingStudentSend] = useState(false);
  const [paymentAgreement, setPaymentAgreement] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    method: "Zelle",
    reference: "",
    note: "",
    sendReceipt: true,
  });
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [uploadingSignedAgreement, setUploadingSignedAgreement] = useState("");
  const [emailingReceipt, setEmailingReceipt] = useState("");

  useEffect(() => {
    fetchGlobalData();
    fetchStudentAgreements();
  }, []);

  async function studentAgreementRequest(body: Record<string, unknown>) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Your Super Admin session expired. Please sign in again.");

    const response = await fetch("/api/student-agreements-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "Student agreement request failed.");
    return data;
  }

  async function fetchStudentAgreements() {
    setLoadingStudentAgreements(true);
    try {
      const data = await studentAgreementRequest({ action: "list" });
      setStudentAgreements(data.agreements || []);
    } catch (error) {
      console.error("Could not load student agreement records", error);
    } finally {
      setLoadingStudentAgreements(false);
    }
  }

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

  const buildStudentLink = (trackingId = "", preview = false, source: any = studentForm) => {
    const origin = window.location.origin;
    const params = new URLSearchParams();
    const values = {
      name: source.studentName ?? source.name ?? "",
      email: source.studentEmail ?? source.email ?? "",
      program: source.program ?? "",
      date: source.trainingDate ?? source.date ?? "",
      price: String(source.classPrice ?? source.price ?? ""),
      paidAmount: String(source.paidAmount ?? ""),
      paidDate: source.paidDate ?? "",
      nextAmount: String(source.nextAmount ?? ""),
      nextDate: source.nextDate ?? "",
      finalDue: source.finalDue ?? "",
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
    });
    if (trackingId) params.set("tracking", trackingId);
    if (preview) params.set("preview", "1");
    return `${origin}/student-onboarding?${params.toString()}`;
  };

  const studentAgreementPayload = () => ({
    studentName: studentForm.name,
    studentEmail: studentForm.email,
    program: studentForm.program,
    trainingDate: studentForm.date,
    classPrice: studentForm.price,
    paidAmount: studentForm.paidAmount,
    paidDate: studentForm.paidDate,
    nextAmount: studentForm.nextAmount,
    nextDate: studentForm.nextDate,
    finalDue: studentForm.finalDue,
  });

  const validateStudentRecord = () => {
    if (!studentForm.name.trim() || !studentForm.email.trim()) {
      alert("Student name and email are required.");
      return false;
    }
    return true;
  };

  const createStudentAgreement = async (status: "created" | "sent", source: string) => {
    const data = await studentAgreementRequest({
      action: "create",
      agreement: studentAgreementPayload(),
      status,
      source,
    });
    return data.agreement;
  };

  const markStudentAgreement = async (id: string, status: "sent" | "failed", emailId = "", note = "") => {
    await studentAgreementRequest({ action: "mark", id, status, emailId, note });
  };

  const copyStudentLink = async () => {
    if (!validateStudentRecord()) return;
    setCopyingStudentLink(true);
    try {
      const agreement = await createStudentAgreement("created", "copied-link");
      await navigator.clipboard.writeText(buildStudentLink(agreement.id));
      await fetchStudentAgreements();
      alert("Tracked student link copied.");
    } catch (error: any) {
      alert(error.message || "Could not create the tracked link.");
    } finally {
      setCopyingStudentLink(false);
    }
  };

  const previewStudentForm = () => {
    window.open(buildStudentLink("", true), "_blank", "noopener,noreferrer");
  };

  const money = (value: string) => {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
      : "$0.00";
  };

  const remainingStudentBalance = Math.max(
    Number(studentForm.price || 0) - Number(studentForm.paidAmount || 0) - Number(studentForm.nextAmount || 0),
    0,
  );

  const logExistingStudentSend = async () => {
    if (!validateStudentRecord()) return;
    setLoggingStudentSend(true);
    try {
      await createStudentAgreement("sent", "manual-backfill");
      await fetchStudentAgreements();
      alert("Existing student form send logged.");
    } catch (error: any) {
      alert(error.message || "Could not log the existing send.");
    } finally {
      setLoggingStudentSend(false);
    }
  };

  const copyAgreementLink = async (agreement: any) => {
    await navigator.clipboard.writeText(buildStudentLink(agreement.id, false, agreement));
    alert("Tracked student link copied.");
  };

  const studentStatusLabel = (status: string) => ({
    created: "Link Created",
    sent: "Sent",
    opened: "Opened",
    signed: "Signed",
    failed: "Send Failed",
  }[status] || status);

  const studentStatusClass = (status: string) => ({
    created: "border-white/15 bg-white/5 text-white/60",
    sent: "border-[#78c8ff]/30 bg-[#78c8ff]/10 text-[#78c8ff]",
    opened: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    signed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    failed: "border-red-400/30 bg-red-400/10 text-red-300",
  }[status] || "border-white/15 bg-white/5 text-white/60");

  const agreementActivity = (agreement: any) => {
    const latestPayment = [...(agreement.payments || [])].reverse()[0];
    const value = agreement.paidInFullAt || latestPayment?.recordedAt || agreement.signedAt || agreement.openedAt || agreement.sentAt || agreement.createdAt;
    return value ? new Date(value).toLocaleString() : "No activity";
  };

  const latestReceiptFor = (agreement: any) => (
    [...(agreement.payments || [])].reverse().find((payment) => payment.receiptPdfPath)
  );

  const openPaymentEditor = (agreement: any) => {
    setPaymentAgreement(agreement);
    setPaymentForm({
      amount: String(agreement.balanceDue || ""),
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "Zelle",
      reference: "",
      note: "",
      sendReceipt: true,
    });
  };

  const recordStudentPayment = async () => {
    if (!paymentAgreement) return;
    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    setRecordingPayment(true);
    try {
      const result = await studentAgreementRequest({
        action: "record-payment",
        id: paymentAgreement.id,
        amount,
        paymentDate: paymentForm.paymentDate,
        method: paymentForm.method,
        reference: paymentForm.reference,
        note: paymentForm.note,
        sendReceipt: paymentForm.sendReceipt,
      });
      setPaymentAgreement(null);
      await fetchStudentAgreements();
      if (result.warning) {
        alert(`Payment recorded and receipt saved. Email delivery needs attention: ${result.warning}`);
      } else if (paymentForm.sendReceipt) {
        alert("Payment recorded and receipt emailed to the student.");
      } else {
        alert("Payment recorded and receipt saved.");
      }
    } catch (error: any) {
      alert(error.message || "Could not record the student payment.");
    } finally {
      setRecordingPayment(false);
    }
  };

  const emailLatestReceipt = async (agreement: any) => {
    const payment = latestReceiptFor(agreement);
    if (!payment) return;
    setEmailingReceipt(agreement.id);
    try {
      await studentAgreementRequest({ action: "send-receipt", id: agreement.id, paymentId: payment.id });
      await fetchStudentAgreements();
      alert(`Receipt emailed to ${agreement.studentEmail}.`);
    } catch (error: any) {
      alert(error.message || "Could not email the receipt.");
    } finally {
      setEmailingReceipt("");
    }
  };

  const attachSignedAgreement = async (agreement: any, file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please choose the signed agreement as a PDF.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("The signed PDF must be smaller than 3 MB.");
      return;
    }

    setUploadingSignedAgreement(agreement.id);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read the signed PDF."));
        reader.readAsDataURL(file);
      });
      await studentAgreementRequest({
        action: "attach-signed-pdf",
        id: agreement.id,
        pdfBase64: dataUrl,
      });
      await fetchStudentAgreements();
      alert("Signed student agreement attached.");
    } catch (error: any) {
      alert(error.message || "Could not attach the signed agreement.");
    } finally {
      setUploadingSignedAgreement("");
    }
  };

  const sendStudentLink = async () => {
    if (!validateStudentRecord()) return;
    setSendingStudentLink(true);
    let agreementId = "";
    let emailSent = false;
    try {
      const agreement = await createStudentAgreement("created", "email");
      agreementId = agreement.id;
      const link = buildStudentLink(agreement.id);
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
    ${(studentForm.paidAmount || studentForm.nextAmount) ? `
      <div style="margin:20px 0;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
        <p style="margin:0 0 10px;color:#0f172a;font-size:15px;font-weight:700;">Payment Schedule</p>
        ${studentForm.paidAmount ? `<p style="margin:5px 0;color:#334155;"><strong>Previously paid:</strong> ${money(studentForm.paidAmount)}${studentForm.paidDate ? ` on ${studentForm.paidDate}` : ""}</p>` : ""}
        ${studentForm.nextAmount ? `<p style="margin:5px 0;color:#334155;"><strong>Next payment:</strong> ${money(studentForm.nextAmount)}${studentForm.nextDate ? ` due ${studentForm.nextDate}` : ""}</p>` : ""}
        <p style="margin:5px 0;color:#334155;"><strong>Remaining after next payment:</strong> ${money(String(remainingStudentBalance))}${studentForm.finalDue ? ` (${studentForm.finalDue})` : ""}</p>
      </div>` : ""}
    <p style="color:#334155;font-size:16px;line-height:1.6;">The onboarding form includes the Resin Academics Student Training Agreement, payment terms, assumption of risk, and release for review and signature.</p>
    <p style="margin:28px 0;"><a href="${link}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:700;">Complete Onboarding</a></p>
    <p style="color:#94a3b8;font-size:13px;">If the button does not open, copy and paste this link:<br>${link}</p>
  </div>
</body>
</html>`
        })
      });
      const emailResult = await res.json().catch(() => null);
      if (!res.ok) throw new Error(emailResult?.error || "Could not send onboarding link.");
      emailSent = true;

      const emailId = emailResult?.data?.id || emailResult?.id || "";
      await markStudentAgreement(agreement.id, "sent", emailId);
      await fetchStudentAgreements();
      alert("Student onboarding link sent and recorded.");
    } catch (err: any) {
      if (agreementId && !emailSent) {
        await markStudentAgreement(agreementId, "failed", "", err.message).catch(() => undefined);
        await fetchStudentAgreements();
      }
      alert(emailSent
        ? "The form was emailed, but its status could not be updated. Use Log Existing Send to backfill it."
        : err.message || "Failed to send student onboarding link.");
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
        <div className="mb-4 border border-emerald-500/20 bg-emerald-500/[0.05] rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck size={20} className="text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">Resin Academics Student Training Agreement included</p>
            <p className="text-xs text-white/45 mt-1 leading-relaxed">Built-in no-refund terms, student-specific materials policy, safety and risk disclosures, release of liability, intellectual-property protection, and Texas electronic-signature terms.</p>
          </div>
        </div>
        <div className="mb-4 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-white/[0.03] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <p className="text-sm font-bold text-white">Payment schedule <span className="text-white/30 font-normal">(optional)</span></p>
              <p className="text-xs text-white/40 mt-1">Record what was received, what is due next, and when the final balance is due.</p>
            </div>
            <p className="text-sm font-bold text-[#78c8ff]">Final balance: {money(String(remainingStudentBalance))}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            <div className="p-4 grid grid-cols-2 gap-3">
              <p className="col-span-2 text-[11px] uppercase tracking-widest text-emerald-400 font-bold">Previously Paid</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35">$</span>
                <input type="number" min="0" step="0.01" value={studentForm.paidAmount} onChange={(e) => setStudentForm({ ...studentForm, paidAmount: e.target.value })} placeholder="500" aria-label="Previously paid amount" className="w-full bg-black border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-white text-sm outline-none focus:border-emerald-400" />
              </div>
              <input type="date" value={studentForm.paidDate} onChange={(e) => setStudentForm({ ...studentForm, paidDate: e.target.value })} aria-label="Previous payment date" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-emerald-400 [color-scheme:dark]" />
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <p className="col-span-2 text-[11px] uppercase tracking-widest text-[#78c8ff] font-bold">Next Payment</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35">$</span>
                <input type="number" min="0" step="0.01" value={studentForm.nextAmount} onChange={(e) => setStudentForm({ ...studentForm, nextAmount: e.target.value })} placeholder="500" aria-label="Next payment amount" className="w-full bg-black border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-white text-sm outline-none focus:border-[#78c8ff]" />
              </div>
              <input type="date" value={studentForm.nextDate} onChange={(e) => setStudentForm({ ...studentForm, nextDate: e.target.value })} aria-label="Next payment due date" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#78c8ff] [color-scheme:dark]" />
            </div>
            <div className="p-4">
              <p className="text-[11px] uppercase tracking-widest text-amber-400 font-bold mb-3">Remaining Balance</p>
              <div className="h-[42px] flex items-center text-lg font-bold text-white mb-3">{money(String(remainingStudentBalance))}</div>
              <input value={studentForm.finalDue} onChange={(e) => setStudentForm({ ...studentForm, finalDue: e.target.value })} placeholder="When due? e.g. After training" aria-label="Final balance due timing" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-black/50 border border-white/10 rounded-xl p-3 mb-4 text-xs text-white/50 font-mono break-all">
          {buildStudentLink("", true)}
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <button onClick={previewStudentForm} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-3 rounded-xl font-bold">
            <Eye size={16} /> Preview as Student
          </button>
          <button onClick={copyStudentLink} disabled={copyingStudentLink} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-50">
            {copyingStudentLink ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />} Copy Tracked Link
          </button>
          <button onClick={logExistingStudentSend} disabled={loggingStudentSend} className="flex items-center justify-center gap-2 bg-amber-400/10 hover:bg-amber-400/15 border border-amber-400/20 text-amber-300 px-4 py-3 rounded-xl font-bold disabled:opacity-50">
            {loggingStudentSend ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />} Log Existing Send
          </button>
          <button onClick={sendStudentLink} disabled={sendingStudentLink} className="flex items-center justify-center gap-2 bg-[#78c8ff] hover:bg-white text-black px-4 py-3 rounded-xl font-bold disabled:opacity-50">
            {sendingStudentLink ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send Form
          </button>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-xl font-space font-bold text-white flex items-center gap-3">
            <FileCheck2 size={20} className="text-emerald-400" />
            Student Agreement Records
            {studentAgreements.length > 0 && (
              <span className="text-xs font-bold border border-white/10 bg-white/5 text-white/60 px-2.5 py-1 rounded-full">
                {studentAgreements.length}
              </span>
            )}
          </h2>
          <button onClick={fetchStudentAgreements} disabled={loadingStudentAgreements} title="Refresh student agreement records" className="h-10 w-10 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg disabled:opacity-50">
            <RefreshCw size={16} className={loadingStudentAgreements ? "animate-spin" : ""} />
          </button>
        </div>

        {loadingStudentAgreements && studentAgreements.length === 0 ? (
          <div className="border-y border-white/10 py-8 text-center text-sm text-white/40">Loading student agreement records...</div>
        ) : studentAgreements.length === 0 ? (
          <div className="border-y border-white/10 py-8 text-center text-sm text-white/40">No student agreement activity recorded yet.</div>
        ) : (
          <div className="border-y border-white/10 divide-y divide-white/10">
            {studentAgreements.map((agreement) => (
              <div key={agreement.id} className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.75fr_0.85fr_minmax(280px,auto)] gap-4 lg:items-center py-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <p className="font-bold text-white truncate">{agreement.studentName}</p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${studentStatusClass(agreement.status)}`}>
                      {studentStatusLabel(agreement.status)}
                    </span>
                    {agreement.paymentStatus === "paid" && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
                        Paid in Full
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/50 truncate">{agreement.studentEmail}</p>
                  <p className="text-xs text-white/30 truncate mt-1">{agreement.program}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-1">Class Price</p>
                  <p className="font-bold text-white">{money(String(agreement.classPrice || 0))}</p>
                  <p className="text-xs text-emerald-300/70 mt-1">{money(String(agreement.totalPaid || 0))} paid</p>
                  <p className="text-xs text-white/35 mt-0.5">{money(String(agreement.balanceDue || 0))} remaining</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-1">Latest Activity</p>
                  <p className="text-sm text-white/70">{agreementActivity(agreement)}</p>
                  <p className="text-xs text-white/30 mt-1">
                    {(agreement.payments || []).length} payment{(agreement.payments || []).length === 1 ? "" : "s"} recorded
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {agreement.balanceDue > 0 && (
                    <button onClick={() => openPaymentEditor(agreement)} title="Record student payment" className="h-10 px-3 flex items-center justify-center gap-2 border border-[#78c8ff]/25 bg-[#78c8ff]/10 hover:bg-[#78c8ff]/15 text-[#78c8ff] rounded-lg text-sm font-bold">
                      <DollarSign size={16} /> Payment
                    </button>
                  )}
                  <button onClick={() => copyAgreementLink(agreement)} title="Copy tracked student link" className="h-10 w-10 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg">
                    <Copy size={16} />
                  </button>
                  {agreement.signedPdfUrl && (
                    <a href={agreement.signedPdfUrl} target="_blank" rel="noreferrer" title="Open signed student agreement" className="h-10 w-10 flex items-center justify-center border border-emerald-400/25 bg-emerald-400/10 hover:bg-emerald-400/15 text-emerald-300 rounded-lg">
                      <FileSignature size={16} />
                    </a>
                  )}
                  {!agreement.signedPdfUrl && (
                    <label title="Attach existing signed agreement PDF" className="h-10 w-10 flex items-center justify-center border border-amber-400/25 bg-amber-400/10 hover:bg-amber-400/15 text-amber-300 rounded-lg cursor-pointer">
                      {uploadingSignedAgreement === agreement.id ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        disabled={uploadingSignedAgreement === agreement.id}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) attachSignedAgreement(agreement, file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  )}
                  {latestReceiptFor(agreement)?.receiptPdfUrl && (
                    <a href={latestReceiptFor(agreement).receiptPdfUrl} target="_blank" rel="noreferrer" title="Open latest payment receipt" className="h-10 w-10 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg">
                      <ReceiptText size={16} />
                    </a>
                  )}
                  {latestReceiptFor(agreement)?.receiptPdfPath && (
                    <button onClick={() => emailLatestReceipt(agreement)} disabled={emailingReceipt === agreement.id} title="Email latest receipt" className="h-10 w-10 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg disabled:opacity-50">
                      {emailingReceipt === agreement.id ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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

      {paymentAgreement && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="student-payment-title">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0b0b0c] border border-white/15 rounded-xl shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#0b0b0c] border-b border-white/10 px-6 py-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#78c8ff] font-bold mb-1">Student Payment</p>
                <h2 id="student-payment-title" className="text-xl font-bold text-white">{paymentAgreement.studentName}</h2>
                <p className="text-sm text-white/45 mt-1">{paymentAgreement.program}</p>
              </div>
              <button onClick={() => setPaymentAgreement(null)} disabled={recordingPayment} title="Close payment window" className="h-10 w-10 shrink-0 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-lg disabled:opacity-50">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 border-y border-white/10 mb-6">
                <div className="py-4 pr-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Class Total</p>
                  <p className="text-lg font-bold text-white">{money(String(paymentAgreement.classPrice || 0))}</p>
                </div>
                <div className="py-4 px-3 border-x border-white/10">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Paid So Far</p>
                  <p className="text-lg font-bold text-emerald-300">{money(String(paymentAgreement.totalPaid || 0))}</p>
                </div>
                <div className="py-4 pl-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Balance</p>
                  <p className="text-lg font-bold text-amber-300">{money(String(paymentAgreement.balanceDue || 0))}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Payment Amount</label>
                  <div className="relative">
                    <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                    <input type="number" min="0.01" max={paymentAgreement.balanceDue} step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} className="w-full bg-black border border-white/10 rounded-lg pl-9 pr-3 py-3 text-white outline-none focus:border-[#78c8ff]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Payment Date</label>
                  <input type="date" value={paymentForm.paymentDate} onChange={(event) => setPaymentForm({ ...paymentForm, paymentDate: event.target.value })} className="w-full bg-black border border-white/10 rounded-lg px-3 py-3 text-white outline-none focus:border-[#78c8ff] [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Payment Method</label>
                  <div className="relative">
                    <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
                    <select value={paymentForm.method} onChange={(event) => setPaymentForm({ ...paymentForm, method: event.target.value })} className="w-full appearance-none bg-black border border-white/10 rounded-lg pl-9 pr-3 py-3 text-white outline-none focus:border-[#78c8ff]">
                      <option>Zelle</option>
                      <option>Cash</option>
                      <option>Credit / Debit Card</option>
                      <option>Cash App</option>
                      <option>Venmo</option>
                      <option>Check</option>
                      <option>Bank Transfer</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Reference <span className="text-white/25">Optional</span></label>
                  <input value={paymentForm.reference} onChange={(event) => setPaymentForm({ ...paymentForm, reference: event.target.value })} placeholder="Transaction ID or confirmation" className="w-full bg-black border border-white/10 rounded-lg px-3 py-3 text-white outline-none focus:border-[#78c8ff]" />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Internal Note <span className="text-white/25">Optional</span></label>
                <textarea value={paymentForm.note} onChange={(event) => setPaymentForm({ ...paymentForm, note: event.target.value })} rows={3} placeholder="Any payment details you want stored on the record" className="w-full bg-black border border-white/10 rounded-lg px-3 py-3 text-white outline-none focus:border-[#78c8ff] resize-none" />
              </div>

              <div className="border-y border-white/10 py-4 mb-5 grid grid-cols-[1fr_auto] gap-4 items-center">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2"><ReceiptText size={16} className="text-[#78c8ff]" /> Receipt Summary</p>
                  <p className="text-xs text-white/40 mt-1">New balance after payment</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">{money(String(Math.max(Number(paymentAgreement.balanceDue || 0) - Number(paymentForm.amount || 0), 0)))}</p>
                  {Number(paymentForm.amount || 0) >= Number(paymentAgreement.balanceDue || 0) && (
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mt-1">Paid in Full</p>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input type="checkbox" checked={paymentForm.sendReceipt} onChange={(event) => setPaymentForm({ ...paymentForm, sendReceipt: event.target.checked })} className="mt-1 h-4 w-4 accent-[#78c8ff]" />
                <span>
                  <span className="block text-sm font-bold text-white">Email receipt to {paymentAgreement.studentEmail}</span>
                  <span className="block text-xs text-white/40 mt-1">The receipt and original signed agreement will be attached when available.</span>
                </span>
              </label>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button onClick={() => setPaymentAgreement(null)} disabled={recordingPayment} className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold disabled:opacity-50">Cancel</button>
                <button onClick={recordStudentPayment} disabled={recordingPayment} className="px-5 py-3 bg-[#78c8ff] hover:bg-white text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {recordingPayment ? <Loader2 size={17} className="animate-spin" /> : paymentForm.sendReceipt ? <Mail size={17} /> : <CheckCircle2 size={17} />}
                  {recordingPayment ? "Recording..." : paymentForm.sendReceipt ? "Record Payment & Email Receipt" : "Record Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
