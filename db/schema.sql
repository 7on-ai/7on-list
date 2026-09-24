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

CREATE INDEX IF NOT EXISTS email_events_message_idx ON email_events (message_id);

-- Referrals: each contact's invite code, who invited them, and when their first
-- email was delivered (a referral counts only from then). email_canonical folds
-- Gmail dots and +tags, so one inbox can't pose as several friends.
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS referral_code   text,
  ADD COLUMN IF NOT EXISTS referred_by     text,          -- inviter's referral_code
  ADD COLUMN IF NOT EXISTS email_canonical text,
  ADD COLUMN IF NOT EXISTS delivered_at    timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS contacts_referral_code_idx ON contacts (referral_code);
CREATE INDEX IF NOT EXISTS contacts_referred_by_idx ON contacts (referred_by);
CREATE INDEX IF NOT EXISTS contacts_email_canonical_idx ON contacts (email_canonical);

-- Campaigns: drafted by a person or Sunday, approved by a person, sent in waves.
-- Approval is valid only while approved_hash = content_hash.
CREATE TABLE IF NOT EXISTS campaigns (
  id             text PRIMARY KEY,               -- also the utm_campaign tag
  name           text NOT NULL,
  kind           text NOT NULL,                  -- updates | launch (launch: once, ever)
  content        jsonb NOT NULL,                 -- per language: subject, preheader, heading, body, cta
  content_hash   text NOT NULL,
  created_by     text NOT NULL,                  -- admin | sunday
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  approved_hash  text,
  approved_at    timestamptz
);

-- One row per person per campaign or flow step (flow:referral:3, …)
CREATE TABLE IF NOT EXISTS sends (
  campaign_id    text NOT NULL,
  email          text NOT NULL,
  status         text NOT NULL,                  -- pending | sent | failed
  resend_id      text,                           -- joins email_events.message_id
  error          text,
  scheduled_for  timestamptz,                    -- local-time delivery
  created_at     timestamptz NOT NULL DEFAULT now(),
  sent_at        timestamptz,
  PRIMARY KEY (campaign_id, email)
);
CREATE INDEX IF NOT EXISTS sends_resend_idx ON sends (resend_id);

-- The line (src/lib/referrals.ts): ordered by first_requested_at, minus 7 days
-- per counted friend; people who turned email off, bounced or complained are out.

-- Who can receive what:
--   campaigns (news):  marketing_consent_at IS NOT NULL AND unsubscribed_at IS NULL
--                      AND bounced_at IS NULL AND complained_at IS NULL
--   launch email:      unsubscribed_at IS NULL AND bounced_at IS NULL AND complained_at IS NULL
