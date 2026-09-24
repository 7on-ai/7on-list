"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Mail, MoonStar, Package, Sunrise, type LucideIcon } from "lucide-react";
import { Phrases } from "@/components/ui/phrases";
import { useI18n } from "@/i18n/provider";

/* Copy lives in the dictionary; icons stay with the moment's position */
const ICONS: LucideIcon[] = [Sunrise, Mail, Package, MoonStar];

const STEP_MS = 5200;

export function DayWithSunday() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const { t } = useI18n();
  const MOMENTS = t.day.moments;

  useEffect(() => {
    if (reduce) return;
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % MOMENTS.length),
      STEP_MS
    );
    return () => clearTimeout(id);
  }, [index, reduce, MOMENTS.length]);

  const m = MOMENTS[index];
  const Icon = ICONS[index];

  return (
    <section className="relative overflow-hidden bg-[#C41D3B] px-6 py-24 text-white sm:py-32">
      {/* Soft light pool, like the main site */}
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.18),transparent)] blur-2xl" />

      <div className="relative mx-auto max-w-5xl text-center">
        <p className="t-eyebrow text-xs font-medium text-white/70">
          {t.day.eyebrow}
        </p>
        <h2 className="t-heading mt-4 text-4xl font-medium sm:text-6xl">
          <Phrases text={t.day.headline} />
        </h2>

        <div className="mx-auto mt-12 max-w-md text-left">
          <AnimatePresence mode="wait">
            <motion.div
              key={m.time}
              initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
              className="rounded-2xl border border-white/15 bg-[#8a1428]/80 p-7 shadow-[0_30px_60px_-20px_rgba(60,0,10,0.55)] backdrop-blur"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <span className="font-semibold tabular-nums">{m.time}</span>
                </div>
                <span className="text-white/70">{m.tag}</span>
              </div>
              <h3 className="mt-5 text-2xl font-medium tracking-[-0.02em]">
                {m.title}
              </h3>
              <p className="mt-4 flex gap-3 leading-relaxed text-white/90">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5a74]" />
                <span>
                  <Phrases text={m.line} />
                </span>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Timeline */}
        <div className="mx-auto mt-14 flex max-w-4xl items-center gap-4">
          <span className="w-12 text-left text-sm font-medium tabular-nums text-white/60">
            {m.time}
          </span>
          <div className="relative flex flex-1 items-center justify-between">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/20" />
            <motion.div
              className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-white/70"
              animate={{ width: `${(index / (MOMENTS.length - 1)) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
            />
            {MOMENTS.map((moment, i) => (
              <button
                key={moment.time}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${moment.time} — ${moment.title}`}
                className="relative z-10 flex h-6 w-6 items-center justify-center"
              >
                <span
                  className={`block rounded-full transition-all duration-500 ${
                    i === index
                      ? "h-3.5 w-3.5 bg-white"
                      : i < index
                      ? "h-1.5 w-1.5 bg-white/80"
                      : "h-1.5 w-1.5 bg-white/35"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
