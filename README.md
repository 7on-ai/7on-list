# 7on — Sunday specs

The page where visitors ask for the preliminary specs of Sunday. They leave an
email; the specs arrive in their inbox, in the language they read the page in.

## How it works

1. The visitor submits their email (`src/components/specs-form.tsx`).
2. `POST /api/specs` checks it with Arcjet (no disposable or undeliverable addresses).
3. The request is saved to Neon Postgres in `contacts`, with language, country and
   time zone (from Vercel's geolocation headers). Asking again re-sends the specs.
4. Right after responding, the specs email is sent through Resend
   (`src/emails/specs/`, 12 languages) and `specs_sent_at` is recorded.
   Addresses that hard-bounced or reported spam are never mailed again.

## Consent and preferences

- The specs email carries a signed link to `/preferences`, where the person picks
  **Updates** (news + launch), **Launch only** (the default) or **Nothing**.
  Changes happen on a button press, never on opening a link, so mail scanners
  can't opt anyone in.
- `POST /api/unsubscribe?t=…` is the RFC 8058 one-click endpoint; campaign emails
  add it with `unsubscribeHeaders()` from `src/lib/email.ts`.
- `POST /api/webhooks/resend` records delivery events (Svix-signed) and suppresses
  hard bounces and spam complaints.
- Every preference change is written to `consent_events` with where it came from
  and the version of the wording shown (`CONSENT_COPY_VERSION` in `src/lib/db.ts`).

## Attribution and analytics

- The first visit of a session keeps its `utm_*`, `ref`, external referrer and
  landing path (`src/lib/attribution.ts`); they are saved on the contact when it
  is created and never overwritten. Tag campaign links, e.g.
  `?utm_source=instagram&utm_medium=social&utm_campaign=launch`.
- Vercel Web Analytics (cookieless) counts page views. Custom events —
  `cta_click`, `section_view`, `spec_requested`, `form_error` (`src/lib/track.ts`) —
  appear on Vercel Pro. No event carries an email.

The page language follows the visitor's browser (`src/i18n/`). Every visible string
lives in `src/i18n/locales/<language>.ts`.

## Referrals and the line

- Everyone gets an invite link (`/?ref=<code>`), shown right after asking and on
  `/invite` (linked from the specs email).
- The line sets the order of launch emails: by first request, **7 days earlier
  per friend** (`REFERRAL_BOOST` in `src/lib/referrals.ts`).
- A friend counts once their first email is **delivered** (Resend webhook), and
  stops counting on a bounce or spam report. Gmail dots and `+tags` fold into one
  inbox, so nobody can invite themselves.
- People who asked for updates get a short note at 1, 3, 5, 10, 25, 50 and 100
  friends. Launch-only people get nothing extra — they were promised one email.

## Campaigns (Sunday drafts, a person approves)

- `/admin` (password: `ADMIN_PASSWORD`): list numbers, sources, top inviters, and
  campaigns with preview in every language, test send, approve, and send in waves.
- **Audiences:** `updates` goes to people who asked for news; `launch` goes to
  everyone in line and can go out **once, ever** (the page promises one email).
- **Approval is bound to the exact content.** Any edit needs a new approval;
  content can't change once anyone has received it.
- **Waves** go down the line, optionally by country or language, delivered at a
  chosen local hour in each person's time zone. Each person gets a campaign once.
- Links to our sites get `utm_source=email&utm_campaign=<id>` automatically;
  `{position}`, `{friends}` and `{invite_link}` fill in per person.
- Campaign emails carry one-click unsubscribe headers and footer links.

**Sunday's API** (`Authorization: Bearer $SUNDAY_API_KEY`) can draft, never send:

```bash
# Aggregate numbers only — no addresses
curl -H "Authorization: Bearer $SUNDAY_API_KEY" https://<site>/api/sunday/insights

# Create or update a draft (English required; other languages optional)
curl -X POST -H "Authorization: Bearer $SUNDAY_API_KEY" -H "Content-Type: application/json" \
  https://<site>/api/sunday/campaigns -d '{
    "id": "build-diary-1", "name": "Build diary #1", "kind": "updates",
    "content": { "en": { "subject": "…", "preheader": "…", "heading": "…",
                         "body": "Paragraph one.\n\nParagraph two.",
                         "cta_label": "Watch", "cta_url": "https://7on.ai/…" } } }'
```

## BIMI (logo next to the sender name)

`public/bimi.svg` is the 7on mark in SVG Tiny PS. Once DMARC is at
`p=quarantine` or `p=reject`, add a TXT record `default._bimi.7on.ai`:
`v=BIMI1; l=https://<site>/bimi.svg;`. Yahoo shows it as is; Gmail and Apple
Mail also need a VMC or CMC certificate (`a=` in the record).

## Database

Tables `contacts`, `consent_events`, `email_events`, `campaigns` and `sends` — see `db/schema.sql`. The app
creates them on first use; you can also run that file in the Neon SQL editor.

## Local setup

```bash
bun i
cp .env.example .env.local   # fill in the keys listed there
bun dev
```

Without `RESEND_API_KEY` the email step is skipped and requests are still saved.

## Tech

Next.js · Neon Postgres · Resend · Arcjet · Vercel Analytics · Tailwind CSS · Motion

## License

[MIT License](LICENSE)
