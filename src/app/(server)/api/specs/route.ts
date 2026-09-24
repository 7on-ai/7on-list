import { isLocale, matchLocale } from "@/i18n/dictionaries";
import { markSpecsSent, recordSpecRequest } from "@/lib/db";
import { sendSpecsEmail } from "@/lib/email";
import arcjet, { validateEmail } from "@arcjet/next";
import { after, type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    validateEmail({
      mode: "LIVE",
      deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
    }),
  ],
});

// Attribution comes from the browser: accept only short strings, never fail on it
const field = z.string().transform((v) => v.slice(0, 300)).optional().catch(undefined);
const attributionSchema = z
  .object({
    utm_source: field,
    utm_medium: field,
    utm_campaign: field,
    utm_content: field,
    utm_term: field,
    ref: field,
    referrer: field,
    landing_path: field,
  })
  .optional()
  .catch(undefined);

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address format."),
  locale: z.string().optional(),
  attribution: attributionSchema,
});

/* A visitor asks for the preliminary specs. Asking again simply sends them
   again (Resend's idempotency key keeps that to once a day per address). */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }

  const result = requestSchema.safeParse(body);
  if (!result.success) {
    const message = result.error.errors[0]?.message ?? "Invalid email address format";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }

  const { email } = result.data;
  // The page's language, so the specs arrive in the words the visitor read
  const locale = isLocale(result.data.locale)
    ? result.data.locale
    : matchLocale(request.headers.get("accept-language"));

  try {
    const decision = await aj.protect(request, { email });
    if (decision.isDenied()) {
      console.warn("Arcjet denied email:", email, "Reason:", decision.reason);
      return NextResponse.json({ success: false, message: "Email validation failed" }, { status: 403 });
    }

    const { suppressed } = await recordSpecRequest({
      email,
      locale,
      // Vercel's IP geolocation — used later to send at a sensible local hour
      country: request.headers.get("x-vercel-ip-country"),
      timezone: request.headers.get("x-vercel-ip-timezone"),
      attribution: result.data.attribution ?? {},
    });

    // Send after responding, so the button never waits on the mail server.
    // Addresses that hard-bounced or reported spam are never mailed again.
    const origin = request.nextUrl.origin;
    if (!suppressed) after(async () => {
      if (await sendSpecsEmail(email, locale, origin)) {
        await markSpecsSent(email).catch((e) => console.error("markSpecsSent failed:", e));
      }
    });

    return NextResponse.json({ success: true, message: "The specs are on their way." }, { status: 200 });
  } catch (error) {
    console.error("Spec request failed:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
