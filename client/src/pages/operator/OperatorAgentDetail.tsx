import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { parseUnits, erc20Abi } from "viem";
import { useWriteContract } from "wagmi";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, StatusBand, MonoLabel, Tag, Monogram, Brackets } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useWalletAuth } from "@/components/auth/WalletAuth";
import { useMyAgents, usePauseAgent, useResumeAgent, useRetireAgent, useUpdateSpendCaps, useWithdrawEarnings } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { KITE_USDT_ADDRESS } from "@/lib/config";
import { kiteTestnet } from "@/lib/wagmi";

export default function OperatorAgentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { address: operatorAddress } = useWalletAuth();
  const { data: agentsData, isLoading } = useMyAgents(operatorAddress ?? "");
  const pauseAgent = usePauseAgent();
  const resumeAgent = useResumeAgent();
  const retireAgent = useRetireAgent();
  const updateCaps = useUpdateSpendCaps();
  const withdrawMutation = useWithdrawEarnings();

  const agent = useMemo(() => {
    const raw = agentsData as Record<string, unknown> | undefined;
    const arr = Array.isArray(raw?.agents) ? (raw!.agents as Record<string, unknown>[]) : [];
    return arr.find((a) => a.id === id || a.wallet === id || a.passportAddress === id) as Record<string, unknown> | undefined;
  }, [agentsData, id]);

  const { writeContractAsync } = useWriteContract();
  const [retuneOpen, setRetuneOpen] = useState(false);
  const [draftPerTask, setDraftPerTask] = useState("2.50");
  const [draftDaily, setDraftDaily] = useState("50.00");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [fundingTx, setFundingTx] = useState(false);
  const [withdrawingTx, setWithdrawingTx] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("25.00");

  if (isLoading) {
    return (
      <DashboardLayout role="operator" title="Loading..." subtitle="Fetching agent details.">
        <MonoLabel>LOADING AGENT...</MonoLabel>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout role="operator" title="Agent not found." subtitle="That agent does not exist or is not in your fleet.">
        <Link to="/dashboard/operator/agents"><FlButton variant="cobalt">← Back to fleet</FlButton></Link>
      </DashboardLayout>
    );
  }

  const handle = (agent.handle ?? agent.displayName ?? agent.name ?? "Agent") as string;
  const wallet = (agent.wallet ?? agent.id ?? "") as string;
  const monogram = (agent.monogram ?? handle.charAt(0).toUpperCase()) as string;
  const specializations = (agent.specializations ?? []) as string[];
  const bio = (agent.bio ?? "") as string;
  const paid = (agent.paid ?? 0) as number;
  const rating = (agent.rating ?? 0) as number;
  const earnings = (agent.earnings ?? 0) as number;
  const isActive = (agent.active ?? agent.status === "active") as boolean;
  const avgTime = (agent.avgTime ?? "—") as string;
  const revisionRate = (agent.revisionRate ?? 0) as number;
  const repeatPosters = (agent.repeatPosters ?? 0) as number;
  const todaySpend = (agent.todaySpend ?? 0) as number;
  const spendCaps = (agent.spendCaps ?? {}) as Record<string, string>;
  const capPerTask = spendCaps.perTaskUSDT ? Number(BigInt(spendCaps.perTaskUSDT)) / 1e18 : 2.5;
  const capDaily = spendCaps.globalDailyUSDT ? Number(BigInt(spendCaps.globalDailyUSDT)) / 1e18 : 50;
  const pct = capPerTask > 0 ? Math.min(100, (todaySpend / capPerTask) * 100) : 0;
  const near = pct > 70;

  const openRetune = () => {
    setDraftPerTask(capPerTask.toFixed(2));
    setDraftDaily(capDaily.toFixed(2));
    setRetuneOpen(true);
  };

  const saveRetune = () => {
    updateCaps.mutate(
      {
        address: wallet,
        perTaskUSDT: String(BigInt(Math.round(parseFloat(draftPerTask) * 1e18))),
        globalDailyUSDT: String(BigInt(Math.round(parseFloat(draftDaily) * 1e18))),
      },
      { onSuccess: () => { setRetuneOpen(false); setActionMsg(`Caps updated: ${draftPerTask} / ${draftDaily} USDT.`); } },
    );
  };

  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const handlePauseResume = () => {
    if (isActive) {
      pauseAgent.mutate(wallet, { onSuccess: () => setActionMsg("Agent paused.") });
    } else {
      resumeAgent.mutate(wallet, { onSuccess: () => setActionMsg("Agent resumed.") });
    }
  };

  const handleWindDown = () => {
    retireAgent.mutate(wallet, { onSuccess: () => nav("/dashboard/operator/agents") });
  };

  const handleWithdraw = () => {
    const n = parseFloat(withdrawAmount);
    if (n > 0 && operatorAddress) {
      withdrawMutation.mutate(
        { address: wallet, operatorAddress, amount: withdrawAmount },
        { onSuccess: () => { setActionMsg(`Withdrew ${withdrawAmount} USDT.`); setWithdrawOpen(false); } },
      );
    } else {
      setWithdrawOpen(false);
    }
  };

  return (
    <DashboardLayout
      role="operator"
      title={`${handle}.`}
      subtitle={`${specializations.join(" · ")} · ${paid} paid · ${rating}★`}
      headerAction={
        <FlButton variant="ghost" onClick={() => nav("/dashboard/operator/agents")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />Back to fleet
        </FlButton>
      }
    >
      {actionMsg && (
        <div className="bg-lime text-ink border-2 border-ink px-5 py-3 flex items-center justify-between">
          <span className="mono-small">{actionMsg}</span>
          <button className="mono-small underline" onClick={() => setActionMsg(null)}>DISMISS</button>
        </div>
      )}
      <ManifestCard
        shadow="lime"
        idTab={<IdTab variant="ink">AGENT · {wallet}</IdTab>}
        formFooter={`OPERATOR FLEET · ${handle.toUpperCase()}`}
      >
        <StatusBand state={isActive ? "assigned" : "ink"}>
          {isActive ? `ACTIVE${paid < 3 ? " · NEW AGENT" : " · WORKING"}` : "PAUSED"}
        </StatusBand>
        <div className="p-7 grid grid-cols-12 gap-6 items-center">
          <div className="col-span-12 md:col-span-2">
            <Monogram letter={monogram} size={96} variant="ink" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <h2 className="display-hero text-[44px] font-medium leading-tight">{handle}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {specializations.map((s) => <Tag key={s}>{s}</Tag>)}
              {paid < 3 && <Tag variant="cobalt">NEW · {paid}/3 PAID</Tag>}
            </div>
            {bio && <p className="mt-3 text-[15px] text-ink max-w-[52ch]">{bio}</p>}
          </div>
          <div className="col-span-12 md:col-span-4 md:text-right">
            <MonoLabel>LIFETIME EARNINGS</MonoLabel>
            <div className="mt-1 inline-block">
              <Brackets><span className="font-display font-medium text-[48px] leading-none">{earnings.toFixed(2)}</span></Brackets>
            </div>
            <div className="mono-small text-muted-ink mt-1">USDT · ALL-TIME</div>
          </div>
        </div>
      </ManifestCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ManifestCard idTab={<IdTab variant="cobalt">SPEND CAPS</IdTab>} formFooter="LIVE BUDGET CONTROLS">
          <div className="p-6 space-y-5">
            <div>
              <MonoLabel ink className="block mb-2">TODAY'S USAGE · {todaySpend.toFixed(2)} / {capPerTask.toFixed(2)} USDT</MonoLabel>
              <div className="h-3 bg-paper border border-ink relative">
                <div className={`absolute inset-y-0 left-0 ${near ? "bg-alarm" : "bg-hivis"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-ink p-4">
                <MonoLabel className="block">PER-TASK CAP</MonoLabel>
                <div className="font-display font-medium text-[24px] mt-1">{capPerTask.toFixed(2)} <span className="mono-small text-muted-ink">USDT</span></div>
              </div>
              <div className="border border-ink p-4">
                <MonoLabel className="block">DAILY CAP</MonoLabel>
                <div className="font-display font-medium text-[24px] mt-1">{capDaily.toFixed(2)} <span className="mono-small text-muted-ink">USDT</span></div>
              </div>
            </div>
            <FlButton variant="cobalt" onClick={openRetune}>Retune caps</FlButton>
          </div>
        </ManifestCard>

        <ManifestCard idTab={<IdTab variant="ink">PERFORMANCE</IdTab>} formFooter="AGENT STATS">
          <div className="p-6 grid grid-cols-2 gap-4">
            {[
              ["PAID", `${paid}`],
              ["RATING", `${rating}★`],
              ["AVG TIME", avgTime],
              ["REVISION RATE", `${(revisionRate * 100).toFixed(0)}%`],
              ["REPEAT POSTERS", `${(repeatPosters * 100).toFixed(0)}%`],
              ["TODAY SPEND", `${todaySpend.toFixed(2)} USDT`],
            ].map(([l, v]) => (
              <div key={l} className="border border-ink p-4">
                <MonoLabel className="block">{l}</MonoLabel>
                <div className="font-display font-medium text-[22px] mt-1">{v}</div>
              </div>
            ))}
          </div>
        </ManifestCard>
      </div>

      <ManifestCard idTab={<IdTab variant="ink">FLEET ACTIONS</IdTab>} formFooter="OPERATOR CONTROLS">
        <div className="p-6 flex flex-wrap items-center gap-3">
          <FlButton variant="cobalt" size="md" onClick={() => { setWithdrawAmount(earnings.toFixed(2)); setWithdrawOpen(true); }}>
            Withdraw earnings
          </FlButton>
          <FlButton variant="secondary" size="md" onClick={() => { setFundAmount("25.00"); setFundOpen(true); }}>
            Fund x402 wallet
          </FlButton>
          <FlButton variant="secondary" size="md" onClick={handlePauseResume} disabled={pauseAgent.isPending || resumeAgent.isPending}>
            {pauseAgent.isPending || resumeAgent.isPending ? "Updating..." : isActive ? "Pause agent" : "Resume agent"}
          </FlButton>
          <FlButton variant="ghost" size="md" onClick={openRetune}>Retune cap</FlButton>
          <div className="flex-1" />
          <FlButton variant="destructive" size="md" onClick={handleWindDown} disabled={retireAgent.isPending}>
            {retireAgent.isPending ? "Winding down..." : "Wind down agent"}
          </FlButton>
        </div>
      </ManifestCard>

      <Dialog open={retuneOpen} onOpenChange={setRetuneOpen}>
        <DialogContent className="bg-paper border-2 border-ink rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-medium text-[24px]">Retune spend caps</DialogTitle>
            <DialogDescription className="mono-small text-muted-ink">CHANGES APPLY IMMEDIATELY</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <FlInput label="MAX SPEND PER TASK" unit="USDT" type="number" step="0.01" value={draftPerTask} onChange={(e) => setDraftPerTask(e.target.value)} />
            <FlInput label="DAILY CAP" unit="USDT" type="number" step="0.01" value={draftDaily} onChange={(e) => setDraftDaily(e.target.value)} />
          </div>
          <DialogFooter className="mt-4 gap-2">
            <FlButton variant="secondary" onClick={() => setRetuneOpen(false)}>Cancel</FlButton>
            <FlButton variant="cobalt" onClick={saveRetune} disabled={updateCaps.isPending}>{updateCaps.isPending ? "Saving..." : "Save caps"}</FlButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fundOpen} onOpenChange={setFundOpen}>
        <DialogContent className="bg-paper border-2 border-ink rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-medium text-[24px]">Fund x402 wallet</DialogTitle>
            <DialogDescription className="mono-small text-muted-ink">TOPS UP {handle.toUpperCase()}'S WALLET FOR PAID API CALLS</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <FlInput label="AMOUNT TO FUND" unit="USDT" type="number" min="0" step="0.01" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
            <div className="grid grid-cols-4 gap-2">
              {["5", "25", "100", "250"].map((v) => (
                <button type="button" key={v} onClick={() => setFundAmount(v)} className="border border-ink h-9 mono-small hover:bg-ink hover:text-paper">{v}</button>
              ))}
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <FlButton variant="secondary" onClick={() => setFundOpen(false)}>Cancel</FlButton>
            <FlButton variant="cobalt" disabled={fundingTx} onClick={async () => {
              const n = parseFloat(fundAmount);
              if (n <= 0 || !operatorAddress) return;
              setFundingTx(true);
              try {
                await writeContractAsync({
                  address: KITE_USDT_ADDRESS as `0x${string}`,
                  abi: erc20Abi,
                  account: operatorAddress as `0x${string}`,
                  chain: kiteTestnet,
                  functionName: 'transfer',
                  args: [wallet as `0x${string}`, parseUnits(String(n), 18)],
                });
                setActionMsg(`Funded ${fundAmount} USDT to agent wallet.`);
                setFundOpen(false);
              } catch (err) {
                console.error("Fund failed:", err);
              } finally {
                setFundingTx(false);
              }
            }}>{fundingTx ? "Sending..." : "Confirm fund"}</FlButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="bg-paper border-2 border-ink rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-medium text-[24px]">Withdraw earnings</DialogTitle>
            <DialogDescription className="mono-small text-muted-ink">SENDS USDT TO YOUR OPERATOR WALLET</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="border border-ink p-3 flex items-center justify-between">
              <MonoLabel>AVAILABLE</MonoLabel>
              <span className="font-display font-medium text-[18px]">{earnings.toFixed(2)} USDT</span>
            </div>
            <FlInput label="AMOUNT" unit="USDT" type="number" min="0" step="0.01" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
          </div>
          <DialogFooter className="mt-4 gap-2">
            <FlButton variant="secondary" onClick={() => setWithdrawOpen(false)}>Cancel</FlButton>
            <FlButton variant="cobalt" onClick={handleWithdraw} disabled={withdrawMutation.isPending}>
              {withdrawMutation.isPending ? "Withdrawing..." : "Confirm withdraw"}
            </FlButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
