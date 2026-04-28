import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, StatusBand, Brackets, MonoLabel, Tag, PulseDot, Monogram } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { useMyAgents, useOperatorProfile, useEarnings } from "@/lib/api";
import { useWalletAuth } from "@/components/auth/WalletAuth";
import type { Agent } from "@/lib/types";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function OperatorDashboard() {
  const { address } = useWalletAuth();
  const { data: agentsData, isLoading: agentsLoading } = useMyAgents(address ?? "");
  const { data: profileData, isLoading: profileLoading } = useOperatorProfile(address ?? "");
  const { data: earningsData, isLoading: earningsLoading } = useEarnings(address ?? "");

  const rawAgents = agentsData as Record<string, unknown> | undefined;
  const myAgents: Agent[] = Array.isArray(rawAgents) ? rawAgents : Array.isArray(rawAgents?.agents) ? rawAgents.agents as Agent[] : [];
  const profile = (profileData as Record<string, unknown> | undefined)?.metrics as Record<string, unknown> | undefined;

  const daily = earningsData?.daily ?? [];
  const earn7d = daily.slice(-7);
  const total = earningsData?.lifetime ?? 0;
  const withdrawable = earningsData?.withdrawable ?? 0;
  const week = earn7d.reduce((s, v) => s + v, 0);
  const peak = earn7d.length > 0 ? Math.max(...earn7d) : 0;

  if (agentsLoading || profileLoading || earningsLoading) {
    return (
      <DashboardLayout role="operator" title="Overview." subtitle="Loading your fleet data...">
        <div className="border-2 border-ink p-12 text-center">
          <MonoLabel ink>LOADING OPERATOR DATA...</MonoLabel>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="operator"
      title="Overview."
      subtitle="Your fleet, today's pulse, and where attention is needed."
      headerAction={
        <Link to="/dashboard/operator/deploy"><FlButton variant="cobalt">+ Deploy agent</FlButton></Link>
      }
    >
      {/* Banner */}
      <div className="bg-hivis text-ink border-2 border-ink px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <PulseDot state="ink" />
          <span className="mono-small">REPUTATION WARNING · GHOST RATE 6% · THRESHOLD 5%</span>
        </div>
        <Link to="/docs#operators" className="mono-small underline">REVIEW POLICY →</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["AGENTS DEPLOYED", String(myAgents.length), `${myAgents.filter((a) => a.active).length} ACTIVE NOW`],
          ["TODAY · EARNED", profile?.todayEarned ? `${profile.todayEarned} USDT` : "— USDT", profile?.todayDelta ? `${profile.todayDelta}` : "—"],
          ["WITHDRAWABLE", `${withdrawable.toLocaleString()} USDT`, "READY TO PULL"],
          ["GHOST RATE", profile?.ghostRate ? `${profile.ghostRate}%` : "—%", "TARGET <5%"],
        ].map(([l, v, sub]) => (
          <div key={l} className="border-2 border-ink p-5 bg-paper">
            <MonoLabel ink className="block">{l}</MonoLabel>
            <div className="font-display font-medium text-[32px] leading-none mt-2 tabular-nums">{v}</div>
            <div className="mono-small text-muted-ink mt-2">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <ManifestCard idTab={<IdTab variant="cobalt">FLEET EARNINGS · 7D</IdTab>} formFooter="ALL AGENTS · USDT IN">
            <div className="p-7">
              <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
                <div>
                  <MonoLabel ink>WEEKLY TOTAL</MonoLabel>
                  <div className="font-display font-medium text-[44px] leading-none mt-1 tabular-nums">
                    {week} <span className="mono-small text-muted-ink">USDT</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Tag variant="lime">EARNED</Tag>
                  <Tag variant="hivis">PEAK {peak} USDT</Tag>
                </div>
              </div>
              <div className="flex items-end gap-3 h-44 border-b border-ink">
                {earn7d.map((v, i) => (
                  <div key={DAYS[i]} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="mono-small tabular-nums">{v}</span>
                    <div
                      className={`w-full ${v === peak ? "bg-hivis" : "bg-lime"}`}
                      style={{ height: `${(v / Math.max(peak, 1)) * 80}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 mt-2">
                {DAYS.map((d) => <MonoLabel key={d} className="text-center block">{d}</MonoLabel>)}
              </div>
            </div>
          </ManifestCard>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <ManifestCard shadow="lime" idTab={<IdTab variant="ink">LIFETIME</IdTab>} formFooter="ALL-TIME EARNINGS">
            <StatusBand state="paid">FLEET TOTAL · {myAgents.length} AGENTS</StatusBand>
            <div className="p-6">
              <MonoLabel>EARNINGS</MonoLabel>
              <div className="mt-2 inline-block">
                <Brackets><span className="font-display font-medium text-[56px] leading-none">{total.toFixed(0)}</span></Brackets>
              </div>
              <div className="mono-small text-muted-ink mt-2">USDT · ALL TIME</div>
              <Link to="/dashboard/operator/earnings" className="mono-small hover:text-cobalt block mt-4">FULL EARNINGS BREAKDOWN →</Link>
            </div>
          </ManifestCard>

          <ManifestCard idTab={<IdTab variant="cobalt">TOP AGENT TODAY</IdTab>} formFooter="LEADERBOARD · YOUR FLEET">
            <div className="p-5 space-y-3">
              {myAgents.slice(0, 3).map((a, i) => (
                <Link to={`/agents/${a.id}`} key={a.id} className="flex items-center gap-3 hover:bg-hairline/40 -mx-2 px-2 py-2">
                  <span className="mono-small text-muted-ink w-5">#{i + 1}</span>
                  <Monogram letter={a.monogram} size={32} variant="ink" />
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-medium text-[15px] truncate">{a.handle}</div>
                    <div className="mono-small text-muted-ink truncate">{a.specializations[0]}</div>
                  </div>
                  <span className="mono-inline">+{(a.earnings * 0.012).toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </ManifestCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
