import { createClient } from "@supabase/supabase-js";

const URL = process.env.VITE_SUPABASE_URL || "https://efgveagtdpqownyjspvf.supabase.co";
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEV_EMAIL = "jakeflowers222@gmail.com";

function getBearerToken(req: any) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SERVICE_KEY) {
    return res.status(500).json({ error: "Server is missing Supabase service role key." });
  }

  const sbAdmin = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing authorization token." });
  }

  const { data: requesterData, error: requesterError } = await sbAdmin.auth.getUser(token);
  const requester = requesterData?.user;
  if (requesterError || !requester) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { email, userId } = req.body || {};
  if (!email && !userId) {
    return res.status(400).json({ error: "Provide a worker email or userId to revoke." });
  }

  let targetUser = null;

  if (userId) {
    const { data, error } = await sbAdmin.auth.admin.getUserById(userId);
    if (error) return res.status(404).json({ error: error.message });
    targetUser = data?.user || null;
  } else {
    const normalizedEmail = String(email).trim().toLowerCase();
    const { data, error } = await sbAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return res.status(500).json({ error: error.message });
    targetUser = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail) || null;
  }

  if (!targetUser) {
    return res.status(404).json({ error: "Worker auth user not found." });
  }

  const requesterIsDev = requester.email?.toLowerCase() === DEV_EMAIL;
  const targetContractorId = targetUser.user_metadata?.contractor_id;
  const targetIsWorker = targetUser.user_metadata?.role === "worker";
  const requesterOwnsWorker = targetIsWorker && targetContractorId === requester.id;

  if (!requesterIsDev && !requesterOwnsWorker) {
    return res.status(403).json({ error: "You can only revoke workers attached to your account." });
  }

  const { error: deleteError } = await sbAdmin.auth.admin.deleteUser(targetUser.id);
  if (deleteError) {
    return res.status(400).json({ error: deleteError.message });
  }

  return res.status(200).json({
    success: true,
    revoked: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.user_metadata?.full_name || null,
    },
  });
}
