import { NextResponse, type NextRequest } from "next/server";
import { localeFromSegment, segmentOf } from "@/i18n/dictionaries";

/* /th, /ja, /zh-hant … serve the home page in that language, whatever the
   browser says. The layout reads the headers set here for the language,
   the canonical address, and whether the visitor came on an invite link. */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const headers = new Headers(request.headers);
  // Never trust these from outside
  headers.delete("x-7on-locale");
  headers.delete("x-7on-path");
  headers.delete("x-7on-invited");
  if (searchParams.get("ref")) headers.set("x-7on-invited", "1");

  if (pathname === "/") {
    headers.set("x-7on-path", "/");
    return NextResponse.next({ request: { headers } });
  }

  const segment = pathname.slice(1);
  const locale = localeFromSegment(segment);
  if (!locale) return NextResponse.next({ request: { headers } });

  // One address per language: /zh-Hant → /zh-hant
  if (segment !== segmentOf(locale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${segmentOf(locale)}`;
    return NextResponse.redirect(url, 308);
  }

  headers.set("x-7on-locale", locale);
  headers.set("x-7on-path", pathname);
  const url = request.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/", "/(en|th|zh-hans|zh-hant|zh-Hans|zh-Hant|ja|ko|vi|id|es|fr|de|pt)"],
};
