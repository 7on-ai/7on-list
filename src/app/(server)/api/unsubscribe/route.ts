import { setPreference } from "@/lib/db";
import { verifyPreferenceToken } from "@/lib/tokens";
import { NextResponse, type NextRequest } from "next/server";

/* RFC 8058 one-click unsubscribe: mail clients POST here straight from the
   inbox's "Unsubscribe" button (List-Unsubscribe-Post header). */
export async function POST(request: NextRequest) {
  const email = verifyPreferenceToken(request.nextUrl.searchParams.get("t"));
  if (!email) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  await setPreference(email, "none", "one_click");
  return NextResponse.json({ ok: true });
}
