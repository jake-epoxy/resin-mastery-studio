import type { VercelRequest } from "./_types.js";

function getHeader(req: VercelRequest, name: string): string {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export function hasBearerSecret(req: VercelRequest, secret: string): boolean {
  if (!secret) return false;

  const authHeader = getHeader(req, "authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  return getHeader(req, "x-api-key") === secret;
}

export function requireApiSecret(req: VercelRequest, secretNames: string[]): boolean {
  const secret = secretNames.map((name) => process.env[name]).find(Boolean) || "";
  return hasBearerSecret(req, secret);
}
