"use client";

import { Counter } from "@/components/counter";
import { Button } from "@/components/ui/button";
import SplitText from "@/components/ui/split-text";
import { WaitlistForm } from "@/components/waitlist-form";
import Link from "next/link";
import Image from "next/image";
import { Space_Grotesk, Instrument_Serif, JetBrains_Mono } from "next/font/google";

/* ── Type triad ─────────────────────────────────────────────
   Serif = display headline (echoes "JUST SAY IT." on 7on.ai)
   Grotesk = body / UI
   Mono = eyebrow + data labels (echoes "CALL NEO")            */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export default function Home() {
  return (
    <div
      className={`${spaceGrotesk.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${spaceGrotesk.className} relative min-h-screen overflow-hidden bg-[#0a0605] text-white selection:bg-rose-600 selection:text-white flex flex-col justify-between`}
    >
      {/* ── Atmosphere layers (behind everything) ───────────────── */}

      {/* Painterly dusk fallback — always present, so the scene looks
          intentional even before /sakura.png loads */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_78%_18%,rgba(190,60,70,0.28),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_115%,rgba(180,83,9,0.32),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_18%_30%,rgba(225,29,72,0.10),transparent_60%)]" />
      </div>

      {/* Sakura tree — bleeds in from the right, like 7on.ai.
          Drop your uploaded file at /public/sakura.png            */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/sakura.png"
          alt=""
          fill
          priority
          aria-hidden
          className="object-cover object-right opacity-70 mix-blend-screen [mask-image:linear-gradient(to_left,#000_40%,transparent_92%)]"
        />
      </div>

      {/* Legibility + vignette overlays */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#0a0605_8%,rgba(10,6,5,0.55)_38%,transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(130%_100%_at_50%_0%,transparent_55%,rgba(6,3,3,0.85)_100%)]" />

      {/* Warm horizon glow (the lit meadow) */}
      <div className="pointer-events-none absolute -bottom-40 left-1/2 z-0 h-[420px] w-[130%] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(closest-side,rgba(214,110,80,0.35),transparent)] blur-[40px] breathe" />

      {/* Drifting sakura petals */}
      <div className="petals pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`petal petal-${i % 7}`} />
        ))}
      </div>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="reveal relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <Image
          src="/logo.png"
          alt="7on"
          width={30}
          height={30}
          className="h-7 w-7 opacity-90 drop-shadow-[0_0_10px_rgba(225,29,72,0.45)]"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">
          Early&nbsp;Access
        </span>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        <div className="w-full max-w-2xl">
          {/* Eyebrow */}
          <div className="reveal reveal-1 mb-7 inline-flex items-center gap-2.5 rounded-full border border-rose-400/20 bg-rose-950/20 px-4 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-300">
              Priority Access — By Invitation
            </span>
          </div>

          {/* Headline: waitlist framing fused with the 7on tagline */}
          <SplitText className="font-serif text-5xl leading-[1.05] tracking-tight text-[#efe6e2] sm:text-7xl">
            Be first to{" "}
            <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-rose-400 to-red-400 drop-shadow-[0_0_30px_rgba(225,29,72,0.45)]">
              just say it.
            </span>
          </SplitText>

          {/* Sub — kept to two lines, plain spoken */}
          <p className="reveal reveal-3 mx-auto mt-6 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
            The real‑life Jarvis, reserved for the few who move first.
            Claim your place before the doors open.
          </p>

          {/* Waitlist form — refined glass shell */}
          <div className="reveal reveal-4 mx-auto mt-10 w-full max-w-md">
            <div className="rounded-2xl bg-gradient-to-b from-rose-400/25 via-white/5 to-transparent p-px">
              <div className="rounded-[15px] border border-white/10 bg-black/60 p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <WaitlistForm />
              </div>
            </div>

            {/* Counter */}
            <div className="mt-5 font-mono text-xs tracking-wide text-zinc-500">
              <Counter />
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="reveal relative z-10 flex items-center justify-center py-6">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full transition-all duration-300 hover:bg-rose-500/10"
          asChild
        >
          <Link href="https://7on.ai" target="_blank" aria-label="Visit 7on.ai">
            <Image
              src="/logo.png"
              alt="7on"
              width={22}
              height={22}
              className="h-5 w-5 opacity-50 transition-opacity hover:opacity-100"
            />
          </Link>
        </Button>
      </footer>

      {/* ── Motion + petals (scoped, reduced-motion aware) ──────── */}
      <style>{`
        .reveal { opacity: 0; transform: translateY(14px); animation: rise .9s cubic-bezier(.2,.7,.2,1) forwards; }
        .reveal-1 { animation-delay: .10s; }
        .reveal-3 { animation-delay: .28s; }
        .reveal-4 { animation-delay: .40s; }
        header.reveal { animation-delay: 0s; }
        footer.reveal { animation-delay: .55s; }
        @keyframes rise { to { opacity: 1; transform: translateY(0); } }

        .breathe { animation: breathe 7s ease-in-out infinite; }
        @keyframes breathe { 0%,100% { opacity: .8; } 50% { opacity: 1; } }

        /* Petals */
        .petal {
          position: absolute; top: -6%;
          width: 9px; height: 9px;
          background: radial-gradient(circle at 30% 30%, #ffd5e2, #f9789f 70%);
          border-radius: 100% 0 100% 0;
          opacity: 0; filter: blur(.2px);
          animation: fall linear infinite;
        }
        .petal-0 { left: 8%;  animation-duration: 14s; animation-delay: 0s;   }
        .petal-1 { left: 20%; animation-duration: 18s; animation-delay: 3s;   transform: scale(.7); }
        .petal-2 { left: 34%; animation-duration: 16s; animation-delay: 6s;   }
        .petal-3 { left: 48%; animation-duration: 20s; animation-delay: 1.5s; transform: scale(1.2); }
        .petal-4 { left: 62%; animation-duration: 15s; animation-delay: 8s;   transform: scale(.8); }
        .petal-5 { left: 76%; animation-duration: 19s; animation-delay: 4s;   }
        .petal-6 { left: 90%; animation-duration: 17s; animation-delay: 10s;  transform: scale(.9); }
        .petals span:nth-child(n+8) { top: -14%; opacity: .6; }

        @keyframes fall {
          0%   { opacity: 0; transform: translateY(-10vh) translateX(0) rotate(0deg); }
          10%  { opacity: .9; }
          90%  { opacity: .7; }
          100% { opacity: 0; transform: translateY(110vh) translateX(60px) rotate(320deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1 !important; transform: none !important; animation: none !important; }
          .petal, .breathe { animation: none !important; }
          .petal { display: none; }
        }
      `}</style>
    </div>
  );
}
