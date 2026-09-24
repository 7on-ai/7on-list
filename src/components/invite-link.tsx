"use client";

import { Check, Copy, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";
import { track } from "@/lib/track";

/* The person's own invite link, with copy and (on phones) the system share sheet */
export function InviteLink({ url, from }: { url: string; from: "form" | "invite_page" }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => setCanShare(typeof navigator !== "undefined" && "share" in navigator), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track("invite_shared", { method: "copy", from });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link stays visible and selectable
    }
  }

  async function share() {
    try {
      await navigator.share({ text: t.invite.shareText, url });
      track("invite_shared", { method: "share", from });
    } catch {
      // Dismissed
    }
  }

  const display = url.replace(/^https?:\/\//, "");

  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-1.5 pl-4">
      <span className="min-w-0 flex-1 select-all truncate text-left text-sm text-[#111]" title={url}>
        {display}
      </span>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#111] px-3 text-sm font-medium text-white transition-colors hover:bg-black"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span aria-live="polite">{copied ? t.invite.copied : t.invite.copy}</span>
      </button>
      {canShare && (
        <button
          type="button"
          onClick={share}
          aria-label={t.invite.share}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-[#111] transition-colors hover:border-zinc-400"
        >
          <Share className="size-4" />
        </button>
      )}
    </div>
  );
}
