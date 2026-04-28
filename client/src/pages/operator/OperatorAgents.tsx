import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, StatusBand, MonoLabel, Monogram } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMyAgents } from "@/lib/api";
import { useWalletAuth } from "@/components/auth/WalletAuth";
import type { Agent } from "@/data/mock";
import { ArrowRight } from "lucide-react";

type Filter = "all" | "active" | "paused" | "probation";

type CapState = Record<string, { perTask: string; daily: string; active: boolean }>;

export default function OperatorAgents() {
  const nav = useNavigate();
  const { address } = useWalletAuth();
  const { data: agentsData, isLoading } = useMyAgents(address ?? "");
  const rawAg = agentsData as Record<string, unknown> | undefined; const mine: Agent[] = Array.isArray(rawAg) ? rawAg : Array.isArray(rawAg?.agents) ? rawAg.agents as Agent[] : [];
  const [filter, setFilter] = useState<Filter>("all");

  const [caps, setCaps] = useState<CapState>({});

  useEffect(() => {
    if (mine.length > 0 && Object.keys(caps).length === 0) {
      setCaps(Object.fromEntries(mine.map((a) => [a.id, { perTask: "2.50", daily: "50.00", active: a.active }])));
    }
  }, [mine, caps]);

  const [retuneId, setRetuneId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ perTask: "2.50", daily: "50.00" });

  const agentActive = (a: Agent) => caps[a.id]?.active ?? a.active;

  const list = mine.filter((a) => {
    const isActive = agentActive(a);
    if (filter === "active") return isActive && !a.probation;
    if (filter === "paused") return !isActive;
    if (filter === "probation") return a.probation;
    return true;
  });

  const count = (f: Filter) => {
    if (f === "active") return mine.filter((a) => agentActive(a) && !a.probation).length;
    if (f === "paused") return mine.filter((a) => !agentActive(a)).length;
    if (f === "probation") return mine.filter((a) => a.probation).length;
    return mine.length;
  };

  const openRetune = (id: string) => {
    const c = caps[id];
    setDraft({ perTask: c.perTask, daily: c.daily });
    setRetuneId(id);
  };

  const saveRetune = () => {
    if (!retuneId) return;
    setCaps((prev) => ({ ...prev, [retuneId]: { ...prev[retuneId], ...draft } }));
    setRetuneId(null);
  };

  const togglePause = (id: string) => {
    setCaps((prev) => ({ ...prev, [id]: { ...prev[id], active: !prev[id].active } }));
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
        {(["all", "active", "paused", "probation"] as Filter[]).map((f) => (
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
          const state = caps[a.id] ?? { perTask: "2.50", daily: "50.00", active: a.active };
          const isActive = state.active;
          const cap = parseFloat(state.perTask) || 2.5;
          const spend = 1.2 + (a.rating ?? 4) * 0.15;
          const pct = Math.min(100, (spend / cap) * 100);
          const near = pct > 70;
          const detailHref = `/dashboard/operator/agents/${a.id}`;

          return (
            <div
              key={a.id}
              role="link"
              tabIndex={0}
              onClick={() => nav(detailHref)}
              onKeyDown={(e) => { if (e.key === "Enter") nav(detailHref); }}
              className="cursor-pointer group focus:outline-none"
            >
              <ManifestCard
                idTab={<IdTab variant="ink">AGENT · {a.wallet}</IdTab>}
                formFooter={`AGENT · ${a.handle.toUpperCase()}`}
              >
                <StatusBand state={a.probation ? "disputed" : isActive ? "assigned" : "ink"}>
                  {a.probation ? "PROBATION · GHOST WATCH" : isActive ? "ACTIVE · WORKING" : "PAUSED"}
                </StatusBand>
                <div className="p-6 transition-colors group-hover:bg-hairline/20">
                  <div className="flex items-start gap-4">
                    <Monogram letter={a.monogram} size={56} variant="ink" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-medium text-[24px] leading-tight truncate group-hover:underline underline-offset-4">{a.handle}</h3>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <MonoLabel className="block mt-1">{a.specializations[0]}</MonoLabel>
                    </div>
                    <div className="text-right">
                      <MonoLabel>TODAY</MonoLabel>
                      <div className="font-display font-medium text-[20px]">+{(a.earnings * 0.012).toFixed(2)} USDT</div>
                    </div>
                  </div>
                  <div className="hairline my-4" />
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div><MonoLabel className="block">PAID</MonoLabel><span className="mono-inline">{a.paid}</span></div>
                    <div><MonoLabel className="block">RATING</MonoLabel><span className="mono-inline">{a.rating}★</span></div>
                    <div><MonoLabel className="block">EARNED</MonoLabel><span className="mono-inline">{a.earnings.toFixed(0)}</span></div>
                  </div>
                  <MonoLabel className="block mb-2">TASK SPEND CAP · {spend.toFixed(2)} / {cap.toFixed(2)} USDT</MonoLabel>
                  <div className="h-3 bg-paper border border-ink relative">
                    <div className={`absolute inset-y-0 left-0 ${near ? "bg-alarm" : "bg-hivis"}`} style={{ width: `${pct}%` }} />
                  </div>

                  {/* Action row — stop propagation so clicks don't trigger card nav */}
                  <div
                    className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FlButton variant="cobalt" size="sm">Withdraw</FlButton>
                    <FlButton variant="secondary" size="sm" onClick={() => togglePause(a.id)}>
                      {isActive ? "Pause" : "Resume"}
                    </FlButton>
                    <FlButton variant="ghost" size="sm" onClick={() => openRetune(a.id)}>Retune cap</FlButton>
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
