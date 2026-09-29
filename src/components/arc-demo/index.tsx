"use client";

import { Lock, LockOpen, Mic, MicOff } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Phrases } from "@/components/ui/phrases";
import { useI18n } from "@/i18n/provider";
import { track } from "@/lib/track";
import type { ArcButton, ArcSceneHandle } from "./scene";
import { ArcScreen, type Mode } from "./screen";
import { exampleAdapter, type SundayAdapter } from "./sunday";
import { MicLevel, speakingLevel } from "./voice";

type Via = "device" | "control";
type Caption = { kind: "tap" | "listening" | "locked" | "muted" | "noMic" } | { kind: "reply"; text: string; example: boolean };
type Stage = "flat" | "3d";

/* Touches this close to the middle of the glass count as touching the dot */
const DOT_TOUCH_MM = 8;
const LISTEN_MAX_S = 8;
const NO_MIC_LISTEN_S = 2.6;

/* Rough speaking time for a line: words where there are spaces, characters where there aren't */
function speakingTime(text: string) {
  const units = /[฀-๿぀-鿿가-힯]/.test(text) ? text.length / 3.2 : text.split(/\s+/).length;
  return Math.min(7, Math.max(2.4, 1.4 + units * 0.33));
}

/* The device, working: tap the red dot and speak; PWR locks the screen;
   BOOT turns the mic off. Everything the screen shows comes from ArcScreen. */
export function ArcDemo({ adapter }: { adapter?: SundayAdapter }) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion() ?? false;

  const [stage, setStage] = useState<Stage>("flat");
  const [mode, setMode] = useState<Mode>("idle");
  const [locked, setLocked] = useState(false);
  const [micOff, setMicOff] = useState(false);
  const [caption, setCaption] = useState<Caption>({ kind: "tap" });

  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flatRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLSpanElement>(null);
  const labelRefs = useRef<Record<ArcButton, HTMLDivElement | null>>({ pwr: null, boot: null });
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
    flatRef.current?.replaceChildren(screen.canvas);

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
        for (const id of ["pwr", "boot"] as ArcButton[]) {
          const el = labelRefs.current[id];
          if (!el) continue;
          const a = anchors[id];
          el.style.transform = `translate(${a.x}px, ${a.y}px)`;
          el.style.opacity = String(Math.max(0, Math.min(1, (a.facing - 0.05) * 4)));
        }
      }
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    // Run only while on screen; load three.js and the model when close
    let loading = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
        if (!visible && live.current.mode !== "idle") {
          toIdleRef.current();
          setCaption({ kind: "tap" });
        }
        if (entry.isIntersecting && !loading) {
          loading = true;
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
              // No WebGL, or the model didn't load: the flat screen still works
              console.warn("ARC demo: showing the flat screen.", err);
            });
        }
      },
      { rootMargin: "300px 0px" }
    );
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

  return (
    <div ref={sectionRef} className="mx-auto max-w-5xl text-center">
      <p className="t-eyebrow text-xs font-medium text-[#C41D3B]">{d.eyebrow}</p>
      <h2 className="t-heading mt-3 text-balance text-[40px] font-medium sm:text-6xl">{d.headline}</h2>
      <p className="mx-auto mt-5 max-w-xl text-balance text-lg leading-relaxed text-zinc-600">
        <Phrases text={d.sub} />
      </p>

      {/* The device */}
      <div className="relative mx-auto mt-6 h-[min(100vw,420px)] max-w-3xl sm:mt-8 sm:h-[480px]">
        {/* Soft contact shadow */}
        <div className="pointer-events-none absolute bottom-[9%] left-1/2 h-8 w-[40%] -translate-x-1/2 rounded-[50%] bg-black/15 blur-2xl" />

        {/* Flat screen: shown while the 3D model loads, and instead of it without WebGL */}
        <div
          className={`absolute left-1/2 top-1/2 aspect-square w-[min(72vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-full p-[3.2%] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] transition-opacity duration-700 [background:linear-gradient(145deg,#f4f4f5,#a1a1aa_45%,#e4e4e7_70%,#71717a)] ${
            stage === "3d" ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const mm = 55 / r.width;
            handlers.current.touchScreen((e.clientX - r.left - r.width / 2) * mm, -(e.clientY - r.top - r.height / 2) * mm);
          }}
        >
          <div ref={flatRef} className="relative h-full w-full cursor-pointer rounded-full bg-black">
            <span className="absolute left-1/2 top-1/2 h-[6%] w-[6%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E0233F]" />
          </div>
        </div>

        <div ref={stageRef} className={`absolute inset-0 transition-opacity duration-700 ${stage === "3d" ? "opacity-100" : "opacity-0"}`} />

        {/* Button labels, following the buttons as the device turns */}
        {stage === "3d" &&
          (["pwr", "boot"] as ArcButton[]).map((id) => (
            <div
              key={id}
              ref={(el) => {
                labelRefs.current[id] = el;
              }}
              className="pointer-events-none absolute left-0 top-0 hidden opacity-0 sm:block"
            >
              <span className="absolute left-3 top-0 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap">
                <span className="h-px w-6 bg-zinc-300" />
                <span className="text-[11px] font-semibold tracking-wider text-zinc-500">{id.toUpperCase()}</span>
                <span className="text-xs text-zinc-400">{id === "pwr" ? d.pwrHint : d.bootHint}</span>
              </span>
            </div>
          ))}
      </div>

      {/* What's happening, in words */}
      <div className="mx-auto mt-2 flex min-h-[4.5rem] max-w-md flex-col items-center justify-start" aria-live="polite">
        {caption.kind === "reply" ? (
          <>
            {caption.example && (
              <span className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{d.replyLabel}</span>
            )}
            {/* The full line holds the space; the visible copy fills in as Sunday speaks */}
            <span className="grid text-balance text-lg leading-snug text-[#111]">
              <span className="invisible col-start-1 row-start-1">{caption.text}</span>
              <span ref={replyRef} className="col-start-1 row-start-1" />
            </span>
          </>
        ) : (
          <span className={`text-balance ${caption.kind === "listening" ? "text-[#C41D3B]" : "text-zinc-500"}`}>
            <Phrases
              text={
                { tap: d.tap, listening: d.listening, locked: d.locked, muted: d.muted, noMic: d.noMic }[caption.kind]
              }
            />
          </span>
        )}
      </div>

      {/* The same three things, as buttons: keyboard, screen readers, small screens */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => pressPwr("control")}
          aria-pressed={locked}
          className="flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          {locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          <span className="text-[11px] font-semibold tracking-wider text-zinc-400">PWR</span>
          {locked ? d.unlock : d.lock}
        </button>
        <button
          type="button"
          onClick={() => pressBoot("control")}
          aria-pressed={micOff}
          className="flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          {micOff ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          <span className="text-[11px] font-semibold tracking-wider text-zinc-400">BOOT</span>
          {micOff ? d.micOn : d.micOff}
        </button>
        <button
          type="button"
          onClick={() => talk("control")}
          className="flex h-11 items-center gap-2 rounded-full bg-[#C41D3B] px-5 text-sm font-medium text-white shadow-[0_10px_30px_-12px_rgba(196,29,59,0.7)] transition-colors hover:bg-[#a9182f]"
        >
          <span className={`h-2.5 w-2.5 rounded-full bg-white ${busy ? "animate-pulse" : ""}`} />
          {busy ? d.stop : d.talk}
        </button>
      </div>

      <p className="mx-auto mt-5 max-w-sm text-balance text-xs leading-relaxed text-zinc-400">
        <Phrases text={d.privacy} />
      </p>
      <a
        href="#get-specs"
        className="mt-6 inline-block text-[15px] font-medium text-[#C41D3B] underline-offset-4 hover:underline"
      >
        {t.hero.cta} ›
      </a>
    </div>
  );
}
