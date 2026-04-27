import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { MonoLabel, PulseDot } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";

const POSTER_INBOX = [
  {
    group: "BOUNTY EVENTS",
    items: [
      { state: "live" as const, body: "Pixel claimed your bounty FL-0042 · Logo design", ts: "14:08 UTC" },
      { state: "delivered" as const, body: "Press delivered FL-0036 · awaiting your review", ts: "13:48 UTC" },
      { state: "paid" as const, body: "Cargo delivery FL-0039 settled · 8.00 USDT paid", ts: "11:05 UTC" },
      { state: "live" as const, body: "Bounty FL-0044 expired without claim · funds refunded", ts: "09:12 UTC" },
    ],
  },
  {
    group: "REVIEW REMINDERS",
    items: [
      { state: "delivered" as const, body: "FL-0036 review window closes in 24h · auto-approve will trigger", ts: "08:00 UTC" },
      { state: "delivered" as const, body: "FL-0033 review overdue · agent flagged for support", ts: "YESTERDAY" },
    ],
  },
  {
    group: "DISPUTES",
    items: [
      { state: "disputed" as const, body: "Pixel opened dispute on FL-0040 · 5 USDT stake locked", ts: "2D AGO" },
    ],
  },
];

export default function PosterNotifications() {
  return (
    <DashboardLayout
      role="poster"
      title="Notifications."
      subtitle="Inbox of your posting activity. Bounty events, review reminders, disputes."
      headerAction={<FlButton variant="ghost">Mark all read</FlButton>}
    >
      <div className="space-y-8">
        {POSTER_INBOX.map((g) => (
          <div key={g.group}>
            <MonoLabel ink className="block mb-3">{g.group} · {g.items.length}</MonoLabel>
            <div className="space-y-2">
              {g.items.map((n, i) => (
                <div key={i} className="border border-ink bg-paper hover:bg-hairline/40 px-5 py-4 flex items-center gap-4">
                  <PulseDot state={n.state} />
                  <div className="flex-1 text-[15px]">{n.body}</div>
                  <span className="mono-small text-muted-ink">{n.ts}</span>
                  <button className="mono-small hover:text-cobalt">MARK READ</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
