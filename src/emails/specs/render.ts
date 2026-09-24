import type { Locale } from "@/i18n/dictionaries";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { id } from "./locales/id";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { pt } from "./locales/pt";
import { th } from "./locales/th";
import { vi } from "./locales/vi";
import { zhHans } from "./locales/zh-Hans";
import { zhHant } from "./locales/zh-Hant";
import type { SpecsEmail } from "./types";

const COPY: Record<Locale, SpecsEmail> = {
  en,
  th,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  ja,
  ko,
  vi,
  id,
  es,
  fr,
  de,
  pt,
};

const SITE = "https://7on.ai";
const INK = "#1d1d1f";
const MUTED = "#6e6e73";
const HAIR = "#e5e5ea";
/* System faces only — email clients can't load web fonts reliably, and
   these fall back to each platform's Thai/CJK/Vietnamese glyphs. */
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif";

function esc(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Chinese and Japanese wrap between characters, so they are left free */
const CJK = /[぀-ヿ㐀-鿿豈-﫿＀-￯]/;

/* Headings: keep each space-separated phrase whole. Thai has no spaces
   between words, so mail clients would otherwise break mid-word. */
function phrase(text: string): string {
  // "\n" in copy marks a deliberate line break
  if (text.includes("\n")) return text.split("\n").map(phrase).join("<br>");
  return text
    .split(/(\s+)/)
    .map((part) =>
      /^\s+$/.test(part) || CJK.test(part) ? esc(part) : `<span style="white-space:nowrap;">${esc(part)}</span>`
    )
    .join("");
}

/* Deliberately plain, like a note from Apple or Stripe: white page, text,
   one link. Newsletter styling (colour blocks, cards, buttons) is what
   sends mail to Gmail's Promotions tab. */
function html(c: SpecsEmail, locale: Locale, logoUrl: string) {
  const text = (content: string, style = "") =>
    `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.6;color:${INK};${style}">${content}</p>`;
  // Title on its own line: Thai titles carry no full stop to separate them
  const item = (title: string, body: string) => text(`<strong>${esc(title)}</strong><br>${esc(body)}`);
  const hair = `<div style="height:1px;background:${HAIR};margin:28px 0;line-height:1px;font-size:0;">&nbsp;</div>`;

  const numbers = c.stats
    .map(
      (s) => `<tr>
        <td valign="top" style="padding:0 16px 8px 0;font-family:${FONT};font-size:15px;line-height:1.5;color:${INK};font-weight:600;white-space:nowrap;">${esc(s.value)}</td>
        <td valign="top" style="padding:0 0 8px;font-family:${FONT};font-size:15px;line-height:1.5;color:${MUTED};">${esc(s.label)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="padding:40px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td>
  <img src="${logoUrl}" width="28" height="28" alt="7on" style="display:block;border:0;margin:0 0 32px;">
  <h1 style="margin:0 0 20px;font-family:${FONT};font-size:24px;line-height:1.3;font-weight:600;color:${INK};">${phrase(c.headline)}</h1>
  ${text(esc(c.intro))}
  ${text(esc(c.lead))}
  ${hair}
  ${c.features.map((f) => item(f.title, f.body)).join("")}
  ${item(c.mindGraph.title, c.mindGraph.body)}
  ${item(c.arc.title, c.arc.body)}
  ${hair}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">${numbers}</table>
  ${hair}
  ${item(c.closing.title, c.closing.body)}
  ${text(`<a href="${SITE}" style="color:#0066cc;text-decoration:none;">${esc(c.cta)} &rsaquo;</a>`)}
  ${text(esc(c.signoff), "margin-top:28px;")}
  ${hair}
  <p style="margin:0 0 8px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">${esc(c.footer)}</p>
  <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">${esc(c.disclaimer)} © ${new Date().getFullYear()} 7on</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/* Plain-text part: some clients show only this, and spam filters expect it */
function text(c: SpecsEmail) {
  return [
    c.headline.replace(/\n/g, ""),
    "",
    c.intro,
    "",
    c.lead,
    "",
    ...[...c.features, c.mindGraph, c.arc].flatMap((f) => [f.title, f.body, ""]),
    "",
    ...c.stats.map((s) => `${s.value}  ${s.label}`),
    "",
    c.closing.title,
    c.closing.body,
    "",
    `${c.cta}: ${SITE}`,
    "",
    c.signoff,
    "",
    "—",
    c.footer,
    c.disclaimer,
  ].join("\n");
}

export function renderSpecsEmail(locale: Locale, origin: string) {
  const c = COPY[locale] ?? COPY.en;
  return { subject: c.subject, html: html(c, locale, `${origin}/logo-email.png`), text: text(c) };
}
