import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/* Neon Postgres over HTTP — one round trip per query, no pool to manage in
   serverless functions. Vercel's Neon integration sets DATABASE_URL. */
let client: NeonQueryFunction<false, false> | null = null;

function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    client = neon(url);
  }
  return client;
}

/* Kept in sync with db/schema.sql. Idempotent, so it doubles as the
   migration for databases created before a column existed. */
let ready: Promise<unknown> | null = null;
function ensureSchema() {
  ready ??= (async () => {
    const q = sql();
    await q`
      CREATE TABLE IF NOT EXISTS contacts (
        email                text PRIMARY KEY,
        locale               text NOT NULL,
        country              text,
        timezone             text,
        source               text NOT NULL DEFAULT 'specs',
        request_count        integer NOT NULL DEFAULT 1,
        first_requested_at   timestamptz NOT NULL DEFAULT now(),
        last_requested_at    timestamptz NOT NULL DEFAULT now(),
        specs_sent_at        timestamptz,
        marketing_consent_at timestamptz,
        unsubscribed_at      timestamptz
      )`;
    await q`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS bounced_at timestamptz`;
    await q`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS complained_at timestamptz`;
    // First-touch attribution: set when the contact is created, never overwritten
    await q`
      ALTER TABLE contacts
        ADD COLUMN IF NOT EXISTS utm_source text,
        ADD COLUMN IF NOT EXISTS utm_medium text,
        ADD COLUMN IF NOT EXISTS utm_campaign text,
        ADD COLUMN IF NOT EXISTS utm_content text,
        ADD COLUMN IF NOT EXISTS utm_term text,
        ADD COLUMN IF NOT EXISTS ref text,
        ADD COLUMN IF NOT EXISTS referrer text,
        ADD COLUMN IF NOT EXISTS landing_path text`;
    // Every change to what someone agreed to receive — proof of consent
    await q`
      CREATE TABLE IF NOT EXISTS consent_events (
        id            bigserial PRIMARY KEY,
        email         text NOT NULL,
        from_pref     text,
        to_pref       text NOT NULL,
        source        text NOT NULL,
        locale        text,
        copy_version  text NOT NULL,
        created_at    timestamptz NOT NULL DEFAULT now()
      )`;
    await q`CREATE INDEX IF NOT EXISTS consent_events_email_idx ON consent_events (email)`;
    await q`
      CREATE TABLE IF NOT EXISTS email_events (
        id          text PRIMARY KEY,
        email       text,
        type        text NOT NULL,
        message_id  text,
        created_at  timestamptz NOT NULL DEFAULT now(),
        data        jsonb
      )`;
    await q`CREATE INDEX IF NOT EXISTS email_events_email_idx ON email_events (email)`;
  })().catch((error) => {
    ready = null; // retry on the next request
    throw error;
  });
  return ready;
}

export type Attribution = Partial<
  Record<
    "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term" | "ref" | "referrer" | "landing_path",
    string
  >
>;

export type SpecRequest = {
  email: string;
  locale: string;
  country: string | null;
  timezone: string | null;
  attribution: Attribution;
};

/* Bump when the wording people agree to changes (email opt-in, preferences
   page), so each consent record points at the text that was shown. */
export const CONSENT_COPY_VERSION = "2026-09-specs-v1";

/* Records a spec request. Asking again is allowed — it bumps the count,
   refreshes language/location and lifts an unsubscribe, since asking is an
   explicit wish to hear from us. Returns whether sending is still blocked
   (a hard bounce or a spam complaint). */
export async function recordSpecRequest(r: SpecRequest): Promise<{ suppressed: boolean }> {
  await ensureSchema();
  const a = r.attribution;
  const rows = await sql()`
    WITH prev AS (SELECT unsubscribed_at FROM contacts WHERE email = ${r.email})
    INSERT INTO contacts (email, locale, country, timezone,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, ref, referrer, landing_path)
    VALUES (${r.email}, ${r.locale}, ${r.country}, ${r.timezone},
      ${a.utm_source ?? null}, ${a.utm_medium ?? null}, ${a.utm_campaign ?? null}, ${a.utm_content ?? null},
      ${a.utm_term ?? null}, ${a.ref ?? null}, ${a.referrer ?? null}, ${a.landing_path ?? null})
    ON CONFLICT (email) DO UPDATE SET
      locale            = EXCLUDED.locale,
      country           = COALESCE(EXCLUDED.country, contacts.country),
      timezone          = COALESCE(EXCLUDED.timezone, contacts.timezone),
      request_count     = contacts.request_count + 1,
      last_requested_at = now(),
      unsubscribed_at   = NULL
    RETURNING bounced_at, complained_at, (SELECT unsubscribed_at FROM prev) AS was_unsubscribed`;
  const row = rows[0] as
    | { bounced_at: string | null; complained_at: string | null; was_unsubscribed: string | null }
    | undefined;
  if (row?.was_unsubscribed) {
    await logConsent(r.email, "none", "launch", "spec_request", r.locale);
  }
  return { suppressed: Boolean(row?.bounced_at || row?.complained_at) };
}

export async function markSpecsSent(email: string) {
  await sql()`UPDATE contacts SET specs_sent_at = now() WHERE email = ${email}`;
}

export type Contact = {
  email: string;
  locale: string;
  marketing_consent_at: string | null;
  unsubscribed_at: string | null;
};

export async function getContact(email: string): Promise<Contact | null> {
  await ensureSchema();
  const rows = await sql()`
    SELECT email, locale, marketing_consent_at, unsubscribed_at
    FROM contacts WHERE email = ${email}`;
  return (rows[0] as Contact | undefined) ?? null;
}

/* What the contact has chosen to receive:
   updates  — the launch email plus occasional news (explicit opt-in)
   launch   — only the one email when 7on ARC is ready (the default)
   none     — nothing at all */
export type Preference = "updates" | "launch" | "none";

export function preferenceOf(c: Contact): Preference {
  if (c.unsubscribed_at) return "none";
  return c.marketing_consent_at ? "updates" : "launch";
}

async function logConsent(
  email: string,
  from: Preference | null,
  to: Preference,
  source: string,
  locale: string | null
) {
  await sql()`
    INSERT INTO consent_events (email, from_pref, to_pref, source, locale, copy_version)
    VALUES (${email}, ${from}, ${to}, ${source}, ${locale}, ${CONSENT_COPY_VERSION})`;
}

/* Where a preference change came from, for the consent record */
export type ConsentSource = "preferences_page" | "one_click" | "spam_complaint" | "spec_request";

export async function setPreference(
  email: string,
  preference: Preference,
  source: ConsentSource,
  locale: string | null = null
) {
  await ensureSchema();
  const before = await getContact(email);
  if (!before) return;
  const from = preferenceOf(before);
  if (from === preference) return;

  if (preference === "updates") {
    await sql()`
      UPDATE contacts SET marketing_consent_at = COALESCE(marketing_consent_at, now()), unsubscribed_at = NULL
      WHERE email = ${email}`;
  } else if (preference === "launch") {
    await sql()`UPDATE contacts SET marketing_consent_at = NULL, unsubscribed_at = NULL WHERE email = ${email}`;
  } else {
    await sql()`
      UPDATE contacts SET marketing_consent_at = NULL, unsubscribed_at = COALESCE(unsubscribed_at, now())
      WHERE email = ${email}`;
  }
  await logConsent(email, from, preference, source, locale ?? before.locale);
}

/* Delivery events from Resend's webhook. Idempotent on the event id, since
   webhooks are retried. Bounces and complaints stop all future sending. */
export async function recordEmailEvent(e: {
  id: string;
  type: string;
  email: string | null;
  messageId: string | null;
  data: unknown;
}) {
  await ensureSchema();
  const inserted = await sql()`
    INSERT INTO email_events (id, email, type, message_id, data)
    VALUES (${e.id}, ${e.email}, ${e.type}, ${e.messageId}, ${JSON.stringify(e.data)})
    ON CONFLICT (id) DO NOTHING
    RETURNING id`;
  if (inserted.length === 0 || !e.email) return;

  if (e.type === "email.bounced") {
    await sql()`UPDATE contacts SET bounced_at = COALESCE(bounced_at, now()) WHERE email = ${e.email}`;
  } else if (e.type === "email.complained") {
    await setPreference(e.email, "none", "spam_complaint");
    await sql()`UPDATE contacts SET complained_at = COALESCE(complained_at, now()) WHERE email = ${e.email}`;
  }
}
