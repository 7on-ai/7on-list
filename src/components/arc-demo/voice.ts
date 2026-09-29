/* The visitor's voice level, measured in the browser with Web Audio.
   Only loudness is read — nothing is recorded, kept or sent anywhere. */
export class MicLevel {
  private stream?: MediaStream;
  private audio?: AudioContext;
  private analyser?: AnalyserNode;
  private buffer?: Float32Array<ArrayBuffer>;

  /* Asks for the mic; false if there is none or the visitor says no */
  async start(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      this.audio = new AudioContext();
      const source = this.audio.createMediaStreamSource(this.stream);
      this.analyser = this.audio.createAnalyser();
      this.analyser.fftSize = 1024;
      this.buffer = new Float32Array(this.analyser.fftSize);
      source.connect(this.analyser);
      return true;
    } catch {
      this.stop();
      return false;
    }
  }

  /* 0 (silence) to 1 (speaking up) */
  read(): number {
    if (!this.analyser || !this.buffer) return 0;
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sum = 0;
    for (const v of this.buffer) sum += v * v;
    const db = 20 * Math.log10(Math.sqrt(sum / this.buffer.length) + 1e-8);
    return Math.min(1, Math.max(0, (db + 55) / 38));
  }

  /* Releases the mic, so the browser's recording indicator goes away */
  stop() {
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.audio?.close().catch(() => {});
    this.stream = this.audio = this.analyser = this.buffer = undefined;
  }
}

/* Sunday's voice while it answers: syllable-like pulses under a slower
   phrase rhythm, for the orb to move with */
export function speakingLevel(t: number) {
  const phrase = 0.55 + 0.45 * Math.sin(t * 1.7) * Math.sin(t * 0.63 + 1);
  const syllables = Math.abs(Math.sin(t * 7.4)) * 0.6 + Math.abs(Math.sin(t * 11.3 + 0.8)) * 0.4;
  return Math.min(1, 0.18 + 0.72 * phrase * syllables);
}
