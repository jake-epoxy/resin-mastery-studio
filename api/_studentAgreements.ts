import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const STUDENT_AGREEMENTS_BUCKET = "student-agreements";
export const STUDENT_AGREEMENT_VERSION = "RA-STUDENT-2026-07";

export type StudentAgreementStatus = "created" | "sent" | "opened" | "signed" | "failed";
export type StudentPaymentStatus = "unpaid" | "partial" | "paid";

export type StudentPaymentRecord = {
  id: string;
  amount: number;
  paymentDate: string;
  method?: string;
  reference?: string;
  note?: string;
  source: "agreement" | "admin";
  recordedAt: string;
  receiptNumber?: string;
  receiptPdfPath?: string;
  receiptEmailedAt?: string;
  receiptEmailId?: string;
};

export type StudentAgreementEvent = {
  type: StudentAgreementStatus | "backfilled" | "signed_attached" | "payment_recorded" | "receipt_sent" | "receipt_failed";
  at: string;
  note?: string;
  amount?: number;
  paymentId?: string;
};

export type StudentAgreementRecord = {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  cityState?: string;
  emergencyContact?: string;
  program: string;
  trainingDate?: string;
  classPrice: number;
  paidAmount: number;
  paidDate?: string;
  nextAmount: number;
  nextDate?: string;
  finalDue?: string;
  remainingBalance: number;
  status: StudentAgreementStatus;
  source: string;
  agreementVersion: string;
  createdAt: string;
  sentAt?: string;
  openedAt?: string;
  signedAt?: string;
  updatedAt: string;
  emailId?: string;
  signedPdfPath?: string;
  payments: StudentPaymentRecord[];
  totalPaid: number;
  balanceDue: number;
  paymentStatus: StudentPaymentStatus;
  paidInFullAt?: string;
  events: StudentAgreementEvent[];
};

export function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://efgveagtdpqownyjspvf.supabase.co";
  const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) throw new Error("Missing Supabase backend credentials.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function ensureStudentAgreementBucket(supabase: ReturnType<typeof getServiceClient>) {
  const { error: getError } = await supabase.storage.getBucket(STUDENT_AGREEMENTS_BUCKET);
  if (!getError) return;

  const { error: createError } = await supabase.storage.createBucket(STUDENT_AGREEMENTS_BUCKET, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/json", "application/pdf"],
  });

  if (createError && !/already exists|duplicate/i.test(createError.message)) throw createError;
}

export function cleanText(value: unknown, maxLength = 300) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function cleanMoney(value: unknown) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(number, 1_000_000));
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeAgreementInput(input: Record<string, unknown> = {}) {
  const classPrice = cleanMoney(input?.classPrice ?? input?.price);
  const paidAmount = cleanMoney(input?.paidAmount);
  const nextAmount = cleanMoney(input?.nextAmount);

  return {
    studentName: cleanText(input?.studentName ?? input?.name, 150),
    studentEmail: cleanText(input?.studentEmail ?? input?.email, 254).toLowerCase(),
    studentPhone: cleanText(input?.studentPhone ?? input?.phone, 50),
    cityState: cleanText(input?.cityState, 150),
    emergencyContact: cleanText(input?.emergencyContact, 200),
    program: cleanText(input?.program, 200) || "Private Epoxy / Resin Training",
    trainingDate: cleanText(input?.trainingDate ?? input?.date, 30),
    classPrice,
    paidAmount,
    paidDate: cleanText(input?.paidDate, 30),
    nextAmount,
    nextDate: cleanText(input?.nextDate, 30),
    finalDue: cleanText(input?.finalDue, 200),
    remainingBalance: Math.max(classPrice - paidAmount - nextAmount, 0),
  };
}

export function isValidStudentEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isSafeAgreementId(id: string) {
  return /^[a-zA-Z0-9-]{16,80}$/.test(id);
}

export function legacyAgreementId(input: Record<string, unknown>) {
  const agreement = normalizeAgreementInput(input);
  const fingerprint = [
    agreement.studentEmail,
    agreement.studentName.toLowerCase(),
    agreement.program.toLowerCase(),
    agreement.trainingDate,
    agreement.classPrice.toFixed(2),
  ].join("|");
  return `legacy-${createHash("sha256").update(fingerprint).digest("hex").slice(0, 32)}`;
}

export async function readStudentAgreement(supabase: ReturnType<typeof getServiceClient>, id: string) {
  if (!isSafeAgreementId(id)) return null;
  const { data, error } = await supabase.storage
    .from(STUDENT_AGREEMENTS_BUCKET)
    .download(`records/${id}.json`);

  if (error) {
    if (/not found|does not exist/i.test(error.message)) return null;
    throw error;
  }

  return hydrateStudentAgreement(JSON.parse(await data.text()) as StudentAgreementRecord);
}

export function hydrateStudentAgreement(record: StudentAgreementRecord) {
  const createdAt = record.createdAt || new Date().toISOString();
  if (!Array.isArray(record.payments)) {
    record.payments = record.paidAmount > 0 ? [{
      id: `initial-${record.id}`,
      amount: roundMoney(record.paidAmount),
      paymentDate: record.paidDate || createdAt.slice(0, 10),
      method: "Previously recorded",
      note: "Payment recorded with the original agreement schedule.",
      source: "agreement",
      recordedAt: createdAt,
    }] : [];
  }

  record.totalPaid = roundMoney(record.payments.reduce((sum, payment) => sum + cleanMoney(payment.amount), 0));
  record.balanceDue = roundMoney(Math.max(record.classPrice - record.totalPaid, 0));
  record.paymentStatus = record.balanceDue <= 0 && record.classPrice > 0
    ? "paid"
    : record.totalPaid > 0
      ? "partial"
      : "unpaid";
  record.events = Array.isArray(record.events) ? record.events : [];
  return record;
}

export async function writeStudentAgreement(
  supabase: ReturnType<typeof getServiceClient>,
  record: StudentAgreementRecord,
) {
  if (!isSafeAgreementId(record.id)) throw new Error("Invalid agreement record ID.");
  record.updatedAt = new Date().toISOString();

  const { error } = await supabase.storage
    .from(STUDENT_AGREEMENTS_BUCKET)
    .upload(`records/${record.id}.json`, JSON.stringify(record, null, 2), {
      contentType: "application/json",
      upsert: true,
      cacheControl: "0",
    });

  if (error) throw error;
  return record;
}

export function buildStudentAgreementRecord(
  id: string,
  input: Record<string, unknown>,
  status: StudentAgreementStatus,
  source: string,
) {
  const now = new Date().toISOString();
  const agreement = normalizeAgreementInput(input);
  const backfilled = source === "manual-backfill";
  const initialPayments: StudentPaymentRecord[] = agreement.paidAmount > 0 ? [{
    id: `initial-${id}`,
    amount: roundMoney(agreement.paidAmount),
    paymentDate: agreement.paidDate || now.slice(0, 10),
    method: "Previously recorded",
    note: "Payment recorded with the original agreement schedule.",
    source: "agreement",
    recordedAt: now,
  }] : [];
  const totalPaid = roundMoney(initialPayments.reduce((sum, payment) => sum + payment.amount, 0));
  const balanceDue = roundMoney(Math.max(agreement.classPrice - totalPaid, 0));

  return {
    id,
    ...agreement,
    status,
    source,
    agreementVersion: STUDENT_AGREEMENT_VERSION,
    createdAt: now,
    sentAt: status === "sent" ? now : undefined,
    openedAt: status === "opened" ? now : undefined,
    updatedAt: now,
    payments: initialPayments,
    totalPaid,
    balanceDue,
    paymentStatus: balanceDue <= 0 && agreement.classPrice > 0 ? "paid" : totalPaid > 0 ? "partial" : "unpaid",
    paidInFullAt: balanceDue <= 0 && agreement.classPrice > 0 ? now : undefined,
    events: [{
      type: backfilled ? "backfilled" : status,
      at: now,
      note: backfilled ? "Existing student form send logged manually by Super Admin." : undefined,
    }],
  } satisfies StudentAgreementRecord;
}
