import { randomUUID } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Resend } from "resend";
import {
  buildStudentAgreementRecord,
  cleanMoney,
  cleanText,
  ensureStudentAgreementBucket,
  getServiceClient,
  isSafeAgreementId,
  isValidStudentEmail,
  readStudentAgreement,
  STUDENT_AGREEMENTS_BUCKET,
  StudentPaymentRecord,
  StudentAgreementRecord,
  StudentAgreementStatus,
  roundMoney,
  writeStudentAgreement,
} from "./_studentAgreements.js";
import type { VercelRequest, VercelResponse } from "./_types.js";

const SUPER_ADMIN_EMAIL = "jakeflowers222@gmail.com";
const resend = new Resend(process.env.RESEND_API_KEY);

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function receiptDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "Student";
}

function wrapText(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function buildReceiptPdf(record: StudentAgreementRecord, payment: StudentPaymentRecord) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.035, 0.043, 0.055);
  const blue = rgb(0.47, 0.78, 1);
  const green = rgb(0.12, 0.65, 0.45);
  const muted = rgb(0.40, 0.45, 0.52);
  const ink = rgb(0.06, 0.09, 0.15);

  page.drawRectangle({ x: 0, y: 650, width: 612, height: 142, color: dark });
  page.drawRectangle({ x: 0, y: 642, width: 612, height: 8, color: blue });
  page.drawText("RESIN ACADEMICS", { x: 46, y: 741, size: 11, font: bold, color: blue });
  page.drawText("PAYMENT RECEIPT", { x: 46, y: 695, size: 28, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`Receipt ${payment.receiptNumber}`, { x: 46, y: 672, size: 10, font: regular, color: rgb(0.72, 0.76, 0.82) });

  const paidInFull = record.paymentStatus === "paid";
  page.drawRectangle({ x: 430, y: 690, width: 136, height: 34, color: paidInFull ? green : blue, borderRadius: 6 });
  page.drawText(paidInFull ? "PAID IN FULL" : "PAYMENT RECEIVED", {
    x: paidInFull ? 451 : 438,
    y: 702,
    size: paidInFull ? 11 : 9,
    font: bold,
    color: paidInFull ? rgb(1, 1, 1) : dark,
  });

  page.drawText("RECEIVED FROM", { x: 46, y: 598, size: 8, font: bold, color: muted });
  page.drawText(record.studentName, { x: 46, y: 577, size: 15, font: bold, color: ink });
  page.drawText(record.studentEmail, { x: 46, y: 558, size: 10, font: regular, color: muted });
  page.drawText("PAYMENT DATE", { x: 390, y: 598, size: 8, font: bold, color: muted });
  page.drawText(receiptDate(payment.paymentDate), { x: 390, y: 577, size: 11, font: bold, color: ink });

  page.drawRectangle({ x: 46, y: 454, width: 520, height: 74, color: rgb(0.95, 0.97, 0.99), borderColor: rgb(0.86, 0.89, 0.93), borderWidth: 1 });
  page.drawText("PAYMENT RECEIVED", { x: 66, y: 500, size: 8, font: bold, color: muted });
  page.drawText(money(payment.amount), { x: 66, y: 472, size: 22, font: bold, color: ink });
  page.drawText("METHOD", { x: 350, y: 500, size: 8, font: bold, color: muted });
  page.drawText(payment.method || "Not specified", { x: 350, y: 476, size: 11, font: bold, color: ink });

  const rows = [
    ["Program", record.program],
    ["Training Date", record.trainingDate ? receiptDate(record.trainingDate) : "To be scheduled"],
    ["Agreement", `${record.agreementVersion} / ${record.id.slice(0, 8).toUpperCase()}`],
    ["Contract Total", money(record.classPrice)],
    ["Total Paid", money(record.totalPaid)],
    ["Balance Due", money(record.balanceDue)],
  ];
  let y = 415;
  rows.forEach(([label, value]) => {
    page.drawText(label.toUpperCase(), { x: 46, y, size: 8, font: bold, color: muted });
    page.drawText(value, { x: 260, y, size: 10, font: label === "Balance Due" ? bold : regular, color: label === "Balance Due" && paidInFull ? green : ink });
    page.drawLine({ start: { x: 46, y: y - 11 }, end: { x: 566, y: y - 11 }, thickness: 0.6, color: rgb(0.88, 0.90, 0.93) });
    y -= 38;
  });

  if (payment.reference || payment.note) {
    page.drawText("PAYMENT NOTES", { x: 46, y: 170, size: 8, font: bold, color: muted });
    const note = [payment.reference ? `Reference: ${payment.reference}` : "", payment.note || ""].filter(Boolean).join(" | ");
    wrapText(note, regular, 9, 520).slice(0, 3).forEach((line, index) => {
      page.drawText(line, { x: 46, y: 151 - index * 13, size: 9, font: regular, color: ink });
    });
  }

  page.drawLine({ start: { x: 46, y: 89 }, end: { x: 566, y: 89 }, thickness: 1, color: rgb(0.85, 0.88, 0.91) });
  page.drawText("Pour Masters LLC / Jake Epoxy / Resin Academics", { x: 46, y: 69, size: 9, font: bold, color: ink });
  page.drawText("This receipt records payment applied to the referenced Student Training Agreement and does not replace or modify its signed terms.", {
    x: 46, y: 50, size: 7.5, font: regular, color: muted,
  });

  return pdf.save();
}

async function requireSuperAdmin(req: VercelRequest, supabase: ReturnType<typeof getServiceClient>) {
  const header = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const { data, error } = await supabase.auth.getUser(token);
  return !error && data.user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
}

async function downloadStorageBase64(
  supabase: ReturnType<typeof getServiceClient>,
  path: string,
) {
  const { data, error } = await supabase.storage.from(STUDENT_AGREEMENTS_BUCKET).download(path);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer()).toString("base64");
}

async function sendReceiptEmail(
  supabase: ReturnType<typeof getServiceClient>,
  record: StudentAgreementRecord,
  payment: StudentPaymentRecord,
  receiptBytes?: Uint8Array,
) {
  if (!process.env.RESEND_API_KEY) throw new Error("Receipt email service is not configured.");
  if (!payment.receiptPdfPath) throw new Error("Receipt PDF is missing.");

  const receiptBase64 = receiptBytes
    ? Buffer.from(receiptBytes).toString("base64")
    : await downloadStorageBase64(supabase, payment.receiptPdfPath);
  const attachments: Array<{ filename: string; content: string }> = [{
    filename: `Payment_Receipt_${payment.receiptNumber}.pdf`,
    content: receiptBase64,
  }];

  if (record.signedPdfPath) {
    try {
      attachments.push({
        filename: `Signed_Student_Agreement_${safeFilename(record.studentName)}.pdf`,
        content: await downloadStorageBase64(supabase, record.signedPdfPath),
      });
    } catch (error) {
      console.error("Could not attach the original signed student agreement", error);
    }
  }

  const paidInFull = record.paymentStatus === "paid";
  const result = await resend.emails.send({
    from: "Resin OS <updates@resinacademics.com>",
    to: record.studentEmail,
    cc: ["jakeflowers222@gmail.com", "Pourmastersllc@gmail.com"],
    subject: paidInFull
      ? `Paid in Full Receipt - ${record.program}`
      : `Payment Receipt - ${record.program}`,
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:#090b0e;padding:28px 32px;border-bottom:6px solid #78c8ff;">
      <p style="margin:0 0 8px;color:#78c8ff;font-size:12px;font-weight:800;letter-spacing:1.5px;">RESIN ACADEMICS</p>
      <h1 style="margin:0;color:#ffffff;font-size:26px;">${paidInFull ? "Paid in Full" : "Payment Received"}</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hi ${escapeHtml(record.studentName)},</p>
      <p style="margin:0 0 22px;color:#475569;font-size:15px;line-height:1.6;">This email confirms your payment toward the ${escapeHtml(record.program)} program. Your official receipt is attached${record.signedPdfPath ? ", along with your original signed Student Training Agreement" : ""}.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:0 0 22px;">
        <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:800;letter-spacing:1px;">PAYMENT RECEIVED</p>
        <p style="margin:0 0 18px;font-size:28px;font-weight:800;">${money(payment.amount)}</p>
        <p style="margin:6px 0;color:#475569;"><strong>Date:</strong> ${receiptDate(payment.paymentDate)}</p>
        <p style="margin:6px 0;color:#475569;"><strong>Receipt:</strong> ${payment.receiptNumber}</p>
        <p style="margin:6px 0;color:#475569;"><strong>Total paid:</strong> ${money(record.totalPaid)}</p>
        <p style="margin:6px 0;color:#475569;"><strong>Balance due:</strong> ${money(record.balanceDue)}</p>
      </div>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">Please retain the attached receipt with your signed training agreement for your records.</p>
    </div>
  </div>
</body>
</html>`,
    attachments,
  });

  if (result.error) throw new Error(result.error.message);
  return result.data?.id || "";
}

async function listAgreements(supabase: ReturnType<typeof getServiceClient>) {
  const { data: files, error } = await supabase.storage
    .from(STUDENT_AGREEMENTS_BUCKET)
    .list("records", { limit: 1000 });
  if (error) throw error;

  const records = (await Promise.all(
    (files || [])
      .filter((file) => file.name.endsWith(".json"))
      .map((file) => readStudentAgreement(supabase, file.name.replace(/\.json$/, ""))),
  )).filter((record): record is StudentAgreementRecord => Boolean(record));

  const withDownloads = await Promise.all(records.map(async (record) => {
    let signedPdfUrl = "";
    if (record.signedPdfPath) {
      const { data } = await supabase.storage
        .from(STUDENT_AGREEMENTS_BUCKET)
        .createSignedUrl(record.signedPdfPath, 60 * 60);
      signedPdfUrl = data?.signedUrl || "";
    }

    const payments = await Promise.all(record.payments.map(async (payment) => {
      if (!payment.receiptPdfPath) return payment;
      const { data } = await supabase.storage
        .from(STUDENT_AGREEMENTS_BUCKET)
        .createSignedUrl(payment.receiptPdfPath, 60 * 60);
      return { ...payment, receiptPdfUrl: data?.signedUrl || "" };
    }));

    return { ...record, signedPdfUrl, payments };
  }));

  return withDownloads.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  try {
    const supabase = getServiceClient();
    if (!(await requireSuperAdmin(req, supabase))) {
      return res.status(403).json({ error: "Super Admin access required." });
    }

    await ensureStudentAgreementBucket(supabase);
    const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
    const action = cleanText(body.action, 30);

    if (action === "list") {
      return res.status(200).json({ agreements: await listAgreements(supabase) });
    }

    if (action === "create") {
      const input = body.agreement && typeof body.agreement === "object"
        ? body.agreement as Record<string, unknown>
        : {};
      const recordStatus: StudentAgreementStatus = body.status === "sent" ? "sent" : "created";
      const source = cleanText(body.source, 50) || "email";
      const record = buildStudentAgreementRecord(randomUUID(), input, recordStatus, source);

      if (!record.studentName || !isValidStudentEmail(record.studentEmail)) {
        return res.status(400).json({ error: "A valid student name and email are required." });
      }

      await writeStudentAgreement(supabase, record);
      return res.status(200).json({ agreement: record });
    }

    if (action === "mark") {
      const id = cleanText(body.id, 80);
      const status = cleanText(body.status, 20) as StudentAgreementStatus;
      if (!isSafeAgreementId(id) || !["sent", "failed"].includes(status)) {
        return res.status(400).json({ error: "Invalid agreement update." });
      }

      const record = await readStudentAgreement(supabase, id);
      if (!record) return res.status(404).json({ error: "Agreement record not found." });

      const now = new Date().toISOString();
      record.status = status;
      if (status === "sent") record.sentAt = record.sentAt || now;
      record.emailId = cleanText(body.emailId, 200) || record.emailId;
      record.events.push({
        type: status,
        at: now,
        note: status === "failed" ? cleanText(body.note, 300) || "Email delivery request failed." : undefined,
      });
      await writeStudentAgreement(supabase, record);
      return res.status(200).json({ agreement: record });
    }

    if (action === "attach-signed-pdf") {
      const id = cleanText(body.id, 80);
      const rawPdf = cleanText(body.pdfBase64, 12 * 1024 * 1024).replace(/^data:application\/pdf;base64,/, "");
      if (!isSafeAgreementId(id) || !rawPdf) {
        return res.status(400).json({ error: "A valid agreement and signed PDF are required." });
      }

      const record = await readStudentAgreement(supabase, id);
      if (!record) return res.status(404).json({ error: "Agreement record not found." });
      const pdf = Buffer.from(rawPdf, "base64");
      if (pdf.length < 500 || pdf.length > 8 * 1024 * 1024 || pdf.subarray(0, 4).toString() !== "%PDF") {
        return res.status(400).json({ error: "Please choose a valid PDF smaller than 8 MB." });
      }

      const now = new Date().toISOString();
      const path = `signed/${record.id}/Signed_Student_Agreement_Admin_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from(STUDENT_AGREEMENTS_BUCKET)
        .upload(path, pdf, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;

      record.signedPdfPath = path;
      record.signedAt = record.signedAt || now;
      record.status = "signed";
      record.events.push({
        type: "signed_attached",
        at: now,
        note: "Existing signed agreement PDF attached by Super Admin.",
      });
      await writeStudentAgreement(supabase, record);
      return res.status(200).json({ agreement: record });
    }

    if (action === "record-payment") {
      const id = cleanText(body.id, 80);
      const amount = roundMoney(cleanMoney(body.amount));
      if (!isSafeAgreementId(id) || amount <= 0) {
        return res.status(400).json({ error: "A valid agreement and payment amount are required." });
      }

      const record = await readStudentAgreement(supabase, id);
      if (!record) return res.status(404).json({ error: "Agreement record not found." });
      if (record.classPrice <= 0) {
        return res.status(400).json({ error: "Set a class price before recording payments." });
      }
      if (amount > record.balanceDue) {
        return res.status(400).json({ error: `Payment exceeds the remaining balance of ${money(record.balanceDue)}.` });
      }

      const today = new Date().toISOString().slice(0, 10);
      const requestedDate = cleanText(body.paymentDate, 30);
      const paymentDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today;
      const paymentId = randomUUID();
      const receiptNumber = `RA-${paymentDate.replaceAll("-", "")}-${paymentId.slice(0, 8).toUpperCase()}`;
      const now = new Date().toISOString();
      const payment: StudentPaymentRecord = {
        id: paymentId,
        amount,
        paymentDate,
        method: cleanText(body.method, 80),
        reference: cleanText(body.reference, 120),
        note: cleanText(body.note, 300),
        source: "admin",
        recordedAt: now,
        receiptNumber,
      };

      record.payments.push(payment);
      record.totalPaid = roundMoney(record.totalPaid + amount);
      record.balanceDue = roundMoney(Math.max(record.classPrice - record.totalPaid, 0));
      record.paymentStatus = record.balanceDue <= 0 ? "paid" : "partial";
      if (record.paymentStatus === "paid") record.paidInFullAt = now;
      record.events.push({
        type: "payment_recorded",
        at: now,
        amount,
        paymentId,
        note: `${money(amount)} payment recorded by Super Admin.`,
      });

      const receiptBytes = await buildReceiptPdf(record, payment);
      const receiptPath = `receipts/${record.id}/${receiptNumber}.pdf`;
      const { error: receiptUploadError } = await supabase.storage
        .from(STUDENT_AGREEMENTS_BUCKET)
        .upload(receiptPath, Buffer.from(receiptBytes), { contentType: "application/pdf", upsert: false });
      if (receiptUploadError) throw receiptUploadError;
      payment.receiptPdfPath = receiptPath;
      await writeStudentAgreement(supabase, record);

      let receiptEmailSent = false;
      let warning = "";
      if (body.sendReceipt !== false) {
        try {
          payment.receiptEmailId = await sendReceiptEmail(supabase, record, payment, receiptBytes);
          payment.receiptEmailedAt = new Date().toISOString();
          record.events.push({
            type: "receipt_sent",
            at: payment.receiptEmailedAt,
            paymentId,
            note: `Receipt ${receiptNumber} emailed to ${record.studentEmail}.`,
          });
          receiptEmailSent = true;
        } catch (error) {
          warning = error instanceof Error ? error.message : "Receipt email could not be delivered.";
          record.events.push({ type: "receipt_failed", at: new Date().toISOString(), paymentId, note: warning });
        }
        await writeStudentAgreement(supabase, record);
      }

      return res.status(200).json({ agreement: record, receiptEmailSent, warning });
    }

    if (action === "send-receipt") {
      const id = cleanText(body.id, 80);
      if (!isSafeAgreementId(id)) return res.status(400).json({ error: "Invalid agreement record." });
      const record = await readStudentAgreement(supabase, id);
      if (!record) return res.status(404).json({ error: "Agreement record not found." });

      const requestedPaymentId = cleanText(body.paymentId, 80);
      const payment = requestedPaymentId
        ? record.payments.find((entry) => entry.id === requestedPaymentId)
        : [...record.payments].reverse().find((entry) => entry.receiptPdfPath);
      if (!payment?.receiptPdfPath) return res.status(404).json({ error: "No generated receipt was found." });

      try {
        payment.receiptEmailId = await sendReceiptEmail(supabase, record, payment);
        payment.receiptEmailedAt = new Date().toISOString();
        record.events.push({
          type: "receipt_sent",
          at: payment.receiptEmailedAt,
          paymentId: payment.id,
          note: `Receipt ${payment.receiptNumber} emailed to ${record.studentEmail}.`,
        });
        await writeStudentAgreement(supabase, record);
        return res.status(200).json({ agreement: record, receiptEmailSent: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Receipt email could not be delivered.";
        record.events.push({ type: "receipt_failed", at: new Date().toISOString(), paymentId: payment.id, note: message });
        await writeStudentAgreement(supabase, record);
        return res.status(502).json({ error: message });
      }
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Student agreement operation failed.",
    });
  }
}
