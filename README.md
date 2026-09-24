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

## Database

Tables `contacts`, `consent_events` and `email_events` — see `db/schema.sql`. The app
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
