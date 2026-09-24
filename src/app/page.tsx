"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import arc from "@/assets/7on-arc.webp";
import { DayWithSunday } from "@/components/day-with-sunday";
import { Orbit } from "@/components/orbit";
import { Phrases } from "@/components/ui/phrases";
import SplitText from "@/components/ui/split-text";
import { SpecsForm } from "@/components/specs-form";
import type { Locale } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/provider";
import { captureAttribution } from "@/lib/attribution";
import { track } from "@/lib/track";
import { useEffect, useState } from "react";

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

function focusSpecsForm() {
  const form = document.getElementById("get-specs");
  form?.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => form?.querySelector("input")?.focus({ preventScroll: true }), 500);
}

/* Where visitors came from, and how far down the page they get */
function usePageInsights() {
  useEffect(() => {
    captureAttribution();
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const section = (e.target as HTMLElement).dataset.section as "orbit" | "day" | "machine";
          if (e.isIntersecting && !seen.has(section)) {
            seen.add(section);
            track("section_view", { section });
          }
        }
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* Arrived on a friend's invite link (?ref=…) */
function useInvited() {
  const [invited, setInvited] = useState(false);
  useEffect(() => {
    setInvited(/^[a-z0-9]{6,12}$/i.test(new URLSearchParams(window.location.search).get("ref") ?? ""));
  }, []);
  return invited;
}

export default function Home() {
  const { t, locale } = useI18n();
  usePageInsights();
  const invited = useInvited();

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
          {invited && (
            <p className="reveal mx-auto -mt-12 mb-6 w-fit rounded-full border border-[#C41D3B]/20 bg-[#C41D3B]/[0.06] px-3.5 py-1 text-sm font-medium text-[#C41D3B] sm:-mt-14 sm:mb-8">
              {t.invite.invited}
            </p>
          )}
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

          <div id="get-specs" className="reveal reveal-3 mx-auto mt-10 w-full max-w-md scroll-mt-40">
            <div className="rounded-2xl border border-zinc-200 bg-white/85 p-2 shadow-[0_20px_50px_-25px_rgba(196,29,59,0.35)] backdrop-blur-md">
              <SpecsForm />
            </div>
            <p className="mt-3 text-balance px-4 text-xs text-zinc-400"><Phrases text={t.hero.note} /></p>
          </div>
        </div>

        <div data-section="orbit" className="relative z-0 mt-[calc(var(--orbit)*-0.1)] sm:mt-[calc(var(--orbit)*-0.22)]">
          {/* Pink bloom that the orb condenses from */}
          <div className="breathe pointer-events-none absolute left-1/2 top-[calc(var(--orbit)*0.5)] h-[calc(var(--orbit)*0.8)] w-[calc(var(--orbit)*0.8)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(196,29,59,0.16),rgba(196,29,59,0.05)_55%,transparent)]" />
          <Orbit />
        </div>
      </section>

      {/* ── Your first day ──────────────────────────────────────── */}
      <div data-section="day">
        <DayWithSunday />
      </div>

      {/* ── Truly yours. — the product reveal ─────────────────── */}
      {/* Background matches the photo's own backdrop so the image has no edge */}
      <section data-section="machine" className="relative overflow-hidden bg-[#faf8f6]">
        <div className="fade-up relative z-10 mx-auto max-w-3xl px-6 pt-24 text-center sm:pt-32">
          {/* Product name — the same in every language */}
          <p className="mb-4 text-base font-medium text-[#C41D3B] sm:text-lg">7on ARC</p>
          <h2 className="t-heading text-[40px] font-medium sm:text-6xl md:text-7xl">
            {t.machine.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-zinc-700 sm:text-xl">
            <Phrases text={t.machine.body} />
          </p>
          <button
            type="button"
            onClick={() => {
              track("cta_click", { location: "machine" });
              focusSpecsForm();
            }}
            className="group mt-9 inline-flex h-11 items-center gap-3 rounded-lg bg-[#111] px-5 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            {t.machine.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="reveal-product relative mx-auto -mt-6 max-w-6xl sm:-mt-10">
          <Image
            src={arc}
            alt="7on ARC"
            sizes="(min-width: 1152px) 1152px, 100vw"
            placeholder="blur"
            className="aspect-square w-full object-cover sm:aspect-[16/10] [mask-image:radial-gradient(ellipse_62%_62%_at_50%_46%,#000_58%,transparent_100%)]"
          />
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="flex flex-col items-center gap-3 bg-[#faf8f6] py-10 text-xs text-zinc-500">
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


        .reveal-product { animation: settle linear both; animation-timeline: view(); animation-range: entry 0% entry 85%; }
        @keyframes settle { from { opacity: 0; transform: translateY(40px) scale(.96); } to { opacity: 1; transform: none; } }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .fade-up, .reveal-product { opacity: 1 !important; transform: none !important; animation: none !important; }
          .breathe, .orb-breathe, .orbit-ring, .orbit-counter { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
