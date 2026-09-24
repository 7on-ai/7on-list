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

/* Everyone who asked for the specs. The start of the CRM: consent and
   unsubscribe columns are here so marketing can be added without a
   migration. Kept in sync with db/schema.sql. */
let ready: Promise<unknown> | null = null;
function ensureSchema() {
  ready ??= sql()`
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
    )`.catch((error) => {
    ready = null; // retry on the next request
    throw error;
  });
  return ready;
}

export type SpecRequest = {
  email: string;
  locale: string;
  country: string | null;
  timezone: string | null;
};

/* Records a spec request. Asking again is allowed — it bumps the count and
   refreshes language/location, and the specs are sent again. */
export async function recordSpecRequest(r: SpecRequest) {
  await ensureSchema();
  await sql()`
    INSERT INTO contacts (email, locale, country, timezone)
    VALUES (${r.email}, ${r.locale}, ${r.country}, ${r.timezone})
    ON CONFLICT (email) DO UPDATE SET
      locale            = EXCLUDED.locale,
      country           = COALESCE(EXCLUDED.country, contacts.country),
      timezone          = COALESCE(EXCLUDED.timezone, contacts.timezone),
      request_count     = contacts.request_count + 1,
      last_requested_at = now()`;
}

export async function markSpecsSent(email: string) {
  await sql()`UPDATE contacts SET specs_sent_at = now() WHERE email = ${email}`;
}
