-- Contacts who asked for the Sunday specs. The app also creates this table
-- on first use (src/lib/db.ts); run this in the Neon SQL editor to create it
-- ahead of time. Keep the two in sync.
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
  unsubscribed_at      timestamptz
);
