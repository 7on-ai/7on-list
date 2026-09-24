import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { LOCALES, pathOf } from "@/i18n/dictionaries";

/* The home page in every language, each listing its translations */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "7on.ai";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  const languages = {
    ...Object.fromEntries(LOCALES.map((l) => [l, `${origin}${pathOf(l)}`])),
    "x-default": `${origin}/`,
  };
  return [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1, alternates: { languages } },
    ...LOCALES.map((l) => ({
      url: `${origin}${pathOf(l)}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: { languages },
    })),
  ];
}
