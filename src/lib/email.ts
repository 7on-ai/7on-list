import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/dictionaries";
import { NOTE_COPY } from "@/emails/note/copy";
import { renderNote } from "@/emails/note/render";
import { renderSpecsEmail } from "@/emails/specs/render";
import { ensureSchema, sql } from "@/lib/db";
import { getStanding } from "@/lib/referrals";
import { hasLinkSecret, preferenceToken } from "@/lib/tokens";

const FROM = process.env.EMAIL_FROM || "7on <hello@7on.ai>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "hello@7on.ai";

export type Outgoing = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  /* Resend drops a repeat of the same key for 24h — no double sends on retries */
  idempotencyKey: string;
  /* ISO time; Resend holds the email until then */
  scheduledAt?: string;
};

export type SendResult = { ok: true; id: string } | { ok: false; error: string; retryable: boolean };

/* One email through Resend's REST API. Never throws. */
export async function sendEmail(m: Outgoing): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set", retryable: false };

  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "Idempotency-Key": m.idempotencyKey,
        },
        body: JSON.stringify({
          from: FROM,
          to: [m.to],
          reply_to: REPLY_TO,
          subject: m.subject,
          html: m.html,
          text: m.text,
          ...(m.headers ? { headers: m.headers } : {}),
          ...(m.scheduledAt ? { scheduled_at: m.scheduledAt } : {}),
        }),
      });
      // Rate limited: wait a moment and try once more
      if (res.status === 429 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1100));
        continue;
      }
      if (!res.ok) {
        return { ok: false, error: `${res.status} ${await res.text()}`.slice(0, 500), retryable: res.status >= 429 };
      }
      const data = (await res.json()) as { id?: string };
      return { ok: true, id: data.id ?? "" };
    } catch (error) {
      return { ok: false, error: String(error).slice(0, 500), retryable: true };
    }
  }
}

/* Signed links for one person: preferences, opt-in, and their invite page */
export function personalLinks(origin: string, email: string) {
  if (!hasLinkSecret()) return null;
  const token = preferenceToken(email);
  return {
    preferences: `${origin}/preferences?t=${token}`,
    updates: `${origin}/preferences?t=${token}&choose=updates`,
    invite: `${origin}/invite?t=${token}`,
    unsubscribe: `${origin}/preferences?t=${token}&choose=none`,
  };
}

/* The preliminary specs. Returns false (and logs why) instead of throwing, so
   a mail hiccup never costs anyone their request. */
export async function sendSpecsEmail(to: string, locale: Locale, origin: string): Promise<boolean> {
  const personal = personalLinks(origin, to);
  if (!personal) console.warn("EMAIL_LINK_SECRET is not set; specs email sent without personal links.");
  const standing = personal ? await getStanding(to).catch(() => null) : null;

  const { subject, html, text } = renderSpecsEmail(
    locale,
    origin,
    personal ? { ...personal, position: standing?.position ?? null } : undefined
  );
  const result = await sendEmail({ to, subject, html, text, idempotencyKey: `specs:${to}` });
  if (!result.ok) console.error("Specs email failed:", result.error);
  return result.ok;
}

/* RFC 8058 one-click unsubscribe headers — required by Gmail and Yahoo on
   campaign email. The transactional specs email does not carry them. */
export function unsubscribeHeaders(origin: string, email: string) {
  const token = preferenceToken(email);
  return {
    "List-Unsubscribe": `<${origin}/api/unsubscribe?t=${token}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/* Claim a send for one person, so each campaign or flow step reaches them at
   most once. Returns false if it was already sent (or is being sent). */
export async function claimSend(campaignId: string, email: string, scheduledFor: string | null = null) {
  await ensureSchema();
  const rows = await sql()`
    INSERT INTO sends (campaign_id, email, status, scheduled_for)
    VALUES (${campaignId}, ${email}, 'pending', ${scheduledFor})
    ON CONFLICT (campaign_id, email) DO UPDATE SET status = 'pending', error = NULL
      WHERE sends.status = 'failed'
    RETURNING email`;
  return rows.length > 0;
}

export async function finishSend(campaignId: string, email: string, result: SendResult) {
  if (result.ok) {
    await sql()`
      UPDATE sends SET status = 'sent', resend_id = ${result.id}, sent_at = now()
      WHERE campaign_id = ${campaignId} AND email = ${email}`;
  } else {
    await sql()`
      UPDATE sends SET status = 'failed', error = ${result.error}
      WHERE campaign_id = ${campaignId} AND email = ${email}`;
  }
}

/* Friend milestones worth a note — not every single one */
export const REFERRAL_MILESTONES = [1, 3, 5, 10, 25, 50, 100];

/* Tells an inviter a friend joined — only if they asked for updates, since
   everyone else was promised a single launch email and nothing more. */
export async function sendReferralNotice(
  inviter: { email: string; locale: string; marketing_consent_at: string | null; unsubscribed_at: string | null; bounced_at: string | null; complained_at: string | null },
  origin: string
) {
  if (!inviter.marketing_consent_at || inviter.unsubscribed_at || inviter.bounced_at || inviter.complained_at) return;
  const personal = personalLinks(origin, inviter.email);
  const standing = await getStanding(inviter.email);
  if (!personal || !standing?.position || !REFERRAL_MILESTONES.includes(standing.referrals)) return;

  const flowId = `flow:referral:${standing.referrals}`;
  if (!(await claimSend(flowId, inviter.email))) return;

  const locale: Locale = isLocale(inviter.locale) ? inviter.locale : DEFAULT_LOCALE;
  const c = NOTE_COPY[locale];
  const fill = (s: string) =>
    s.replace("{position}", String(standing.position)).replace("{friends}", String(standing.referrals));
  const { subject, html, text } = renderNote({
    locale,
    subject: c.referral.subject,
    preheader: c.referral.preheader,
    heading: c.referral.heading,
    body: fill(standing.referrals === 1 ? c.referral.bodyOne : c.referral.bodyMany),
    cta: { label: c.referral.cta, url: personal.invite },
    footer: {
      reason: c.reasonUpdates,
      links: [
        { label: c.preferences, url: personal.preferences },
        { label: c.unsubscribe, url: personal.unsubscribe },
      ],
    },
  });
  const result = await sendEmail({
    to: inviter.email,
    subject,
    html,
    text,
    headers: unsubscribeHeaders(origin, inviter.email),
    idempotencyKey: `${flowId}:${inviter.email}`,
  });
  await finishSend(flowId, inviter.email, result);
}
