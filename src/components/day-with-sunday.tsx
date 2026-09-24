"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarDays, House, PhoneCall, Sunrise, type LucideIcon } from "lucide-react";

type Moment = {
  time: string;
  icon: LucideIcon;
  tag: string;
  title: string;
  line: string;
};

const MOMENTS: Moment[] = [
  {
    time: "04:11",
    icon: Sunrise,
    tag: "Before the alarm",
    title: "Waking you up",
    line: "Morning. It's raining until six, so I've moved your run to the evening.",
  },
  {
    time: "09:40",
    icon: CalendarDays,
    tag: "On the way in",
    title: "Clearing your day",
    line: "Your 11:00 slipped to Thursday. I've told everyone and booked the room.",
  },
  {
    time: "14:25",
    icon: PhoneCall,
    tag: "While you focus",
    title: "Taking the call",
    line: "The clinic called back. You're confirmed for Friday at 3pm.",
  },
  {
    time: "21:30",
    icon: House,
    tag: "Winding down",
    title: "Closing the house",
    line: "Doors locked, lights dimmed, alarm set for 6:15. Sleep well.",
  },
];

const STEP_MS = 5200;

export function DayWithSunday() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % MOMENTS.length),
      STEP_MS
    );
    return () => clearTimeout(id);
  }, [index, reduce]);

  const m = MOMENTS[index];
  const Icon = m.icon;

  return (
    <section className="relative overflow-hidden bg-[#C41D3B] px-6 py-24 text-white sm:py-32">
      {/* Soft light pool, like the main site */}
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.18),transparent)] blur-2xl" />

      <div className="relative mx-auto max-w-5xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/70">
          One day
        </p>
        <h2 className="mt-4 text-4xl font-medium tracking-[-0.03em] sm:text-6xl">
          A day with Sunday
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
                {m.line}
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
