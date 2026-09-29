/* Talking to Sunday: the visitor's words go out, Sunday's voice comes back.
   The page talks to /api/sunday/voice, which passes the request to the
   Sunday voice backend (see that route for the contract). */

export type SundayAnswer = {
  audio: Blob;
  /* What Sunday said, when the backend sends it */
  text?: string;
  /* A reminder the visitor just set: when, and what to say then */
  reminder?: { inSeconds: number; text?: string };
};

export type SundayProblem = "unavailable" | "busy" | "failed";

export class SundayError extends Error {
  constructor(readonly problem: SundayProblem) {
    super(problem);
  }
}

export interface SundayAdapter {
  /* Whether Sunday can talk yet (the backend is connected) */
  ready(): Promise<boolean>;
  converse(request: { audio: Blob; locale: string; session: string }, signal?: AbortSignal): Promise<SundayAnswer>;
}

export function httpAdapter(url = "/api/sunday/voice"): SundayAdapter {
  return {
    async ready() {
      try {
        const res = await fetch(url, { cache: "no-store" });
        return res.ok && Boolean(((await res.json()) as { ready?: boolean }).ready);
      } catch {
        return false;
      }
    },

    async converse({ audio, locale, session }, signal) {
      const form = new FormData();
      const ext = audio.type.includes("mp4") ? "m4a" : audio.type.includes("ogg") ? "ogg" : "webm";
      form.set("audio", audio, `speech.${ext}`);
      form.set("locale", locale);
      form.set("session", session);
      let res: Response;
      try {
        res = await fetch(url, { method: "POST", body: form, signal });
      } catch (err) {
        if (signal?.aborted) throw err;
        throw new SundayError("failed");
      }
      if (res.status === 503) throw new SundayError("unavailable");
      if (res.status === 429) throw new SundayError("busy");
      if (!res.ok) throw new SundayError("failed");
      const decode = (value: string | null) => {
        if (!value) return undefined;
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      };
      const text = decode(res.headers.get("X-Sunday-Text"));
      const seconds = Number(res.headers.get("X-Sunday-Reminder"));
      const reminder =
        Number.isFinite(seconds) && seconds > 0 && seconds <= 24 * 3600
          ? { inSeconds: seconds, text: decode(res.headers.get("X-Sunday-Reminder-Text")) }
          : undefined;
      return { audio: await res.blob(), text, reminder };
    },
  };
}
