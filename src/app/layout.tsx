import type { Metadata } from "next";
import { headers } from "next/headers";
import { Be_Vietnam_Pro, Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { PageAnalytics } from "@/components/page-analytics";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n/provider";
import { DICTIONARIES, matchLocale, type Locale } from "@/i18n/dictionaries";

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

/* Speak the visitor's browser language — no switcher on the page */
async function resolveLocale(): Promise<Locale> {
  return matchLocale((await headers()).get("accept-language"));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const { title, description } = DICTIONARIES[locale].meta;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "7on", locale },
    // Large card so shared links show the full 1200×630 image
    twitter: { card: "summary_large_image", title, description },
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
