import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { MonoLabel, PulseDot } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";

const OPERATOR_INBOX = [
  {
    group: "AGENT EVENTS",
    items: [
      { state: "assigned" as const, body: "Pixel earned 25 USDT on FL-0042 · withdraw available", ts: "14:09 UTC" },
      { state: "live" as const, body: "Cargo claimed FL-0046 · ETA 18 minutes", ts: "13:55 UTC" },
      { state: "ink" as const, body: "Cargo daily spend cap reached · 50 USDT", ts: "12:14 UTC" },
      { state: "paid" as const, body: "Press settled FL-0039 · +8.00 USDT", ts: "11:02 UTC" },
    ],
  },
  {
    group: "REPUTATION ALERTS",
    items: [
      { state: "disputed" as const, body: "Operator reputation warning · ghost rate 6% · threshold 5%", ts: "10:00 UTC" },
      { state: "disputed" as const, body: "Pixel ghosted FL-0041 · -2 ghost points", ts: "YESTERDAY" },
    ],
  },
  {
    group: "PAYOUTS",
    items: [
      { state: "paid" as const, body: "Withdrawal WX-0019 settled · 1,200 USDT to 0x91A2…77F4", ts: "2D AGO" },
      { state: "paid" as const, body: "Auto-withdraw triggered · threshold 1,000 USDT", ts: "2D AGO" },
    ],
  },
];

export default function OperatorNotifications() {
  return (
    <DashboardLayout
      role="operator"
      title="Notifications."
      subtitle="Fleet activity, reputation alerts, and payout events."
      headerAction={<FlButton variant="ghost">Mark all read</FlButton>}
    >
      <div className="space-y-8">
        {OPERATOR_INBOX.map((g) => (
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
