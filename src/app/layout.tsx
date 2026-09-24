import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n/provider";
import { DICTIONARIES, LOCALE_COOKIE, isLocale, matchLocale, type Locale } from "@/i18n/dictionaries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* Loopless Thai that sits comfortably next to Geist */
const notoThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600"],
});

/* Explicit choice (cookie) wins; otherwise follow the browser's language */
async function resolveLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return matchLocale((await headers()).get("accept-language"));
}

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = DICTIONARIES[await resolveLocale()].meta;
  return { title, description, openGraph: { title, description }, twitter: { title, description } };
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
        className={`${geistSans.variable} ${geistMono.variable} ${notoThai.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <I18nProvider initialLocale={locale}>
            <Toaster position="bottom-center" />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
