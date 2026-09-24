import { createHmac, timingSafeEqual } from "node:crypto";

/* Signed links for email preferences: the token carries the address and an
   HMAC, so a link can only ever manage the inbox it was sent to. No expiry —
   an old email's "unsubscribe" must keep working. */

function secret() {
  return process.env.EMAIL_LINK_SECRET || "";
}

function sign(email: string) {
  return createHmac("sha256", secret()).update(`prefs:${email}`).digest("base64url");
}

export function hasLinkSecret() {
  return secret().length >= 16;
}

export function preferenceToken(email: string) {
  return `${Buffer.from(email).toString("base64url")}.${sign(email)}`;
}

/* The email the token was issued for, or null if it was altered */
export function verifyPreferenceToken(token: string | null | undefined): string | null {
  if (!token || !hasLinkSecret()) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const email = Buffer.from(payload, "base64url").toString();
  const expected = Buffer.from(sign(email));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return email;
}
