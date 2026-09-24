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
const RED = "#C41D3B";
const INK = "#111111";
const MUTED = "#5f5f66";
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
const CJK = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;

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

/* Email HTML: tables and inline styles, because that is what Gmail,
   Outlook and Apple Mail all render the same way. */
function html(c: SpecsEmail, locale: Locale, logoUrl: string, links?: SpecsLinks) {
  // Letter-spacing pulls Thai and CJK glyphs apart; keep it for Latin only
  const latin = !["th", "ja", "ko", "zh-Hans", "zh-Hant"].includes(locale);
  const tracking = (em: string) => (latin ? `letter-spacing:${em};` : "");
  const p = (text: string, style = "") =>
    `<p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.6;color:${MUTED};${style}">${esc(text)}</p>`;
  const h = (text: string, size: number, style = "") =>
    `<h2 style="margin:0 0 8px;font-family:${FONT};font-size:${size}px;line-height:1.3;font-weight:600;${tracking("-0.01em")}color:${INK};${style}">${phrase(text)}</h2>`;
  const block = (inner: string, pad = "0 40px 36px") => `<tr><td class="pad" style="padding:${pad};">${inner}</td></tr>`;
  const rule = `<tr><td class="pad" style="padding:0 40px 36px;"><div style="height:1px;background:#ececef;line-height:1px;font-size:0;">&nbsp;</div></td></tr>`;

  const features = c.features
    .map(
      (f) => `<tr><td style="padding:0 0 22px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="top" style="padding:9px 14px 0 0;"><div style="width:6px;height:6px;border-radius:3px;background:${RED};"></div></td>
          <td valign="top">${h(f.title, 17, "margin-bottom:4px;")}${p(f.body, "font-size:15px;")}</td>
        </tr></table>
      </td></tr>`
    )
    .join("");

  const statCell = (s: { value: string; label: string }) => `<td class="stat" width="50%" valign="top" style="padding:0 8px 16px;">
      <div style="border:1px solid #ececef;border-radius:14px;padding:18px 18px 16px;">
        <div style="font-family:${FONT};font-size:26px;line-height:1.2;font-weight:600;${tracking("-0.02em")}color:${INK};white-space:nowrap;">${esc(s.value)}</div>
        <div style="margin-top:8px;font-family:${FONT};font-size:13px;line-height:1.45;color:${MUTED};">${esc(s.label)}</div>
      </div>
    </td>`;
  const stats = [0, 2]
    .map((i) => `<tr>${statCell(c.stats[i])}${statCell(c.stats[i + 1])}</tr>`)
    .join("");

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<style>
  @media (max-width: 480px) {
    .stat { display: block !important; width: 100% !important; box-sizing: border-box; }
    .pad { padding-left: 24px !important; padding-right: 24px !important; }
    .h1 { font-size: 32px !important; }
  }
</style>
<title>${esc(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f6f7;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f6f7;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;">

  <tr><td align="center" style="padding:36px 40px 8px;">
    <a href="${SITE}"><img src="${logoUrl}" width="36" height="36" alt="7on" style="display:block;border:0;"></a>
  </td></tr>

  ${block(
    `<p style="margin:0 0 14px;font-family:${FONT};font-size:12px;${tracking("0.18em")}text-transform:uppercase;color:${RED};font-weight:600;">${esc(c.eyebrow)}</p>
     <h1 class="h1" style="margin:0 0 16px;font-family:${FONT};font-size:40px;line-height:1.15;font-weight:600;${tracking("-0.03em")}color:${INK};">${phrase(c.headline)}</h1>
     ${p(c.intro, "font-size:17px;")}`,
    "28px 40px 36px"
  )}

  <tr><td class="pad" style="padding:0 40px 40px;">
    <div style="background:${RED};border-radius:16px;padding:28px 28px 26px;">
      <h2 style="margin:0 0 8px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:600;color:#ffffff;">${phrase(c.lead.title)}</h2>
      <p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.6;color:rgba(255,255,255,0.88);">${esc(c.lead.body)}</p>
    </div>
  </td></tr>

  ${block(`${h(c.featuresTitle, 24)}${p(c.featuresIntro, "margin-bottom:24px;")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${features}</table>`, "0 40px 14px")}

  ${rule}
  ${block(`${h(c.mindGraph.title, 20)}${p(c.mindGraph.body)}`)}
  ${block(`${h(c.arc.title, 20)}${p(c.arc.body)}`)}
  ${rule}

  ${block(`${h(c.statsTitle, 24, "margin-bottom:20px;")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -8px;">${stats}</table>`, "0 40px 24px")}

  <tr><td class="pad" style="padding:0 40px 40px;">
    <div style="background:#f6f6f7;border-radius:16px;padding:28px;">
      ${h(c.closing.title, 22)}${p(c.closing.body)}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;"><tr>
        <td style="background:${INK};border-radius:10px;">
          <a href="${SITE}" style="display:inline-block;padding:13px 22px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${esc(c.cta)} &rarr;</a>
        </td>
      </tr></table>
    </div>
  </td></tr>

  ${
    links
      ? block(
          `${h(c.updates.title, 18, "margin-bottom:6px;")}${p(c.updates.body, "font-size:15px;")}
    <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;font-weight:600;"><a href="${esc(links.updates)}" style="color:${RED};text-decoration:none;">${esc(c.updates.cta)} &rarr;</a></p>`,
          "0 40px 36px"
        )
      : ""
  }

  ${block(p(`— ${c.signoff}`, `color:${INK};`), "0 40px 36px")}
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
  <tr><td style="padding:24px 40px 8px;">
    <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;line-height:1.6;color:#8a8a92;">${esc(c.footer)}${
      links ? ` <a href="${esc(links.preferences)}" style="color:#8a8a92;text-decoration:underline;">${esc(c.preferences)}</a>` : ""
    }</p>
    <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:#8a8a92;">${esc(c.disclaimer)} © ${new Date().getFullYear()} 7on</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/* Plain-text part: some clients show only this, and spam filters expect it */
function text(c: SpecsEmail, links?: SpecsLinks) {
  return [
    c.eyebrow.toUpperCase(),
    c.headline,
    "",
    c.intro,
    "",
    c.lead.title,
    c.lead.body,
    "",
    c.featuresTitle,
    c.featuresIntro,
    "",
    ...c.features.flatMap((f) => [`• ${f.title}`, `  ${f.body}`, ""]),
    c.mindGraph.title,
    c.mindGraph.body,
    "",
    c.arc.title,
    c.arc.body,
    "",
    c.statsTitle,
    ...c.stats.map((s) => `• ${s.value} — ${s.label}`),
    "",
    c.closing.title,
    c.closing.body,
    "",
    `${c.cta}: ${SITE}`,
    "",
    ...(links ? [c.updates.title, c.updates.body, `${c.updates.cta}: ${links.updates}`, ""] : []),
    `— ${c.signoff}`,
    "",
    "—",
    c.footer,
    ...(links ? [`${c.preferences}: ${links.preferences}`] : []),
    c.disclaimer,
  ].join("\n");
}

/* Signed links into the preferences page; omitted when no link secret is set */
export type SpecsLinks = { updates: string; preferences: string };

export function renderSpecsEmail(locale: Locale, origin: string, links?: SpecsLinks) {
  const c = COPY[locale] ?? COPY.en;
  return {
    subject: c.subject,
    html: html(c, locale, `${origin}/logo-email.png`, links),
    text: text(c, links),
  };
}
