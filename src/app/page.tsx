"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import device from "@/assets/arc-device.webp";
import shadow from "@/assets/arc-shadow.webp";
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

/* Headline size per language: "AI on the go" is short in most, long in a few */
const SHORT = "text-[46px] min-[400px]:text-[52px] sm:text-7xl md:text-[88px]";
const MEDIUM = "text-[40px] min-[400px]:text-[46px] sm:text-6xl md:text-[80px]";
const LONG = "text-[34px] min-[400px]:text-[38px] sm:text-6xl md:text-[68px]";
const DISPLAY_SIZE: Partial<Record<Locale, string>> = {
  en: SHORT,
  th: MEDIUM,
  "zh-Hans": SHORT,
  "zh-Hant": SHORT,
  ja: SHORT,
  ko: MEDIUM,
  de: MEDIUM,
  vi: LONG,
  id: LONG,
  es: LONG,
  fr: LONG,
  pt: LONG,
};

/* ARC, floating. The device and its shadow are separate layers cut from the
   same photo: the device drifts up and down; the shadow stays on the ground,
   shrinking and fading a little as the device rises. Positions are the
   device's place in the original 2000×1116 photo. */
function FloatingArc() {
  return (
    <div className="arc-stage relative mx-auto w-full">
      <div className="arc-frame absolute left-1/2 -translate-x-1/2">
        <Image
          src={shadow}
          alt=""
          priority
          sizes="(min-width: 768px) 1100px, 160vw"
          className="arc-shadow absolute select-none"
          style={{ left: "0%", top: "62.72%", width: "80.4%", height: "auto" }}
        />
        <Image
          src={device}
          alt="7on ARC"
          priority
          sizes="(min-width: 768px) 420px, 60vw"
          className="arc-float absolute select-none"
          style={{ left: "35.45%", top: "19.09%", width: "29%", height: "auto" }}
        />
      </div>
    </div>
  );
}

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

      {/* ── Hero: the product first, then what it is, then the form ── */}
      <section className="relative bg-gradient-to-b from-[#faf8f6] from-80% to-white pb-20 pt-20 sm:pb-28 sm:pt-24">
        <FloatingArc />

        <div className="relative z-10 mx-auto -mt-4 max-w-4xl px-6 text-center sm:-mt-8">
          {invited && (
            <p className="reveal mx-auto mb-5 w-fit rounded-full border border-[#C41D3B]/20 bg-[#C41D3B]/[0.06] px-3.5 py-1 text-sm font-medium text-[#C41D3B]">
              {t.invite.invited}
            </p>
          )}
          <h1>
            <span className="reveal block text-lg font-semibold text-[#C41D3B] sm:text-xl">7on ARC</span>
            <span className={`t-display mt-2 block text-balance font-medium ${DISPLAY_SIZE[locale] ?? DISPLAY_SIZE.en}`}>
              <SplitText delay={0.25}>{t.machine.tagline}</SplitText>
            </span>
          </h1>

          <p className="reveal reveal-2 mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-zinc-600 sm:text-xl">
            <Phrases text={t.hero.sub} />
          </p>

          <div id="get-specs" className="reveal reveal-3 mx-auto mt-9 w-full max-w-md scroll-mt-40">
            <div className="rounded-2xl border border-zinc-200 bg-white/85 p-2 shadow-[0_20px_50px_-25px_rgba(196,29,59,0.35)] backdrop-blur-md">
              <SpecsForm />
            </div>
            <p className="mt-3 text-balance px-4 text-xs text-zinc-400"><Phrases text={t.hero.note} /></p>
          </div>
        </div>
      </section>

      {/* ── One agent, everything around you ───────────────────── */}
      <section className="relative">
        <div data-section="orbit" className="relative z-0">
          {/* Pink bloom that the orb condenses from */}
          <div className="breathe pointer-events-none absolute left-1/2 top-[calc(var(--orbit)*0.5)] h-[calc(var(--orbit)*0.8)] w-[calc(var(--orbit)*0.8)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(196,29,59,0.16),rgba(196,29,59,0.05)_55%,transparent)]" />
          <Orbit />
        </div>
      </section>

      {/* ── Your first day ──────────────────────────────────────── */}
      <div data-section="day">
        <DayWithSunday />
      </div>

      {/* ── Truly yours. — and the closing call ─────────────── */}
      <section data-section="machine" className="relative overflow-hidden bg-[#faf8f6] px-6 py-24 text-center sm:py-32">
        <div className="fade-up mx-auto max-w-3xl">
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
        </div>

        <div className="fade-up mx-auto mt-20 max-w-2xl sm:mt-28">
          <p className="text-base font-semibold text-[#C41D3B] sm:text-lg">ARC</p>
          <h2 className="t-heading mt-2 text-balance text-3xl font-medium sm:text-5xl">
            {t.hero.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <button
            type="button"
            onClick={() => {
              track("cta_click", { location: "machine" });
              focusSpecsForm();
            }}
            className="group mt-9 inline-flex h-11 items-center gap-3 rounded-full bg-[#111] px-6 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            {t.machine.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
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


        /* The stage shows the photo from just above the device to below its shadow */
        .arc-stage { height: clamp(300px, 48vh, 580px); }
        .arc-frame { height: 122%; top: -16%; aspect-ratio: 2000 / 1116; }

        /* ARC settles in, then floats: up and down, gently, forever */
        .arc-float { animation: arcIn 1.4s cubic-bezier(.2,.7,.2,1) both, arcFloat 5s ease-in-out 1.4s infinite; }
        @keyframes arcIn { from { opacity: 0; transform: translateY(8%) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes arcFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5%); } }
        .arc-shadow { transform-origin: 62% 55%; animation: shadowIn 1.4s ease-out both, shadowFloat 5s ease-in-out 1.4s infinite; }
        @keyframes shadowIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shadowFloat { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(.93); opacity: .75; } }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .fade-up, .arc-float, .arc-shadow { opacity: 1 !important; transform: none !important; animation: none !important; }
          .breathe, .orb-breathe, .orbit-ring, .orbit-counter { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
