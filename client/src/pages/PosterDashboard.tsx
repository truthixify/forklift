import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, StatusBand, Brackets, MonoLabel, Tag, PulseDot } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { useBounties, usePoster } from "@/lib/api";
import { useWalletAuth } from "@/components/auth/WalletAuth";
import type { Bounty } from "@/data/mock";

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

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function PosterDashboard() {
  const { address } = useWalletAuth();
  const { data: bountyData, isLoading: bLoading } = useBounties();
  const { data: posterData, isLoading: pLoading } = usePoster(address ?? "");

  const bounties: Bounty[] = useMemo(() => {
    const raw = (bountyData as { bounties?: unknown[] })?.bounties;
    if (!Array.isArray(raw)) return [];
    return raw.map((b) => toBounty(b as Record<string, unknown>));
  }, [bountyData]);

  const myBounties = useMemo(
    () => bounties.filter((b) => b.poster === address || b.poster === (posterData as Record<string, unknown>)?.id),
    [bounties, address, posterData],
  );

  const me = posterData as Record<string, unknown> | undefined;

  const reviewQ = myBounties.filter((b) => b.state === "delivered").slice(0, 3);
  const live = myBounties.filter((b) => b.state === "live").length;
  const inProgress = myBounties.filter((b) => b.state === "assigned").length;
  const paidBounties = myBounties.filter((b) => b.state === "paid");
  const totalSpentAll = paidBounties.reduce((s, b) => s + b.amount, 0);
  const paidCount = paidBounties.length;

  const spendByDay = useMemo(() => {
    const spend = [0, 0, 0, 0, 0, 0, 0];
    paidBounties.forEach((b, i) => { spend[i % 7] += b.amount; });
    return spend;
  }, [paidBounties]);

  const totalSpend = spendByDay.reduce((s, v) => s + v, 0);
  const peak = Math.max(...spendByDay, 1);

  const handle = (me?.handle ?? me?.displayName ?? (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "poster")) as string;
  const disputeRate = Number(me?.disputeRate ?? 0);
  const frivolous = Number(me?.frivolous ?? 0);
  const repeatAgents = Number(me?.repeatAgents ?? 0);
  const avgReviewTime = (me?.avgReviewTime ?? "--:--") as string;

  const isLoading = bLoading || pLoading;

  return (
    <DashboardLayout
      role="poster"
      title="Overview."
      subtitle={`Welcome back, ${handle}. Here's the pulse of your work pipeline today.`}
      headerAction={
        <Link to="/dashboard/poster/post">
          <FlButton variant="cobalt">+ Post a bounty</FlButton>
        </Link>
      }
    >
      {isLoading ? (
        <div className="border-2 border-dashed border-ink/30 p-12 text-center">
          <MonoLabel ink className="block">LOADING DASHBOARD DATA...</MonoLabel>
        </div>
      ) : (
      <>
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["LIVE", String(live), "OPEN FOR CLAIM"],
          ["AWAITING REVIEW", String(reviewQ.length), "ACT WITHIN 72H"],
          ["IN PROGRESS", String(inProgress), "AGENTS WORKING"],
          ["AVG REVIEW", avgReviewTime, "YOUR REPLY TIME"],
        ].map(([l, v, sub]) => (
          <div key={l} className="border-2 border-ink p-5 bg-paper">
            <MonoLabel ink className="block">{l}</MonoLabel>
            <div className="font-display font-medium text-[36px] leading-none mt-2 tabular-nums">{v}</div>
            <div className="mono-small text-muted-ink mt-2">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Spend chart */}
        <div className="col-span-12 lg:col-span-8">
          <ManifestCard idTab={<IdTab variant="cobalt">SPEND · LAST 7 DAYS</IdTab>} formFooter="WEEKLY USDT OUTFLOW">
            <div className="p-7">
              <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
                <div>
                  <MonoLabel ink>WEEKLY TOTAL</MonoLabel>
                  <div className="font-display font-medium text-[44px] leading-none mt-1 tabular-nums">
                    {totalSpend} <span className="mono-small text-muted-ink">USDT</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Tag variant="cobalt">PAID</Tag>
                  <Tag>POSTED</Tag>
                  <Tag variant="hivis">PEAK {peak} USDT</Tag>
                </div>
              </div>
              <div className="flex items-end gap-3 h-44 border-b border-ink">
                {spendByDay.map((v, i) => (
                  <div key={DAYS[i]} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="mono-small tabular-nums">{v}</span>
                    <div
                      className={`w-full ${v === peak ? "bg-hivis" : "bg-cobalt"}`}
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
          <ManifestCard shadow="hivis" idTab={<IdTab variant="ink">REVIEW QUEUE</IdTab>} formFooter="AWAITING APPROVAL">
            <StatusBand state="delivered">{reviewQ.length} DELIVERIES · 7-DAY WINDOW</StatusBand>
            <ul>
              {reviewQ.map((b) => (
                <li key={b.id} className="px-5 py-3 border-b border-hairline last:border-b-0 flex items-center gap-3">
                  <PulseDot state="delivered" />
                  <Link to={`/bounties/${b.id}`} className="flex-1 text-[14px] hover:text-cobalt truncate font-display font-medium">{b.title}</Link>
                  <span className="mono-small">{b.amount} USDT</span>
                </li>
              ))}
              {reviewQ.length === 0 && (
                <li className="px-5 py-6 text-center mono-small text-muted-ink">QUEUE EMPTY</li>
              )}
            </ul>
            <div className="p-3 border-t border-hairline">
              <Link to="/dashboard/poster/bounties" className="mono-small hover:text-cobalt">VIEW ALL BOUNTIES →</Link>
            </div>
          </ManifestCard>

          <ManifestCard idTab={<IdTab variant="cobalt">REPUTATION</IdTab>} formFooter="POSTER STANDING">
            <div className="p-6 space-y-3">
              <div className="flex justify-between"><MonoLabel>DISPUTE RATE</MonoLabel><span className="mono-inline">{(disputeRate * 100).toFixed(0)}%</span></div>
              <div className="flex justify-between"><MonoLabel>FRIVOLOUS</MonoLabel><span className="mono-inline">{frivolous}</span></div>
              <div className="flex justify-between"><MonoLabel>REPEAT AGENTS</MonoLabel><span className="mono-inline">{(repeatAgents * 100).toFixed(0)}%</span></div>
              <div className="hairline" />
              <div className="flex justify-between items-baseline">
                <MonoLabel ink>STANDING</MonoLabel>
                <Tag variant="lime">TRUSTED</Tag>
              </div>
            </div>
          </ManifestCard>

          <ManifestCard idTab={<IdTab variant="ink">LIFETIME</IdTab>} formFooter="POSTER · ALL-TIME">
            <div className="p-6">
              <MonoLabel>TOTAL SPEND</MonoLabel>
              <div className="mt-1 inline-block">
                <Brackets>
                  <span className="font-display font-medium text-[44px] leading-none">{totalSpentAll}</span>
                </Brackets>
              </div>
              <div className="mono-small text-muted-ink mt-2">USDT · {paidCount} PAID BOUNTIES</div>
            </div>
          </ManifestCard>
        </div>
      </div>
      </>
      )}
    </DashboardLayout>
  );
}
