import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { randomInt } from "node:crypto";

/* Neon Postgres over HTTP — one round trip per query, no pool to manage in
   serverless functions. Vercel's Neon integration sets DATABASE_URL. */
let client: NeonQueryFunction<false, false> | null = null;

export function sql() {
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
export function ensureSchema() {
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
    await q`CREATE INDEX IF NOT EXISTS email_events_message_idx ON email_events (message_id)`;
    // Referrals: each contact's own code, who invited them, and when their
    // first email actually arrived (a referral only counts once it has)
    await q`
      ALTER TABLE contacts
        ADD COLUMN IF NOT EXISTS referral_code text,
        ADD COLUMN IF NOT EXISTS referred_by text,
        ADD COLUMN IF NOT EXISTS email_canonical text,
        ADD COLUMN IF NOT EXISTS delivered_at timestamptz`;
    await q`CREATE UNIQUE INDEX IF NOT EXISTS contacts_referral_code_idx ON contacts (referral_code)`;
    await q`CREATE INDEX IF NOT EXISTS contacts_referred_by_idx ON contacts (referred_by)`;
    await q`CREATE INDEX IF NOT EXISTS contacts_email_canonical_idx ON contacts (email_canonical)`;
    // Contacts from before referrals get a code and a canonical address
    await q`
      UPDATE contacts SET referral_code = substr(md5(random()::text || email), 1, 8)
      WHERE referral_code IS NULL`;
    await q`
      UPDATE contacts SET email_canonical =
        CASE WHEN split_part(email, '@', 2) IN ('gmail.com', 'googlemail.com')
          THEN replace(split_part(split_part(email, '@', 1), '+', 1), '.', '') || '@gmail.com'
          ELSE split_part(split_part(email, '@', 1), '+', 1) || '@' || split_part(email, '@', 2)
        END
      WHERE email_canonical IS NULL`;
    // Campaigns: drafted (by a person or Sunday), approved by a person, then sent
    await q`
      CREATE TABLE IF NOT EXISTS campaigns (
        id             text PRIMARY KEY,
        name           text NOT NULL,
        kind           text NOT NULL,
        content        jsonb NOT NULL,
        content_hash   text NOT NULL,
        created_by     text NOT NULL,
        created_at     timestamptz NOT NULL DEFAULT now(),
        updated_at     timestamptz NOT NULL DEFAULT now(),
        approved_hash  text,
        approved_at    timestamptz
      )`;
    // One row per person per campaign or flow step — nobody gets the same email twice
    await q`
      CREATE TABLE IF NOT EXISTS sends (
        campaign_id    text NOT NULL,
        email          text NOT NULL,
        status         text NOT NULL,
        resend_id      text,
        error          text,
        scheduled_for  timestamptz,
        created_at     timestamptz NOT NULL DEFAULT now(),
        sent_at        timestamptz,
        PRIMARY KEY (campaign_id, email)
      )`;
    await q`CREATE INDEX IF NOT EXISTS sends_resend_idx ON sends (resend_id)`;
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

/* Gmail ignores dots and everything after "+"; most providers ignore "+tags".
   Used so one inbox can't pose as several friends. */
export function canonicalEmail(email: string) {
  const [local = "", domain = ""] = email.toLowerCase().split("@");
  const base = local.split("+")[0];
  return ["gmail.com", "googlemail.com"].includes(domain) ? `${base.replace(/\./g, "")}@gmail.com` : `${base}@${domain}`;
}

/* Short, unambiguous invite codes (no 0/o, 1/l/i) */
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function newReferralCode() {
  return Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

export const REFERRAL_CODE = /^[a-z0-9]{6,12}$/;

/* Records a spec request. Asking again is allowed — it bumps the count,
   refreshes language/location and lifts an unsubscribe, since asking is an
   explicit wish to hear from us. A new contact who arrived on someone's
   invite link is credited to them, unless it's the same inbox in disguise.
   Returns the contact's invite code and whether sending is still blocked
   (a hard bounce or a spam complaint). */
export async function recordSpecRequest(
  r: SpecRequest
): Promise<{ suppressed: boolean; referralCode: string }> {
  await ensureSchema();
  const a = r.attribution;
  const canonical = canonicalEmail(r.email);
  const ref = a.ref && REFERRAL_CODE.test(a.ref.toLowerCase()) ? a.ref.toLowerCase() : null;

  for (let attempt = 0; ; attempt++) {
    try {
      const rows = await sql()`
        WITH prev AS (SELECT unsubscribed_at FROM contacts WHERE email = ${r.email}),
        inviter AS (
          SELECT referral_code FROM contacts
          WHERE referral_code = ${ref}
            AND email_canonical IS DISTINCT FROM ${canonical}
            AND NOT EXISTS (SELECT 1 FROM contacts WHERE email_canonical = ${canonical}))
        INSERT INTO contacts (email, locale, country, timezone,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term, ref, referrer, landing_path,
          referral_code, referred_by, email_canonical)
        VALUES (${r.email}, ${r.locale}, ${r.country}, ${r.timezone},
          ${a.utm_source ?? null}, ${a.utm_medium ?? null}, ${a.utm_campaign ?? null}, ${a.utm_content ?? null},
          ${a.utm_term ?? null}, ${a.ref ?? null}, ${a.referrer ?? null}, ${a.landing_path ?? null},
          ${newReferralCode()}, (SELECT referral_code FROM inviter), ${canonical})
        ON CONFLICT (email) DO UPDATE SET
          locale            = EXCLUDED.locale,
          country           = COALESCE(EXCLUDED.country, contacts.country),
          timezone          = COALESCE(EXCLUDED.timezone, contacts.timezone),
          request_count     = contacts.request_count + 1,
          last_requested_at = now(),
          unsubscribed_at   = NULL,
          referral_code     = COALESCE(contacts.referral_code, EXCLUDED.referral_code),
          email_canonical   = COALESCE(contacts.email_canonical, EXCLUDED.email_canonical)
        RETURNING bounced_at, complained_at, referral_code,
          (SELECT unsubscribed_at FROM prev) AS was_unsubscribed`;
      const row = rows[0] as {
        bounced_at: string | null;
        complained_at: string | null;
        referral_code: string;
        was_unsubscribed: string | null;
      };
      if (row.was_unsubscribed) {
        await logConsent(r.email, "none", "launch", "spec_request", r.locale);
      }
      return { suppressed: Boolean(row.bounced_at || row.complained_at), referralCode: row.referral_code };
    } catch (error) {
      // A fresh invite code collided with an existing one: draw another
      const e = error as { code?: string; constraint?: string };
      if (e.code === "23505" && String(e.constraint ?? "").includes("referral_code") && attempt < 3) continue;
      throw error;
    }
  }
}

export async function markSpecsSent(email: string) {
  await sql()`UPDATE contacts SET specs_sent_at = now() WHERE email = ${email}`;
}

export type Contact = {
  email: string;
  locale: string;
  marketing_consent_at: string | null;
  unsubscribed_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  referral_code: string | null;
};

export async function getContact(email: string): Promise<Contact | null> {
  await ensureSchema();
  const rows = await sql()`
    SELECT email, locale, marketing_consent_at, unsubscribed_at, bounced_at, complained_at, referral_code
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
   webhooks are retried. Bounces and complaints stop all future sending.
   Returns the inviter's code when this is the first email ever delivered to a
   referred contact — the moment their referral starts to count. */
export async function recordEmailEvent(e: {
  id: string;
  type: string;
  email: string | null;
  messageId: string | null;
  data: unknown;
}): Promise<{ creditedInviter: string | null }> {
  await ensureSchema();
  const inserted = await sql()`
    INSERT INTO email_events (id, email, type, message_id, data)
    VALUES (${e.id}, ${e.email}, ${e.type}, ${e.messageId}, ${JSON.stringify(e.data)})
    ON CONFLICT (id) DO NOTHING
    RETURNING id`;
  if (inserted.length === 0 || !e.email) return { creditedInviter: null };

  if (e.type === "email.delivered") {
    const rows = await sql()`
      UPDATE contacts SET delivered_at = now()
      WHERE email = ${e.email} AND delivered_at IS NULL
      RETURNING referred_by`;
    return { creditedInviter: (rows[0]?.referred_by as string | null | undefined) ?? null };
  }
  if (e.type === "email.bounced") {
    await sql()`UPDATE contacts SET bounced_at = COALESCE(bounced_at, now()) WHERE email = ${e.email}`;
  } else if (e.type === "email.complained") {
    await setPreference(e.email, "none", "spam_complaint");
    await sql()`UPDATE contacts SET complained_at = COALESCE(complained_at, now()) WHERE email = ${e.email}`;
  }
  return { creditedInviter: null };
}
