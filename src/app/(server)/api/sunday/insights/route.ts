import { NextResponse, type NextRequest } from "next/server";
import { isSunday } from "@/lib/admin";
import { getInsights } from "@/lib/insights";

/* For Sunday: how the list is growing and where people come from.
   Aggregates only — no addresses ever leave through this door. */
export async function GET(request: NextRequest) {
  if (!isSunday(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getInsights());
}
