import type { Metadata } from "next";
import { headers } from "next/headers";
import { Be_Vietnam_Pro, Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { PageAnalytics } from "@/components/page-analytics";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n/provider";
import { DICTIONARIES, isLocale, LOCALES, matchLocale, pathOf, segmentOf, type Locale } from "@/i18n/dictionaries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* Script fonts load only when a page uses their glyphs (no preload).
   Loopless Thai that sits comfortably next to Geist: */
const notoThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600"],
  preload: false,
});

/* Geist has no Vietnamese; this grotesk was drawn for it */
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-vietnamese",
  subsets: ["vietnamese"],
  weight: ["400", "500", "600"],
  preload: false,
});

/* The language in the address (/th, /ja …) if there is one; otherwise the
   visitor's browser language. No switcher on the page. */
async function resolveLocale(): Promise<Locale> {
  const h = await headers();
  const forced = h.get("x-7on-locale");
  return isLocale(forced) ? forced : matchLocale(h.get("accept-language"));
}

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "7on.ai";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const locale = await resolveLocale();
  const t = DICTIONARIES[locale];
  // Set by the middleware on the home page and its language addresses
  const path = h.get("x-7on-path");
  const invited = h.get("x-7on-invited") === "1";

  // Arrived on a friend's link: the card says so, in the link's language
  const title = invited ? `${t.invite.invited} · 7on ARC` : t.meta.title;
  const image = {
    url: `/og/${invited ? "invited-" : ""}${segmentOf(locale)}.png`,
    width: 1200,
    height: 630,
    alt: `${t.hero.headline.join(" ")} ${t.meta.ogLine}`,
  };

  return {
    metadataBase: new URL(await siteOrigin()),
    title,
    description: t.meta.description,
    ...(path && {
      alternates: {
        // Invite codes and campaign tags never make a separate page
        canonical: path,
        languages: {
          ...Object.fromEntries(LOCALES.map((l) => [l, pathOf(l)])),
          "x-default": "/",
        },
      },
    }),
    openGraph: {
      title,
      description: t.meta.description,
      type: "website",
      siteName: "7on",
      locale,
      images: [image],
      ...(path && { url: path }),
    },
    // Large card so shared links show the full 1200×630 image
    twitter: { card: "summary_large_image", title, description: t.meta.description, images: [image] },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await resolveLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoThai.variable} ${beVietnam.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <I18nProvider locale={locale}>
            <Toaster position="bottom-center" />
            {children}
          </I18nProvider>
          {/* Cookieless page analytics; custom events need Vercel Pro */}
          <PageAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
