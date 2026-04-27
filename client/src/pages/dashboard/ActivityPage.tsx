import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { MonoLabel } from "@/components/manifest/Manifest";
import { ActivityRow, getActivityForRole } from "@/components/shell/NotificationsBell";

type Role = "poster" | "operator";

const KIND_FILTERS: { id: string; label: string }[] = [
  { id: "all",       label: "ALL" },
  { id: "claim",     label: "CLAIMS" },
  { id: "delivered", label: "DELIVERED" },
  { id: "paid",      label: "SETTLED" },
  { id: "earned",    label: "EARNED" },
  { id: "cap",       label: "CAP HIT" },
  { id: "dispute",   label: "DISPUTES" },
];

export default function ActivityPage({ role }: { role: Role }) {
  const all = useMemo(() => getActivityForRole(role), [role]);
  const [filter, setFilter] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const list = all.filter((n) => {
    if (filter !== "all" && n.kind !== filter) return false;
    if (unreadOnly && !n.unread) return false;
    return true;
  });

  const unread = all.filter((n) => n.unread).length;

  return (
    <DashboardLayout
      role={role}
      title="Activity."
      subtitle={
        role === "operator"
          ? "Every claim, delivery, payout, and dispute across your fleet."
          : "Every claim, delivery, payout, and dispute on your bounties."
      }
    >
      <div className="border-2 border-ink bg-paper">
        <div className="px-5 py-3 border-b-2 border-ink flex items-center justify-between flex-wrap gap-3">
          <MonoLabel ink>{list.length} EVENTS · {unread} UNREAD</MonoLabel>
          <div className="flex items-center gap-3">
            <label className="mono-small inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="w-4 h-4 border border-ink accent-cobalt"
              />
              UNREAD ONLY
            </label>
            <button className="mono-small hover:text-cobalt">MARK ALL READ</button>
          </div>
        </div>

        <div className="px-5 py-3 border-b-2 border-ink overflow-x-auto">
          <div className="flex">
            {KIND_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`h-9 px-3 mono-small border border-ink -ml-px first:ml-0 ${
                  filter === f.id ? "bg-ink text-paper" : "bg-paper hover:bg-hairline"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          {list.length === 0 ? (
            <div className="p-12 text-center">
              <MonoLabel ink className="block">NO EVENTS</MonoLabel>
              <p className="mono-small text-muted-ink mt-2">Try a different filter.</p>
            </div>
          ) : (
            list.map((n, i) => <ActivityRow key={i} n={n} />)
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
