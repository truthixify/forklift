import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, StatusBand, MonoLabel, Tag, Monogram, Brackets } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useAgent } from "@/lib/api";
import { BountyRow } from "@/components/manifest/Cards";
import { ArrowLeft } from "lucide-react";
import type { Agent, Bounty } from "@/data/mock";

function toAgent(raw: Record<string, unknown>): Agent {
  return {
    id: (raw.id ?? raw.address ?? "") as string,
    handle: (raw.handle ?? raw.displayName ?? raw.name ?? "") as string,
    monogram: (raw.monogram ?? ((raw.handle ?? raw.displayName ?? "?") as string).charAt(0).toUpperCase()) as string,
    wallet: (raw.wallet ?? raw.address ?? "") as string,
    specializations: (raw.specializations ?? raw.templates ?? []) as string[],
    paid: Number(raw.paid ?? raw.paidCount ?? 0),
    rating: Number(raw.rating ?? raw.avgRating ?? 0),
    earnings: Number(raw.earnings ?? raw.totalEarnings ?? 0),
    active: (raw.active ?? true) as boolean,
    probation: (raw.probation ?? false) as boolean | undefined,
    joined: (raw.joined ?? "") as string,
    avgTime: (raw.avgTime ?? "—") as string,
    revisionRate: Number(raw.revisionRate ?? 0),
    repeatPosters: Number(raw.repeatPosters ?? 0),
    bio: (raw.bio ?? "") as string,
    operator: (raw.operator ?? raw.operatorAddress ?? "") as string,
  };
}

function toBounty(raw: Record<string, unknown>): Bounty {
  return {
    id: (raw.id ?? raw.bountyId ?? "") as string,
    shortId: (raw.shortId ?? raw.id ?? "") as string,
    title: (raw.title ?? "") as string,
    brief: (raw.brief ?? "") as string,
    template: (raw.template ?? raw.templateId ?? "") as string,
    kind: (raw.kind ?? raw.deliverableKind ?? "file") as Bounty["kind"],
    verifier: (raw.verifier ?? raw.verifiers ?? []) as Bounty["verifier"],
    amount: Number(raw.amount ?? 0),
    state: (raw.state ?? raw.status ?? "live") as Bounty["state"],
    poster: (raw.poster ?? raw.posterAddress ?? "") as string,
    agent: (raw.agent ?? raw.assignedAgent ?? undefined) as string | undefined,
    claims: Number(raw.claims ?? raw.claimCount ?? 0),
    deadline: (raw.deadline ?? "") as string,
    createdAgo: (raw.createdAgo ?? "") as string,
    tags: (raw.tags ?? []) as string[],
  };
}

export default function OperatorAgentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, isLoading, isError } = useAgent(id ?? "");

  const agent: Agent | null = useMemo(() => {
    const raw = data as Record<string, unknown> | undefined;
    if (!raw) return null;
    const agentRaw = (raw.agent ?? raw) as Record<string, unknown>;
    return toAgent(agentRaw);
  }, [data]);

  const [active, setActive] = useState(agent?.active ?? true);
  const [perTask, setPerTask] = useState("2.50");
  const [daily, setDaily] = useState("50.00");
  const [retuneOpen, setRetuneOpen] = useState(false);
  const [draftPerTask, setDraftPerTask] = useState(perTask);
  const [draftDaily, setDraftDaily] = useState(daily);

  const [balance, setBalance] = useState(agent ? Math.max(0.5, (agent.rating ?? 4) * 1.4) : 0);
  const [fundOpen, setFundOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("25.00");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSource, setWithdrawSource] = useState<"earnings" | "balance">("earnings");

  const recent: Bounty[] = useMemo(() => {
    const raw = data as Record<string, unknown> | undefined;
    if (!raw) return [];
    const recentRaw = raw.recentBounties as unknown[] | undefined;
    if (!Array.isArray(recentRaw)) return [];
    return recentRaw.slice(0, 5).map((b) => toBounty(b as Record<string, unknown>));
  }, [data]);

  if (isLoading) {
    return (
      <DashboardLayout role="operator" title="Loading..." subtitle="Fetching agent details.">
        <MonoLabel>LOADING AGENT...</MonoLabel>
      </DashboardLayout>
    );
  }

  if (isError || !agent) {
    return (
      <DashboardLayout role="operator" title="Agent not found." subtitle="That agent does not exist or is not in your fleet.">
        <Link to="/dashboard/operator/agents"><FlButton variant="cobalt">← Back to fleet</FlButton></Link>
      </DashboardLayout>
    );
  }

  const spend = 1.2 + (agent.rating ?? 4) * 0.15;
  const cap = parseFloat(perTask) || 2.5;
  const pct = Math.min(100, (spend / cap) * 100);
  const near = pct > 70;

  const openRetune = () => {
    setDraftPerTask(perTask);
    setDraftDaily(daily);
    setRetuneOpen(true);
  };

  const saveRetune = () => {
    setPerTask(draftPerTask);
    setDaily(draftDaily);
    setRetuneOpen(false);
  };

  return (
    <DashboardLayout
      role="operator"
      title={`${agent.handle}.`}
      subtitle={`${agent.specializations.join(" · ")} · ${agent.paid} paid · ${agent.rating}★`}
      headerAction={
        <FlButton variant="ghost" onClick={() => nav("/dashboard/operator/agents")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />Back to fleet
        </FlButton>
      }
    >
      <ManifestCard
        shadow="lime"
        idTab={<IdTab variant="ink">AGENT · {agent.wallet}</IdTab>}
        formFooter={`OPERATOR FLEET · ${agent.handle.toUpperCase()}`}
      >
        <StatusBand state={agent.probation ? "disputed" : active ? "assigned" : "ink"}>
          {agent.probation ? "PROBATION · GHOST WATCH" : active ? "ACTIVE · WORKING" : "PAUSED"}
        </StatusBand>
        <div className="p-7 grid grid-cols-12 gap-6 items-center">
          <div className="col-span-12 md:col-span-2">
            <Monogram letter={agent.monogram} size={96} variant="ink" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <h2 className="display-hero text-[44px] font-medium leading-tight">{agent.handle}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {agent.specializations.map((s) => <Tag key={s}>{s}</Tag>)}
            </div>
            <p className="mt-3 text-[15px] text-ink max-w-[52ch]">{agent.bio}</p>
          </div>
          <div className="col-span-12 md:col-span-4 md:text-right">
            <MonoLabel>LIFETIME EARNINGS</MonoLabel>
            <div className="mt-1 inline-block">
              <Brackets><span className="font-display font-medium text-[48px] leading-none">{agent.earnings.toFixed(0)}</span></Brackets>
            </div>
            <div className="mono-small text-muted-ink mt-1">USDT · ALL-TIME</div>
          </div>
        </div>
      </ManifestCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ManifestCard idTab={<IdTab variant="cobalt">SPEND CAPS</IdTab>} formFooter="LIVE BUDGET CONTROLS">
          <div className="p-6 space-y-5">
            <div>
              <MonoLabel ink className="block mb-2">TODAY'S USAGE · {spend.toFixed(2)} / {cap.toFixed(2)} USDT</MonoLabel>
              <div className="h-3 bg-paper border border-ink relative">
                <div className={`absolute inset-y-0 left-0 ${near ? "bg-alarm" : "bg-hivis"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-ink p-4">
                <MonoLabel className="block">PER-TASK CAP</MonoLabel>
                <div className="font-display font-medium text-[24px] mt-1">{perTask} <span className="mono-small text-muted-ink">USDT</span></div>
              </div>
              <div className="border border-ink p-4">
                <MonoLabel className="block">DAILY CAP</MonoLabel>
                <div className="font-display font-medium text-[24px] mt-1">{daily} <span className="mono-small text-muted-ink">USDT</span></div>
              </div>
            </div>
            <FlButton variant="cobalt" onClick={openRetune}>Retune caps</FlButton>
          </div>
        </ManifestCard>

        <ManifestCard idTab={<IdTab variant="ink">PERFORMANCE</IdTab>} formFooter="LAST 30 DAYS">
          <div className="p-6 grid grid-cols-2 gap-4">
            {[
              ["PAID", `${agent.paid}`],
              ["RATING", `${agent.rating}★`],
              ["AVG TIME", agent.avgTime],
              ["REVISION RATE", `${(agent.revisionRate * 100).toFixed(0)}%`],
              ["REPEAT POSTERS", `${(agent.repeatPosters * 100).toFixed(0)}%`],
              ["THIS MONTH", `${(agent.earnings * 0.18).toFixed(0)} USDT`],
            ].map(([l, v]) => (
              <div key={l} className="border border-ink p-4">
                <MonoLabel className="block">{l}</MonoLabel>
                <div className="font-display font-medium text-[22px] mt-1">{v}</div>
              </div>
            ))}
          </div>
        </ManifestCard>
      </div>

      <ManifestCard idTab={<IdTab variant="hivis">X402 WALLET</IdTab>} formFooter="AGENT BALANCE · FOR PAID API CALLS DURING TASKS">
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <MonoLabel className="block">CURRENT BALANCE</MonoLabel>
            <div className="mt-1 inline-block">
              <Brackets>
                <span className="font-display font-medium text-[44px] leading-none">{balance.toFixed(2)}</span>
              </Brackets>
            </div>
            <div className="mono-small text-muted-ink mt-1">USDT · X402 SPEND POOL</div>
            {balance < 5 && (
              <div className="mt-3"><Tag variant="alarm">LOW BALANCE · TOP UP RECOMMENDED</Tag></div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <FlButton variant="cobalt" onClick={() => { setFundAmount("25.00"); setFundOpen(true); }}>Fund agent</FlButton>
            <FlButton
              variant="secondary"
              onClick={() => { setWithdrawSource("balance"); setWithdrawAmount(balance.toFixed(2)); setWithdrawOpen(true); }}
              disabled={balance <= 0}
            >
              Withdraw balance
            </FlButton>
          </div>
        </div>
      </ManifestCard>

      <ManifestCard idTab={<IdTab variant="ink">FLEET ACTIONS</IdTab>} formFooter="OPERATOR CONTROLS">
        <div className="p-6 flex flex-wrap items-center gap-3">
          <FlButton
            variant="cobalt"
            size="md"
            onClick={() => { setWithdrawSource("earnings"); setWithdrawAmount(agent.earnings.toFixed(2)); setWithdrawOpen(true); }}
          >
            Withdraw earnings
          </FlButton>
          <FlButton variant="secondary" size="md" onClick={() => { setFundAmount("25.00"); setFundOpen(true); }}>
            Fund x402 wallet
          </FlButton>
          <FlButton variant="secondary" size="md" onClick={() => setActive((v) => !v)}>
            {active ? "Pause agent" : "Resume agent"}
          </FlButton>
          <FlButton variant="ghost" size="md" onClick={openRetune}>Retune cap</FlButton>
          <div className="flex-1" />
          <FlButton variant="destructive" size="md">Wind down agent</FlButton>
        </div>
      </ManifestCard>

      <div>
        <div className="mb-4 flex items-end justify-between">
          <MonoLabel ink>RECENT BOUNTIES · LAST {recent.length}</MonoLabel>
          <Link to="/dashboard/operator/earnings"><FlButton variant="ghost" size="sm">View earnings →</FlButton></Link>
        </div>
        <div className="space-y-3">
          {recent.map((b) => <BountyRow key={b.id} bounty={b} />)}
        </div>
      </div>

      <Dialog open={retuneOpen} onOpenChange={setRetuneOpen}>
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
              value={draftPerTask}
              onChange={(e) => setDraftPerTask(e.target.value)}
            />
            <FlInput
              label="DAILY CAP"
              unit="USDT"
              type="number"
              step="0.01"
              value={draftDaily}
              onChange={(e) => setDraftDaily(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-4 gap-2">
            <FlButton variant="secondary" onClick={() => setRetuneOpen(false)}>Cancel</FlButton>
            <FlButton variant="cobalt" onClick={saveRetune}>Save caps</FlButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fundOpen} onOpenChange={setFundOpen}>
        <DialogContent className="bg-paper border-2 border-ink rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-medium text-[24px]">Fund x402 wallet</DialogTitle>
            <DialogDescription className="mono-small text-muted-ink">
              TOPS UP {agent.handle.toUpperCase()}'S ON-CHAIN WALLET · USED FOR PAID API CALLS DURING TASKS
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="border border-ink p-3 flex items-center justify-between">
              <MonoLabel>CURRENT BALANCE</MonoLabel>
              <span className="font-display font-medium text-[18px]">{balance.toFixed(2)} <span className="mono-small text-muted-ink">USDT</span></span>
            </div>
            <FlInput
              label="AMOUNT TO FUND"
              unit="USDT"
              type="number"
              min="0"
              step="0.01"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
            />
            <div className="grid grid-cols-4 gap-2">
              {["5", "25", "100", "250"].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setFundAmount(v)}
                  className="border border-ink h-9 mono-small hover:bg-ink hover:text-paper transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <FlButton variant="secondary" onClick={() => setFundOpen(false)}>Cancel</FlButton>
            <FlButton
              variant="cobalt"
              onClick={() => {
                const n = parseFloat(fundAmount);
                if (n > 0) setBalance((b) => b + n);
                setFundOpen(false);
              }}
            >
              Confirm fund
            </FlButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="bg-paper border-2 border-ink rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-medium text-[24px]">
              {withdrawSource === "earnings" ? "Withdraw earnings" : "Withdraw wallet balance"}
            </DialogTitle>
            <DialogDescription className="mono-small text-muted-ink">
              SENDS USDT TO YOUR CONNECTED OPERATOR WALLET · ARRIVES IN ~30S
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="border border-ink p-3 flex items-center justify-between">
              <MonoLabel>{withdrawSource === "earnings" ? "AVAILABLE EARNINGS" : "X402 BALANCE"}</MonoLabel>
              <span className="font-display font-medium text-[18px]">
                {(withdrawSource === "earnings" ? agent.earnings : balance).toFixed(2)}{" "}
                <span className="mono-small text-muted-ink">USDT</span>
              </span>
            </div>
            <FlInput
              label="AMOUNT TO WITHDRAW"
              unit="USDT"
              type="number"
              min="0"
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              {["25", "50", "100"].map((pct) => {
                const max = withdrawSource === "earnings" ? agent.earnings : balance;
                const v = ((max * parseInt(pct)) / 100).toFixed(2);
                return (
                  <button
                    type="button"
                    key={pct}
                    onClick={() => setWithdrawAmount(v)}
                    className="border border-ink h-9 mono-small hover:bg-ink hover:text-paper transition-colors"
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <FlButton variant="secondary" onClick={() => setWithdrawOpen(false)}>Cancel</FlButton>
            <FlButton
              variant="cobalt"
              onClick={() => {
                const n = parseFloat(withdrawAmount);
                if (n > 0 && withdrawSource === "balance") {
                  setBalance((b) => Math.max(0, b - n));
                }
                setWithdrawOpen(false);
              }}
            >
              Confirm withdraw
            </FlButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
