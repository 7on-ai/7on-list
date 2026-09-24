import { createHash } from "node:crypto";
import { z } from "zod";
import { NOTE_COPY } from "@/emails/note/copy";
import { renderNote, withUtm } from "@/emails/note/render";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/i18n/dictionaries";
import { ensureSchema, sql } from "@/lib/db";
import { finishSend, personalLinks, sendEmail, unsubscribeHeaders } from "@/lib/email";
import { inviteUrl, LINE_CTE } from "@/lib/referrals";

/* Campaigns are drafted — by a person or by Sunday — then approved by a
   person, then sent in waves down the line. Approval is bound to the exact
   content: any edit after approval needs a new approval, and content can't
   change once anyone has received it.

   kind "updates": only people who asked for news.
   kind "launch":  everyone in line — the one launch email the page promises,
                   so only one launch campaign may ever go out. */

export const CAMPAIGN_ID = /^[a-z0-9][a-z0-9-]{2,40}$/;
export type CampaignKind = "launch" | "updates";

const text = (max: number) => z.string().trim().min(1).max(max);
export const localeContentSchema = z.object({
  subject: text(120),
  preheader: text(200),
  heading: text(160),
  /* Paragraphs separated by a blank line; **bold**, [text](https://…),
     and {position}, {friends}, {invite_link} filled in per person */
  body: text(5000),
  cta_label: z.string().trim().max(60).optional(),
  cta_url: z.string().trim().url().max(500).optional(),
});
export type LocaleContent = z.infer<typeof localeContentSchema>;

export const campaignInputSchema = z.object({
  id: z.string().regex(CAMPAIGN_ID, "Use 3–41 lowercase letters, digits and dashes"),
  name: text(120),
  kind: z.enum(["launch", "updates"]),
  content: z
    .record(z.string(), localeContentSchema)
    .refine((c) => Object.keys(c).every(isLocale), "Unknown language")
    .refine((c) => "en" in c, "English (en) is required — it's the fallback for other languages"),
});
export type CampaignInput = z.infer<typeof campaignInputSchema>;

export type Campaign = {
  id: string;
  name: string;
  kind: CampaignKind;
  content: Partial<Record<Locale, LocaleContent>>;
  content_hash: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  approved_hash: string | null;
  approved_at: string | null;
};

export type CampaignStatus = "draft" | "approved" | "live";

/* Stable fingerprint of what people would receive */
export function hashContent(kind: CampaignKind, content: CampaignInput["content"]) {
  const fields = ["subject", "preheader", "heading", "body", "cta_label", "cta_url"] as const;
  const normal = LOCALES.filter((l) => content[l]).map((l) => [l, fields.map((f) => content[l]?.[f] ?? "")]);
  return createHash("sha256").update(JSON.stringify([kind, normal])).digest("hex");
}

export function isApproved(c: Pick<Campaign, "approved_hash" | "content_hash">) {
  return c.approved_hash !== null && c.approved_hash === c.content_hash;
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  await ensureSchema();
  const rows = await sql()`SELECT * FROM campaigns WHERE id = ${id}`;
  return (rows[0] as Campaign | undefined) ?? null;
}

async function sentCount(id: string) {
  const rows = await sql()`SELECT count(*)::int AS n FROM sends WHERE campaign_id = ${id} AND status <> 'failed'`;
  return Number(rows[0]?.n ?? 0);
}

/* Create or update a draft. Refused once anyone has received the campaign. */
export async function saveCampaign(input: CampaignInput, by: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureSchema();
  if ((await sentCount(input.id)) > 0) {
    return { ok: false, error: "This campaign has already been sent to people, so it can't change. Make a new one." };
  }
  const hash = hashContent(input.kind, input.content);
  await sql()`
    INSERT INTO campaigns (id, name, kind, content, content_hash, created_by)
    VALUES (${input.id}, ${input.name}, ${input.kind}, ${JSON.stringify(input.content)}, ${hash}, ${by})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, kind = EXCLUDED.kind, content = EXCLUDED.content,
      content_hash = EXCLUDED.content_hash, updated_at = now()`;
  return { ok: true };
}

/* Another launch campaign that has already reached people, if any */
async function otherLaunchSent(id: string) {
  const rows = await sql()`
    SELECT c.id FROM campaigns c
    WHERE c.kind = 'launch' AND c.id <> ${id}
      AND EXISTS (SELECT 1 FROM sends s WHERE s.campaign_id = c.id AND s.status <> 'failed')
    LIMIT 1`;
  return (rows[0]?.id as string | undefined) ?? null;
}

export async function approveCampaign(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await getCampaign(id);
  if (!c) return { ok: false, error: "No such campaign." };
  if (c.kind === "launch") {
    const other = await otherLaunchSent(id);
    if (other) return { ok: false, error: `The launch email already went out as "${other}". The page promises only one.` };
  }
  await sql()`UPDATE campaigns SET approved_hash = content_hash, approved_at = now() WHERE id = ${id}`;
  return { ok: true };
}

export async function revokeApproval(id: string) {
  await ensureSchema();
  await sql()`UPDATE campaigns SET approved_hash = NULL, approved_at = NULL WHERE id = ${id}`;
}

export async function deleteDraft(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureSchema();
  if ((await sentCount(id)) > 0) return { ok: false, error: "Already sent to people; kept for the record." };
  await sql()`DELETE FROM campaigns WHERE id = ${id}`;
  return { ok: true };
}

export type CampaignRow = Campaign & {
  status: CampaignStatus;
  sent: number;
  delivered: number;
  clicked: number;
  bounced: number;
  complained: number;
};

export async function listCampaigns(): Promise<CampaignRow[]> {
  await ensureSchema();
  const rows = (await sql()`
    SELECT c.*,
      (SELECT count(*) FROM sends s WHERE s.campaign_id = c.id AND s.status <> 'failed')::int AS sent,
      (SELECT count(DISTINCT s.email) FROM sends s JOIN email_events e ON e.message_id = s.resend_id
        WHERE s.campaign_id = c.id AND e.type = 'email.delivered')::int AS delivered,
      (SELECT count(DISTINCT s.email) FROM sends s JOIN email_events e ON e.message_id = s.resend_id
        WHERE s.campaign_id = c.id AND e.type = 'email.clicked')::int AS clicked,
      (SELECT count(DISTINCT s.email) FROM sends s JOIN email_events e ON e.message_id = s.resend_id
        WHERE s.campaign_id = c.id AND e.type = 'email.bounced')::int AS bounced,
      (SELECT count(DISTINCT s.email) FROM sends s JOIN email_events e ON e.message_id = s.resend_id
        WHERE s.campaign_id = c.id AND e.type = 'email.complained')::int AS complained
    FROM campaigns c
    ORDER BY c.updated_at DESC`) as (Campaign & { sent: number; delivered: number; clicked: number; bounced: number; complained: number })[];
  return rows.map((r) => ({ ...r, status: r.sent > 0 ? "live" : isApproved(r) ? "approved" : "draft" }));
}

export type Filters = { countries: string[] | null; locales: string[] | null };

/* Who a wave would reach next: people in the audience not yet sent this
   campaign, by language — so missing translations are visible up front. */
export async function audience(c: Campaign, f: Filters) {
  await ensureSchema();
  const rows = await sql().query(
    `WITH ${LINE_CTE}
     SELECT c.locale, count(*)::int AS n
     FROM contacts c JOIN line l ON l.email = c.email
     WHERE ($1 = 'launch' OR c.marketing_consent_at IS NOT NULL)
       AND ($2::text[] IS NULL OR c.country = ANY($2::text[]))
       AND ($3::text[] IS NULL OR c.locale = ANY($3::text[]))
       AND NOT EXISTS (SELECT 1 FROM sends s WHERE s.campaign_id = $4 AND s.email = c.email AND s.status <> 'failed')
     GROUP BY c.locale ORDER BY n DESC`,
    [c.kind, f.countries, f.locales, c.id]
  );
  const byLocale = rows as { locale: string; n: number }[];
  return {
    total: byLocale.reduce((sum, r) => sum + Number(r.n), 0),
    byLocale: byLocale.map((r) => ({ locale: r.locale, n: Number(r.n), translated: r.locale in c.content })),
  };
}

type Person = { email: string; locale: string; timezone: string | null; referral_code: string | null; position: number; referrals: number };

/* One person's copy of the campaign, in their language (English if the
   campaign has no translation for it) */
export function renderCampaign(c: Campaign, person: Omit<Person, "timezone">, origin: string) {
  const locale: Locale = isLocale(person.locale) && c.content[person.locale] ? person.locale : DEFAULT_LOCALE;
  const content = c.content[locale] ?? c.content.en!;
  const links = personalLinks(origin, person.email);
  const invite = person.referral_code ? inviteUrl(origin, person.referral_code, person.locale) : origin;
  const fill = (s: string) =>
    s
      .replace(/\{position\}/g, String(person.position))
      .replace(/\{friends\}/g, String(person.referrals))
      .replace(/\{invite_link\}/g, invite);
  // Our own links carry the campaign in their UTM tags
  const body = fill(content.body).replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_, label: string, url: string) => `[${label}](${withUtm(url, c.id, origin)})`
  );
  const copy = NOTE_COPY[locale];
  return renderNote({
    locale,
    subject: fill(content.subject),
    preheader: fill(content.preheader),
    heading: fill(content.heading),
    body,
    cta:
      content.cta_label && content.cta_url
        ? { label: content.cta_label, url: withUtm(fill(content.cta_url), c.id, origin) }
        : undefined,
    footer: {
      reason: c.kind === "updates" ? copy.reasonUpdates : copy.reasonLaunch,
      links: links
        ? [
            { label: copy.preferences, url: links.preferences },
            { label: copy.unsubscribe, url: links.unsubscribe },
          ]
        : [],
    },
  });
}

/* Next time the clock shows `hour`:00 in the given time zone */
export function nextLocalHour(timeZone: string | null, hour: number, now = new Date()): Date | null {
  if (!timeZone) return null;
  const offset = (at: Date) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(at);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - at.getTime();
  };
  try {
    const off = offset(now);
    const local = new Date(now.getTime() + off);
    let target = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), hour) - off;
    if (target < now.getTime() + 5 * 60_000) target += 24 * 3600_000;
    // Daylight saving may shift the offset between now and then
    target += off - offset(new Date(target));
    return new Date(target);
  } catch {
    return null; // unknown time zone
  }
}

export type WaveOptions = Filters & {
  /* How many to send in this call */
  limit: number;
  /* Deliver at this local hour in each person's time zone; null = now */
  localHour: number | null;
  origin: string;
};

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* Sends the campaign to the next people in line. Called repeatedly (small
   chunks keep each request short); returns what happened in this chunk. */
export async function sendWaveChunk(id: string, o: WaveOptions) {
  const c = await getCampaign(id);
  if (!c) throw new Error("No such campaign.");
  if (!isApproved(c)) throw new Error("Not approved — or changed since approval.");
  if (c.kind === "launch" && (await otherLaunchSent(id))) throw new Error("Another launch email already went out.");

  const limit = Math.max(1, Math.min(o.limit, 25));
  // Pick the next people in line and claim them in one statement, so two
  // tabs sending at once can never double up
  const people = (await sql().query(
    `WITH ${LINE_CTE},
     picked AS (
       SELECT c.email, c.locale, c.timezone, c.referral_code, l.position, l.referrals
       FROM contacts c JOIN line l ON l.email = c.email
       WHERE ($1 = 'launch' OR c.marketing_consent_at IS NOT NULL)
         AND ($2::text[] IS NULL OR c.country = ANY($2::text[]))
         AND ($3::text[] IS NULL OR c.locale = ANY($3::text[]))
         AND NOT EXISTS (SELECT 1 FROM sends s WHERE s.campaign_id = $4 AND s.email = c.email AND s.status <> 'failed')
       ORDER BY l.position
       LIMIT $5
     ),
     claimed AS (
       INSERT INTO sends (campaign_id, email, status)
       SELECT $4, email, 'pending' FROM picked
       ON CONFLICT (campaign_id, email) DO UPDATE SET status = 'pending', error = NULL
         WHERE sends.status = 'failed'
       RETURNING email
     )
     SELECT p.* FROM picked p JOIN claimed USING (email) ORDER BY p.position`,
    [c.kind, o.countries, o.locales, c.id, limit]
  )) as Person[];

  let sent = 0;
  let failed = 0;
  for (const [i, person] of people.entries()) {
    if (i > 0) await pause(550); // Resend allows about two requests a second
    const { subject, html, text } = renderCampaign(c, person, o.origin);
    const at = o.localHour === null ? null : nextLocalHour(person.timezone, o.localHour);
    if (at) await sql()`UPDATE sends SET scheduled_for = ${at.toISOString()} WHERE campaign_id = ${c.id} AND email = ${person.email}`;
    const result = await sendEmail({
      to: person.email,
      subject,
      html,
      text,
      headers: unsubscribeHeaders(o.origin, person.email),
      idempotencyKey: `${c.id}:${person.email}`,
      scheduledAt: at?.toISOString(),
    });
    await finishSend(c.id, person.email, result);
    if (result.ok) sent++;
    else failed++;
  }
  return { sent, failed, picked: people.length, done: people.length < limit };
}

/* A test copy to yourself, marked as such; not recorded as a send */
export async function sendTest(id: string, locale: Locale, to: string, origin: string) {
  const c = await getCampaign(id);
  if (!c) return { ok: false as const, error: "No such campaign." };
  const { subject, html, text } = renderCampaign(
    c,
    { email: to, locale, referral_code: "example", position: 42, referrals: 3 },
    origin
  );
  return sendEmail({
    to,
    subject: `[Test] ${subject}`,
    html,
    text,
    idempotencyKey: `test:${c.id}:${locale}:${Date.now()}`,
  });
}
