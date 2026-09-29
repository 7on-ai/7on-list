import arcjet, { slidingWindow } from "@arcjet/next";
import { type NextRequest, NextResponse } from "next/server";

/* Talk to Sunday from the page: the visitor's words go to the Sunday voice
   backend, and Sunday's spoken answer comes back.

   The page never sees the backend's address or key; this route passes the
   request through and limits how often one visitor can talk.

   Backend contract — SUNDAY_VOICE_URL receives:
     POST, multipart/form-data
       audio    the visitor speaking (webm/opus, or mp4/aac from Safari), ≤ 8 s
       locale   the page's language, e.g. "th", "en", "zh-Hant"
       session  an id for this visitor's conversation, to keep context between turns
     Authorization: Bearer SUNDAY_VOICE_TOKEN
   and answers with:
     200, the answer as audio (audio/mpeg, audio/wav, audio/ogg …)
       optional header X-Sunday-Text: the answer as text, URI-encoded,
       shown under the device as Sunday speaks
       optional header X-Sunday-Reminder: seconds until a reminder the
       visitor just set (e.g. "remind me in 5 minutes" → 300); the
       reminder arc counts down to it and chimes when it arrives
       optional header X-Sunday-Reminder-Text: what to say then, URI-encoded
     any other status: the page says Sunday couldn't answer just now

   Until SUNDAY_VOICE_URL is set, this route answers 503 "not_configured"
   and the page says Sunday's voice is on its way. */

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // A conversation is a handful of turns; this stops anyone running up the bill
    slidingWindow({ mode: "LIVE", interval: "10m", max: 30 }),
  ],
});

const MAX_AUDIO_BYTES = 2_000_000;
const TIMEOUT_MS = 30_000;

/* Whether Sunday can talk yet — the page checks before asking for the mic */
export function GET() {
  return NextResponse.json({ ready: Boolean(process.env.SUNDAY_VOICE_URL) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const backend = process.env.SUNDAY_VOICE_URL;
  if (!backend) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const decision = await aj.protect(request);
  if (decision.isDenied()) return NextResponse.json({ error: "too_many" }, { status: 429 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) return NextResponse.json({ error: "no_audio" }, { status: 400 });
  if (audio.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: "too_long" }, { status: 413 });

  const out = new FormData();
  out.set("audio", audio, audio instanceof File ? audio.name : "speech");
  out.set("locale", String(form.get("locale") ?? "en").slice(0, 16));
  out.set("session", String(form.get("session") ?? "").slice(0, 64));

  let answer: Response;
  try {
    answer = await fetch(backend, {
      method: "POST",
      headers: process.env.SUNDAY_VOICE_TOKEN ? { Authorization: `Bearer ${process.env.SUNDAY_VOICE_TOKEN}` } : {},
      body: out,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json({ error: "unreachable" }, { status: 502 });
  }
  if (!answer.ok || !answer.body) return NextResponse.json({ error: "backend" }, { status: 502 });

  const headers = new Headers({
    "Content-Type": answer.headers.get("Content-Type") ?? "audio/mpeg",
    "Cache-Control": "no-store",
  });
  for (const name of ["X-Sunday-Text", "X-Sunday-Reminder", "X-Sunday-Reminder-Text"]) {
    const value = answer.headers.get(name);
    if (value) headers.set(name, value.slice(0, 2000));
  }
  return new Response(answer.body, { status: 200, headers });
}
