import { NextResponse, type NextRequest } from "next/server";
import { isSunday } from "@/lib/admin";
import { campaignInputSchema, listCampaigns, saveCampaign } from "@/lib/campaigns";

/* Sunday drafts campaigns; a person approves and sends them in /admin.
   Saving over an approved draft withdraws the approval (it's bound to the
   exact content), and anything already sent can't be changed. */

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isSunday(request.headers.get("authorization"))) return unauthorized();
  const campaigns = await listCampaigns();
  return NextResponse.json(
    campaigns.map(({ id, name, kind, status, content, created_by, sent, delivered, clicked, bounced, complained }) => ({
      id, name, kind, status, content, created_by, sent, delivered, clicked, bounced, complained,
    }))
  );
}

export async function POST(request: NextRequest) {
  if (!isSunday(request.headers.get("authorization"))) return unauthorized();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = campaignInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid campaign", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await saveCampaign(parsed.data, "sunday");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({
    ok: true,
    status: "draft",
    review: `${request.nextUrl.origin}/admin/campaigns/${parsed.data.id}`,
  });
}
