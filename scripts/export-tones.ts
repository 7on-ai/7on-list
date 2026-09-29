/* Writes ARC's sounds (src/components/arc-demo/tones.ts) as WAV files for
   the device: 16-bit mono, at 44.1 kHz and at 16 kHz.
   Run: bun scripts/export-tones.ts */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderTone, TONE_NAMES } from "../src/components/arc-demo/tones";

function wav(samples: Float32Array, rate: number) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write("WAVEfmt ", 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20); // PCM
  head.writeUInt16LE(1, 22); // mono
  head.writeUInt32LE(rate, 24);
  head.writeUInt32LE(rate * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

const root = new URL("../design/arc/sounds", import.meta.url).pathname;
for (const rate of [44100, 16000]) {
  const dir = join(root, rate === 44100 ? "44k" : "16k");
  mkdirSync(dir, { recursive: true });
  for (const name of TONE_NAMES) {
    const samples = renderTone(name, rate);
    writeFileSync(join(dir, `${name}.wav`), wav(samples, rate));
    console.log(`${dir}/${name}.wav  ${(samples.length / rate).toFixed(2)} s`);
  }
}
