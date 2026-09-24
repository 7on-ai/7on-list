import { getContact, setPreference, type Preference } from "@/lib/db";
import { verifyPreferenceToken } from "@/lib/tokens";
import { NextResponse, type NextRequest } from "next/server";

const CHOICES: Preference[] = ["updates", "launch", "none"];

/* Form post from the preferences page. Changes happen only on POST, never on
   opening a link, so mail scanners that prefetch links can't opt anyone in. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("t") ?? "");
  const choice = String(form.get("preference") ?? "") as Preference;
  const email = verifyPreferenceToken(token);

  const back = new URL("/preferences", request.nextUrl.origin);
  back.searchParams.set("t", token);

  if (!email || !CHOICES.includes(choice) || !(await getContact(email))) {
    return NextResponse.redirect(back, 303);
  }
  await setPreference(email, choice);
  back.searchParams.set("saved", "1");
  return NextResponse.redirect(back, 303);
}
