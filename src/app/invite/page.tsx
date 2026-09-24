import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { InviteLink } from "@/components/invite-link";
import { Phrases } from "@/components/ui/phrases";
import { DICTIONARIES, matchLocale } from "@/i18n/dictionaries";
import { getStanding, inviteUrl } from "@/lib/referrals";
import { verifyPreferenceToken } from "@/lib/tokens";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ t?: string }> };

/* Reached from the specs email: the person's place in line, how many friends
   joined through them, and their invite link. */
export default async function Invite({ searchParams }: Props) {
  const { t: token = "" } = await searchParams;
  const h = await headers();
  const dict = DICTIONARIES[matchLocale(h.get("accept-language"))];
  const t = dict.invite;

  const email = verifyPreferenceToken(token);
  const standing = email ? await getStanding(email) : null;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "7on.ai";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

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

        <h1 className="t-heading mt-12 text-center text-3xl font-medium sm:text-4xl">{t.pageTitle}</h1>

        {!standing ? (
          <p className="mt-6 text-balance text-center text-zinc-600">
            <Phrases text={dict.prefs.invalid} />
          </p>
        ) : standing.position === null ? (
          <p className="mt-6 text-balance text-center text-zinc-600">
            <Phrases text={t.out} />
          </p>
        ) : (
          <>
            <div className="mt-10 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-200 p-5 text-center">
                <p className="text-sm text-zinc-500">{t.place}</p>
                <p className="t-heading mt-2 text-4xl font-medium tabular-nums sm:text-5xl">#{standing.position}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-5 text-center">
                <p className="text-sm text-zinc-500">{t.friends}</p>
                <p className="t-heading mt-2 text-4xl font-medium tabular-nums sm:text-5xl">{standing.referrals}</p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <p className="font-medium">{t.title}</p>
              <p className="mx-auto mt-1 mb-4 max-w-sm text-balance text-sm text-zinc-600">
                <Phrases text={t.body} />
              </p>
              <InviteLink url={inviteUrl(origin, standing.code)} from="invite_page" />
              <p className="mx-auto mt-6 max-w-sm text-balance text-xs leading-relaxed text-zinc-400">
                <Phrases text={t.how} />
              </p>
            </div>
          </>
        )}

        <p className="mt-12 flex justify-center gap-6 text-sm">
          {email && (
            <Link
              href={`/preferences?t=${encodeURIComponent(token)}`}
              className="text-zinc-500 underline-offset-4 hover:text-[#111] hover:underline"
            >
              {t.manage}
            </Link>
          )}
          <Link href="/" className="text-zinc-500 underline-offset-4 hover:text-[#111] hover:underline">
            {dict.prefs.back}
          </Link>
        </p>
      </div>
    </main>
  );
}
