"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Counter } from "@/components/counter";
import { DayWithSunday } from "@/components/day-with-sunday";
import { Machine } from "@/components/machine";
import { Orbit } from "@/components/orbit";
import SplitText from "@/components/ui/split-text";
import { WaitlistForm } from "@/components/waitlist-form";

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

function focusWaitlist() {
  const form = document.getElementById("waitlist");
  form?.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => form?.querySelector("input")?.focus({ preventScroll: true }), 500);
}

export default function Home() {
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
          <h1 className="text-[38px] font-medium min-[400px]:text-[44px] leading-[1.02] tracking-[-0.045em] sm:text-7xl md:text-[92px]">
            <SplitText as="span" className="block">Your Sovereign AI.</SplitText>
            <SplitText as="span" className="block">Always-On Agent.</SplitText>
          </h1>

          <p className="reveal reveal-2 mt-7 text-lg text-zinc-600 sm:text-2xl">
            It doesn&rsquo;t just answer. It acts.
          </p>

          <div id="waitlist" className="reveal reveal-3 mx-auto mt-10 w-full max-w-md scroll-mt-40">
            <div className="rounded-2xl border border-zinc-200 bg-white/85 p-2 shadow-[0_20px_50px_-25px_rgba(196,29,59,0.35)] backdrop-blur-md">
              <WaitlistForm />
            </div>
            <div className="mt-5 text-sm text-zinc-500">
              <Counter />
            </div>
          </div>
        </div>

        <div className="relative z-0 mt-[calc(var(--orbit)*-0.22)]">
          {/* Pink bloom that the orb condenses from */}
          <div className="breathe pointer-events-none absolute left-1/2 top-[calc(var(--orbit)*0.5)] h-[calc(var(--orbit)*0.8)] w-[calc(var(--orbit)*0.8)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(196,29,59,0.16),rgba(196,29,59,0.05)_55%,transparent)]" />
          <Orbit />
        </div>
      </section>

      {/* ── One day ─────────────────────────────────────────────── */}
      <DayWithSunday />

      {/* ── A machine of your own ───────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f6f6f7]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 sm:py-32 md:grid-cols-2">
          <div className="fade-up">
            <h2 className="text-5xl font-medium leading-[1.05] tracking-[-0.04em] sm:text-6xl">
              A machine
              <br />
              of your own.
            </h2>
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-zinc-700 sm:text-xl">
              Your data stays yours. In a dedicated space untouched by anyone else.
            </p>
            <button
              type="button"
              onClick={focusWaitlist}
              className="group mt-9 inline-flex h-11 items-center gap-3 rounded-lg bg-[#111] px-5 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              Claim your machine
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
        <span>© {new Date().getFullYear()} 7on. Always on, never off.</span>
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
