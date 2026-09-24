import Link from "next/link";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { listCampaigns } from "@/lib/campaigns";
import { getInsights, topInviters } from "@/lib/insights";
import { LoginForm, primary } from "./ui";

function Stat({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-medium tabular-nums">{value}</p>
      {note && <p className="mt-0.5 text-xs text-zinc-400">{note}</p>}
    </div>
  );
}

function Bars({ title, rows }: { title: string; rows: { label: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-400">Nothing yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-2 text-sm">
              <span className="truncate text-zinc-600" title={r.label}>
                {r.label}
              </span>
              <span className="h-2 rounded-full bg-zinc-100">
                <span className="block h-2 rounded-full bg-[#C41D3B]" style={{ width: `${(r.n / max) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums text-zinc-500">{r.n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

export default async function Admin() {
  if (!adminConfigured()) {
    return <p className="text-zinc-600">Set ADMIN_PASSWORD (12+ characters) in the environment to use this page.</p>;
  }
  if (!(await isAdmin())) return <LoginForm />;

  const [insights, campaigns, inviters] = await Promise.all([getInsights(), listCampaigns(), topInviters()]);
  const t = insights.totals;
  const maxDay = Math.max(1, ...insights.daily.map((d) => d.n));

  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-4 text-lg font-medium">The list</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Asked for the specs" value={t.contacts} note={`${t.last_7d} this week · ${t.last_24h} today`} />
          <Stat label="In line" value={t.in_line} note={`${t.suppressed} bounced or spam · ${t.unsubscribed} off`} />
          <Stat label="Want updates" value={t.updates} note={`${pct(t.updates, t.contacts)} opted in`} />
          <Stat label="Came by invite" value={t.referred} note={`${t.referred_counted} counted (delivered)`} />
        </div>

        <div className="mt-6 flex h-24 items-end gap-1.5 rounded-2xl border border-zinc-200 p-4" aria-label="Requests per day, last 14 days">
          {insights.daily.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${d.n}`}>
              <div className="w-full rounded-sm bg-[#C41D3B]" style={{ height: `${Math.max(2, (d.n / maxDay) * 56)}px`, opacity: d.n ? 1 : 0.15 }} />
            </div>
          ))}
        </div>
        <p className="mt-1 text-right text-xs text-zinc-400">last 14 days</p>
      </section>

      <section className="grid gap-10 sm:grid-cols-2">
        <Bars title="Sources" rows={insights.sources.map((s) => ({ label: s.source, n: s.n }))} />
        <Bars title="UTM campaigns" rows={insights.campaigns.map((s) => ({ label: s.campaign, n: s.n }))} />
        <Bars title="Countries" rows={insights.countries.map((s) => ({ label: s.country, n: s.n }))} />
        <Bars title="Languages" rows={insights.locales.map((s) => ({ label: s.locale, n: s.n }))} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Campaigns</h2>
          <Link href="/admin/campaigns/new" className={primary}>
            New campaign
          </Link>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-zinc-500">
            None yet. Write one here, or let Sunday draft it through <code>POST /api/sunday/campaigns</code>.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-zinc-500">
                <tr>
                  <th className="py-2 font-normal">Campaign</th>
                  <th className="font-normal">Audience</th>
                  <th className="font-normal">Status</th>
                  <th className="text-right font-normal">Sent</th>
                  <th className="text-right font-normal">Delivered</th>
                  <th className="text-right font-normal">Clicked</th>
                  <th className="text-right font-normal">Bounced / spam</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-zinc-100">
                    <td className="py-2.5">
                      <Link href={`/admin/campaigns/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                      <span className="ml-2 text-xs text-zinc-400">
                        {c.id} · by {c.created_by}
                      </span>
                    </td>
                    <td>{c.kind}</td>
                    <td>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs ${
                          c.status === "live" ? "bg-emerald-50 text-emerald-700" : c.status === "approved" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{c.sent}</td>
                    <td className="text-right tabular-nums">{c.delivered}</td>
                    <td className="text-right tabular-nums">{c.clicked}</td>
                    <td className="text-right tabular-nums">
                      {c.bounced} / {c.complained}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Top inviters</h2>
        {inviters.length === 0 ? (
          <p className="text-sm text-zinc-500">No counted referrals yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {inviters.map((i) => (
                <tr key={i.email} className="border-t border-zinc-100">
                  <td className="py-2">{i.email}</td>
                  <td className="text-right tabular-nums">{i.friends} friends</td>
                  <td className="w-24 text-right tabular-nums text-zinc-500">{i.position ? `#${i.position}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
