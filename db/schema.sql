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

-- First-touch attribution: set when the contact is created, never overwritten
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS utm_source   text,
  ADD COLUMN IF NOT EXISTS utm_medium   text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content  text,
  ADD COLUMN IF NOT EXISTS utm_term     text,
  ADD COLUMN IF NOT EXISTS ref          text,   -- ?ref= on the link (referrals, partners)
  ADD COLUMN IF NOT EXISTS referrer     text,   -- the other site the visitor came from
  ADD COLUMN IF NOT EXISTS landing_path text;

-- Every change to what someone agreed to receive — proof of consent
CREATE TABLE IF NOT EXISTS consent_events (
  id            bigserial PRIMARY KEY,
  email         text NOT NULL,
  from_pref     text,                            -- updates | launch | none
  to_pref       text NOT NULL,
  source        text NOT NULL,                   -- preferences_page | one_click | spam_complaint | spec_request
  locale        text,
  copy_version  text NOT NULL,                   -- wording shown (CONSENT_COPY_VERSION)
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consent_events_email_idx ON consent_events (email);

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
