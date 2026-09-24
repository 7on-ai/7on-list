"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { approve, login, remove, revoke, save, sendChunk, test } from "./actions";

const button =
  "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-40";
export const primary = `${button} bg-[#111] text-white hover:bg-black`;
export const secondary = `${button} border border-zinc-300 text-[#111] hover:border-zinc-500`;
const field =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#111]";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mx-auto mt-16 max-w-xs space-y-3">
      <input name="password" type="password" autoComplete="current-password" placeholder="Password" className={field} autoFocus />
      <button className={`${primary} w-full`} disabled={pending}>
        Sign in
      </button>
      {state?.error && <p className="text-sm text-[#C41D3B]">{state.error}</p>}
    </form>
  );
}

export function Preview({ htmls }: { htmls: Record<string, string> }) {
  const locales = Object.keys(htmls);
  const [locale, setLocale] = useState(locales[0]);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${l === locale ? "bg-[#111] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <iframe
        title="Email preview"
        srcDoc={htmls[locale]}
        sandbox=""
        className="h-[640px] w-full rounded-xl border border-zinc-200 bg-[#f6f6f7]"
      />
    </div>
  );
}

export function CampaignActions({
  id,
  status,
  approvedButChanged,
  locales,
  canDelete,
}: {
  id: string;
  status: "draft" | "approved" | "live";
  approvedButChanged: boolean;
  locales: string[];
  canDelete: boolean;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ error?: string | null; ok?: string } | null>(null);
  const [testLocale, setTestLocale] = useState(locales[0] ?? "en");

  const run = (fn: () => Promise<{ error?: string | null; to?: string } | void>, ok?: string) =>
    start(async () => {
      const r = await fn();
      setMessage(r?.error ? { error: r.error } : { ok: r && "to" in r ? `Test sent to ${r.to}.` : ok });
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {status === "draft" && (
          <button
            className={primary}
            disabled={pending}
            onClick={() => {
              if (confirm("Approve exactly this content for sending?")) run(() => approve(id), "Approved.");
            }}
          >
            Approve
          </button>
        )}
        {status === "approved" && (
          <button className={secondary} disabled={pending} onClick={() => run(() => revoke(id), "Approval withdrawn.")}>
            Withdraw approval
          </button>
        )}
        <span className="flex items-center gap-1">
          <select value={testLocale} onChange={(e) => setTestLocale(e.target.value)} className={`${field} h-10 w-auto`}>
            {locales.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <button className={secondary} disabled={pending} onClick={() => run(() => test(id, testLocale))}>
            Send test to me
          </button>
        </span>
        {canDelete && (
          <button
            className={`${secondary} text-[#C41D3B]`}
            disabled={pending}
            onClick={() => {
              if (confirm("Delete this draft?")) run(() => remove(id));
            }}
          >
            Delete
          </button>
        )}
      </div>
      {approvedButChanged && (
        <p className="text-sm text-[#C41D3B]">Edited after approval — approve again before sending.</p>
      )}
      {message?.error && <p className="text-sm text-[#C41D3B]">{message.error}</p>}
      {message?.ok && <p className="text-sm text-emerald-700">{message.ok}</p>}
    </div>
  );
}

/* Sends a wave down the line in small chunks, showing progress; stop anytime */
export function WaveSender({ id, kind, remaining }: { id: string; kind: "launch" | "updates"; remaining: number }) {
  const [size, setSize] = useState(Math.min(remaining, 100));
  const [countries, setCountries] = useState("");
  const [languages, setLanguages] = useState("");
  const [local, setLocal] = useState(true);
  const [hour, setHour] = useState(9);
  const [progress, setProgress] = useState<{ sent: number; failed: number; running: boolean; error?: string } | null>(null);
  const stop = useRef(false);

  const list = (s: string) => {
    const items = s.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
    return items.length ? items : null;
  };

  async function go() {
    const audience = kind === "launch" ? "everyone in line" : "people who asked for updates";
    if (!confirm(`Send to the next ${size} ${audience}${countries ? ` in ${countries}` : ""}? This can't be undone.`)) return;
    stop.current = false;
    let sent = 0;
    let failed = 0;
    setProgress({ sent, failed, running: true });
    while (!stop.current && sent + failed < size) {
      const r = await sendChunk(id, {
        limit: Math.min(10, size - sent - failed),
        countries: list(countries.toUpperCase()),
        locales: list(languages),
        localHour: local ? hour : null,
      });
      sent += r.sent;
      failed += r.failed;
      setProgress({ sent, failed, running: !r.done && !r.error, error: r.error ?? undefined });
      if (r.error || r.done) break;
    }
    setProgress((p) => (p ? { ...p, running: false } : p));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-zinc-500">How many (next in line)</span>
          <input type="number" min={1} max={remaining} value={size} onChange={(e) => setSize(Number(e.target.value))} className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-500">Only countries (e.g. TH, SG) — blank for all</span>
          <input value={countries} onChange={(e) => setCountries(e.target.value)} className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-500">Only languages (e.g. th, en) — blank for all</span>
          <input value={languages} onChange={(e) => setLanguages(e.target.value)} className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-zinc-500">Delivery</span>
          <span className="flex items-center gap-2">
            <input type="checkbox" checked={local} onChange={(e) => setLocal(e.target.checked)} />
            at
            <input type="number" min={0} max={23} value={hour} disabled={!local} onChange={(e) => setHour(Number(e.target.value))} className={`${field} w-16`} />
            :00 their local time
          </span>
          <span className="mt-1 block text-xs text-zinc-400">Unknown time zone: right away.</span>
        </label>
      </div>
      <div className="flex items-center gap-3">
        {progress?.running ? (
          <button className={secondary} onClick={() => (stop.current = true)}>
            Stop
          </button>
        ) : (
          <button className={primary} disabled={remaining === 0 || size < 1} onClick={go}>
            Send wave
          </button>
        )}
        {progress && (
          <p className="text-sm text-zinc-600">
            {progress.sent} sent{progress.failed ? `, ${progress.failed} failed (retried next wave)` : ""}
            {progress.running ? "…" : "."}
          </p>
        )}
      </div>
      {progress?.error && <p className="text-sm text-[#C41D3B]">{progress.error}</p>}
    </div>
  );
}

type LocaleFields = { subject?: string; preheader?: string; heading?: string; body?: string; cta_label?: string; cta_url?: string };

export function Editor({
  initial,
  locales,
  readOnly,
}: {
  initial: { id: string; name: string; kind: "launch" | "updates"; content: Record<string, LocaleFields> } | null;
  locales: readonly string[];
  readOnly: boolean;
}) {
  const [state, action, pending] = useActionState(save, null);
  return (
    <form action={action} className="space-y-6">
      <fieldset disabled={readOnly} className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-zinc-500">ID (used in UTM tags)</span>
            <input
              name="id"
              defaultValue={initial?.id}
              readOnly={Boolean(initial)}
              placeholder="founders-note"
              className={field}
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-500">Name</span>
            <input name="name" defaultValue={initial?.name} placeholder="Founder's note" className={field} required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-zinc-500">Audience</span>
            <select name="kind" defaultValue={initial?.kind ?? "updates"} className={field}>
              <option value="updates">Updates — people who asked for news</option>
              <option value="launch">Launch — everyone in line (once, ever)</option>
            </select>
          </label>
        </div>

        <p className="text-xs leading-relaxed text-zinc-500">
          Body: paragraphs separated by a blank line; <code>**bold**</code> and <code>[text](https://…)</code>. Per person:{" "}
          <code>{"{position}"}</code>, <code>{"{friends}"}</code>, <code>{"{invite_link}"}</code>. Languages left empty get
          English.
        </p>

        {locales.map((l) => {
          const c = initial?.content[l];
          return (
            <details key={l} open={l === "en" || Boolean(c)} className="rounded-xl border border-zinc-200 p-4">
              <summary className="cursor-pointer text-sm font-medium">
                {l} {c ? "" : <span className="font-normal text-zinc-400">— not translated</span>}
              </summary>
              <div className="mt-4 grid gap-3">
                <input name={`${l}.subject`} defaultValue={c?.subject} placeholder="Subject" className={field} />
                <input name={`${l}.preheader`} defaultValue={c?.preheader} placeholder="Preview line (after the subject in the inbox)" className={field} />
                <input name={`${l}.heading`} defaultValue={c?.heading} placeholder="Heading" className={field} />
                <textarea name={`${l}.body`} defaultValue={c?.body} placeholder="Body" rows={8} className={field} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name={`${l}.cta_label`} defaultValue={c?.cta_label} placeholder="Button label (optional)" className={field} />
                  <input name={`${l}.cta_url`} defaultValue={c?.cta_url} placeholder="Button link https://…" className={field} />
                </div>
              </div>
            </details>
          );
        })}
      </fieldset>
      {!readOnly && (
        <div className="flex items-center gap-3">
          <button className={primary} disabled={pending}>
            Save draft
          </button>
          {state?.error && <p className="text-sm text-[#C41D3B]">{state.error}</p>}
        </div>
      )}
    </form>
  );
}
