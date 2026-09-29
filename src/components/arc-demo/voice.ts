/* Voice in and out, in the browser.

   Mic: records what the visitor says (for Sunday) and measures how loud it
   is (for the orb). Voice: plays Sunday's spoken answer and measures that
   too, so the orb moves with Sunday's real voice. */

let shared: AudioContext | null = null;

/* One audio context for the page. Browsers only let sound start from a tap
   or click, so unlock() is called from one; later answers then play. */
function audio() {
  shared ??= new AudioContext();
  return shared;
}

export function unlockAudio() {
  void audio().resume().catch(() => {});
}

function levelOf(analyser: AnalyserNode, buffer: Float32Array<ArrayBuffer>) {
  analyser.getFloatTimeDomainData(buffer);
  let sum = 0;
  for (const v of buffer) sum += v * v;
  const db = 20 * Math.log10(Math.sqrt(sum / buffer.length) + 1e-8);
  return Math.min(1, Math.max(0, (db + 55) / 38));
}

const RECORDING_TYPES = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];

export class Mic {
  private stream?: MediaStream;
  private source?: MediaStreamAudioSourceNode;
  private analyser?: AnalyserNode;
  private buffer?: Float32Array<ArrayBuffer>;
  private recorder?: MediaRecorder;
  private chunks: Blob[] = [];

  /* Asks for the mic and starts recording; false if there is none or the
     visitor says no */
  async start(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      return false;
    }
    const ctx = audio();
    this.source = ctx.createMediaStreamSource(this.stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.buffer = new Float32Array(this.analyser.fftSize);
    this.source.connect(this.analyser);

    const mimeType = RECORDING_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    this.recorder.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.recorder.start(250);
    return true;
  }

  /* 0 (silence) to 1 (speaking up) */
  read(): number {
    return this.analyser && this.buffer ? levelOf(this.analyser, this.buffer) : 0;
  }

  /* Stops recording and hands over what was said */
  finish(): Promise<Blob | null> {
    const recorder = this.recorder;
    if (!recorder || recorder.state === "inactive") {
      this.release();
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = this.chunks.length ? new Blob(this.chunks, { type: recorder.mimeType || "audio/webm" }) : null;
        this.release();
        resolve(blob);
      };
      recorder.stop();
    });
  }

  /* Drops the recording and lets go of the mic, so the browser's recording
     indicator goes away */
  stop() {
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.onstop = null;
      this.recorder.stop();
    }
    this.release();
  }

  private release() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.source?.disconnect();
    this.stream = this.source = this.analyser = this.buffer = this.recorder = undefined;
    this.chunks = [];
  }
}

export class Voice {
  private node?: AudioBufferSourceNode;
  private analyser?: AnalyserNode;
  private buffer?: Float32Array<ArrayBuffer>;

  /* Plays Sunday's answer; resolves when it has finished (or was stopped) */
  async play(answer: Blob): Promise<void> {
    this.stop();
    const ctx = audio();
    await ctx.resume().catch(() => {});
    const decoded = await ctx.decodeAudioData(await answer.arrayBuffer());
    const node = ctx.createBufferSource();
    node.buffer = decoded;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.buffer = new Float32Array(this.analyser.fftSize);
    node.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.node = node;
    return new Promise((resolve) => {
      node.onended = () => {
        if (this.node === node) this.release();
        resolve();
      };
      node.start();
    });
  }

  read(): number {
    return this.analyser && this.buffer ? levelOf(this.analyser, this.buffer) : 0;
  }

  stop() {
    const node = this.node;
    this.release();
    try {
      node?.stop(); // fires onended, which resolves play()
    } catch {
      // not started yet
    }
  }

  private release() {
    this.node?.disconnect();
    this.analyser?.disconnect();
    this.node = this.analyser = this.buffer = undefined;
  }
}
