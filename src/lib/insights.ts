import { ensureSchema, sql } from "@/lib/db";
import { LINE_CTE } from "@/lib/referrals";

/* Aggregate numbers only — never an address. Safe to hand to Sunday. */
export async function getInsights() {
  await ensureSchema();
  const q = sql();

  const [totals] = (await q.query(
    `WITH ${LINE_CTE}
     SELECT
       count(*)::int AS contacts,
       (SELECT count(*) FROM line)::int AS in_line,
       count(*) FILTER (WHERE marketing_consent_at IS NOT NULL AND unsubscribed_at IS NULL)::int AS updates,
       count(*) FILTER (WHERE marketing_consent_at IS NULL AND unsubscribed_at IS NULL)::int AS launch_only,
       count(*) FILTER (WHERE unsubscribed_at IS NOT NULL)::int AS unsubscribed,
       count(*) FILTER (WHERE bounced_at IS NOT NULL OR complained_at IS NOT NULL)::int AS suppressed,
       count(*) FILTER (WHERE first_requested_at > now() - interval '1 day')::int AS last_24h,
       count(*) FILTER (WHERE first_requested_at > now() - interval '7 days')::int AS last_7d,
       count(*) FILTER (WHERE referred_by IS NOT NULL)::int AS referred,
       count(*) FILTER (WHERE referred_by IS NOT NULL AND delivered_at IS NOT NULL)::int AS referred_counted,
       count(*) FILTER (WHERE specs_sent_at IS NOT NULL)::int AS specs_sent
     FROM contacts`
  )) as Record<string, number>[];

  const daily = (await q`
    SELECT to_char(d, 'YYYY-MM-DD') AS day,
      (SELECT count(*) FROM contacts WHERE first_requested_at >= d AND first_requested_at < d + interval '1 day')::int AS n
    FROM generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') AS d
    ORDER BY d`) as { day: string; n: number }[];

  // Where people came from: campaign tag first, then the referring site
  const sources = (await q`
    SELECT source, count(*)::int AS n FROM (
      SELECT CASE
        WHEN referred_by IS NOT NULL THEN 'invite link'
        WHEN utm_source IS NOT NULL THEN utm_source
        WHEN referrer IS NOT NULL THEN split_part(split_part(referrer, '://', 2), '/', 1)
        ELSE 'direct'
      END AS source
      FROM contacts
    ) s GROUP BY source ORDER BY n DESC LIMIT 12`) as { source: string; n: number }[];

  const campaigns = (await q`
    SELECT utm_campaign AS campaign, count(*)::int AS n FROM contacts
    WHERE utm_campaign IS NOT NULL GROUP BY utm_campaign ORDER BY n DESC LIMIT 12`) as { campaign: string; n: number }[];

  const countries = (await q`
    SELECT COALESCE(country, '?') AS country, count(*)::int AS n FROM contacts
    GROUP BY 1 ORDER BY n DESC LIMIT 12`) as { country: string; n: number }[];

  const locales = (await q`
    SELECT locale, count(*)::int AS n FROM contacts GROUP BY locale ORDER BY n DESC`) as { locale: string; n: number }[];

  // How referrals are spread: how many people have brought 1, 2, 3… friends
  const inviters = (await q.query(
    `WITH ${LINE_CTE}
     SELECT n AS friends, count(*)::int AS people FROM refs GROUP BY n ORDER BY n DESC LIMIT 10`
  )) as { friends: number; people: number }[];

  return { totals, daily, sources, campaigns, countries, locales, inviters };
}

export type Insights = Awaited<ReturnType<typeof getInsights>>;

/* Admin only: the people bringing the most friends */
export async function topInviters(limit = 10) {
  await ensureSchema();
  return (await sql().query(
    `WITH ${LINE_CTE}
     SELECT c.email, r.n AS friends, l.position
     FROM refs r JOIN contacts c ON c.referral_code = r.code LEFT JOIN line l ON l.email = c.email
     ORDER BY r.n DESC, l.position LIMIT $1`,
    [limit]
  )) as { email: string; friends: number; position: number | null }[];
}
