"use client";

import { MoveHorizontal } from "lucide-react";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import poster from "@/assets/arc-3d.webp";
import { Phrases } from "@/components/ui/phrases";
import { useI18n } from "@/i18n/provider";
import { track } from "@/lib/track";
import type { AnchorId, ArcButton, ArcSceneHandle } from "./scene";
import { ArcScreen, type Mode } from "./screen";
import { httpAdapter, SundayError, type SundayAdapter, type SundayProblem } from "./sunday";
import { Mic, unlockAudio, Voice } from "./voice";

type Via = "device" | "label";
type Caption =
  | { kind: "idle" | "listening" | "locked" | "muted" | "noMic" | SundayProblem }
  | { kind: "said"; text: string };
type Stage = "loading" | "3d" | "flat";

/* Touches this close to the middle of the glass count as touching the dot */
const DOT_TOUCH_MM = 8;
const LISTEN_MAX_S = 8;
/* Sunday isn't connected yet: the orb opens briefly, then says so */
const UNAVAILABLE_S = 1.6;

/* What each button is called on the page. The mic button is BOOT on the
   development board; for people it's the privacy button. */
const BUTTON_NAME: Record<ArcButton, string> = { pwr: "PWR", boot: "PRIVACY" };

const LABEL =
  "pointer-events-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-200/90 bg-white/90 px-2.5 py-1 text-[11px] leading-none text-zinc-600 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.25)] backdrop-blur transition-colors hover:border-zinc-300 hover:bg-white sm:px-3 sm:py-1.5 sm:text-xs";

/* ARC, working: tap the red dot (or its label) and talk to Sunday; PWR locks
   the screen; Privacy turns the mic off. The labels on the device are the
   buttons. Everything the screen shows comes from ArcScreen. */
export function ArcDemo({ adapter }: { adapter?: SundayAdapter }) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion() ?? false;

  const [stage, setStage] = useState<Stage>("loading");
  const [locked, setLocked] = useState(false);
  const [micOff, setMicOff] = useState(false);
  const [caption, setCaption] = useState<Caption>({ kind: "idle" });

  const stageRef = useRef<HTMLDivElement>(null);
  const flatRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<AnchorId, HTMLElement | null>>({ pwr: null, boot: null, dot: null });
  const lineRefs = useRef<Record<AnchorId, HTMLElement | null>>({ pwr: null, boot: null, dot: null });
  const screenRef = useRef<ArcScreen | null>(null);
  const sceneRef = useRef<ArcSceneHandle | null>(null);
  const mic = useMemo(() => new Mic(), []);
  const voice = useMemo(() => new Voice(), []);
  const sunday = useMemo(() => adapter ?? httpAdapter(), [adapter]);

  // Everything the frame loop reads, without re-rendering React
  const live = useRef({
    mode: "idle" as Mode,
    locked: false,
    micOff: false,
    level: 0,
    clock: 0,
    ready: null as boolean | null, // is Sunday connected?
    recording: false,
    listenFrom: 0,
    speech: 0,
    silence: 0,
    heard: false,
    turn: 0, // bumps on every new conversation turn, so stale ones stop
    abort: null as AbortController | null,
    session: "",
  });

  useEffect(() => {
    live.current.session = crypto.randomUUID?.() ?? String(Math.random()).slice(2);
    void sunday.ready().then((ready) => (live.current.ready = ready));
  }, [sunday]);

  const setMode = (mode: Mode) => {
    live.current.mode = mode;
  };

  const toIdle = useCallback(() => {
    const l = live.current;
    l.turn += 1;
    l.abort?.abort();
    l.abort = null;
    l.recording = false;
    mic.stop();
    voice.stop();
    setMode("idle");
  }, [mic, voice]);

  /* The visitor stopped talking: send it, then play Sunday's answer */
  const finishListening = useCallback(async () => {
    const l = live.current;
    if (l.mode !== "listening") return;
    const turn = l.turn;
    if (!l.recording) {
      // Nothing recorded: Sunday isn't connected, or the mic was still being asked for
      toIdle();
      setCaption({ kind: l.ready === false ? "unavailable" : "idle" });
      return;
    }
    l.recording = false;
    setMode("thinking");
    const said = await mic.finish();
    if (l.turn !== turn) return;
    if (!said || !l.heard) {
      // Nothing was said; close quietly
      toIdle();
      setCaption({ kind: "idle" });
      return;
    }
    l.abort = new AbortController();
    try {
      const answer = await sunday.converse({ audio: said, locale, session: l.session }, l.abort.signal);
      if (l.turn !== turn) return;
      setMode("speaking");
      setCaption(answer.text ? { kind: "said", text: answer.text } : { kind: "idle" });
      await voice.play(answer.audio);
      if (l.turn !== turn) return;
      toIdle();
    } catch (err) {
      if (l.turn !== turn) return;
      toIdle();
      setCaption({ kind: err instanceof SundayError ? err.problem : "failed" });
    }
  }, [locale, mic, sunday, toIdle, voice]);

  const startListening = useCallback(async () => {
    const l = live.current;
    l.turn += 1;
    const turn = l.turn;
    setMode("listening");
    l.heard = false;
    l.speech = l.silence = 0;
    l.listenFrom = l.clock;
    unlockAudio(); // from this tap, so Sunday's answer can play later
    if (l.ready === false) {
      l.recording = false;
      setCaption({ kind: "idle" });
      return; // the loop closes the orb and says Sunday is on the way
    }
    setCaption({ kind: "listening" });
    const ok = await mic.start();
    if (l.turn !== turn) {
      mic.stop();
      return;
    }
    if (!ok) {
      toIdle();
      setCaption({ kind: "noMic" });
      return;
    }
    l.recording = true;
    l.listenFrom = l.clock;
  }, [mic, toIdle]);

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
        setCaption({ kind: "idle" });
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
      if (l.locked && l.mode !== "idle") toIdle();
      setCaption({ kind: l.locked ? "locked" : l.micOff ? "muted" : "idle" });
    },
    [toIdle]
  );

  const pressPrivacy = useCallback(
    (via: Via) => {
      sceneRef.current?.press("boot");
      const l = live.current;
      l.micOff = !l.micOff;
      setMicOff(l.micOff);
      track("demo_action", { action: l.micOff ? "mic_off" : "mic_on", via });
      if (l.micOff && l.mode !== "idle") toIdle();
      setCaption({ kind: l.micOff ? "muted" : l.locked ? "locked" : "idle" });
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
  const handlers = useRef({ talk, pressPwr, pressPrivacy, touchScreen, finishListening, toIdle });
  handlers.current = { talk, pressPwr, pressPrivacy, touchScreen, finishListening, toIdle };

  // ── Screen, frame loop, and the 3D model ─────────────────────
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
      // Animation steps are capped so a slow frame doesn't jump; the
      // listening timers run on real time, however slow the device draws
      const real = Math.min((now - last) / 1000, 1);
      const dt = Math.min(real, 0.05);
      last = now;
      const l = live.current;
      l.clock += real;

      if (l.mode === "listening") {
        const elapsed = l.clock - l.listenFrom;
        if (l.recording) {
          l.level = mic.read();
          if (l.level > 0.32) {
            l.speech += real;
            l.silence = 0;
            if (l.speech > 0.15) l.heard = true;
          } else if (l.heard) {
            l.silence += real;
          }
          // Done when they pause after speaking, or after a while regardless
          if ((l.heard && l.silence > 1.1) || elapsed > LISTEN_MAX_S) void handlers.current.finishListening();
        } else {
          l.level = 0.12 + 0.08 * Math.sin(l.clock * 3);
          if (l.ready === false && elapsed > UNAVAILABLE_S) void handlers.current.finishListening();
        }
      } else if (l.mode === "speaking") {
        l.level = voice.read();
      } else {
        l.level = 0;
      }

      screen.update(l, dt);
      screen.draw();
      const scene = sceneRef.current;
      const stageEl = stageRef.current;
      if (scene && stageEl) {
        scene.focus(l.mode !== "idle");
        scene.render(real, true);
        placeLabels(scene, stageEl.clientWidth, l.mode === "idle" && !l.locked && !l.micOff);
      }
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    // Labels follow the device: PWR and Privacy beside their buttons (on
    // whichever side they are), the dot's label above the device with a
    // line down to the dot. Each is a button; hidden when turned away.
    const placeLabels = (scene: ArcSceneHandle, width: number, dotAvailable: boolean) => {
      const anchors = scene.anchors();
      for (const id of ["pwr", "boot", "dot"] as AnchorId[]) {
        const label = labelRefs.current[id];
        const line = lineRefs.current[id];
        if (!label || !line) continue;
        const a = anchors[id];
        const shown = id === "dot" ? dotAvailable && a.facing > 0.15 : a.facing > 0.1;
        const opacity = shown ? Math.min(1, (a.facing - 0.05) * 4) : 0;
        label.style.opacity = line.style.opacity = String(opacity);
        label.style.visibility = line.style.visibility = opacity > 0.05 ? "visible" : "hidden";
        const w = label.offsetWidth;
        const h = label.offsetHeight;
        if (id === "dot") {
          const x = Math.min(Math.max(a.x - w / 2, 4), width - w - 4);
          const top = label.offsetTop;
          label.style.transform = `translateX(${x}px)`;
          line.style.transform = `translate(${a.x}px, ${top + h}px)`;
          line.style.height = `${Math.max(0, a.y - top - h - 7)}px`;
        } else {
          const left = a.x < width / 2;
          const gap = 14;
          let x = left ? a.x - gap - w : a.x + gap;
          x = Math.min(Math.max(x, 4), width - w - 4);
          label.style.transform = `translate(${x}px, ${a.y - h / 2}px)`;
          const from = left ? x + w : a.x;
          const to = left ? a.x : x;
          line.style.transform = `translate(${Math.min(from, to)}px, ${a.y}px)`;
          line.style.width = `${Math.max(0, Math.abs(to - from))}px`;
        }
      }
    };

    // Run only while on screen
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
      if (!visible && live.current.mode !== "idle") {
        handlers.current.toIdle();
        setCaption({ kind: "idle" });
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
              onButton: (b) => (b === "pwr" ? handlers.current.pressPwr("device") : handlers.current.pressPrivacy("device")),
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
    if (stageRef.current) io.observe(stageRef.current);

    return () => {
      disposed = true;
      io.disconnect();
      cancelAnimationFrame(raf);
      handlers.current.toIdle();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [mic, voice, reduce]);

  const d = t.demo;
  const hold = (on: boolean) => sceneRef.current?.hold(on);
  const line = "pointer-events-none absolute left-0 top-0 bg-zinc-300 opacity-0 transition-opacity duration-300";

  return (
    <div className="relative">
      {/* The device */}
      <div
        ref={stageRef}
        className="arc-3d relative mx-auto w-full max-w-4xl"
        onPointerEnter={(e) => e.pointerType === "mouse" && hold(true)}
        onPointerLeave={() => hold(false)}
      >
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

        {/* Labels on the device — each one is a button */}
        {stage === "3d" && (
          <>
            <div
              ref={(el) => {
                lineRefs.current.dot = el;
              }}
              className={`${line} w-px bg-gradient-to-b from-zinc-300 to-[#E0233F]/70`}
            />
            <button
              type="button"
              ref={(el) => {
                labelRefs.current.dot = el;
              }}
              onClick={() => talk("label")}
              className={`${LABEL} invisible absolute left-0 top-[3%] font-medium text-zinc-700 opacity-0`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#E0233F]" />
              <Phrases text={d.dotHint} />
            </button>

            {(["pwr", "boot"] as ArcButton[]).map((id) => (
              <div key={id}>
                <div
                  ref={(el) => {
                    lineRefs.current[id] = el;
                  }}
                  className={`${line} h-px`}
                />
                <button
                  type="button"
                  ref={(el) => {
                    labelRefs.current[id] = el;
                  }}
                  onClick={() => (id === "pwr" ? pressPwr("label") : pressPrivacy("label"))}
                  aria-pressed={id === "pwr" ? locked : micOff}
                  className={`${LABEL} invisible absolute left-0 top-0 opacity-0`}
                >
                  <span className="text-[10px] font-semibold tracking-wider text-zinc-400 sm:text-[11px]">{BUTTON_NAME[id]}</span>
                  <span>{id === "pwr" ? (locked ? d.unlock : d.pwrHint) : micOff ? d.micOn : d.micOff}</span>
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* What's happening, in words */}
      <div className="relative z-10 mx-auto flex min-h-[3.25rem] max-w-md flex-col items-center justify-center px-6 text-center" aria-live="polite">
        {caption.kind === "said" ? (
          <span className="text-balance leading-snug text-[#111]">{caption.text}</span>
        ) : (
          <>
            <span
              className={`flex items-center gap-1.5 text-balance text-sm ${caption.kind === "listening" ? "text-[#C41D3B]" : "text-zinc-500"}`}
            >
              {caption.kind === "idle" && stage === "3d" && <MoveHorizontal className="h-4 w-4 shrink-0" strokeWidth={1.6} />}
              <Phrases
                text={
                  {
                    idle: stage === "3d" ? d.drag : d.dotHint,
                    listening: d.listening,
                    locked: d.locked,
                    muted: d.muted,
                    noMic: d.noMic,
                    unavailable: d.unavailable,
                    busy: d.busy,
                    failed: d.failed,
                  }[caption.kind]
                }
              />
            </span>
            {/* Said where it matters: while the mic is in use */}
            {caption.kind === "listening" && (
              <span className="mt-1 text-balance text-[11px] text-zinc-400">
                <Phrases text={d.privacy} />
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
