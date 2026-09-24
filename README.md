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

The page language follows the visitor's browser (`src/i18n/`). Every visible string
lives in `src/i18n/locales/<language>.ts`.

## Database

Table `contacts` — see `db/schema.sql`. The app creates it on first use; you can also
run that file in the Neon SQL editor.

## Local setup

```bash
bun i
cp .env.example .env.local   # fill in DATABASE_URL, ARCJET_KEY, RESEND_API_KEY
bun dev
```

Without `RESEND_API_KEY` the email step is skipped and requests are still saved.

## Tech

Next.js · Neon Postgres · Resend · Arcjet · Tailwind CSS · Motion

## License

[MIT License](LICENSE)
