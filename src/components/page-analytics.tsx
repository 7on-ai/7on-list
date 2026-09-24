"use client";

import { Analytics } from "@vercel/analytics/next";

/* Vercel Web Analytics, minus anything private: the admin area isn't
   counted, and signed links (?t=…) never leave the browser. */
export function PageAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        if (url.pathname.startsWith("/admin")) return null;
        url.searchParams.delete("t");
        return { ...event, url: url.toString() };
      }}
    />
  );
}
