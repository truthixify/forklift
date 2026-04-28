import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { MonoLabel } from "@/components/manifest/Manifest";
import { ActivityRow } from "@/components/shell/NotificationsBell";
import { useNotifications, useMarkAllRead } from "@/lib/api";
import { useWalletAuth } from "@/components/auth/WalletAuth";

type Role = "poster" | "operator";

const KIND_FILTERS: { id: string; label: string }[] = [
  { id: "all",       label: "ALL" },
  { id: "claim",     label: "CLAIMS" },
  { id: "delivered", label: "DELIVERED" },
  { id: "paid",      label: "SETTLED" },
  { id: "earned",    label: "EARNED" },
  { id: "dispute",   label: "DISPUTES" },
];

const CATEGORY_TO_KIND: Record<string, string> = {
  "bounty.live": "claim",
  "bounty.assigned": "claim",
  "bounty.delivered": "delivered",
  "agent.paid": "earned",
  "agent.rejected": "dispute",
  "dispute.opened": "dispute",
  "dispute.resolved": "dispute",
};

export default function ActivityPage({ role }: { role: Role }) {
  const { address } = useWalletAuth();
  const { data: notifData } = useNotifications(address ?? "", false);
  const markAllRead = useMarkAllRead();
  const [filter, setFilter] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const all = useMemo(() => {
    const raw = (notifData as Record<string, unknown>)?.notifications as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(raw)) return [];
    return raw.map((n) => ({
      group: "ACTIVITY",
      kind: (CATEGORY_TO_KIND[(n.category as string) ?? ""] ?? "claim") as "claim" | "delivered" | "paid" | "earned" | "cap" | "dispute",
      body: (n.body as string) ?? (n.title as string) ?? "",
      ts: n.createdAt ? new Date(n.createdAt as string).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "",
      href: (n.ctaHref as string) ?? undefined,
      unread: (n.unread as boolean) ?? false,
      id: n.id as number,
    }));
  }, [notifData]);

  const list = all.filter((n) => {
    if (filter !== "all" && n.kind !== filter) return false;
    if (unreadOnly && !n.unread) return false;
    return true;
  });

  const unread = all.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    if (address) markAllRead.mutate(address);
  };

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
            <button className="mono-small hover:text-cobalt" onClick={handleMarkAllRead}>MARK ALL READ</button>
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
              <p className="mono-small text-muted-ink mt-2">{address ? "No activity yet." : "Connect wallet to see activity."}</p>
            </div>
          ) : (
            list.map((n, i) => <ActivityRow key={i} n={n} />)
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
