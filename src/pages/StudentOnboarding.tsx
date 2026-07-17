import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CheckCircle2, ExternalLink, FileText, Loader2, PenTool, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_TERMS = [
  "Student understands that epoxy/resin training includes hands-on work with tools, concrete preparation equipment, chemicals, coatings, dust, and active jobsite conditions.",
  "Student agrees to follow all safety instructions, wear required PPE, and immediately stop work if instructed by Jake Epoxy / Resin Academics.",
  "Student acknowledges that training materials, installation processes, pricing methods, sales systems, and Resin Academics curriculum are proprietary and may not be copied, resold, or redistributed.",
  "Student understands that results after training depend on their own effort, market, sales ability, workmanship, follow-up, and business execution.",
  "Student grants Resin Academics permission to document training with photos/videos for education, internal records, and promotional content unless otherwise agreed in writing.",
  "Deposits and training payments are non-refundable unless otherwise agreed in writing. Rescheduling is handled case by case based on availability."
];

export default function StudentOnboarding() {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const sigRef = useRef<any>(null);
  const prefill = useMemo(() => ({
    name: params.get("name") || "",
    email: params.get("email") || "",
    program: params.get("program") || "Private Epoxy / Resin Training",
    trainingDate: params.get("date") || "",
    classPrice: params.get("price") || "",
    agreementUrl: params.get("agreement") || "",
    agreementName: params.get("agreementName") || "Student Training Agreement.pdf",
  }), [params]);

  const [form, setForm] = useState({
    fullName: prefill.name,
    email: prefill.email,
    phone: "",
    cityState: "",
    emergencyContact: "",
    program: prefill.program,
    trainingDate: prefill.trainingDate,
    notes: "",
  });
  const [acceptedSafety, setAcceptedSafety] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [pdfBase64, setPdfBase64] = useState("");

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const classPriceLabel = useMemo(() => {
    if (!prefill.classPrice.trim()) return "Not specified";
    const amount = Number(prefill.classPrice);
    return Number.isFinite(amount)
      ? amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
      : prefill.classPrice;
  }, [prefill.classPrice]);

  const pdfSafeText = (value: string) => value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();

  async function buildCustomAgreementPdf(signatureData: string) {
    const response = await fetch(prefill.agreementUrl);
    if (!response.ok) throw new Error("Your agreement could not be opened. Please contact Resin Academics for a new link.");

    const pdfDoc = await PDFDocument.load(await response.arrayBuffer());
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const signatureBytes = await fetch(signatureData).then((res) => res.arrayBuffer());
    const signatureImage = await pdfDoc.embedPng(signatureBytes);
    const page = pdfDoc.addPage([612, 792]);
    const signedAt = new Date().toLocaleString();
    const verificationId = `STUDENT-${Date.now()}`;

    const fitText = (value: string, maxWidth: number, fontSize = 11) => {
      const clean = pdfSafeText(value) || "N/A";
      if (regular.widthOfTextAtSize(clean, fontSize) <= maxWidth) return clean;
      let shortened = clean;
      while (shortened.length > 1 && regular.widthOfTextAtSize(`${shortened}...`, fontSize) > maxWidth) {
        shortened = shortened.slice(0, -1);
      }
      return `${shortened}...`;
    };

    page.drawRectangle({ x: 0, y: 696, width: 612, height: 96, color: rgb(0.03, 0.035, 0.045) });
    page.drawText("RESIN ACADEMICS", { x: 48, y: 750, size: 20, font: bold, color: rgb(1, 1, 1) });
    page.drawText("STUDENT AGREEMENT EXECUTION RECORD", { x: 48, y: 726, size: 10, font: bold, color: rgb(0.47, 0.78, 1) });

    page.drawText("SIGNED TRAINING DETAILS", { x: 48, y: 650, size: 11, font: bold, color: rgb(0.1, 0.15, 0.22) });
    const fields = [
      ["Student", form.fullName],
      ["Email", form.email],
      ["Phone", form.phone || "N/A"],
      ["Program", form.program],
      ["Training Date", form.trainingDate || "To be scheduled"],
      ["Class Price", classPriceLabel],
      ["Agreement", prefill.agreementName],
      ["Signed At", signedAt],
    ];
    let fieldY = 618;
    fields.forEach(([label, value]) => {
      page.drawText(`${label}:`, { x: 48, y: fieldY, size: 10, font: bold, color: rgb(0.35, 0.4, 0.48) });
      page.drawText(fitText(value, 375), { x: 155, y: fieldY, size: 11, font: regular, color: rgb(0.05, 0.07, 0.1) });
      fieldY -= 28;
    });

    page.drawRectangle({ x: 48, y: 285, width: 516, height: 90, color: rgb(0.95, 0.97, 0.99), borderColor: rgb(0.82, 0.86, 0.9), borderWidth: 1 });
    page.drawText("ELECTRONIC ACKNOWLEDGEMENT", { x: 64, y: 345, size: 10, font: bold, color: rgb(0.1, 0.15, 0.22) });
    const acknowledgement = "I confirm that I reviewed every page of the attached training agreement and the safety and training terms presented during onboarding. I agree to be legally bound by them and adopt the signature below as my electronic signature.";
    const acknowledgementWords = acknowledgement.split(" ");
    const acknowledgementLines: string[] = [];
    let line = "";
    acknowledgementWords.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (regular.widthOfTextAtSize(candidate, 9) > 480) {
        acknowledgementLines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) acknowledgementLines.push(line);
    acknowledgementLines.forEach((text, index) => {
      page.drawText(text, { x: 64, y: 324 - (index * 14), size: 9, font: regular, color: rgb(0.25, 0.3, 0.38) });
    });

    page.drawText("DIGITAL SIGNATURE", { x: 48, y: 245, size: 10, font: bold, color: rgb(0.1, 0.15, 0.22) });
    page.drawImage(signatureImage, { x: 48, y: 135, width: 240, height: 90 });
    page.drawLine({ start: { x: 48, y: 130 }, end: { x: 320, y: 130 }, thickness: 1, color: rgb(0.6, 0.65, 0.72) });
    page.drawText(fitText(form.fullName, 272, 10), { x: 48, y: 112, size: 10, font: regular, color: rgb(0.2, 0.25, 0.32) });
    page.drawText(`Verification ID: ${verificationId}`, { x: 48, y: 72, size: 8, font: regular, color: rgb(0.5, 0.55, 0.62) });
    page.drawText("Executed through Resin OS", { x: 419, y: 72, size: 8, font: regular, color: rgb(0.5, 0.55, 0.62) });

    return pdfDoc.saveAsBase64();
  }

  async function buildPdf(signatureData: string) {
    if (prefill.agreementUrl) return buildCustomAgreementPdf(signatureData);

    const doc = new jsPDF();
    const margin = 16;
    let y = 18;

    const addText = (text: string, size = 10, bold = false, gap = 6) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, 180);
      lines.forEach((line: string) => {
        if (y > 276) {
          doc.addPage();
          y = 18;
        }
        doc.text(line, margin, y);
        y += gap;
      });
    };

    doc.setFillColor(8, 9, 11);
    doc.roundedRect(8, 8, 194, 40, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Resin Academics", margin, 25);
    doc.setFontSize(10);
    doc.setTextColor(120, 200, 255);
    doc.text("Student Training Onboarding Agreement", margin, 34);
    y = 60;

    doc.setTextColor(15, 23, 42);
    addText("Student Information", 14, true, 8);
    addText(`Name: ${form.fullName}`);
    addText(`Email: ${form.email}`);
    addText(`Phone: ${form.phone || "N/A"}`);
    addText(`City / State: ${form.cityState || "N/A"}`);
    addText(`Emergency Contact: ${form.emergencyContact || "N/A"}`);
    addText(`Program: ${form.program}`);
    addText(`Training Date: ${form.trainingDate || "To be scheduled"}`);
    addText(`Class Price: ${classPriceLabel}`);
    y += 4;

    addText("Agreement Terms", 14, true, 8);
    DEFAULT_TERMS.forEach((term) => addText(`- ${term}`, 9, false, 5));

    if (form.notes.trim()) {
      y += 4;
      addText("Student Notes", 14, true, 8);
      addText(form.notes, 9, false, 5);
    }

    y += 6;
    addText("Acknowledgement", 14, true, 8);
    addText(`I, ${form.fullName}, confirm that I have reviewed and agree to the safety expectations, training terms, and onboarding agreement above. Signed electronically on ${new Date().toLocaleString()}.`, 9, false, 5);

    if (y > 235) {
      doc.addPage();
      y = 18;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Digital Signature", margin, y + 8);
    doc.addImage(signatureData, "PNG", margin, y + 12, 70, 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Verification ID: STUDENT-${Date.now()}`, margin, y + 46);

    return doc.output("datauristring").split(",")[1];
  }

  async function submit() {
    if (!form.fullName || !form.email) {
      toast({ title: "Missing info", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    if (!acceptedSafety || !acceptedTerms) {
      toast({ title: "Acknowledgement required", description: "Please accept the safety and training terms.", variant: "destructive" });
      return;
    }
    if (sigRef.current?.isEmpty()) {
      toast({ title: "Signature required", description: "Please sign before submitting.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const signatureData = sigRef.current.getCanvas().toDataURL("image/png");
      const pdf = await buildPdf(signatureData);
      setPdfBase64(pdf);

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: ["Pourmastersllc@gmail.com", "jakeflowers222@gmail.com", form.email],
          subject: `Student Onboarding Signed: ${form.fullName}`,
          html: `
            <h2>Student Onboarding Signed</h2>
            <p><strong>Student:</strong> ${form.fullName}</p>
            <p><strong>Email:</strong> ${form.email}</p>
            <p><strong>Phone:</strong> ${form.phone || "N/A"}</p>
            <p><strong>Program:</strong> ${form.program}</p>
            <p><strong>Training Date:</strong> ${form.trainingDate || "To be scheduled"}</p>
            <p><strong>Class Price:</strong> ${classPriceLabel}</p>
            <p>The completed signed ${prefill.agreementUrl ? "student agreement" : "onboarding agreement"} is attached.</p>
          `,
          attachments: [{ filename: `Signed_Student_Agreement_${form.fullName.replace(/\s+/g, "_")}.pdf`, content: pdf }]
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Could not send signed onboarding.");
      }
      setComplete(true);
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message || "Please try again.", variant: "destructive" });
    }
    setSubmitting(false);
  }

  if (complete) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="max-w-xl bg-[#111] border border-emerald-500/30 rounded-3xl p-10 text-center">
          <CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={56} />
          <h1 className="text-3xl font-bold mb-3">You're Signed In</h1>
          <p className="text-white/60 mb-6">Your student onboarding agreement has been sent to you and Resin Academics.</p>
          {pdfBase64 && (
            <a href={`data:application/pdf;base64,${pdfBase64}`} download={`Signed_Student_Agreement_${form.fullName.replace(/\s+/g, "_")}.pdf`} className="inline-flex items-center gap-2 bg-white text-black px-5 py-3 rounded-xl font-bold">
              <FileText size={18} /> Download Copy
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="border-b border-white/10 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 bg-[#78c8ff]/10 border border-[#78c8ff]/20 text-[#78c8ff] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <ShieldCheck size={14} /> Student Intake
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Resin Academics Training Onboarding</h1>
          <p className="text-white/60 mt-3">Complete this form before your hands-on epoxy/resin training.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 border-y border-white/10 mb-8">
          <div className="py-4 md:pr-5">
            <p className="text-[11px] uppercase tracking-widest text-white/35 font-bold mb-1">Program</p>
            <p className="font-bold text-white">{form.program}</p>
          </div>
          <div className="py-4 md:px-5 md:border-x border-white/10">
            <p className="text-[11px] uppercase tracking-widest text-white/35 font-bold mb-1">Training Date</p>
            <p className="font-bold text-white">{form.trainingDate || "To be scheduled"}</p>
          </div>
          <div className="py-4 md:pl-5">
            <p className="text-[11px] uppercase tracking-widest text-white/35 font-bold mb-1">Class Price</p>
            <p className="font-bold text-[#78c8ff]">{classPriceLabel}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[
            ["fullName", "Full Legal Name", "Your full name"],
            ["email", "Email", "you@email.com"],
            ["phone", "Phone", "(555) 123-4567"],
            ["cityState", "City / State", "El Paso, TX"],
            ["emergencyContact", "Emergency Contact", "Name + phone"],
            ["trainingDate", "Training Date", "To be scheduled"],
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="block text-xs uppercase tracking-widest text-white/40 font-bold mb-2">{label}</label>
              <input value={(form as any)[key]} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#78c8ff]" />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-white/40 font-bold mb-2">Program</label>
            <input value={form.program} onChange={(e) => update("program", e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#78c8ff]" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-white/40 font-bold mb-2">Notes / Goals</label>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={4} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#78c8ff] resize-none" placeholder="What are you hoping to learn or accomplish?" />
          </div>
        </div>

        {prefill.agreementUrl && (
          <section className="bg-[#111] border border-[#78c8ff]/20 rounded-2xl overflow-hidden mb-8">
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-widest text-[#78c8ff] font-bold mb-1">Required Review</p>
                <h2 className="font-bold text-lg truncate">{prefill.agreementName}</h2>
                <p className="text-white/45 text-sm mt-1">Review every page before adding your signature below.</p>
              </div>
              <a href={prefill.agreementUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-bold shrink-0">
                <ExternalLink size={16} /> Open PDF
              </a>
            </div>
            <iframe src={`${prefill.agreementUrl}#toolbar=0`} title="Student training agreement" className="hidden md:block w-full h-[640px] bg-white border-0" />
          </section>
        )}

        <section className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Safety & Training Terms</h2>
          <div className="space-y-3 text-white/70 text-sm leading-relaxed">
            {DEFAULT_TERMS.map((term, i) => <p key={i}>{i + 1}. {term}</p>)}
          </div>
        </section>

        <div className="space-y-3 mb-8">
          <label className="flex gap-3 items-start text-sm text-white/70">
            <input type="checkbox" checked={acceptedSafety} onChange={(e) => setAcceptedSafety(e.target.checked)} className="mt-1" />
            I agree to follow safety instructions, wear required PPE, and act responsibly during training.
          </label>
          <label className="flex gap-3 items-start text-sm text-white/70">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1" />
            I have read and agree to {prefill.agreementUrl ? "the uploaded student agreement and " : ""}the training terms above, including the class price shown.
          </label>
        </div>

        <section className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2"><PenTool size={18} /> Digital Signature</h2>
            <button onClick={() => sigRef.current?.clear()} className="text-xs text-white/40 hover:text-white">Clear</button>
          </div>
          <div className="bg-white rounded-xl overflow-hidden">
            <SignatureCanvas ref={sigRef} canvasProps={{ className: "w-full h-40 cursor-crosshair" }} />
          </div>
        </section>

        <button onClick={submit} disabled={submitting} className="w-full bg-[#78c8ff] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
          {submitting ? "Submitting..." : "Sign & Submit Student Onboarding"}
        </button>
      </div>
    </div>
  );
}
