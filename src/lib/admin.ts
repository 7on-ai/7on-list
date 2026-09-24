import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/* Two keys, two powers:
   ADMIN_PASSWORD  — a person: sees the list, approves and sends campaigns.
   SUNDAY_API_KEY  — Sunday: reads aggregate numbers and writes drafts.
                     It can never approve, send, or see an address. */

export const ADMIN_COOKIE = "7on_admin";

function password() {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function adminConfigured() {
  return password().length >= 12;
}

function same(a: string, b: string) {
  // Hash first so lengths match and nothing leaks through timing
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

/* The session cookie value; changing ADMIN_PASSWORD signs everyone out */
export function sessionValue() {
  return createHmac("sha256", password()).update("7on-admin-session:v1").digest("base64url");
}

export function checkPassword(given: string) {
  return adminConfigured() && same(given, password());
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(value) && same(value!, sessionValue());
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not signed in.");
}

export function isSunday(authorization: string | null) {
  const key = process.env.SUNDAY_API_KEY ?? "";
  if (key.length < 24 || !authorization?.startsWith("Bearer ")) return false;
  return same(authorization.slice(7), key);
}
