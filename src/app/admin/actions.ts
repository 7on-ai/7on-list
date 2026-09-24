"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALES } from "@/i18n/dictionaries";
import { ADMIN_COOKIE, checkPassword, requireAdmin, sessionValue } from "@/lib/admin";
import {
  approveCampaign,
  campaignInputSchema,
  deleteDraft,
  revokeApproval,
  saveCampaign,
  sendTest,
  sendWaveChunk,
} from "@/lib/campaigns";

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "7on.ai";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function login(_: unknown, form: FormData) {
  if (!checkPassword(String(form.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "Wrong password." };
  }
  (await cookies()).set(ADMIN_COOKIE, sessionValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin");
}

/* The editor posts one set of fields per language: <locale>.<field> */
export async function save(_: unknown, form: FormData) {
  await requireAdmin();
  const content: Record<string, Record<string, string | undefined>> = {};
  for (const locale of LOCALES) {
    const get = (f: string) => String(form.get(`${locale}.${f}`) ?? "").trim();
    const fields = {
      subject: get("subject"),
      preheader: get("preheader"),
      heading: get("heading"),
      body: get("body").replace(/\r\n/g, "\n"),
      cta_label: get("cta_label") || undefined,
      cta_url: get("cta_url") || undefined,
    };
    // A language counts only when it has its essentials filled in
    if (fields.subject || fields.heading || fields.body) content[locale] = fields;
  }
  const parsed = campaignInputSchema.safeParse({
    id: String(form.get("id") ?? "").trim(),
    name: String(form.get("name") ?? "").trim(),
    kind: form.get("kind"),
    content,
  });
  if (!parsed.success) {
    const issue = parsed.error.errors[0];
    return { error: `${issue?.path.join(".") || "Campaign"}: ${issue?.message}` };
  }
  const result = await saveCampaign(parsed.data, "admin");
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin");
  redirect(`/admin/campaigns/${parsed.data.id}?saved=1`);
}

export async function approve(id: string) {
  await requireAdmin();
  const result = await approveCampaign(id);
  revalidatePath(`/admin/campaigns/${id}`);
  return result.ok ? { error: null } : { error: result.error };
}

export async function revoke(id: string) {
  await requireAdmin();
  await revokeApproval(id);
  revalidatePath(`/admin/campaigns/${id}`);
}

export async function remove(id: string) {
  await requireAdmin();
  const result = await deleteDraft(id);
  if (!result.ok) return { error: result.error };
  redirect("/admin");
}

export async function test(id: string, locale: string) {
  await requireAdmin();
  const to = process.env.ADMIN_EMAIL;
  if (!to) return { error: "Set ADMIN_EMAIL to receive test emails." };
  const result = await sendTest(id, isLocale(locale) ? locale : "en", to, await origin());
  return result.ok ? { error: null, to } : { error: result.error };
}

export async function sendChunk(
  id: string,
  opts: { limit: number; countries: string[] | null; locales: string[] | null; localHour: number | null }
) {
  await requireAdmin();
  try {
    return { ...(await sendWaveChunk(id, { ...opts, origin: await origin() })), error: null };
  } catch (error) {
    return { sent: 0, failed: 0, picked: 0, done: true, error: (error as Error).message };
  }
}
