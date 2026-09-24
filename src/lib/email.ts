import type { Locale } from "@/i18n/dictionaries";
import { renderSpecsEmail } from "@/emails/specs/render";
import { hasLinkSecret, preferenceToken } from "@/lib/tokens";

const FROM = process.env.EMAIL_FROM || "7on <hello@7on.ai>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "hello@7on.ai";

/* Sends the preliminary specs through Resend's REST API.
   Returns false (and logs why) instead of throwing, so a mail hiccup never
   costs someone their place on the list. */
export async function sendSpecsEmail(to: string, locale: Locale, origin: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY is not set; skipping specs email.");
    return false;
  }

  // Without EMAIL_LINK_SECRET the opt-in and preferences links are left out
  const token = hasLinkSecret() ? preferenceToken(to) : null;
  const links = token
    ? {
        updates: `${origin}/preferences?t=${token}&choose=updates`,
        preferences: `${origin}/preferences?t=${token}`,
      }
    : undefined;
  if (!links) console.warn("EMAIL_LINK_SECRET is not set; specs email sent without preference links.");

  const { subject, html, text } = renderSpecsEmail(locale, origin, links);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        // Resend drops repeats of the same key for 24h — no double sends on retries
        "Idempotency-Key": `specs:${to}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: REPLY_TO,
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      console.error("Resend rejected specs email:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Specs email failed:", error);
    return false;
  }
}

/* RFC 8058 one-click unsubscribe headers — for campaign emails, which Gmail
   and Yahoo require to carry them. The transactional specs email does not. */
export function unsubscribeHeaders(origin: string, email: string) {
  const token = preferenceToken(email);
  return {
    "List-Unsubscribe": `<${origin}/api/unsubscribe?t=${token}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
