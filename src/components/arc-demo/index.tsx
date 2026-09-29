"use client";

import { AudioLines, MoveHorizontal } from "lucide-react";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import poster from "@/assets/arc-3d.webp";
import { Phrases } from "@/components/ui/phrases";
import { useI18n } from "@/i18n/provider";
import { track } from "@/lib/track";
import type { AnchorId, ArcButton, ArcSceneHandle } from "./scene";
import { ArcScreen, LOGO_HALF_HEIGHT_MM, REMINDER_ARC_MM, type Mode } from "./screen";
import { httpAdapter, SundayError, type SundayAdapter, type SundayProblem } from "./sunday";
import { Mic, playTone, unlockAudio, Voice } from "./voice";
import { WakeWord, wakeWordSupported } from "./wake";

type Via = "device" | "label" | "wake";
type Caption =
  | { kind: "idle" | "listening" | "locked" | "muted" | "noMic" | SundayProblem }
  | { kind: "said"; text: string };
type Stage = "loading" | "3d" | "flat";

/* Touches this close to the middle of the glass count as touching the mark */
const DOT_TOUCH_MM = 8;
const LISTEN_MAX_S = 8;
/* Sunday isn't connected yet: the orb opens briefly, then says so */
const UNAVAILABLE_S = 1.6;

/* Hands-free switches itself off after this long without hearing "Sunday" */
const HANDS_FREE_S = 180;

/* Remembered for this visit, so the specs request can say whether the demo was used */
function noteDemo(value: "tried" | "talked") {
  try {
    if (value === "talked" || !sessionStorage.getItem("arc-demo")) sessionStorage.setItem("arc-demo", value);
  } catch {
    // storage unavailable: fine
  }
}

/* The reminder arc's demo cycle, in seconds */
const REMINDER = { count: 90, due: 3.5, empty: 8 };
const REMINDER_CYCLE = REMINDER.count + REMINDER.due + REMINDER.empty;

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
  const [ready, setReady] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [canHandsFree, setCanHandsFree] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const flatRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<AnchorId, HTMLElement | null>>({ pwr: null, boot: null, dot: null, reminder: null });
  const lineRefs = useRef<Record<AnchorId, HTMLElement | null>>({ pwr: null, boot: null, dot: null, reminder: null });
  const screenRef = useRef<ArcScreen | null>(null);
  const sceneRef = useRef<ArcSceneHandle | null>(null);
  const mic = useMemo(() => new Mic(), []);
  const voice = useMemo(() => new Voice(), []);
  const wake = useMemo(() => new WakeWord(), []);
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
    // The reminder arc's demo: a countdown, the reminder arriving, a quiet
    // spell with nothing coming up, and round again. Starts part-way down.
    reminderClock: REMINDER.count * 0.38,
    reminder: null as number | null,
    reminderLeft: Infinity, // seconds to go
    reminderDue: false,
    wasDue: false,
    // A reminder the visitor set by talking to Sunday: it replaces the demo
    real: null as { due: number; total: number; text?: string } | null,
    chime: false, // ring when the next reminder arrives (only ones the visitor asked for)
    handsFree: false,
    heardWakeAt: 0,
  });

  useEffect(() => {
    live.current.session = crypto.randomUUID?.() ?? String(Math.random()).slice(2);
    void sunday.ready().then((ready) => {
      live.current.ready = ready;
      setReady(ready);
    });
    setCanHandsFree(wakeWordSupported());
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
    if (l.handsFree && !l.micOff) wake.resume();
  }, [mic, voice, wake]);

  /* The visitor stopped talking: send it, then play Sunday's answer */
  const finishListening = useCallback(async () => {
    const l = live.current;
    if (l.mode !== "listening") return;
    const turn = l.turn;
    if (!l.recording) {
      // Nothing recorded: Sunday isn't connected, or the mic was still being asked for
      toIdle();
      if (l.ready === false) track("demo_turn", { stage: "unavailable" });
      setCaption({ kind: l.ready === false ? "unavailable" : "idle" });
      return;
    }
    l.recording = false;
    setMode("thinking");
    playTone("sent");
    const said = await mic.finish();
    if (l.turn !== turn) return;
    if (!said || !l.heard) {
      // Nothing was said; close quietly
      toIdle();
      setCaption({ kind: "idle" });
      return;
    }
    l.abort = new AbortController();
    track("demo_turn", { stage: "sent" });
    try {
      const answer = await sunday.converse({ audio: said, locale, session: l.session }, l.abort.signal);
      if (l.turn !== turn) return;
      track("demo_turn", { stage: "answered" });
      noteDemo("talked");
      if (answer.reminder) {
        // "Remind me in 5 minutes": the arc counts down to it for real
        l.real = { due: l.clock + answer.reminder.inSeconds, total: answer.reminder.inSeconds, text: answer.reminder.text };
        l.chime = true;
      }
      setMode("speaking");
      setCaption(answer.text ? { kind: "said", text: answer.text } : { kind: "idle" });
      await voice.play(answer.audio);
      if (l.turn !== turn) return;
      toIdle();
    } catch (err) {
      if (l.turn !== turn) return;
      toIdle();
      const problem = err instanceof SundayError ? err.problem : "failed";
      track("demo_turn", { stage: problem });
      if (problem !== "unavailable") playTone("error");
      setCaption({ kind: problem });
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
    noteDemo("tried");
    wake.pause(); // the mic is the conversation's now
    // From this tap, so sounds and Sunday's answer can play later
    void unlockAudio().then(() => playTone("listen"));
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
      track("demo_turn", { stage: "no_mic" });
      playTone("error");
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
        void unlockAudio().then(() => playTone("tap"));
        setCaption({ kind: "locked" });
        return;
      }
      if (l.micOff) {
        screenRef.current?.nudge("mic");
        void unlockAudio().then(() => playTone("tap"));
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
      void unlockAudio().then(() => playTone(l.locked ? "lock" : "unlock"));
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
      void unlockAudio().then(() => playTone(l.micOff ? "micOff" : "micOn"));
      // Mic off means off: hands-free stops listening for "Sunday" too
      if (l.micOff) wake.pause();
      else if (l.handsFree) wake.resume();
      track("demo_action", { action: l.micOff ? "mic_off" : "mic_on", via });
      if (l.micOff && l.mode !== "idle") toIdle();
      setCaption({ kind: l.micOff ? "muted" : l.locked ? "locked" : "idle" });
    },
    [toIdle, wake]
  );

  const stopHandsFree = useCallback(() => {
    live.current.handsFree = false;
    wake.stop();
    setHandsFree(false);
  }, [wake]);

  /* Hands-free: say "Sunday" instead of tapping */
  const toggleHandsFree = useCallback(() => {
    const l = live.current;
    if (l.handsFree) {
      stopHandsFree();
      return;
    }
    void unlockAudio();
    const started = wake.start(
      locale,
      () => {
        l.heardWakeAt = l.clock;
        handlers.current.talk("wake");
      },
      () => {
        stopHandsFree();
        setCaption({ kind: "noMic" });
      }
    );
    if (!started) return;
    l.handsFree = true;
    l.heardWakeAt = l.clock;
    if (l.micOff) wake.pause();
    setHandsFree(true);
    track("demo_action", { action: "hands_free", via: "label" });
  }, [locale, stopHandsFree, wake]);

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
  const handlers = useRef({ talk, pressPwr, pressPrivacy, touchScreen, finishListening, toIdle, stopHandsFree });
  handlers.current = { talk, pressPwr, pressPrivacy, touchScreen, finishListening, toIdle, stopHandsFree };

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

      // The reminder arc: a reminder the visitor set, or else the demo cycle
      l.reminderClock += real;
      if (l.real) {
        const left = l.real.due - l.clock;
        l.reminderLeft = Math.max(0, left);
        l.reminder = left > 0 ? left / l.real.total : null;
        l.reminderDue = left <= 0 && left > -REMINDER.due;
        if (left <= -REMINDER.due) {
          l.real = null;
          l.reminderClock = REMINDER.count + REMINDER.due; // then a quiet spell
        }
      } else {
        const r = l.reminderClock % REMINDER_CYCLE;
        l.reminder = r < REMINDER.count ? 1 - r / REMINDER.count : null;
        l.reminderLeft = r < REMINDER.count ? REMINDER.count - r : Infinity;
        l.reminderDue = r >= REMINDER.count && r < REMINDER.count + REMINDER.due;
      }
      if (l.reminderDue && !l.wasDue) {
        // Only reminders the visitor asked for make a sound
        if (l.chime) playTone("reminder", 0.8);
        l.chime = false;
        if (l.real?.text && l.mode === "idle") setCaption({ kind: "said", text: l.real.text });
      }
      l.wasDue = l.reminderDue;

      if (l.handsFree && l.mode === "idle" && l.clock - l.heardWakeAt > HANDS_FREE_S) handlers.current.stopHandsFree();

      screen.update(l, dt);
      screen.draw();
      const scene = sceneRef.current;
      const stageEl = stageRef.current;
      if (scene && stageEl) {
        // Face the viewer while Sunday is with them, and as a reminder comes due
        const dueSoon = l.reminderLeft < 4 || l.reminderDue;
        scene.focus(l.mode !== "idle" || dueSoon);
        scene.render(real, true);
        placeLabels(scene, stageEl.clientWidth, stageEl.clientHeight, l.mode === "idle", !l.locked && !l.micOff);
      }
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    // Labels follow the device: PWR and Privacy beside their buttons (on
    // whichever side they are), the dot's label above the device with a
    // line down to the dot, the reminder arc's below with a line up to it.
    // Each is a button; hidden when turned away or while Sunday is talking.
    const placeLabels = (scene: ArcSceneHandle, width: number, height: number, idle: boolean, canTalk: boolean) => {
      const anchors = scene.anchors();
      for (const id of ["pwr", "boot", "dot", "reminder"] as AnchorId[]) {
        const label = labelRefs.current[id];
        const line = lineRefs.current[id];
        if (!label || !line) continue;
        const a = anchors[id];
        const shown =
          id === "dot" ? idle && canTalk && a.facing > 0.15 : id === "reminder" ? idle && a.facing > 0.15 : a.facing > 0.1;
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
          // Stop just above the mark: the reminder arc's bottom gives the scale
          const pxPerMm = Math.hypot(anchors.reminder.x - a.x, anchors.reminder.y - a.y) / REMINDER_ARC_MM;
          line.style.height = `${Math.max(0, a.y - top - h - pxPerMm * (LOGO_HALF_HEIGHT_MM + 1))}px`;
        } else if (id === "reminder") {
          const x = Math.min(Math.max(a.x - w / 2, 4), width - w - 4);
          const y = height * 0.97 - h;
          label.style.transform = `translate(${x}px, ${y}px)`;
          line.style.transform = `translate(${a.x}px, ${a.y + 3}px)`;
          line.style.height = `${Math.max(0, y - a.y - 3)}px`;
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
      // Scrolled away: stop listening for "Sunday"
      if (!visible && live.current.handsFree) handlers.current.stopHandsFree();
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
      handlers.current.stopHandsFree();
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
              <span className="h-3.5 w-3.5 shrink-0 bg-[#E0233F] [mask:url(/logo.png)_center/contain_no-repeat]" />
              <Phrases text={d.dotHint} />
            </button>

            {/* The reminder arc: tap to skip ahead and watch a reminder arrive */}
            <div
              ref={(el) => {
                lineRefs.current.reminder = el;
              }}
              className={`${line} w-px bg-gradient-to-b from-[#E0233F]/60 to-zinc-300`}
            />
            <button
              type="button"
              ref={(el) => {
                labelRefs.current.reminder = el;
              }}
              onClick={() => {
                const l = live.current;
                const r = l.reminderClock % REMINDER_CYCLE;
                void unlockAudio();
                l.chime = true;
                if (l.real) l.real.due = Math.min(l.real.due, l.clock + 3);
                else if (r < REMINDER.count - 3) l.reminderClock += REMINDER.count - 3 - r;
                else if (r >= REMINDER.count + REMINDER.due) l.reminderClock += REMINDER_CYCLE - r;
                track("demo_action", { action: "reminder", via: "label" });
              }}
              className={`${LABEL} invisible absolute left-0 top-0 opacity-0`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-[#E0233F] border-r-zinc-300 border-b-zinc-300" />
              <span className="text-[10px] font-semibold tracking-wider text-zinc-400 sm:text-[11px]">REMINDER ARC</span>
              <span>{d.reminderHint}</span>
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

      {/* Hands-free: once Sunday can talk, and where the browser can listen for the word */}
      {ready && canHandsFree && stage !== "loading" && (
        <div className="relative z-10 mt-1 flex flex-col items-center px-6 text-center">
          <button
            type="button"
            onClick={toggleHandsFree}
            aria-pressed={handsFree}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              handsFree
                ? "border-[#C41D3B]/25 bg-[#C41D3B]/[0.06] text-[#C41D3B]"
                : "border-zinc-200 bg-white/80 text-zinc-600 hover:border-zinc-300 hover:bg-white"
            }`}
          >
            <AudioLines className={`h-3.5 w-3.5 ${handsFree ? "animate-pulse" : ""}`} strokeWidth={1.8} />
            {handsFree ? d.handsFreeOn : d.handsFree}
          </button>
          {handsFree && (
            <span className="mt-1.5 max-w-xs text-balance text-[11px] text-zinc-400">
              <Phrases text={d.handsFreeNote} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
