import type { Locale } from "@/i18n/dictionaries";

/* A short email in the same look as the specs email: logo, one heading, a few
   paragraphs, at most one button. Used for campaigns and flow notices —
   one email, one story, one action. */
export type Note = {
  locale: Locale;
  subject: string;
  preheader: string;
  heading: string;
  /* Paragraphs separated by a blank line; **bold** and [text](https://…) allowed */
  body: string;
  cta?: { label: string; url: string };
  footer: { reason: string; links: { label: string; url: string }[] };
};

const SITE = "https://7on.ai";
const INK = "#111111";
const MUTED = "#5f5f66";
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif";
const CJK = /[぀-ヿ㐀-鿿豈-﫿＀-￯]/;
const ZWSP = "​";

function esc(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Headings break only between phrases; Thai marks its break points with U+200B */
function phrase(text: string) {
  return text
    .split(/(\s+|​)/)
    .filter(Boolean)
    .map((part) =>
      part === ZWSP
        ? "<wbr>"
        : /^\s+$/.test(part) || CJK.test(part)
          ? esc(part)
          : `<span style="white-space:nowrap;">${esc(part)}</span>`
    )
    .join("");
}

const LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

/* Escaped text with **bold** and [links](https://…) — nothing else */
function inline(text: string) {
  return esc(text.replace(new RegExp(ZWSP, "g"), ""))
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${INK};font-weight:600;">$1</strong>`)
    .replace(LINK, (_, label: string, url: string) => `<a href="${url}" style="color:#C41D3B;text-decoration:none;">${label}</a>`);
}

function paragraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function renderNote(n: Note) {
  const latin = !["th", "ja", "ko", "zh-Hans", "zh-Hant"].includes(n.locale);
  const tracking = latin ? "letter-spacing:-0.02em;" : "";
  const p = (html: string) =>
    `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.65;color:${MUTED};">${html}</p>`;

  const html = `<!doctype html>
<html lang="${n.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<style>@media (max-width:480px){.pad{padding-left:24px !important;padding-right:24px !important;}}</style>
<title>${esc(n.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f6f7;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(n.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f6f7;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:20px;">
  <tr><td align="center" style="padding:36px 40px 8px;">
    <a href="${SITE}"><img src="${SITE}/logo-email.png" width="36" height="36" alt="7on" style="display:block;border:0;"></a>
  </td></tr>
  <tr><td class="pad" style="padding:28px 40px 20px;">
    <h1 style="margin:0 0 20px;font-family:${FONT};font-size:30px;line-height:1.2;font-weight:600;${tracking}color:${INK};">${phrase(n.heading)}</h1>
    ${paragraphs(n.body).map((para) => p(inline(para).replace(/\n/g, "<br>"))).join("\n    ")}
  </td></tr>
  ${
    n.cta
      ? `<tr><td class="pad" style="padding:0 40px 40px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background:${INK};border-radius:10px;">
        <a href="${esc(n.cta.url)}" style="display:inline-block;padding:13px 22px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${esc(n.cta.label)} &rarr;</a>
      </td>
    </tr></table>
  </td></tr>`
      : `<tr><td style="padding:0 0 20px;"></td></tr>`
  }
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
  <tr><td style="padding:24px 40px 8px;">
    <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:#8a8a92;">${esc(n.footer.reason)}${n.footer.links
      .map((l) => ` <a href="${esc(l.url)}" style="color:#8a8a92;text-decoration:underline;">${esc(l.label)}</a>`)
      .join(" ·")}</p>
    <p style="margin:8px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:#8a8a92;">© ${new Date().getFullYear()} 7on</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const plain = (s: string) => s.replace(new RegExp(ZWSP, "g"), "");
  const text = [
    plain(n.heading),
    "",
    ...paragraphs(n.body).flatMap((para) => [
      plain(para).replace(/\*\*(.+?)\*\*/g, "$1").replace(LINK, (_, label: string, url: string) => `${label} (${url})`),
      "",
    ]),
    ...(n.cta ? [`${n.cta.label}: ${n.cta.url}`, ""] : []),
    "—",
    n.footer.reason,
    ...n.footer.links.map((l) => `${l.label}: ${l.url}`),
  ].join("\n");

  return { subject: plain(n.subject), html, text };
}

/* Tags our own links so visits from an email show up by campaign in analytics */
export function withUtm(url: string, campaign: string, origin: string) {
  try {
    const u = new URL(url);
    const ours = u.host === new URL(origin).host || u.host === "7on.ai" || u.host.endsWith(".7on.ai");
    if (!ours || u.searchParams.has("utm_source")) return url;
    u.searchParams.set("utm_source", "email");
    u.searchParams.set("utm_medium", "email");
    u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  } catch {
    return url;
  }
}
