import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";
import { AlertTriangle, CheckCircle2, FileText, Loader2, PenTool, Scale, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const AGREEMENT_VERSION = "RA-STUDENT-2026-07";

type ContractSection = {
  title: string;
  paragraphs: string[];
  emphasis?: "refund" | "release";
};

export default function StudentOnboarding() {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const sigRef = useRef<any>(null);
  const trackingId = params.get("tracking") || "";
  const previewMode = params.get("preview") === "1";
  const prefill = useMemo(() => ({
    name: params.get("name") || "",
    email: params.get("email") || "",
    program: params.get("program") || "Private Epoxy / Resin Training",
    trainingDate: params.get("date") || "",
    classPrice: params.get("price") || "",
    paidAmount: params.get("paidAmount") || "",
    paidDate: params.get("paidDate") || "",
    nextAmount: params.get("nextAmount") || "",
    nextDate: params.get("nextDate") || "",
    finalDue: params.get("finalDue") || "",
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
  const [acceptedRefundPolicy, setAcceptedRefundPolicy] = useState(false);
  const [acceptedRelease, setAcceptedRelease] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [pdfBase64, setPdfBase64] = useState("");
  const [agreementRecordId, setAgreementRecordId] = useState(trackingId);
  const [emailDelivered, setEmailDelivered] = useState(true);

  useEffect(() => {
    if (previewMode) return;
    const controller = new AbortController();

    fetch("/api/student-agreement-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        action: "open",
        trackingId,
        agreement: {
          studentName: prefill.name,
          studentEmail: prefill.email,
          program: prefill.program,
          trainingDate: prefill.trainingDate,
          classPrice: prefill.classPrice,
          paidAmount: prefill.paidAmount,
          paidDate: prefill.paidDate,
          nextAmount: prefill.nextAmount,
          nextDate: prefill.nextDate,
          finalDue: prefill.finalDue,
        },
      }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Could not record agreement activity.");
        if (data?.id) setAgreementRecordId(data.id);
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Student agreement open event failed", error);
      });

    return () => controller.abort();
  }, [prefill, previewMode, trackingId]);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const classPriceLabel = useMemo(() => {
    if (!prefill.classPrice.trim()) return "Not specified";
    const amount = Number(prefill.classPrice);
    return Number.isFinite(amount)
      ? amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
      : prefill.classPrice;
  }, [prefill.classPrice]);

  const formatMoney = (value: string | number) => {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
      : "$0.00";
  };

  const formatDate = (value: string, fallback: string) => {
    if (!value) return fallback;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const paymentSchedule = useMemo(() => {
    const total = Number(prefill.classPrice || 0);
    const paid = Number(prefill.paidAmount || 0);
    const next = Number(prefill.nextAmount || 0);
    const remaining = Math.max(total - paid - next, 0);
    const today = new Date().toISOString().slice(0, 10);
    return {
      hasSchedule: Boolean(prefill.paidAmount || prefill.nextAmount),
      paid,
      next,
      remaining,
      nextStatus: prefill.nextDate === today ? "Due Today" : "Upcoming",
    };
  }, [prefill.classPrice, prefill.nextAmount, prefill.nextDate, prefill.paidAmount]);

  const paymentPlanDescription = paymentSchedule.hasSchedule
    ? `${formatMoney(paymentSchedule.paid)} previously paid; ${formatMoney(paymentSchedule.next)} due ${formatDate(prefill.nextDate, "as scheduled")}; ${formatMoney(paymentSchedule.remaining)} final balance ${prefill.finalDue || "due as scheduled"}.`
    : `The total training price is ${classPriceLabel}, payable according to the schedule communicated by Provider.`;

  const contractSections: ContractSection[] = [
    {
      title: "1. PARTIES AND TRAINING SERVICES",
      paragraphs: [
        `This Student Training Agreement (Agreement) is between ${form.fullName || "the signing student"} (Student) and Pour Masters LLC, Jacob Flores individually, and the Jake Epoxy and Resin Academics business and brand names (collectively, Provider). Provider's owners, members, managers, employees, contractors, instructors, agents, successors, assigns, premises owners, hosts, and equipment providers are included as Released Parties where that term is used below.`,
        `Provider will deliver the ${form.program} program on ${form.trainingDate || "a date to be scheduled"}. Training may include classroom instruction, demonstrations, hands-on surface preparation, mixing and application of resin or coating products, equipment operation, business education, and related activities. Provider may reasonably adjust the schedule, location, sequence, instructor, or exercises for safety, weather, availability, or instructional quality.`,
      ],
    },
    {
      title: "2. FINAL SALE; NO REFUNDS; STUDENT-SPECIFIC PURCHASES",
      emphasis: "refund",
      paragraphs: [
        "STUDENT UNDERSTANDS AND AGREES THAT ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE, EXCEPT ONLY TO THE EXTENT A NON-WAIVABLE LAW REQUIRES OTHERWISE.",
        `The total class price is ${classPriceLabel}. ${paymentPlanDescription}`,
        "The initial payment becomes non-refundable immediately upon receipt because Provider begins performance and commits money and resources for this Student, including purchasing or reserving student-specific epoxy/resin materials, coatings, pigments, flakes, consumables, PPE and training gear; reserving equipment and workspace; preparing curriculum; and holding a limited class seat that may not be resold.",
        "All later payments are also final and non-refundable once paid. The parties agree this policy is a reasonable allocation of Provider's actual and anticipated preparation costs, inventory commitments, administrative time, and lost booking opportunities, and is not a penalty. Provider may reschedule or provide substantially equivalent training, materials, or credit if Provider cannot perform on the original date.",
      ],
    },
    {
      title: "3. STUDENT CANCELLATION, NO-SHOW, AND RESCHEDULING",
      paragraphs: [
        "Student cancellation, failure to attend, late arrival, removal for unsafe conduct, or inability to complete training does not create a right to a refund or eliminate any unpaid balance. With at least fourteen calendar days' written notice, Provider may allow one transfer to another available date within ninety days, subject to availability, replacement-material costs, and Provider's written approval. A reschedule is a courtesy, not a guaranteed right.",
        "Provider may postpone training because of weather, illness, emergency, unsafe conditions, supply interruption, facility issues, or events beyond reasonable control. In that event, Provider may select a reasonable replacement date or equivalent delivery method, and the no-refund policy remains in effect to the fullest extent permitted by law.",
      ],
    },
    {
      title: "4. SAFETY, FITNESS, AND VOLUNTARY ASSUMPTION OF RISK",
      paragraphs: [
        "Student represents that Student is at least eighteen years old, is legally able to sign this Agreement, and is physically and mentally able to participate safely. Student will disclose relevant allergies, respiratory conditions, medications, mobility limits, or other conditions before participating, will use required PPE, follow labels and safety data sheets, obey all instructions, and immediately stop when directed.",
        "Student knowingly and voluntarily assumes all inherent and ordinary risks of epoxy/resin and contractor training, whether known or unknown, including chemical exposure, fumes, skin or eye irritation, allergic reaction, burns, dust and silica exposure, slips and falls, cuts, lifting injuries, noise, rotating or electrical equipment, property damage, and serious bodily injury or death. Student may decline any exercise and remains responsible for choosing whether to participate.",
      ],
    },
    {
      title: "5. CONSPICUOUS RELEASE OF LIABILITY, INCLUDING ORDINARY NEGLIGENCE",
      emphasis: "release",
      paragraphs: [
        "TO THE MAXIMUM EXTENT PERMITTED BY TEXAS LAW, STUDENT RELEASES, WAIVES, AND AGREES NOT TO SUE ANY RELEASED PARTY FOR ANY CLAIM, DAMAGE, INJURY, ILLNESS, DEATH, PROPERTY LOSS, OR EXPENSE ARISING FROM OR RELATED TO THE TRAINING, PREMISES, MATERIALS, EQUIPMENT, TRAVEL BETWEEN TRAINING LOCATIONS, OR STUDENT'S PARTICIPATION, INCLUDING A CLAIM CAUSED IN WHOLE OR IN PART BY THE ORDINARY NEGLIGENCE OF JACOB FLORES, JAKE EPOXY, POUR MASTERS LLC, RESIN ACADEMICS, OR ANY OTHER RELEASED PARTY.",
        "This release is intended to expressly cover the Released Parties' own future ordinary negligence and applies to Student and Student's heirs, estate, representatives, and assigns. It does not release gross negligence, reckless or intentional misconduct, or any liability that applicable law does not allow the parties to waive.",
      ],
    },
    {
      title: "6. STUDENT CONDUCT, DAMAGE, AND THIRD-PARTY CLAIMS",
      paragraphs: [
        "Student is responsible for losses, property damage, cleanup, fines, or injuries caused by Student's failure to follow instructions or by Student's negligent, reckless, unlawful, or intentional conduct. To the extent permitted by law, Student will defend and indemnify the Released Parties from third-party claims caused by that conduct. This obligation does not require Student to indemnify a Released Party for that Released Party's gross negligence or intentional misconduct.",
        "Provider may immediately remove Student from training for unsafe, disruptive, threatening, intoxicated, unlawful, or abusive conduct. Removal is not a cancellation by Provider and does not create a refund or credit.",
      ],
    },
    {
      title: "7. EDUCATIONAL PURPOSE; NO GUARANTEE OF RESULTS",
      paragraphs: [
        "Training is educational and is not a state license, trade certification, legal advice, tax advice, engineering advice, or guarantee of employment, revenue, profit, sales, project awards, coating performance, or business success. Results depend on Student's practice, workmanship, products, surface conditions, compliance, insurance, market, and business decisions.",
        "Student is solely responsible for following product instructions, safety data sheets, building codes, environmental rules, OSHA requirements, licensing rules, insurance requirements, and other laws when performing work after training. Student will independently evaluate each future job and will not represent that Provider supervises or guarantees Student's work.",
      ],
    },
    {
      title: "8. CURRICULUM, INTELLECTUAL PROPERTY, AND RECORDINGS",
      paragraphs: [
        "Provider retains all ownership of its curriculum, manuals, forms, pricing tools, videos, processes, branding, sales systems, and other training content. Student receives a personal, non-transferable license to use the knowledge and provided materials in Student's own business. Student may not copy, record, publish, share, sell, sublicense, teach from, upload, or redistribute Provider's protected materials or account access without prior written permission.",
        "Student may use general skills learned in training to perform Student's own projects. This section protects Provider's specific materials, content, branding, and confidential business information; it does not prohibit lawful competition or Student's independent use of general industry knowledge.",
      ],
    },
    {
      title: "9. PHOTOS, VIDEO, AND TRAINING DOCUMENTATION",
      paragraphs: [
        "Provider may photograph or record training for safety documentation, education, internal records, and promotional use without additional compensation. A Student who does not want their identifiable image or voice used publicly must give Provider written notice before training begins. Provider will use reasonable efforts to honor a timely written opt-out for future public use.",
      ],
    },
    {
      title: "10. MATERIALS, GEAR, AND EQUIPMENT",
      paragraphs: [
        "Materials, consumables, PPE, gear, tools, and equipment purchased or reserved for training may be opened, allocated, consumed, contaminated, fitted, or otherwise made unavailable for resale. Only items that Provider expressly identifies as take-home items become Student's property. All other tools, machines, samples, inventory, and equipment remain Provider's property.",
      ],
    },
    {
      title: "11. LIMITATION OF ECONOMIC DAMAGES",
      paragraphs: [
        "To the fullest extent permitted by law, Provider will not be liable for lost profits, lost jobs, lost business opportunities, indirect, incidental, special, exemplary, or consequential damages arising from the training or Student's later work. For claims that may not be released under Section 5, Provider's aggregate liability for contract or economic loss will not exceed the amount Student actually paid under this Agreement. These limits do not apply where applicable law prohibits them.",
      ],
    },
    {
      title: "12. TEXAS LAW, DISPUTE PROCESS, AND VENUE",
      paragraphs: [
        "Texas law governs this Agreement without regard to conflict-of-law rules. Before filing suit, the parties will make a good-faith effort to resolve a dispute through written notice and an informal conference. If unresolved, the parties agree to attempt non-binding mediation in El Paso County, Texas before trial, unless emergency injunctive relief is reasonably necessary to protect safety, property, confidential information, or intellectual property.",
        "Any lawsuit arising from this Agreement must be brought in a court of competent jurisdiction in El Paso County, Texas, and each party consents to that venue and jurisdiction. Nothing in this Agreement waives a right or remedy that applicable law makes non-waivable.",
      ],
    },
    {
      title: "13. COMPLETE AGREEMENT AND ELECTRONIC SIGNATURE",
      paragraphs: [
        `This Agreement, the payment schedule displayed with it, and any written addendum signed by both parties are the complete agreement concerning the training. Changes must be in a writing accepted by both parties. If one provision is unenforceable, it will be enforced to the maximum lawful extent and the remaining provisions will continue. Version: ${AGREEMENT_VERSION}.`,
        "Student consents to electronic records and signatures, intends the signature below to be Student's legal signature, and agrees that the electronic copy and verification record may be used as an original. Student confirms having had the opportunity to read the entire Agreement, ask questions, seek independent legal advice, and decline to participate before signing.",
      ],
    },
  ];

  function buildPdf(signatureData: string) {
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
    doc.text("Student Training Agreement, Assumption of Risk & Release", margin, 34);
    y = 60;

    doc.setTextColor(15, 23, 42);
    addText("Agreement Details", 14, true, 8);
    addText(`Name: ${form.fullName}`);
    addText(`Email: ${form.email}`);
    addText(`Phone: ${form.phone || "N/A"}`);
    addText(`City / State: ${form.cityState || "N/A"}`);
    addText(`Emergency Contact: ${form.emergencyContact || "N/A"}`);
    addText(`Program: ${form.program}`);
    addText(`Training Date: ${form.trainingDate || "To be scheduled"}`);
    addText(`Class Price: ${classPriceLabel}`);
    if (paymentSchedule.hasSchedule) {
      y += 4;
      addText("Payment Schedule", 14, true, 8);
      if (prefill.paidAmount) addText(`Previously Paid: ${formatMoney(paymentSchedule.paid)} - ${formatDate(prefill.paidDate, "Date not specified")}`);
      if (prefill.nextAmount) addText(`Next Payment: ${formatMoney(paymentSchedule.next)} - ${formatDate(prefill.nextDate, "Date not specified")}`);
      addText(`Remaining After Next Payment: ${formatMoney(paymentSchedule.remaining)} - ${prefill.finalDue || "Due date not specified"}`);
    }
    y += 4;

    addText("Student Training Agreement", 15, true, 9);
    addText(`Agreement Version: ${AGREEMENT_VERSION}`, 8, false, 5);
    contractSections.forEach((section) => {
      if (y > 248) {
        doc.addPage();
        y = 18;
      } else {
        y += 4;
      }
      if (section.emphasis === "release") doc.setTextColor(153, 27, 27);
      else if (section.emphasis === "refund") doc.setTextColor(146, 64, 14);
      else doc.setTextColor(15, 23, 42);
      addText(section.title, 11, true, 6);
      section.paragraphs.forEach((paragraph, index) => {
        const emphasizedOpening = Boolean(section.emphasis && index === 0);
        doc.setTextColor(15, 23, 42);
        addText(paragraph, emphasizedOpening ? 9.5 : 9, emphasizedOpening, 4.8);
        y += 2;
      });
    });

    if (form.notes.trim()) {
      y += 4;
      addText("Student Notes", 14, true, 8);
      addText(form.notes, 9, false, 5);
    }

    y += 6;
    doc.setTextColor(15, 23, 42);
    addText("Electronic Acknowledgement", 14, true, 8);
    addText(`I, ${form.fullName}, confirm that I read and voluntarily agree to the complete Agreement, including the final-sale/no-refund policy, student-specific materials policy, assumption of risk, conspicuous release of claims caused by the Released Parties' ordinary negligence, payment schedule, and electronic-signature terms. Signed electronically on ${new Date().toLocaleString()}.`, 9, true, 5);

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
    doc.text(`Agreement Version: ${AGREEMENT_VERSION}`, margin, y + 51);

    return doc.output("datauristring").split(",")[1];
  }

  async function submit() {
    if (previewMode) {
      toast({ title: "Preview mode", description: "This preview will not submit or email an agreement." });
      return;
    }
    if (!form.fullName || !form.email) {
      toast({ title: "Missing info", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    if (!acceptedSafety || !acceptedRefundPolicy || !acceptedRelease || !acceptedTerms) {
      toast({ title: "Acknowledgement required", description: "Please accept every agreement acknowledgement before signing.", variant: "destructive" });
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

      const agreement = {
        studentName: form.fullName,
        studentEmail: form.email,
        studentPhone: form.phone,
        cityState: form.cityState,
        emergencyContact: form.emergencyContact,
        program: form.program,
        trainingDate: form.trainingDate,
        classPrice: prefill.classPrice,
        paidAmount: prefill.paidAmount,
        paidDate: prefill.paidDate,
        nextAmount: prefill.nextAmount,
        nextDate: prefill.nextDate,
        finalDue: prefill.finalDue,
      };

      const recordResponse = await fetch("/api/student-agreement-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign",
          trackingId: agreementRecordId || trackingId,
          agreement,
          pdfBase64: pdf,
        }),
      });
      const recordResult = await recordResponse.json().catch(() => null);
      if (!recordResponse.ok) throw new Error(recordResult?.error || "Could not save the signed agreement.");
      if (recordResult?.id) setAgreementRecordId(recordResult.id);

      try {
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
              ${paymentSchedule.hasSchedule ? `
                <p><strong>Previously Paid:</strong> ${formatMoney(paymentSchedule.paid)}${prefill.paidDate ? ` on ${formatDate(prefill.paidDate, "")}` : ""}</p>
                <p><strong>Next Payment:</strong> ${formatMoney(paymentSchedule.next)}${prefill.nextDate ? ` due ${formatDate(prefill.nextDate, "")}` : ""}</p>
                <p><strong>Remaining After Next Payment:</strong> ${formatMoney(paymentSchedule.remaining)}${prefill.finalDue ? ` (${prefill.finalDue})` : ""}</p>
              ` : ""}
              <p>The completed signed Resin Academics Student Training Agreement is attached.</p>
            `,
            attachments: [{ filename: `Signed_Student_Agreement_${form.fullName.replace(/\s+/g, "_")}.pdf`, content: pdf }],
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.error || "Could not email the signed onboarding.");
        }
        setEmailDelivered(true);
      } catch (emailError: any) {
        setEmailDelivered(false);
        toast({
          title: "Agreement saved",
          description: "The signature is safely recorded, but the email copy could not be delivered right now.",
        });
      }
      setComplete(true);
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="max-w-xl bg-[#111] border border-emerald-500/30 rounded-3xl p-10 text-center">
          <CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={56} />
          <h1 className="text-3xl font-bold mb-3">You're Signed In</h1>
          <p className="text-white/60 mb-6">
            {emailDelivered
              ? "Your signed Student Training Agreement has been saved and emailed to you and Resin Academics."
              : "Your signed Student Training Agreement has been saved. The email copy is delayed, but Resin Academics can retrieve it from the agreement record."}
          </p>
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

        {paymentSchedule.hasSchedule && (
          <section className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/35 font-bold mb-1">Payment Plan</p>
                <h2 className="font-bold text-lg">Class Payment Schedule</h2>
              </div>
              <p className="text-sm text-white/45">Total {classPriceLabel}</p>
            </div>
            <div className="divide-y divide-white/10">
              {prefill.paidAmount && (
                <div className="px-5 py-4 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto] items-center gap-3">
                  <div>
                    <p className="font-bold">Previous Payment</p>
                    <p className="text-sm text-white/45 mt-1">{formatDate(prefill.paidDate, "Previously received")}</p>
                  </div>
                  <span className="hidden sm:inline-flex justify-self-start text-[10px] uppercase tracking-widest font-bold text-emerald-400 border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 rounded-full">Paid</span>
                  <p className="font-bold text-emerald-400">{formatMoney(paymentSchedule.paid)}</p>
                </div>
              )}
              {prefill.nextAmount && (
                <div className="px-5 py-4 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto] items-center gap-3">
                  <div>
                    <p className="font-bold">Next Payment</p>
                    <p className="text-sm text-white/45 mt-1">{formatDate(prefill.nextDate, "Date to be arranged")}</p>
                  </div>
                  <span className="hidden sm:inline-flex justify-self-start text-[10px] uppercase tracking-widest font-bold text-[#78c8ff] border border-[#78c8ff]/25 bg-[#78c8ff]/10 px-2.5 py-1 rounded-full">{paymentSchedule.nextStatus}</span>
                  <p className="font-bold text-[#78c8ff]">{formatMoney(paymentSchedule.next)}</p>
                </div>
              )}
              <div className="px-5 py-4 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto] items-center gap-3">
                <div>
                  <p className="font-bold">Final Balance</p>
                  <p className="text-sm text-white/45 mt-1">{prefill.finalDue || "Due timing to be arranged"}</p>
                </div>
                <span className="hidden sm:inline-flex justify-self-start text-[10px] uppercase tracking-widest font-bold text-amber-400 border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 rounded-full">Remaining</span>
                <p className="font-bold text-amber-400">{formatMoney(paymentSchedule.remaining)}</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[
            ["fullName", "Full Legal Name", "Your full name"],
            ["email", "Email", "you@email.com"],
            ["phone", "Phone", "(555) 123-4567"],
            ["cityState", "City / State", "El Paso, TX"],
            ["emergencyContact", "Emergency Contact", "Name + phone"],
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="block text-xs uppercase tracking-widest text-white/40 font-bold mb-2">{label}</label>
              <input value={(form as any)[key]} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#78c8ff]" />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-white/40 font-bold mb-2">Notes / Goals</label>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={4} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#78c8ff] resize-none" placeholder="What are you hoping to learn or accomplish?" />
          </div>
        </div>

        <section className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden mb-8">
          <div className="p-6 border-b border-white/10 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#78c8ff]/10 border border-[#78c8ff]/20 text-[#78c8ff] flex items-center justify-center shrink-0">
              <Scale size={20} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[#78c8ff] font-bold mb-1">Required Agreement</p>
              <h2 className="text-xl md:text-2xl font-bold">Student Training Agreement, Assumption of Risk & Release</h2>
              <p className="text-white/40 text-xs mt-2">Agreement version {AGREEMENT_VERSION}. Read every section before signing.</p>
            </div>
          </div>
          <div className="divide-y divide-white/10">
            {contractSections.map((section) => {
              const criticalClass = section.emphasis === "release"
                ? "bg-red-500/[0.07] border-l-4 border-red-500"
                : section.emphasis === "refund"
                  ? "bg-amber-500/[0.07] border-l-4 border-amber-400"
                  : "";
              return (
                <div key={section.title} className={`p-5 md:p-6 ${criticalClass}`}>
                  <h3 className={`text-sm md:text-base font-bold mb-3 ${section.emphasis === "release" ? "text-red-300" : section.emphasis === "refund" ? "text-amber-300" : "text-white"}`}>
                    {section.title}
                  </h3>
                  <div className="space-y-3 text-white/65 text-sm leading-6">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={index} className={section.emphasis && index === 0 ? "text-white font-bold" : ""}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-3 mb-8 bg-[#111] border border-white/10 rounded-2xl p-5 md:p-6">
          <h2 className="font-bold flex items-center gap-2 mb-4"><AlertTriangle size={18} className="text-amber-400" /> Required Acknowledgements</h2>
          <label className="flex gap-3 items-start text-sm text-white/70 cursor-pointer">
            <input type="checkbox" checked={acceptedSafety} onChange={(e) => setAcceptedSafety(e.target.checked)} className="mt-1" />
            I am at least 18, can legally sign, voluntarily accept the disclosed training risks, and will follow all safety and PPE instructions.
          </label>
          <label className="flex gap-3 items-start text-sm text-white/70 cursor-pointer">
            <input type="checkbox" checked={acceptedRefundPolicy} onChange={(e) => setAcceptedRefundPolicy(e.target.checked)} className="mt-1" />
            <span><strong className="text-amber-300">I understand all payments are final and non-refundable</strong> because my initial payment triggers student-specific material, consumable, PPE/gear, equipment, curriculum, and class-slot commitments.</span>
          </label>
          <label className="flex gap-3 items-start text-sm text-white/70 cursor-pointer">
            <input type="checkbox" checked={acceptedRelease} onChange={(e) => setAcceptedRelease(e.target.checked)} className="mt-1" />
            <span><strong className="text-red-300">I expressly accept the conspicuous release of liability</strong>, including claims caused in whole or part by the ordinary negligence of Jacob Flores, Jake Epoxy, Pour Masters LLC, Resin Academics, or another Released Party, subject to the limits stated in the Agreement.</span>
          </label>
          <label className="flex gap-3 items-start text-sm text-white/70 cursor-pointer">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1" />
            I read the entire Agreement and agree to its payment schedule, intellectual-property terms, media provision, Texas venue, and electronic-signature terms.
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

        <button onClick={submit} disabled={submitting || previewMode} className="w-full bg-[#78c8ff] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
          {previewMode ? "Preview Mode" : submitting ? "Submitting..." : "Sign & Submit Student Onboarding"}
        </button>
      </div>
    </div>
  );
}
