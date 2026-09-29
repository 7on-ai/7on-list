"use client";

import { Lock, LockOpen, Mic, MicOff, MoveHorizontal } from "lucide-react";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import poster from "@/assets/arc-3d.webp";
import { Phrases } from "@/components/ui/phrases";
import { useI18n } from "@/i18n/provider";
import { track } from "@/lib/track";
import type { AnchorId, ArcButton, ArcSceneHandle } from "./scene";
import { ArcScreen, type Mode } from "./screen";
import { exampleAdapter, type SundayAdapter } from "./sunday";
import { MicLevel, speakingLevel } from "./voice";

type Via = "device" | "control";
type Caption = { kind: "tap" | "listening" | "locked" | "muted" | "noMic" } | { kind: "reply"; text: string; example: boolean };
type Stage = "loading" | "3d" | "flat";

/* Touches this close to the middle of the glass count as touching the dot */
const DOT_TOUCH_MM = 8;

/* What each button is called on the page. The mic button is BOOT on the
   development board; for people it's the privacy button. */
const BUTTON_NAME: Record<ArcButton, string> = { pwr: "PWR", boot: "PRIVACY" };
const LISTEN_MAX_S = 8;
const NO_MIC_LISTEN_S = 2.6;

/* Rough speaking time for a line: words where there are spaces, characters where there aren't */
function speakingTime(text: string) {
  const units = /[฀-๿぀-鿿가-힯]/.test(text) ? text.length / 3.2 : text.split(/\s+/).length;
  return Math.min(7, Math.max(2.4, 1.4 + units * 0.33));
}

/* The device, working: tap the red dot and speak; PWR locks the screen;
   Privacy (BOOT on the board) turns the mic off. Everything the screen shows comes from ArcScreen. */
export function ArcDemo({ adapter }: { adapter?: SundayAdapter }) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion() ?? false;

  const [stage, setStage] = useState<Stage>("loading");
  const [mode, setMode] = useState<Mode>("idle");
  const [locked, setLocked] = useState(false);
  const [micOff, setMicOff] = useState(false);
  const [caption, setCaption] = useState<Caption>({ kind: "tap" });

  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flatRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLSpanElement>(null);
  const labelRefs = useRef<Record<AnchorId, HTMLDivElement | null>>({ pwr: null, boot: null, dot: null });
  const dotLineRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<ArcScreen | null>(null);
  const sceneRef = useRef<ArcSceneHandle | null>(null);
  const mic = useMemo(() => new MicLevel(), []);

  // Examples come from "The day your ARC arrives", already in every language
  const linesRef = useRef<string[]>([]);
  linesRef.current = t.day.moments.slice(1).map((m) => m.line);
  const sunday = useMemo(() => adapter ?? exampleAdapter(() => linesRef.current), [adapter]);

  // Everything the frame loop reads, without re-rendering React
  const live = useRef({
    mode: "idle" as Mode,
    locked: false,
    micOff: false,
    level: 0,
    clock: 0,
    micState: "none" as "none" | "asking" | "on" | "off",
    listenFrom: 0,
    speech: 0,
    silence: 0,
    heard: false,
    speakFrom: 0,
    speakFor: 0,
    reply: "",
    shown: -1,
    session: 0,
  });

  const toIdle = useCallback(() => {
    mic.stop();
    const l = live.current;
    l.session += 1;
    l.mode = "idle";
    l.micState = "none";
    setMode("idle");
  }, [mic]);

  const finishListening = useCallback(async () => {
    const l = live.current;
    if (l.mode !== "listening") return;
    mic.stop();
    const session = l.session;
    l.mode = "thinking";
    setMode("thinking");
    const [reply] = await Promise.all([
      sunday.reply({ locale, heard: l.heard }),
      new Promise((r) => setTimeout(r, 650)),
    ]);
    if (l.session !== session) return; // cancelled meanwhile
    l.mode = "speaking";
    l.speakFrom = l.clock;
    l.speakFor = speakingTime(reply.text);
    l.reply = reply.text;
    l.shown = -1;
    setMode("speaking");
    setCaption({ kind: "reply", text: reply.text, example: reply.example });
  }, [locale, mic, sunday]);

  const startListening = useCallback(async () => {
    const l = live.current;
    l.session += 1;
    const session = l.session;
    l.mode = "listening";
    l.micState = "asking";
    l.heard = false;
    l.speech = l.silence = 0;
    l.listenFrom = l.clock;
    setMode("listening");
    setCaption({ kind: "listening" });
    const ok = await mic.start();
    if (l.session !== session) {
      mic.stop();
      return;
    }
    l.micState = ok ? "on" : "off";
    l.listenFrom = l.clock;
    if (!ok) setCaption({ kind: "noMic" });
  }, [mic]);

  const talk = useCallback(
    (via: Via) => {
      const l = live.current;
      if (l.locked) {
        screenRef.current?.nudge("lock");
        setCaption({ kind: "locked" });
        return;
      }
      if (l.micOff) {
        screenRef.current?.nudge("mic");
        setCaption({ kind: "muted" });
        return;
      }
      if (l.mode === "idle") {
        track("demo_action", { action: "talk", via });
        void startListening();
      } else if (l.mode === "listening") {
        void finishListening();
      } else {
        toIdle();
        setCaption({ kind: "tap" });
      }
    },
    [finishListening, startListening, toIdle]
  );

  const pressPwr = useCallback(
    (via: Via) => {
      sceneRef.current?.press("pwr");
      const l = live.current;
      l.locked = !l.locked;
      setLocked(l.locked);
      track("demo_action", { action: l.locked ? "lock" : "unlock", via });
      if (l.locked) {
        if (l.mode !== "idle") toIdle();
        setCaption({ kind: "locked" });
      } else {
        setCaption({ kind: l.micOff ? "muted" : "tap" });
      }
    },
    [toIdle]
  );

  const pressBoot = useCallback(
    (via: Via) => {
      sceneRef.current?.press("boot");
      const l = live.current;
      l.micOff = !l.micOff;
      setMicOff(l.micOff);
      track("demo_action", { action: l.micOff ? "mic_off" : "mic_on", via });
      if (l.micOff) {
        if (l.mode !== "idle") toIdle();
        setCaption({ kind: "muted" });
      } else {
        setCaption({ kind: l.locked ? "locked" : "tap" });
      }
    },
    [toIdle]
  );

  const touchScreen = useCallback(
    (x: number, y: number) => {
      const l = live.current;
      if (l.mode !== "idle" || Math.hypot(x, y) < DOT_TOUCH_MM) talk("device");
      else if (l.locked) {
        screenRef.current?.nudge("lock");
        setCaption({ kind: "locked" });
      }
    },
    [talk]
  );

  // Without WebGL, the screen canvas goes in the flat frame
  useEffect(() => {
    if (stage === "flat" && screenRef.current) flatRef.current?.replaceChildren(screenRef.current.canvas);
  }, [stage]);

  // The loop and listeners are set up once; these keep them calling the latest versions
  const handlers = useRef({ talk, pressPwr, pressBoot, touchScreen });
  handlers.current = { talk, pressPwr, pressBoot, touchScreen };
  const finishListeningRef = useRef(finishListening);
  finishListeningRef.current = finishListening;
  const toIdleRef = useRef(toIdle);
  toIdleRef.current = toIdle;

  // ── Screen, frame loop, and the 3D model once the demo is near ──
  useEffect(() => {
    const screen = new ArcScreen(window.innerWidth >= 768 ? 768 : 512, { reducedMotion: reduce });
    screenRef.current = screen;
    screen.canvas.className = "h-full w-full rounded-full";
    screen.canvas.setAttribute("aria-hidden", "true");

    let raf = 0;
    let last = performance.now();
    let visible = false;
    let disposed = false;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const l = live.current;
      l.clock += dt;

      if (l.mode === "listening") {
        const elapsed = l.clock - l.listenFrom;
        if (l.micState === "on") {
          l.level = mic.read();
          if (l.level > 0.32) {
            l.speech += dt;
            l.silence = 0;
            if (l.speech > 0.15) l.heard = true;
          } else if (l.heard) {
            l.silence += dt;
          }
          if ((l.heard && l.silence > 1.1) || elapsed > LISTEN_MAX_S) void finishListeningRef.current();
        } else {
          l.level = 0.12 + 0.08 * Math.sin(l.clock * 3);
          if (l.micState === "off" && elapsed > NO_MIC_LISTEN_S) void finishListeningRef.current();
        }
      } else if (l.mode === "speaking") {
        const s = l.clock - l.speakFrom;
        l.level = speakingLevel(s);
        // Words appear as Sunday says them
        const n = Math.ceil(l.reply.length * Math.min(1, s / (l.speakFor * 0.92)));
        if (n !== l.shown && replyRef.current) {
          l.shown = n;
          replyRef.current.textContent = l.reply.slice(0, n);
        }
        if (s > l.speakFor) {
          if (replyRef.current) replyRef.current.textContent = l.reply;
          toIdleRef.current();
        }
      } else {
        l.level = 0;
      }

      screen.update(l, dt);
      screen.draw();
      const scene = sceneRef.current;
      if (scene) {
        scene.render(dt, true);
        const anchors = scene.anchors();
        const stageWidth = stageRef.current?.clientWidth ?? 0;
        const fade = (facing: number) => String(Math.max(0, Math.min(1, (facing - 0.05) * 4)));

        // PWR and Privacy: the label sits on whichever side the button is
        for (const id of ["pwr", "boot"] as ArcButton[]) {
          const el = labelRefs.current[id];
          if (!el) continue;
          const a = anchors[id];
          const left = a.x < stageWidth / 2;
          el.style.transform = `translate(${a.x}px, ${a.y}px)`;
          el.style.opacity = fade(a.facing);
          const inner = el.firstElementChild as HTMLElement;
          inner.style.flexDirection = left ? "row-reverse" : "row";
          inner.style.textAlign = left ? "right" : "left";
          inner.style.transform = left ? "translate(calc(-100% - 10px), -50%)" : "translate(10px, -50%)";
        }

        // The red dot: its label above the device, a line down to the dot.
        // Only while the dot is there to tap.
        const dot = labelRefs.current.dot;
        const line = dotLineRef.current;
        if (dot && line) {
          const a = anchors.dot;
          const show = l.mode === "idle" && !l.locked && !l.micOff;
          const opacity = show ? fade(a.facing) : "0";
          const half = dot.offsetWidth / 2 + 8;
          const x = Math.min(Math.max(a.x, half), stageWidth - half);
          dot.style.transform = `translateX(${x}px) translateX(-50%)`;
          dot.style.opacity = opacity;
          const top = dot.offsetTop + dot.offsetHeight + 6;
          line.style.transform = `translate(${a.x}px, ${top}px)`;
          line.style.height = `${Math.max(0, a.y - top - 7)}px`;
          line.style.opacity = opacity;
        }
      }
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    // Run only while on screen
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
      if (!visible && live.current.mode !== "idle") {
        toIdleRef.current();
        setCaption({ kind: "tap" });
      }
    });

    // The still shows first; three.js and the model load once the page is idle
    const load = () =>
      import("./scene")
        .then(({ createArcScene }) =>
          createArcScene(
            stageRef.current!,
            screen.canvas,
            {
              onButton: (b) => (b === "pwr" ? handlers.current.pressPwr("device") : handlers.current.pressBoot("device")),
              onScreen: (x, y) => handlers.current.touchScreen(x, y),
              onDrag: () => track("demo_action", { action: "drag", via: "device" }),
            },
            { reducedMotion: reduce }
          )
        )
        .then((scene) => {
          if (disposed) return scene.dispose();
          sceneRef.current = scene;
          setStage("3d");
        })
        .catch((err) => {
          // No WebGL, or the model didn't load: the screen still works on its own
          console.warn("ARC demo: showing the flat screen.", err);
          if (!disposed) setStage("flat");
        });
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => void load(), { timeout: 1500 });
    else setTimeout(() => void load(), 200);
    if (sectionRef.current) io.observe(sectionRef.current);

    return () => {
      disposed = true;
      io.disconnect();
      cancelAnimationFrame(raf);
      mic.stop();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [mic, reduce]);

  const d = t.demo;
  const busy = mode !== "idle";
  const pill =
    "flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white/80 px-3 text-[13px] font-medium text-zinc-700 backdrop-blur transition-colors hover:border-zinc-300 hover:bg-white sm:h-10 sm:gap-2 sm:px-4 sm:text-sm";

  return (
    <div ref={sectionRef} className="relative">
      {/* The device */}
      <div className="arc-3d relative mx-auto w-full max-w-4xl">
        {/* Soft contact shadow */}
        <div className="pointer-events-none absolute bottom-[8%] left-1/2 aspect-[7/1] h-[6%] -translate-x-1/2 rounded-[50%] bg-black/20 blur-xl" />

        {/* A still of the same pose, shown until the live model takes over */}
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
            stage === "loading" ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Phones show the device a little smaller (see layout.ts) */}
          <Image
            src={poster}
            alt="7on ARC"
            priority
            sizes="(min-width: 768px) 560px, 100vw"
            className="aspect-square h-full max-h-full w-auto max-w-full scale-[0.854] select-none object-contain sm:scale-100"
          />
        </div>

        {/* Without WebGL: the screen on its own, still working */}
        {stage === "flat" && (
          <div
            className="absolute left-1/2 top-1/2 aspect-square w-[min(66vw,320px)] -translate-x-1/2 -translate-y-1/2 rounded-full p-[3.2%] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] [background:linear-gradient(145deg,#f4f4f5,#a1a1aa_45%,#e4e4e7_70%,#71717a)]"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const mm = 55 / r.width;
              handlers.current.touchScreen((e.clientX - r.left - r.width / 2) * mm, -(e.clientY - r.top - r.height / 2) * mm);
            }}
          >
            <div ref={flatRef} className="relative h-full w-full cursor-pointer rounded-full bg-black" />
          </div>
        )}

        <div ref={stageRef} className={`absolute inset-0 transition-opacity duration-500 ${stage === "3d" ? "opacity-100" : "opacity-0"}`} />

        {/* Labels that follow the device as it turns */}
        {stage === "3d" && (
          <>
            {(["pwr", "boot"] as ArcButton[]).map((id) => (
              <div
                key={id}
                ref={(el) => {
                  labelRefs.current[id] = el;
                }}
                className="pointer-events-none absolute left-0 top-0 opacity-0"
              >
                <span className="absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap sm:gap-2">
                  <span className="h-px w-4 shrink-0 bg-zinc-300 sm:w-6" />
                  <span className="flex flex-col leading-tight sm:flex-row sm:items-center sm:gap-2">
                    <span className="text-[10px] font-semibold tracking-wider text-zinc-500 sm:text-[11px]">{BUTTON_NAME[id]}</span>
                    <span className="text-[10px] text-zinc-400 sm:text-xs">{id === "pwr" ? d.pwrHint : d.bootHint}</span>
                  </span>
                </span>
              </div>
            ))}

            {/* What the red dot does */}
            <div
              ref={(el) => {
                labelRefs.current.dot = el;
              }}
              className="pointer-events-none absolute left-0 top-[3%] whitespace-nowrap text-xs font-medium text-zinc-600 opacity-0 transition-opacity duration-300 sm:text-[13px]"
            >
              <Phrases text={d.dotHint} />
            </div>
            <div
              ref={dotLineRef}
              className="pointer-events-none absolute left-0 top-0 w-px bg-gradient-to-b from-zinc-300 to-[#E0233F]/70 opacity-0 transition-opacity duration-300"
            />
          </>
        )}
      </div>

      {/* What's happening, in words */}
      <div className="relative z-10 mx-auto flex min-h-[3.25rem] max-w-md flex-col items-center justify-center px-6 text-center" aria-live="polite">
        {caption.kind === "reply" ? (
          <>
            {caption.example && (
              <span className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{d.replyLabel}</span>
            )}
            {/* The full line holds the space; the visible copy fills in as Sunday speaks */}
            <span className="grid text-balance leading-snug text-[#111]">
              <span className="invisible col-start-1 row-start-1">{caption.text}</span>
              <span ref={replyRef} className="col-start-1 row-start-1" />
            </span>
          </>
        ) : (
          <>
            <span
              className={`flex items-center gap-1.5 text-balance text-sm ${caption.kind === "listening" ? "text-[#C41D3B]" : "text-zinc-500"}`}
            >
              {caption.kind === "tap" && stage === "3d" && <MoveHorizontal className="h-4 w-4 shrink-0" strokeWidth={1.6} />}
              <Phrases
                text={
                  {
                    tap: stage === "3d" ? d.drag : d.dotHint,
                    listening: d.listening,
                    locked: d.locked,
                    muted: d.muted,
                    noMic: d.noMic,
                  }[caption.kind]
                }
              />
            </span>
            {/* Said where it matters: while the mic is in use */}
            {(caption.kind === "listening" || caption.kind === "noMic") && (
              <span className="mt-1 text-balance text-[11px] text-zinc-400">
                <Phrases text={d.privacy} />
              </span>
            )}
          </>
        )}
      </div>

      {/* The same three things, as buttons: keyboard, screen readers, small screens */}
      <div className="relative z-10 mt-2 flex items-center justify-center gap-2">
        <button type="button" onClick={() => pressPwr("control")} aria-pressed={locked} className={pill}>
          {locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          <span className="text-[10px] font-semibold tracking-wider text-zinc-400 sm:text-[11px]">{BUTTON_NAME.pwr}</span>
          {locked ? d.unlock : d.lock}
        </button>
        <button type="button" onClick={() => pressBoot("control")} aria-pressed={micOff} className={pill}>
          {micOff ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          <span className="text-[10px] font-semibold tracking-wider text-zinc-400 sm:text-[11px]">{BUTTON_NAME.boot}</span>
          {micOff ? d.micOn : d.micOff}
        </button>
        <button
          type="button"
          onClick={() => talk("control")}
          className="flex h-9 items-center gap-2 rounded-full bg-[#111] px-4 text-[13px] font-medium text-white transition-colors hover:bg-black sm:h-10 sm:px-5 sm:text-sm"
        >
          <span className={`h-2 w-2 rounded-full bg-[#E0233F] ${busy ? "animate-pulse" : ""}`} />
          {busy ? d.stop : d.talk}
        </button>
      </div>
    </div>
  );
}
