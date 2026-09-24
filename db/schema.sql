-- The app creates and migrates these on first use (src/lib/db.ts); run this
-- in the Neon SQL editor to do it ahead of time. Keep the two in sync.

-- Everyone who asked for the specs — the start of the CRM
CREATE TABLE IF NOT EXISTS contacts (
  email                text PRIMARY KEY,           -- trimmed, lowercased
  locale               text NOT NULL,              -- language the visitor saw
  country              text,                       -- from Vercel's IP geolocation
  timezone             text,                       -- e.g. Asia/Bangkok, for send-time
  source               text NOT NULL DEFAULT 'specs',
  request_count        integer NOT NULL DEFAULT 1,
  first_requested_at   timestamptz NOT NULL DEFAULT now(),
  last_requested_at    timestamptz NOT NULL DEFAULT now(),
  specs_sent_at        timestamptz,                -- last successful specs email
  marketing_consent_at timestamptz,                -- set only on explicit opt-in
  unsubscribed_at      timestamptz                 -- no email at all, not even launch
);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS bounced_at    timestamptz;  -- hard bounce: never mail again
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS complained_at timestamptz;  -- marked as spam: never mail again

-- Delivery events from Resend's webhook (id = svix-id, so retries are ignored)
CREATE TABLE IF NOT EXISTS email_events (
  id          text PRIMARY KEY,
  email       text,
  type        text NOT NULL,                       -- email.delivered, email.bounced, …
  message_id  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  data        jsonb
);
CREATE INDEX IF NOT EXISTS email_events_email_idx ON email_events (email);

-- Who can receive what:
--   campaigns (news):  marketing_consent_at IS NOT NULL AND unsubscribed_at IS NULL
--                      AND bounced_at IS NULL AND complained_at IS NULL
--   launch email:      unsubscribed_at IS NULL AND bounced_at IS NULL AND complained_at IS NULL
