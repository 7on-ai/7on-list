"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Counter } from "@/components/counter";
import { DayWithSunday } from "@/components/day-with-sunday";
import { Machine } from "@/components/machine";
import { Orbit } from "@/components/orbit";
import { Phrases } from "@/components/ui/phrases";
import SplitText from "@/components/ui/split-text";
import { WaitlistForm } from "@/components/waitlist-form";
import type { Locale } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/provider";

/* Logo PNG used as a mask so it renders in brand red, like 7on.ai */
function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="7on"
      className={`block bg-[#E0233F] [mask:url(/logo.png)_center/contain_no-repeat] ${className}`}
    />
  );
}

/* Hero size per script: Latin runs big like 7on.ai; longer languages and
   scripts with tall marks or dense glyphs step down so lines stay whole. */
const LONG = "text-[34px] min-[400px]:text-[38px] sm:text-6xl md:text-[76px]";
const COMPACT = "text-[30px] min-[400px]:text-[34px] sm:text-6xl md:text-[72px]";
const DISPLAY_SIZE: Partial<Record<Locale, string>> = {
  en: "text-[40px] min-[400px]:text-[46px] sm:text-7xl md:text-[92px]",
  th: "text-[34px] min-[400px]:text-[38px] sm:text-6xl md:text-[72px]",
  "zh-Hans": COMPACT,
  "zh-Hant": COMPACT,
  ja: COMPACT,
  ko: COMPACT,
  vi: LONG,
  id: LONG,
  es: LONG,
  fr: LONG,
  de: LONG,
  pt: LONG,
};

function focusWaitlist() {
  const form = document.getElementById("waitlist");
  form?.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => form?.querySelector("input")?.focus({ preventScroll: true }), 500);
}

export default function Home() {
  const { t, locale } = useI18n();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-[#111] selection:bg-[#C41D3B] selection:text-white">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="reveal absolute inset-x-0 top-0 z-20 flex justify-center py-8">
        <Link href="https://7on.ai" target="_blank" aria-label="7on.ai">
          <Logo className="h-9 w-9" />
        </Link>
      </header>

      {/* ── Hero + orbit ────────────────────────────────────────── */}
      <section className="relative">
        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-36 text-center sm:pt-44">
          <h1
            className={`t-display font-medium ${DISPLAY_SIZE[locale] ?? DISPLAY_SIZE.en}`}
          >
            {t.hero.headline.map((line, i) => (
              <SplitText key={line} className="block" delay={i * 0.15}>
                {line}
              </SplitText>
            ))}
          </h1>

          <p className="reveal reveal-2 mx-auto mt-7 max-w-xl text-balance text-lg leading-relaxed text-zinc-600 sm:text-xl">
            <Phrases text={t.hero.sub} />
          </p>

          <div id="waitlist" className="reveal reveal-3 mx-auto mt-10 w-full max-w-md scroll-mt-40">
            <div className="rounded-2xl border border-zinc-200 bg-white/85 p-2 shadow-[0_20px_50px_-25px_rgba(196,29,59,0.35)] backdrop-blur-md">
              <WaitlistForm />
            </div>
            <p className="mt-3 text-xs text-zinc-400"><Phrases text={t.hero.note} /></p>
            <div className="mt-6 text-sm text-zinc-500">
              <Counter />
            </div>
          </div>
        </div>

        <div className="relative z-0 mt-[calc(var(--orbit)*-0.1)] sm:mt-[calc(var(--orbit)*-0.22)]">
          {/* Pink bloom that the orb condenses from */}
          <div className="breathe pointer-events-none absolute left-1/2 top-[calc(var(--orbit)*0.5)] h-[calc(var(--orbit)*0.8)] w-[calc(var(--orbit)*0.8)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(196,29,59,0.16),rgba(196,29,59,0.05)_55%,transparent)]" />
          <Orbit />
        </div>
      </section>

      {/* ── Your first day ──────────────────────────────────────── */}
      <DayWithSunday />

      {/* ── Truly yours. ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f6f6f7]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 sm:py-32 md:grid-cols-2">
          <div className="fade-up">
            <h2 className="t-heading text-[40px] font-medium sm:text-6xl">
              {t.machine.headline.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-700 sm:text-xl">
              <Phrases text={t.machine.body} />
            </p>
            <button
              type="button"
              onClick={focusWaitlist}
              className="group mt-9 inline-flex h-11 items-center gap-3 rounded-lg bg-[#111] px-5 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              {t.machine.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
          <div className="relative flex justify-center md:justify-end">
            <Machine className="float w-[78%] max-w-[440px] md:w-[115%] md:max-w-none md:translate-x-[18%]" />
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="flex flex-col items-center gap-3 bg-white py-10 text-xs text-zinc-500">
        <Link href="https://7on.ai" target="_blank" className="opacity-70 transition-opacity hover:opacity-100">
          <Logo className="h-7 w-7" />
        </Link>
        <span>
          © {new Date().getFullYear()} 7on. {t.footer}
        </span>
      </footer>

      {/* ── Motion (reduced-motion aware) ──────────────────────── */}
      <style>{`
        :root { --orbit: min(1040px, 170vw); }

        .reveal { opacity: 0; transform: translateY(14px); animation: rise 1s cubic-bezier(.2,.7,.2,1) forwards; }
        .reveal-2 { animation-delay: .45s; }
        .reveal-3 { animation-delay: .65s; }
        @keyframes rise { to { opacity: 1; transform: translateY(0); } }

        .fade-up { animation: rise linear both; animation-timeline: view(); animation-range: entry 10% cover 35%; }

        .breathe { animation: breathe 7s ease-in-out infinite; }
        @keyframes breathe { 0%,100% { opacity: .75; } 50% { opacity: 1; } }

        .orb-breathe { animation: orbBreathe 5s ease-in-out infinite; }
        @keyframes orbBreathe { 0%,100% { opacity: .6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.03); } }

        .orbit-ring { animation: spin linear infinite; }
        .orbit-counter { animation: spin linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .machine-glow { animation: glow 4s ease-in-out infinite; }
        @keyframes glow { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.15); } }

        .float { animation: float 8s ease-in-out infinite; }
        @keyframes float { 0%,100% { translate: 0 0; } 50% { translate: 0 -10px; } }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .fade-up { opacity: 1 !important; transform: none !important; animation: none !important; }
          .breathe, .orb-breathe, .orbit-ring, .orbit-counter, .machine-glow, .float { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
