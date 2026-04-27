import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { MonoLabel, Tag, PulseDot, ManifestCard, IdTab } from "@/components/manifest/Manifest";
import { BOUNTIES } from "@/data/mock";

const STATES = ["paid", "expired", "refunded", "disputed"] as const;
type HState = (typeof STATES)[number];

const STATE_LABEL: Record<HState, string> = {
  paid: "PAID",
  expired: "EXPIRED",
  refunded: "REFUNDED",
  disputed: "DISPUTED",
};

export default function PosterHistory() {
  const [filter, setFilter] = useState<HState | "all">("all");
  const all = BOUNTIES.filter((b) => STATES.includes(b.state as HState));
  const list = filter === "all" ? all : all.filter((b) => b.state === filter);

  const counts = STATES.reduce<Record<HState, number>>((acc, s) => {
    acc[s] = all.filter((b) => b.state === s).length;
    return acc;
  }, { paid: 0, expired: 0, refunded: 0, disputed: 0 });

  const totalSpent = all
    .filter((b) => b.state === "paid")
    .reduce((s, b) => s + b.amount, 0);
  const totalRefunded = all
    .filter((b) => b.state === "refunded")
    .reduce((s, b) => s + b.amount, 0);

  return (
    <DashboardLayout
      role="poster"
      title="History."
      subtitle="Closed bounties — settled, expired, refunded, or disputed. Your full audit trail."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border-2 border-ink p-5">
          <MonoLabel ink className="block">SETTLED · USDT OUT</MonoLabel>
          <div className="font-display font-medium text-[36px] mt-2 tabular-nums">{totalSpent}</div>
        </div>
        <div className="border-2 border-ink p-5">
          <MonoLabel ink className="block">REFUNDED · BACK TO YOU</MonoLabel>
          <div className="font-display font-medium text-[36px] mt-2 tabular-nums">{totalRefunded}</div>
        </div>
        <div className="border-2 border-ink p-5">
          <MonoLabel ink className="block">CLOSED BOUNTIES</MonoLabel>
          <div className="font-display font-medium text-[36px] mt-2 tabular-nums">{all.length}</div>
        </div>
        <div className="border-2 border-ink p-5">
          <MonoLabel ink className="block">DISPUTES OPENED</MonoLabel>
          <div className="font-display font-medium text-[36px] mt-2 tabular-nums">{counts.disputed}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`mono-small h-8 px-3 border ${filter === "all" ? "bg-ink text-paper border-ink" : "border-ink/40 hover:bg-hairline"}`}
        >
          ALL · {all.length}
        </button>
        {STATES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`mono-small h-8 px-3 border ${filter === s ? "bg-ink text-paper border-ink" : "border-ink/40 hover:bg-hairline"}`}
          >
            {STATE_LABEL[s]} · {counts[s]}
          </button>
        ))}
      </div>

      <ManifestCard idTab={<IdTab variant="ink">LEDGER</IdTab>} formFooter="CLOSED BOUNTY HISTORY">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left p-4 mono-small">ID</th>
                <th className="text-left p-4 mono-small">BOUNTY</th>
                <th className="text-left p-4 mono-small">STATE</th>
                <th className="text-right p-4 mono-small">AMOUNT</th>
                <th className="text-right p-4 mono-small">CLOSED</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id} className="border-b border-hairline hover:bg-hairline/30">
                  <td className="p-4"><span className="mono-inline">{b.shortId}</span></td>
                  <td className="p-4">
                    <Link to={`/bounties/${b.id}`} className="font-display font-medium hover:text-cobalt">{b.title}</Link>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <PulseDot state={b.state === "expired" || b.state === "refunded" ? "ink" : b.state} />
                      <Tag variant={b.state === "paid" ? "lime" : b.state === "disputed" ? "magenta" : "ink"}>
                        {STATE_LABEL[b.state as HState]}
                      </Tag>
                    </div>
                  </td>
                  <td className="p-4 text-right tabular-nums">{b.amount} USDT</td>
                  <td className="p-4 text-right mono-small text-muted-ink">{b.createdAgo}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center mono-small text-muted-ink">NO ENTRIES</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </ManifestCard>
    </DashboardLayout>
  );
}
