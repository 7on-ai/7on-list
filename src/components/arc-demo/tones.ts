/* ARC's sounds, synthesised — the same recipes play on the page and are
   exported as WAV files for the device (bun scripts/export-tones.ts).

   One family: soft sine tones with a touch of overtone, quick to start,
   gently fading; notes from E major, so every sound sits with the others.
   Short and quiet — ARC is worn close, so nothing should startle. */

export type ToneName = "tap" | "lock" | "unlock" | "micOff" | "micOn" | "listen" | "sent" | "reminder" | "error";

type Note = {
  at: number; // seconds from the start
  freq: number; // Hz
  gain: number; // 0–1
  decay: number; // seconds for the sound to fall to about a third
  attack?: number; // seconds
  /* Overtones: [multiple of freq, level]. A bell adds a slightly
     inharmonic partial (2.76) that gives it its shimmer. */
  partials?: [number, number][];
  /* A little filtered noise at the start: the "touch" of a press */
  click?: number;
};

const E5 = 659.26;
const GS5 = 830.61;
const B5 = 987.77;
const E6 = 1318.51;
const GS6 = 1661.22;
const B6 = 1975.53;
const SOFT: [number, number][] = [[2, 0.18], [3, 0.05]];
const BELL: [number, number][] = [[2, 0.22], [2.76, 0.12], [4.07, 0.04]];

const RECIPES: Record<ToneName, Note[]> = {
  /* A press, felt more than heard */
  tap: [{ at: 0, freq: 2400, gain: 0.35, decay: 0.012, attack: 0.001, click: 0.5 }],
  /* Two ticks stepping down; unlocking steps up */
  lock: [
    { at: 0, freq: B6, gain: 0.3, decay: 0.02, attack: 0.001, click: 0.35 },
    { at: 0.07, freq: E6, gain: 0.32, decay: 0.03, attack: 0.001, click: 0.25 },
  ],
  unlock: [
    { at: 0, freq: E6, gain: 0.3, decay: 0.02, attack: 0.001, click: 0.35 },
    { at: 0.07, freq: B6, gain: 0.32, decay: 0.03, attack: 0.001, click: 0.25 },
  ],
  /* The mic going quiet: a soft falling pair; coming back, rising */
  micOff: [
    { at: 0, freq: B5, gain: 0.4, decay: 0.07, partials: SOFT, click: 0.2 },
    { at: 0.09, freq: E5, gain: 0.42, decay: 0.1, partials: SOFT },
  ],
  micOn: [
    { at: 0, freq: E5, gain: 0.4, decay: 0.07, partials: SOFT, click: 0.2 },
    { at: 0.09, freq: B5, gain: 0.42, decay: 0.1, partials: SOFT },
  ],
  /* Sunday is listening: a bright, open rising fifth */
  listen: [
    { at: 0, freq: B5, gain: 0.34, decay: 0.12, partials: BELL },
    { at: 0.085, freq: E6, gain: 0.4, decay: 0.22, partials: BELL },
  ],
  /* Got it — one soft note, lower, as the orb settles to think */
  sent: [{ at: 0, freq: GS5, gain: 0.3, decay: 0.14, partials: SOFT }],
  /* A reminder: three warm bell notes, rising, left to ring */
  reminder: [
    { at: 0, freq: E6, gain: 0.34, decay: 0.55, partials: BELL },
    { at: 0.16, freq: GS6, gain: 0.32, decay: 0.55, partials: BELL },
    { at: 0.32, freq: B6, gain: 0.36, decay: 0.65, partials: BELL },
  ],
  /* Couldn't do that: low and brief, never harsh */
  error: [
    { at: 0, freq: 329.63, gain: 0.42, decay: 0.08, partials: SOFT },
    { at: 0.11, freq: 277.18, gain: 0.42, decay: 0.12, partials: SOFT },
  ],
};

export const TONE_NAMES = Object.keys(RECIPES) as ToneName[];

/* Samples in -1…1, mono */
export function renderTone(name: ToneName, sampleRate: number): Float32Array {
  const notes = RECIPES[name];
  const length = Math.max(...notes.map((n) => n.at + n.decay * 6 + 0.02));
  const out = new Float32Array(Math.ceil(length * sampleRate));
  let seed = 1;
  const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

  for (const n of notes) {
    const start = Math.round(n.at * sampleRate);
    const attack = n.attack ?? 0.004;
    const partials: [number, number][] = [[1, 1], ...(n.partials ?? [])];
    const norm = partials.reduce((sum, [, level]) => sum + level, 0);
    let lp = 0; // one-pole low-pass for the click
    for (let i = 0; start + i < out.length; i++) {
      const t = i / sampleRate;
      const env = t < attack ? t / attack : Math.exp(-(t - attack) / n.decay);
      if (env < 1e-4 && t > attack) break;
      let v = 0;
      for (const [mult, level] of partials) {
        // Higher partials fade faster, as on a real bell
        v += Math.sin(2 * Math.PI * n.freq * mult * t) * level * Math.exp(-t * (mult - 1) * 6);
      }
      v = (v / norm) * env * n.gain;
      if (n.click) {
        lp += (noise() - lp) * 0.35;
        v += lp * n.click * Math.exp(-t / 0.004) * 0.6;
      }
      out[start + i] += v;
    }
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  if (peak > 0.95) for (let i = 0; i < out.length; i++) out[i] *= 0.95 / peak;
  // Cut the silent tail (below -50 dB), then fade the last few
  // milliseconds so nothing clicks off
  let end = out.length;
  while (end > 1 && Math.abs(out[end - 1]) < 0.003) end--;
  const trimmed = out.slice(0, Math.min(out.length, end + Math.round(0.01 * sampleRate)));
  const fade = Math.min(trimmed.length, Math.round(0.008 * sampleRate));
  for (let i = 0; i < fade; i++) trimmed[trimmed.length - 1 - i] *= i / fade;
  return trimmed;
}
