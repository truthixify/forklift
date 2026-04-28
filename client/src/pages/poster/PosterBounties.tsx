import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { MonoLabel, Tag } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { useBounties, usePoster } from "@/lib/api";
import { useWalletAuth } from "@/components/auth/WalletAuth";
import { BountyRow } from "@/components/manifest/Cards";
import type { Bounty } from "@/lib/types";

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

const FILTERS = [
  { id: "all", label: "ALL OPEN", states: ["live", "assigned", "delivered"] },
  { id: "live", label: "LIVE · UNCLAIMED", states: ["live"] },
  { id: "assigned", label: "IN PROGRESS", states: ["assigned"] },
  { id: "delivered", label: "AWAITING REVIEW", states: ["delivered"] },
] as const;

export default function PosterBounties() {
  const { address } = useWalletAuth();
  const { data: bountyData, isLoading } = useBounties();
  const { data: posterData } = usePoster(address ?? "");
  const [active, setActive] = useState<typeof FILTERS[number]["id"]>("all");

  const myBounties: Bounty[] = useMemo(() => {
    const raw = (bountyData as { bounties?: unknown[] })?.bounties;
    if (!Array.isArray(raw)) return [];
    const all = raw.map((b) => toBounty(b as Record<string, unknown>));
    const posterId = (posterData as Record<string, unknown>)?.id as string | undefined;
    const addr = address?.toLowerCase();
    const pid = posterId?.toLowerCase();
    return all.filter((b) => {
      const p = b.poster.toLowerCase();
      return p === addr || p === pid;
    });
  }, [bountyData, address, posterData]);

  const filter = FILTERS.find((f) => f.id === active)!;
  const list = myBounties.filter((b) => filter.states.includes(b.state as never));

  return (
    <DashboardLayout
      role="poster"
      title="My bounties."
      subtitle="Everything you've posted that's still open. Filter by stage, jump to detail to review or extend."
      headerAction={
        <Link to="/dashboard/poster/post"><FlButton variant="cobalt">+ Post a bounty</FlButton></Link>
      }
    >
      {isLoading ? (
        <div className="border-2 border-dashed border-ink/30 p-12 text-center">
          <MonoLabel ink className="block">LOADING BOUNTIES...</MonoLabel>
        </div>
      ) : (
      <>
      {/* Stage counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FILTERS.map((f) => {
          const n = myBounties.filter((b) => f.states.includes(b.state as never)).length;
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`text-left border-2 ${isActive ? "border-cobalt bg-paper" : "border-ink bg-paper hover:bg-hairline/30"} p-4`}
            >
              <MonoLabel ink className="block">{f.label}</MonoLabel>
              <div className="font-display font-medium text-[28px] mt-1 tabular-nums">{n}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Tag>SORT · NEWEST</Tag>
          <Tag variant="cobalt">FILTER · {filter.label}</Tag>
        </div>
        <div className="mono-small text-muted-ink">{list.length} BOUNTIES</div>
      </div>

      <div className="space-y-3">
        {list.map((b) => <BountyRow key={b.id} bounty={b} basePath="/dashboard/poster/bounties" />)}
        {list.length === 0 && (
          <div className="border-2 border-dashed border-ink/30 p-12 text-center">
            <MonoLabel ink className="block">NO BOUNTIES IN THIS VIEW</MonoLabel>
            <p className="mono-small text-muted-ink mt-2">Post your first bounty to get the wheels turning.</p>
            <Link to="/dashboard/poster/post" className="inline-block mt-4">
              <FlButton variant="cobalt">+ Post a bounty</FlButton>
            </Link>
          </div>
        )}
      </div>
      </>
      )}
    </DashboardLayout>
  );
}
