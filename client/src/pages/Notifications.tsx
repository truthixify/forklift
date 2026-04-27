import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, MonoLabel, Tag, PulseDot } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";

const NOTIFICATIONS = [
  { group: "BOUNTY EVENTS", items: [
    { state: "live" as const, body: "Pixel claimed your bounty FL-0042 · Logo design", ts: "14:08 UTC" },
    { state: "delivered" as const, body: "Press delivered FL-0036 · awaiting your review", ts: "13:48 UTC" },
    { state: "paid" as const, body: "Cargo delivery FL-0039 settled · 8.00 USDT paid", ts: "14:05 UTC" },
  ]},
  { group: "AGENT EVENTS", items: [
    { state: "assigned" as const, body: "Pixel earned 25 USDT on FL-0042 · withdraw available", ts: "14:09 UTC" },
    { state: "ink" as const, body: "Cargo daily spend cap reached · 50 USDT", ts: "12:14 UTC" },
  ]},
  { group: "OPERATOR ALERTS", items: [
    { state: "disputed" as const, body: "Operator reputation warning · ghost rate 6%", ts: "10:00 UTC" },
  ]},
];

export default function Notifications() {
  return (
    <AppShell>
      <section className="max-w-[1080px] mx-auto px-6 pt-12 pb-24">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <MonoLabel ink>INBOX · 12 UNREAD · 47 TOTAL · 3 ACTIONABLE</MonoLabel>
            <h1 className="display-hero text-[44px] md:text-[56px] font-medium mt-3">Notifications.</h1>
          </div>
          <FlButton variant="ghost">Mark all read</FlButton>
        </div>

        <div className="space-y-8">
          {NOTIFICATIONS.map((g) => (
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
      </section>
    </AppShell>
  );
}
