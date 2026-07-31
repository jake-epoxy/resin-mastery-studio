import {
  buildStudentAgreementRecord,
  cleanText,
  ensureStudentAgreementBucket,
  getServiceClient,
  isSafeAgreementId,
  isValidStudentEmail,
  legacyAgreementId,
  normalizeAgreementInput,
  readStudentAgreement,
  STUDENT_AGREEMENTS_BUCKET,
  writeStudentAgreement,
} from "./_studentAgreements.js";
import type { VercelRequest, VercelResponse } from "./_types.js";

async function resolveRecord(
  supabase: ReturnType<typeof getServiceClient>,
  body: Record<string, unknown>,
) {
  const providedId = cleanText(body.trackingId, 80);
  const agreementInput = body.agreement && typeof body.agreement === "object"
    ? body.agreement as Record<string, unknown>
    : {};
  const agreement = normalizeAgreementInput(agreementInput);
  const id = isSafeAgreementId(providedId) ? providedId : legacyAgreementId(agreement);
  let record = await readStudentAgreement(supabase, id);

  if (!record) {
    if (!isValidStudentEmail(agreement.studentEmail)) {
      throw new Error("This student agreement link is missing valid student details.");
    }
    record = buildStudentAgreementRecord(
      id,
      { ...agreement, studentName: agreement.studentName || "Student (name pending)" },
      "opened",
      providedId ? "tracked-link" : "legacy-link",
    );
    await writeStudentAgreement(supabase, record);
  }

  return record;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  try {
    const supabase = getServiceClient();
    await ensureStudentAgreementBucket(supabase);
    const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
    const action = cleanText(body.action, 20);
    const record = await resolveRecord(supabase, body);
    const now = new Date().toISOString();

    if (action === "open") {
      if (!record.openedAt) {
        record.openedAt = now;
        if (record.status !== "signed") record.status = "opened";
        record.events.push({ type: "opened", at: now });
        await writeStudentAgreement(supabase, record);
      }
      return res.status(200).json({ id: record.id });
    }

    if (action === "sign") {
      const pdfBase64 = typeof body.pdfBase64 === "string" ? body.pdfBase64 : "";
      const pdf = Buffer.from(pdfBase64, "base64");
      if (pdf.length < 500 || pdf.length > 8 * 1024 * 1024) {
        return res.status(400).json({ error: "The signed PDF is missing or too large." });
      }

      const agreementInput = body.agreement && typeof body.agreement === "object"
        ? body.agreement as Record<string, unknown>
        : {};
      const agreement = normalizeAgreementInput(agreementInput);
      if (!agreement.studentName || !isValidStudentEmail(agreement.studentEmail)) {
        return res.status(400).json({ error: "Valid student details are required before signing." });
      }

      const pdfPath = `signed/${record.id}/Signed_Student_Agreement_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from(STUDENT_AGREEMENTS_BUCKET)
        .upload(pdfPath, pdf, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;

      Object.assign(record, agreement, {
        status: "signed",
        openedAt: record.openedAt || now,
        signedAt: now,
        signedPdfPath: pdfPath,
      });
      record.events.push({ type: "signed", at: now });
      await writeStudentAgreement(supabase, record);
      return res.status(200).json({ id: record.id });
    }

    return res.status(400).json({ error: "Unknown agreement event." });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Could not record student agreement activity.",
    });
  }
}
