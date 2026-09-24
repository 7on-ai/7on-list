/* First-touch attribution, captured in the browser: which link, campaign or
   referral brought this visitor. Kept for the session so it survives
   in-page navigation, and sent along with the spec request. */

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ref?: string;
  referrer?: string;
  landing_path?: string;
};

const KEY = "7on:attribution";
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"] as const;

/* Call once when the page loads; keeps the first values seen this session */
export function captureAttribution() {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const url = new URL(window.location.href);
    const data: Attribution = { landing_path: url.pathname };
    for (const p of PARAMS) {
      const v = url.searchParams.get(p);
      if (v) data[p] = v;
    }
    // Only other sites count as a referrer
    if (document.referrer && new URL(document.referrer).host !== url.host) data.referrer = document.referrer;
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage can be unavailable (private mode); attribution is best-effort
  }
}

export function readAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
