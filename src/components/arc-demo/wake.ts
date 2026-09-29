/* Hands-free: listen for the word "Sunday", as ARC does, and start talking
   when it's heard. Uses the browser's own speech recognition (Chrome, Edge,
   Safari), only after the visitor turns it on, and only for this word. */

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionClass = new () => Recognition;

function recognitionClass(): RecognitionClass | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function wakeWordSupported() {
  return recognitionClass() !== null;
}

/* The page's language, as speech recognition names it */
const SPEECH_LANG: Record<string, string> = {
  en: "en-US",
  th: "th-TH",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  ja: "ja-JP",
  ko: "ko-KR",
  vi: "vi-VN",
  id: "id-ID",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-BR",
};

/* "Sunday" as recognisers write it down in each language */
const SUNDAY = /sunday|sun day|ซันเดย์|ซันเด|ซันเดร์|サンデー|サンデイ|선데이|썬데이|桑迪|森迪|sandei|san đây|zondag|domingo/i;

export class WakeWord {
  private recognition: Recognition | null = null;
  private active = false;

  /* Starts listening for "Sunday"; onBlocked when the mic is refused */
  start(locale: string, onWake: () => void, onBlocked: () => void): boolean {
    const Klass = recognitionClass();
    if (!Klass) return false;
    this.stop();
    const r = new Klass();
    r.lang = SPEECH_LANG[locale] ?? "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 3;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const alternatives = e.results[i];
        for (let j = 0; j < alternatives.length; j++) {
          if (SUNDAY.test(alternatives[j].transcript)) {
            this.pause();
            onWake();
            return;
          }
        }
      }
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        this.stop();
        onBlocked();
      }
    };
    // Recognisers stop after a pause in speech; keep going while it's on
    r.onend = () => {
      if (this.active && this.recognition === r) {
        try {
          r.start();
        } catch {
          // already starting
        }
      }
    };
    this.recognition = r;
    this.active = true;
    try {
      r.start();
    } catch {
      return false;
    }
    return true;
  }

  /* While Sunday is talking with the visitor, the mic is theirs */
  pause() {
    this.active = false;
    this.recognition?.abort();
  }

  resume() {
    if (!this.recognition || this.active) return;
    this.active = true;
    try {
      this.recognition.start();
    } catch {
      // already running
    }
  }

  stop() {
    this.active = false;
    this.recognition?.abort();
    this.recognition = null;
  }

  get on() {
    return this.recognition !== null;
  }
}
