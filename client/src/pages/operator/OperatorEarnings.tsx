import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, StatusBand, Brackets, MonoLabel, Tag, Monogram } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { useMyAgents, useWithdrawEarnings, useEarnings } from "@/lib/api";
import { useWalletAuth } from "@/components/auth/WalletAuth";
import type { Agent } from "@/data/mock";

export default function OperatorEarnings() {
  const { address } = useWalletAuth();
  const { data: agentsData, isLoading: agentsLoading } = useMyAgents(address ?? "");
  const { data: earningsData, isLoading: earningsLoading } = useEarnings(address ?? "");
  const withdrawMutation = useWithdrawEarnings();

  const mine = (agentsData as Agent[] | undefined) ?? [];
  const daily = earningsData?.daily ?? [];
  const lifetime = earningsData?.lifetime ?? 0;
  const withdrawable = earningsData?.withdrawable ?? 0;
  const perAgent = earningsData?.perAgent ?? [];
  const month = daily.reduce((s, v) => s + v, 0);
  const peak = daily.length > 0 ? Math.max(...daily) : 0;

  const withdrawals = [
    { id: "WX-0019", ts: "2026-04-22 14:08", amount: 1200, status: "settled" as const, tx: "0x91A2…77F4" },
    { id: "WX-0018", ts: "2026-04-15 11:42", amount: 980, status: "settled" as const, tx: "0x44C1…8B12" },
    { id: "WX-0017", ts: "2026-04-08 09:11", amount: 2104, status: "settled" as const, tx: "0xDD7E…22A6" },
    { id: "WX-0016", ts: "2026-04-01 16:33", amount: 740, status: "settled" as const, tx: "0xAB31…0044" },
  ];

  if (agentsLoading || earningsLoading) {
    return (
      <DashboardLayout role="operator" title="Earnings." subtitle="Loading earnings data...">
        <div className="border-2 border-ink p-12 text-center">
          <MonoLabel ink>LOADING EARNINGS...</MonoLabel>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="operator"
      title="Earnings."
      subtitle="What your fleet has earned, what's withdrawable, and your settlement history."
    >
      {/* Withdraw card */}
      <ManifestCard shadow="lime" idTab={<IdTab variant="ink">WITHDRAWABLE BALANCE</IdTab>} formFooter="ESCROW · USDT BASE">
        <StatusBand state="paid">SETTLED INTO YOUR OPERATOR WALLET</StatusBand>
        <div className="p-7 grid grid-cols-12 gap-6 items-center">
          <div className="col-span-12 md:col-span-7">
            <MonoLabel>AVAILABLE NOW</MonoLabel>
            <div className="mt-2 inline-block">
              <Brackets><span className="font-display font-medium text-[72px] leading-none tabular-nums">{withdrawable.toLocaleString()}</span></Brackets>
            </div>
            <div className="mono-small text-muted-ink mt-2">USDT · NET OF FEES · WALLET 0x91A2…77F4</div>
          </div>
          <div className="col-span-12 md:col-span-5 md:text-right space-y-3">
            <FlButton
              variant="cobalt"
              size="lg"
              onClick={() => {
                if (!address || withdrawable <= 0) return;
                withdrawMutation.mutate({
                  address: mine[0]?.wallet ?? "",
                  operatorAddress: address,
                  amount: String(withdrawable),
                });
              }}
            >
              {withdrawMutation.isPending ? "Sending tx…" : "Withdraw all"}
            </FlButton>
            <div className="mono-small text-muted-ink">GAS ESTIMATE · 0.00018 ETH</div>
          </div>
        </div>
      </ManifestCard>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["MONTH · IN", `${month} USDT`, "30D ROLLING"],
          ["LIFETIME · IN", `${lifetime.toLocaleString()} USDT`, "ALL AGENTS"],
          ["PEAK DAY", `${peak} USDT`, "BEST 24H"],
          ["AVG / DAY", `${daily.length > 0 ? (month / daily.length).toFixed(0) : 0} USDT`, "30D AVG"],
        ].map(([l, v, s]) => (
          <div key={l} className="border-2 border-ink p-5">
            <MonoLabel ink className="block">{l}</MonoLabel>
            <div className="font-display font-medium text-[28px] mt-2 tabular-nums">{v}</div>
            <div className="mono-small text-muted-ink mt-2">{s}</div>
          </div>
        ))}
      </div>

      {/* 30d chart */}
      <ManifestCard idTab={<IdTab variant="cobalt">DAILY EARNINGS · 30D</IdTab>} formFooter="USDT · NET OF FEES">
        <div className="p-7">
          <div className="flex items-end gap-1 h-40 border-b border-ink">
            {daily.map((v, i) => (
              <div
                key={i}
                className={`flex-1 ${v === peak ? "bg-hivis" : "bg-cobalt"}`}
                style={{ height: `${(v / Math.max(peak, 1)) * 100}%` }}
                title={`Day ${i + 1}: ${v} USDT`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 mono-small text-muted-ink">
            <span>30D AGO</span><span>15D AGO</span><span>TODAY</span>
          </div>
        </div>
      </ManifestCard>

      {/* Per-agent breakdown */}
      <ManifestCard idTab={<IdTab variant="ink">EARNINGS BY AGENT</IdTab>} formFooter="FLEET BREAKDOWN">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left p-4 mono-small">AGENT</th>
                <th className="text-left p-4 mono-small">SPEC</th>
                <th className="text-right p-4 mono-small">PAID</th>
                <th className="text-right p-4 mono-small">RATING</th>
                <th className="text-right p-4 mono-small">LIFETIME</th>
                <th className="text-right p-4 mono-small">SHARE</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((a) => {
                const agentEarnings = perAgent.find((pa) => pa.address === a.wallet)?.total ?? a.earnings;
                const share = (agentEarnings / Math.max(lifetime, 1)) * 100;
                return (
                  <tr key={a.id} className="border-b border-hairline hover:bg-hairline/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Monogram letter={a.monogram} size={28} variant="ink" />
                        <span className="font-display font-medium">{a.handle}</span>
                      </div>
                    </td>
                    <td className="p-4 mono-small text-muted-ink">{a.specializations[0]}</td>
                    <td className="p-4 text-right tabular-nums">{a.paid}</td>
                    <td className="p-4 text-right tabular-nums">{a.rating}★</td>
                    <td className="p-4 text-right tabular-nums">{agentEarnings.toFixed(0)} USDT</td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-20 h-2 bg-paper border border-ink relative">
                          <div className="absolute inset-y-0 left-0 bg-cobalt" style={{ width: `${share}%` }} />
                        </div>
                        <span className="mono-inline tabular-nums w-10 text-right">{share.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ManifestCard>

      {/* Withdrawals */}
      <ManifestCard idTab={<IdTab variant="ink">WITHDRAWAL HISTORY</IdTab>} formFooter="ON-CHAIN SETTLEMENTS">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left p-4 mono-small">ID</th>
                <th className="text-left p-4 mono-small">DATE</th>
                <th className="text-right p-4 mono-small">AMOUNT</th>
                <th className="text-left p-4 mono-small">TX</th>
                <th className="text-left p-4 mono-small">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-hairline hover:bg-hairline/30">
                  <td className="p-4 mono-inline">{w.id}</td>
                  <td className="p-4 mono-small">{w.ts}</td>
                  <td className="p-4 text-right tabular-nums">{w.amount} USDT</td>
                  <td className="p-4 mono-inline text-cobalt">{w.tx}</td>
                  <td className="p-4"><Tag variant="lime">SETTLED</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ManifestCard>
    </DashboardLayout>
  );
}
