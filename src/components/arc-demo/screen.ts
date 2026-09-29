/* ARC's round screen, drawn on a canvas. The same canvas is the texture on
   the 3D model's glass, and the whole demo when WebGL isn't available.

   What it shows, as on the real device:
   - a small red dot, 3 mm across, in the middle: waiting for "Sunday"
   - the dot opening into the big red orb: Sunday is listening; the orb
     swells and settles with the voice
   - a mic-off icon in place of the dot while the mic is off (the Privacy button)
   - a small lock at the bottom while the screen is locked (PWR) */

export type Mode = "idle" | "listening" | "thinking" | "speaking";

export type ScreenInput = {
  mode: Mode;
  locked: boolean;
  micOff: boolean;
  /* Voice level, 0–1: the visitor's while listening, Sunday's while speaking */
  level: number;
};

/* Sizes in millimetres, from the dimension drawing */
const GLASS_MM = 48.96;
const DISPLAY_MM = 43.76;
const DOT_MM = 3;

const ICON_MIC_OFF = [
  "M2 2l20 20",
  "M18.89 13.23A7.12 7.12 0 0 0 19 12v-2",
  "M5 10v2a7 7 0 0 0 12 5",
  "M15 9.34V5a3 3 0 0 0-5.68-1.33",
  "M9 9v3a3 3 0 0 0 5.12 2.12",
  "M12 19v3",
];
const ICON_LOCK_BODY = "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z";
const ICON_LOCK_SHACKLE = "M7 11V7a5 5 0 0 1 10 0v4";
const ICON_UNLOCK_SHACKLE = "M7 11V7a5 5 0 0 1 9.9-1";

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const approach = (x: number, target: number, rate: number, dt: number) => x + (target - x) * (1 - Math.exp(-rate * dt));

export class ArcScreen {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private size: number;
  private paths: Record<string, Path2D[]> = {};

  /* Animated values */
  private open = 0; // dot (0) → orb (1), on a spring so the orb blooms out
  private openV = 0;
  private level = 0;
  private mute = 0;
  private lock = 0;
  private think = 0;
  private nudgeLock = -10;
  private nudgeMic = -10;
  private unlockedAt = -10;
  private wasLocked = false;
  private time = 0;
  private calm: boolean;

  constructor(size = 768, { reducedMotion = false } = {}) {
    this.size = size;
    this.calm = reducedMotion;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvas.height = size;
    this.ctx = this.canvas.getContext("2d")!;
    this.paths = {
      micOff: ICON_MIC_OFF.map((d) => new Path2D(d)),
      lock: [new Path2D(ICON_LOCK_BODY), new Path2D(ICON_LOCK_SHACKLE)],
      unlock: [new Path2D(ICON_LOCK_BODY), new Path2D(ICON_UNLOCK_SHACKLE)],
    };
  }

  /* A little shake when the screen is touched but can't respond */
  nudge(what: "lock" | "mic") {
    if (what === "lock") this.nudgeLock = this.time;
    else this.nudgeMic = this.time;
  }

  update(input: ScreenInput, dt: number) {
    dt = Math.min(dt, 1 / 20);
    this.time += dt;
    const active = input.mode !== "idle" && !input.micOff;

    // Underdamped spring: the dot overshoots a touch as it opens
    const k = this.calm ? 90 : 150;
    const d = this.calm ? 19 : 15;
    this.openV += ((active ? 1 : 0) - this.open) * k * dt - this.openV * d * dt;
    this.open += this.openV * dt;

    // Voice: quick to rise, slower to fall, like a VU meter
    const target = active ? clamp(input.level) : 0;
    this.level = approach(this.level, target, target > this.level ? 28 : 9, dt);
    this.think = approach(this.think, input.mode === "thinking" ? 1 : 0, 10, dt);
    this.mute = approach(this.mute, input.micOff ? 1 : 0, 14, dt);
    this.lock = approach(this.lock, input.locked ? 1 : 0, 14, dt);
    if (this.wasLocked && !input.locked) this.unlockedAt = this.time;
    this.wasLocked = input.locked;
  }

  draw() {
    const { ctx, size: S } = this;
    const t = this.time;
    const px = S / GLASS_MM; // pixels per millimetre
    const c = S / 2;
    const displayR = (DISPLAY_MM / 2) * px;
    const dotR = (DOT_MM / 2) * px;
    const orbR = displayR * 0.42;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, S, S);

    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, displayR, 0, Math.PI * 2);
    ctx.clip();

    const open = clamp(this.open, 0, 1.2);

    // The whole display warms up a little while Sunday is with you
    if (open > 0.01) {
      const g = ctx.createRadialGradient(c, c, 0, c, c, displayR);
      g.addColorStop(0, `rgba(150, 10, 30, ${0.32 * clamp(open)})`);
      g.addColorStop(0.55, `rgba(90, 4, 16, ${0.16 * clamp(open)})`);
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);
    }

    // The dot, or the orb it opens into
    const visible = 1 - this.mute;
    if (visible > 0.01) {
      const breathe = this.calm ? 1 : 1 + 0.07 * Math.sin(t * 2.2) * (1 - clamp(open));
      let r = (dotR + (orbR - dotR) * open) * breathe;
      r *= 1 + 0.2 * this.level * clamp(open) - 0.14 * this.think;
      this.drawOrb(c, c, r, clamp(open), visible);
    }

    // Mic off: the icon takes the dot's place
    if (this.mute > 0.01) {
      const size = 6 * px;
      const shake = this.shake(this.nudgeMic) * px;
      this.drawIcon(this.paths.micOff, c + shake, c, size, this.mute * 0.9, 1.6);
    }

    // Locked: a small lock, bottom centre. Unlocking shows it opening.
    const lockY = c + displayR * 0.72;
    const lockSize = 2.6 * px;
    if (this.lock > 0.01) {
      const shake = this.shake(this.nudgeLock) * px;
      this.drawIcon(this.paths.lock, c + shake, lockY, lockSize, this.lock * 0.75, 2);
    }
    const since = t - this.unlockedAt;
    if (since < 1.1) {
      const a = (1 - this.lock) * 0.75 * (1 - clamp((since - 0.35) / 0.75));
      this.drawIcon(this.paths.unlock, c, lockY, lockSize, a, 2);
    }

    ctx.restore();
  }

  private shake(at: number) {
    const s = this.time - at;
    if (s > 0.6) return 0;
    return Math.sin(s * 42) * 0.55 * Math.exp(-s * 7);
  }

  private drawOrb(x: number, y: number, r: number, open: number, alpha: number) {
    const { ctx } = this;
    const t = this.time;

    // Glow around it — wider for the orb than the dot
    const haloR = r * (2.1 - 0.4 * open);
    const halo = ctx.createRadialGradient(x, y, r * 0.7, x, y, haloR);
    halo.addColorStop(0, `rgba(230, 30, 60, ${(0.42 + 0.25 * this.level) * alpha})`);
    halo.addColorStop(0.45, `rgba(200, 20, 50, ${0.14 * alpha})`);
    halo.addColorStop(1, "rgba(160, 10, 40, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, haloR, 0, Math.PI * 2);
    ctx.fill();

    // The body: a softly lit sphere whose edge ripples with the voice
    const wobble = this.calm ? 0 : open * (0.01 + 0.026 * this.level);
    ctx.beginPath();
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const rr = r * (1 + wobble * Math.sin(3 * a + t * 1.9) + wobble * 0.6 * Math.sin(5 * a - t * 2.7));
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    const body = ctx.createRadialGradient(x - r * 0.32, y - r * 0.38, r * 0.05, x, y, r * 1.08);
    body.addColorStop(0, `rgba(255, 150, 160, ${alpha})`);
    body.addColorStop(0.28, `rgba(238, 50, 72, ${alpha})`);
    body.addColorStop(0.72, `rgba(196, 18, 45, ${alpha})`);
    body.addColorStop(1, `rgba(112, 6, 24, ${alpha})`);
    ctx.fillStyle = body;
    ctx.fill();

    // Thinking: a slow sheen travels round the orb
    if (this.think > 0.02) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 210, 215, ${0.5 * this.think * alpha})`;
      ctx.lineWidth = r * 0.07;
      ctx.lineCap = "round";
      ctx.beginPath();
      const a0 = t * 3.2;
      ctx.arc(x, y, r * 0.8, a0, a0 + 1.1);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawIcon(paths: Path2D[], x: number, y: number, size: number, alpha: number, stroke: number) {
    if (alpha <= 0.01) return;
    const { ctx } = this;
    ctx.save();
    ctx.translate(x - size / 2, y - size / 2);
    ctx.scale(size / 24, size / 24);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const p of paths) ctx.stroke(p);
    ctx.restore();
  }
}
