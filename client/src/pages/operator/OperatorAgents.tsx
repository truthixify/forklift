import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, StatusBand, MonoLabel, Monogram } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMyAgents, usePauseAgent, useResumeAgent, useUpdateSpendCaps, useWithdrawEarnings } from "@/lib/api";
import { useWalletAuth } from "@/components/auth/WalletAuth";
import type { Agent } from "@/lib/types";
import { ArrowRight } from "lucide-react";

type Filter = "all" | "active" | "paused" | "retired";

type CapState = Record<string, { perTask: string; daily: string; active: boolean }>;

export default function OperatorAgents() {
  const nav = useNavigate();
  const { address } = useWalletAuth();
  const { data: agentsData, isLoading } = useMyAgents(address ?? "");
  const mine: Agent[] = useMemo(() => {
    const rawAg = agentsData as Record<string, unknown> | undefined;
    const arr = Array.isArray(rawAg) ? rawAg : Array.isArray(rawAg?.agents) ? rawAg.agents as Agent[] : [];
    return arr as Agent[];
  }, [agentsData]);
  const [filter, setFilter] = useState<Filter>("all");

  const [caps, setCaps] = useState<CapState>({});

  useEffect(() => {
    if (mine.length > 0 && Object.keys(caps).length === 0) {
      setCaps(Object.fromEntries(mine.map((a) => [a.id, { perTask: "2.50", daily: "50.00", active: a.active }])));
    }
  }, [mine, caps]);

  const pauseAgent = usePauseAgent();
  const resumeAgent = useResumeAgent();
  const updateCapsApi = useUpdateSpendCaps();
  const withdrawApi = useWithdrawEarnings();
  const [retuneId, setRetuneId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ perTask: "2.50", daily: "50.00" });

  const agentStatus = (a: Agent) => {
    const ext = a as Agent & { status?: string };
    return ext.status ?? (a.active ? 'active' : 'paused');
  };

  const list = mine.filter((a) => {
    const s = agentStatus(a);
    if (filter === "active") return s === 'active';
    if (filter === "paused") return s === 'paused';
    if (filter === "retired") return s === 'retired';
    return true;
  });

  const count = (f: Filter) => {
    if (f === "active") return mine.filter((a) => agentStatus(a) === 'active').length;
    if (f === "paused") return mine.filter((a) => agentStatus(a) === 'paused').length;
    if (f === "retired") return mine.filter((a) => agentStatus(a) === 'retired').length;
    return mine.length;
  };

  const openRetune = (id: string) => {
    const c = caps[id];
    setDraft({ perTask: c.perTask, daily: c.daily });
    setRetuneId(id);
  };

  const saveRetune = () => {
    if (!retuneId) return;
    updateCapsApi.mutate({
      address: retuneId,
      perTaskUSDT: String(BigInt(Math.round(parseFloat(draft.perTask) * 1e18))),
      globalDailyUSDT: String(BigInt(Math.round(parseFloat(draft.daily) * 1e18))),
    });
    setRetuneId(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="operator" title="My agents." subtitle="Loading your fleet...">
        <div className="border-2 border-ink p-12 text-center">
          <MonoLabel ink>LOADING AGENTS...</MonoLabel>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="operator"
      title="My agents."
      subtitle="Manage your fleet — pause, withdraw, retune spend caps, or deploy a new worker."
      headerAction={<Link to="/dashboard/operator/deploy"><FlButton variant="cobalt">+ Deploy agent</FlButton></Link>}
    >
      <div className="flex flex-wrap gap-2">
        {(["all", "active", "paused", "retired"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`mono-small h-9 px-4 border ${filter === f ? "bg-ink text-paper border-ink" : "border-ink/40 hover:bg-hairline"}`}
          >
            {f.toUpperCase()} · {count(f)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {list.map((a) => {
          const todaySpend = (a as any).todaySpend ?? 0;
          const capObj = (a as any).spendCaps ?? {};
          const capPerTask = capObj.perTaskUSDT ? Number(BigInt(capObj.perTaskUSDT)) / 1e18 : 2.5;
          const isActive = agentStatus(a) === 'active';
          const cap = capPerTask;
          const pct = cap > 0 ? Math.min(100, (todaySpend / cap) * 100) : 0;
          const near = pct > 70;
          const detailHref = `/dashboard/operator/agents/${a.id}`;

          return (
            <div key={a.id} className="group">
              <ManifestCard
                idTab={<IdTab variant="ink">AGENT · {a.wallet ?? a.id}</IdTab>}
                formFooter={`AGENT · ${(a.handle ?? "AGENT").toUpperCase()}`}
              >
                <StatusBand state={agentStatus(a) === 'retired' ? "disputed" : isActive ? "assigned" : "ink"}>
                  {agentStatus(a) === 'retired' ? "RETIRED" : isActive ? (a.paid < 3 ? "ACTIVE · NEW" : "ACTIVE") : "PAUSED"}
                </StatusBand>
                <div className="p-6 transition-colors group-hover:bg-hairline/20">
                  <div className="flex items-start gap-4">
                    <Monogram letter={(a.monogram ?? a.handle?.charAt(0) ?? "A")} size={56} variant="ink" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={detailHref} className="font-display font-medium text-[24px] leading-tight truncate hover:underline underline-offset-4">{a.handle ?? "Agent"}</Link>
                        <Link to={detailHref}><ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" /></Link>
                      </div>
                      <MonoLabel className="block mt-1">{a.specializations[0]}</MonoLabel>
                    </div>
                    <div className="text-right">
                      <MonoLabel>TODAY</MonoLabel>
                      <div className="font-display font-medium text-[20px]">+{todaySpend.toFixed(2)} USDT</div>
                    </div>
                  </div>
                  <div className="hairline my-4" />
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div><MonoLabel className="block">PAID</MonoLabel><span className="mono-inline">{a.paid}</span></div>
                    <div><MonoLabel className="block">RATING</MonoLabel><span className="mono-inline">{a.rating}★</span></div>
                    <div><MonoLabel className="block">EARNED</MonoLabel><span className="mono-inline">{a.earnings.toFixed(0)}</span></div>
                  </div>
                  <MonoLabel className="block mb-2">TASK SPEND CAP · {todaySpend.toFixed(2)} / {cap.toFixed(2)} USDT</MonoLabel>
                  <div className="h-3 bg-paper border border-ink relative">
                    <div className={`absolute inset-y-0 left-0 ${near ? "bg-alarm" : "bg-hivis"}`} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <FlButton variant="cobalt" size="sm" onClick={() => address && withdrawApi.mutate({ address: a.id, operatorAddress: address, amount: String(a.earnings) })}>
                      {withdrawApi.isPending ? "..." : "Withdraw"}
                    </FlButton>
                    <FlButton variant="secondary" size="sm" onClick={() => isActive ? pauseAgent.mutate(a.wallet ?? a.id) : resumeAgent.mutate(a.wallet ?? a.id)}>
                      {pauseAgent.isPending || resumeAgent.isPending ? "..." : isActive ? "Pause" : "Resume"}
                    </FlButton>
                    <FlButton variant="ghost" size="sm" onClick={() => { const ext = a as any; setDraft({ perTask: (ext.spendCaps?.perTaskUSDT ? (Number(BigInt(ext.spendCaps.perTaskUSDT)) / 1e18).toFixed(2) : "2.50"), daily: (ext.spendCaps?.globalDailyUSDT ? (Number(BigInt(ext.spendCaps.globalDailyUSDT)) / 1e18).toFixed(2) : "50.00") }); setRetuneId(a.id); }}>Retune cap</FlButton>
                    <FlButton variant="ghost" size="sm" onClick={() => nav(detailHref)}>Manage →</FlButton>
                  </div>
                </div>
              </ManifestCard>
            </div>
          );
        })}

        {list.length === 0 && (
          <div className="lg:col-span-2 border-2 border-dashed border-ink/30 p-12 text-center">
            <MonoLabel ink className="block">NO AGENTS IN THIS VIEW</MonoLabel>
            <p className="mono-small text-muted-ink mt-2">Deploy your first agent to start earning.</p>
            <Link to="/dashboard/operator/deploy" className="inline-block mt-4">
              <FlButton variant="cobalt">+ Deploy agent</FlButton>
            </Link>
          </div>
        )}
      </div>

      <div className="border-t-2 border-ink pt-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <MonoLabel ink>FLEET TIPS</MonoLabel>
          <p className="text-[14px] mt-1 max-w-[60ch]">
            Keep ghost rate under 5% to stay off probation. Tighter spend caps reduce loss when an
            agent misbehaves. Withdraw earnings weekly to reduce custodial risk.
          </p>
        </div>
        <Link to="/docs#operators"><FlButton variant="ghost">Read operator playbook →</FlButton></Link>
      </div>

      <Dialog open={!!retuneId} onOpenChange={(o) => !o && setRetuneId(null)}>
        <DialogContent className="bg-paper border-2 border-ink rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-medium text-[24px]">Retune spend caps</DialogTitle>
            <DialogDescription className="mono-small text-muted-ink">
              CHANGES APPLY IMMEDIATELY · AGENT WILL HONOR NEW LIMITS ON NEXT TASK
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <FlInput
              label="MAX SPEND PER TASK"
              unit="USDT"
              type="number"
              step="0.01"
              value={draft.perTask}
              onChange={(e) => setDraft((d) => ({ ...d, perTask: e.target.value }))}
            />
            <FlInput
              label="DAILY CAP"
              unit="USDT"
              type="number"
              step="0.01"
              value={draft.daily}
              onChange={(e) => setDraft((d) => ({ ...d, daily: e.target.value }))}
            />
          </div>
          <DialogFooter className="mt-4 gap-2">
            <FlButton variant="secondary" onClick={() => setRetuneId(null)}>Cancel</FlButton>
            <FlButton variant="cobalt" onClick={saveRetune}>Save caps</FlButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
