import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Phrases } from "@/components/ui/phrases";
import { NOTE_COPY } from "@/emails/note/copy";
import { DICTIONARIES, matchLocale } from "@/i18n/dictionaries";
import { getContact, preferenceOf, type Preference } from "@/lib/db";
import { verifyPreferenceToken } from "@/lib/tokens";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const ORDER: Preference[] = ["updates", "launch", "none"];

type Props = { searchParams: Promise<{ t?: string; choose?: string; saved?: string }> };

/* Reached from the links in our emails. Shows what the person currently
   receives and lets them change it; every change is a deliberate click. */
export default async function Preferences({ searchParams }: Props) {
  const { t: token = "", choose, saved } = await searchParams;
  const locale = matchLocale((await headers()).get("accept-language"));
  const t = DICTIONARIES[locale].prefs;

  const email = verifyPreferenceToken(token);
  const contact = email ? await getContact(email) : null;
  const current = contact ? preferenceOf(contact) : null;
  const [before, after] = t.intro.split("{email}");

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-[#111] sm:py-24">
      <div className="mx-auto max-w-lg">
        <Link href="/" aria-label="7on ARC" className="mx-auto block w-fit">
          <span
            role="img"
            aria-label="7on"
            className="block h-9 w-9 bg-[#E0233F] [mask:url(/logo.png)_center/contain_no-repeat]"
          />
        </Link>

        <h1 className="t-heading mt-12 text-center text-3xl font-medium sm:text-4xl">{t.title}</h1>

        {!contact || !current ? (
          <p className="mt-6 text-balance text-center text-zinc-600">
            <Phrases text={t.invalid} />
          </p>
        ) : (
          <>
            <p className="mt-4 text-center text-zinc-600">
              <Phrases text={before} />
              <span className="font-medium text-[#111]">{contact.email}</span>
              <Phrases text={after ?? ""} />
            </p>

            {saved && (
              <p role="status" className="mt-6 text-center text-sm font-medium text-[#C41D3B]">
                {t.saved}
              </p>
            )}

            {/* Arrived from "Yes, keep me posted" or "Unsubscribe" in an email:
                one clear button, still a deliberate press */}
            {(choose === "updates" || choose === "none") && current !== choose && !saved && (
              <form method="post" action="/api/preferences" className="mt-8 text-center">
                <input type="hidden" name="t" value={token} />
                <input type="hidden" name="preference" value={choose} />
                <button className="inline-flex h-12 items-center rounded-lg bg-[#111] px-6 font-medium text-white transition-colors hover:bg-black">
                  {choose === "updates" ? t.confirm : NOTE_COPY[locale].unsubscribe}
                </button>
              </form>
            )}

            <div className="mt-10 space-y-3">
              {ORDER.map((option) => {
                const active = option === current;
                return (
                  <form key={option} method="post" action="/api/preferences">
                    <input type="hidden" name="t" value={token} />
                    <input type="hidden" name="preference" value={option} />
                    <button
                      disabled={active}
                      aria-pressed={active}
                      className={`flex w-full items-start justify-between gap-4 rounded-2xl border p-5 text-left transition-colors ${
                        active ? "border-[#111] bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <span>
                        <span className="block font-medium">{t.options[option].label}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-zinc-600">
                          <Phrases text={t.options[option].description} />
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-sm font-medium ${active ? "text-[#C41D3B]" : "text-zinc-400"}`}
                      >
                        {active ? t.current : t.choose}
                      </span>
                    </button>
                  </form>
                );
              })}
            </div>
          </>
        )}

        <p className="mt-12 text-center text-sm">
          <Link href="/" className="text-zinc-500 underline-offset-4 hover:text-[#111] hover:underline">
            {t.back}
          </Link>
        </p>
      </div>
    </main>
  );
}
