import { DEFAULT_LOCALE, isLocale, pathOf } from "@/i18n/dictionaries";
import { ensureSchema, sql } from "@/lib/db";

/* The line — the order launch emails go out in.
   Everyone is placed by when they first asked for the specs; each friend who
   got the specs through their invite link moves them this much earlier.
   A friend counts once their first email has actually been delivered, and
   stops counting if it bounces or they report spam. People who turned off
   email aren't in line, since they won't be written to. */
export const REFERRAL_BOOST = "7 days";

/* Shared by every query that needs a place in line: CTEs "refs" and "line" */
export const LINE_CTE = `
  refs AS (
    SELECT referred_by AS code, count(*)::int AS n
    FROM contacts
    WHERE referred_by IS NOT NULL AND delivered_at IS NOT NULL
      AND bounced_at IS NULL AND complained_at IS NULL
    GROUP BY referred_by
  ),
  line AS (
    SELECT c.email, COALESCE(r.n, 0) AS referrals,
      (row_number() OVER (
        ORDER BY c.first_requested_at - COALESCE(r.n, 0) * interval '${REFERRAL_BOOST}',
                 c.first_requested_at, c.email
      ))::int AS position
    FROM contacts c
    LEFT JOIN refs r ON r.code = c.referral_code
    WHERE c.unsubscribed_at IS NULL AND c.bounced_at IS NULL AND c.complained_at IS NULL
  )`;

export type Standing = {
  code: string;
  locale: string;
  /* null when the person isn't in line (email turned off or undeliverable) */
  position: number | null;
  referrals: number;
};

export async function getStanding(email: string): Promise<Standing | null> {
  await ensureSchema();
  const rows = await sql().query(
    `WITH ${LINE_CTE}
     SELECT c.referral_code AS code, c.locale, l.position,
       COALESCE((SELECT n FROM refs WHERE code = c.referral_code), 0) AS referrals
     FROM contacts c LEFT JOIN line l ON l.email = c.email
     WHERE c.email = $1`,
    [email]
  );
  const row = rows[0] as { code: string; locale: string; position: number | null; referrals: number } | undefined;
  return row
    ? { code: row.code, locale: row.locale, position: row.position ?? null, referrals: Number(row.referrals) }
    : null;
}

/* The contact who owns an invite code, for telling them a friend joined */
export async function inviterOf(code: string) {
  await ensureSchema();
  const rows = await sql()`
    SELECT email, locale, marketing_consent_at, unsubscribed_at, bounced_at, complained_at
    FROM contacts WHERE referral_code = ${code}`;
  return (
    (rows[0] as
      | {
          email: string;
          locale: string;
          marketing_consent_at: string | null;
          unsubscribed_at: string | null;
          bounced_at: string | null;
          complained_at: string | null;
        }
      | undefined) ?? null
  );
}

/* In the inviter's language, so the shared card and page speak it too.
   English uses "/", which still follows each friend's own browser. */
export function inviteUrl(origin: string, code: string, locale?: string | null) {
  const path = isLocale(locale) && locale !== DEFAULT_LOCALE ? pathOf(locale) : "/";
  return `${origin}${path}?ref=${code}`;
}
