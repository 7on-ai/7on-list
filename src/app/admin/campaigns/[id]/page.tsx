import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES } from "@/i18n/dictionaries";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { audience, getCampaign, isApproved, listCampaigns, renderCampaign } from "@/lib/campaigns";
import { CampaignActions, Editor, LoginForm, Preview, WaveSender } from "../../ui";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function CampaignPage({ params, searchParams }: Props) {
  if (!adminConfigured() || !(await isAdmin())) return <LoginForm />;
  const { id } = await params;
  const { saved } = await searchParams;

  if (id === "new") {
    return (
      <div>
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-[#111]">
          ← Admin
        </Link>
        <h1 className="mb-8 mt-3 text-2xl font-medium">New campaign</h1>
        <Editor initial={null} locales={LOCALES} readOnly={false} />
      </div>
    );
  }

  const campaign = await getCampaign(id);
  if (!campaign) notFound();
  const row = (await listCampaigns()).find((c) => c.id === id)!;
  const reach = await audience(campaign, { countries: null, locales: null });
  const translated = LOCALES.filter((l) => campaign.content[l]);
  const origin = "https://7on.ai";
  const htmls = Object.fromEntries(
    translated.map((l) => [
      l,
      renderCampaign(campaign, { email: "you@example.com", locale: l, referral_code: "example", position: 42, referrals: 3 }, origin).html,
    ])
  );
  const approvedButChanged = campaign.approved_hash !== null && !isApproved(campaign);

  return (
    <div className="space-y-12">
      <div>
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-[#111]">
          ← Admin
        </Link>
        <h1 className="mt-3 text-2xl font-medium">{campaign.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {campaign.id} · {campaign.kind === "launch" ? "Launch — everyone in line" : "Updates — people who asked for news"} · drafted by{" "}
          {campaign.created_by} · <span className="font-medium text-[#111]">{row.status}</span>
          {row.sent > 0 && ` · ${row.sent} sent, ${row.delivered} delivered, ${row.clicked} clicked`}
        </p>
        {saved && <p className="mt-2 text-sm text-emerald-700">Saved.</p>}
      </div>

      <section className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <Preview htmls={htmls} />
        <div className="space-y-8">
          <CampaignActions
            id={campaign.id}
            status={row.status}
            approvedButChanged={approvedButChanged}
            locales={translated}
            canDelete={row.sent === 0}
          />
          <div>
            <h3 className="mb-2 text-sm font-medium">Not yet sent: {reach.total}</h3>
            <ul className="space-y-1 text-sm text-zinc-600">
              {reach.byLocale.map((r) => (
                <li key={r.locale}>
                  {r.locale}: {r.n}
                  {!r.translated && <span className="text-[#C41D3B]"> — gets English</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {isApproved(campaign) && (
        <section className="rounded-2xl border border-zinc-200 p-6">
          <h2 className="mb-1 text-lg font-medium">Send a wave</h2>
          <p className="mb-5 text-sm text-zinc-500">
            Goes to the next people in line who haven&apos;t had it yet. Each person gets it once, ever.
          </p>
          <WaveSender id={campaign.id} kind={campaign.kind} remaining={reach.total} />
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-medium">{row.sent > 0 ? "Content (sent — can't change)" : "Edit"}</h2>
        <Editor
          initial={{ id: campaign.id, name: campaign.name, kind: campaign.kind, content: campaign.content }}
          locales={LOCALES}
          readOnly={row.sent > 0}
        />
      </section>
    </div>
  );
}
