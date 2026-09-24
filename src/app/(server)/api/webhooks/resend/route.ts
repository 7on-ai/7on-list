import { recordEmailEvent } from "@/lib/db";
import { sendReferralNotice } from "@/lib/email";
import { inviterOf } from "@/lib/referrals";
import { createHmac, timingSafeEqual } from "node:crypto";
import { after, NextResponse, type NextRequest } from "next/server";

/* Resend delivery events (Svix-signed). Set this URL in Resend → Webhooks and
   put the signing secret (whsec_…) in RESEND_WEBHOOK_SECRET. */

const TOLERANCE_SECONDS = 5 * 60;

function verify(body: string, id: string, timestamp: string, signatures: string, secret: string) {
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = Buffer.from(createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64"));
  // Header holds one or more "v1,<base64>" entries separated by spaces
  return signatures.split(" ").some((entry) => {
    const [version, sig] = entry.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

type ResendEvent = {
  type: string;
  created_at?: string;
  data?: { email_id?: string; to?: string[]; bounce?: { type?: string } };
};

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signatures = request.headers.get("svix-signature");
  const body = await request.text();
  if (!id || !timestamp || !signatures || !verify(body, id, timestamp, signatures, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // A temporary bounce (full inbox, greylisting) is not a reason to stop sending
  const type =
    event.type === "email.bounced" && event.data?.bounce?.type?.toLowerCase() === "transient"
      ? "email.bounced.transient"
      : event.type;

  const { creditedInviter } = await recordEmailEvent({
    id,
    type,
    email: event.data?.to?.[0]?.trim().toLowerCase() ?? null,
    messageId: event.data?.email_id ?? null,
    data: event,
  });

  // A referred friend's first email just arrived: their inviter moves up
  if (creditedInviter) {
    const origin = request.nextUrl.origin;
    after(async () => {
      const inviter = await inviterOf(creditedInviter);
      if (inviter) await sendReferralNotice(inviter, origin).catch((e) => console.error("Referral notice failed:", e));
    });
  }

  return NextResponse.json({ ok: true });
}
