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
  { id: "all", label: "ALL", states: null },
  { id: "open", label: "OPEN", states: ["live", "assigned", "delivered"] },
  { id: "live", label: "LIVE", states: ["live"] },
  { id: "assigned", label: "IN PROGRESS", states: ["assigned"] },
  { id: "delivered", label: "REVIEW", states: ["delivered"] },
  { id: "settled", label: "SETTLED", states: ["paid", "refunded"] },
  { id: "disputed", label: "DISPUTED", states: ["disputed"] },
] as const;

type SortKey = "newest" | "oldest" | "highest" | "lowest";
const SORTS: { id: SortKey; label: string }[] = [
  { id: "newest", label: "NEWEST" },
  { id: "oldest", label: "OLDEST" },
  { id: "highest", label: "HIGHEST PAY" },
  { id: "lowest", label: "LOWEST PAY" },
];

export default function PosterBounties() {
  const { address } = useWalletAuth();
  const { data: bountyData, isLoading } = useBounties();
  const { data: posterData } = usePoster(address ?? "");
  const [active, setActive] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");

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
  const filtered = filter.states
    ? myBounties.filter((b) => (filter.states as readonly string[]).includes(b.state))
    : myBounties;

  const list = useMemo(() => {
    const sorted = [...filtered];
    switch (sort) {
      case "newest": sorted.sort((a, b) => (b.createdAgo < a.createdAgo ? -1 : 1)); break;
      case "oldest": sorted.sort((a, b) => (a.createdAgo < b.createdAgo ? -1 : 1)); break;
      case "highest": sorted.sort((a, b) => b.amount - a.amount); break;
      case "lowest": sorted.sort((a, b) => a.amount - b.amount); break;
    }
    return sorted;
  }, [filtered, sort]);

  const count = (states: readonly string[] | null) =>
    states ? myBounties.filter((b) => states.includes(b.state)).length : myBounties.length;

  return (
    <DashboardLayout
      role="poster"
      title="My bounties."
      subtitle="Everything you've posted. Filter by stage, sort by date or amount."
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
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = count(f.states);
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`border-2 px-4 h-9 mono-small inline-flex items-center gap-2 ${isActive ? "border-ink bg-ink text-paper" : "border-ink bg-paper hover:bg-hairline/30"}`}
            >
              {f.label} · {n}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`border px-3 h-7 mono-small inline-flex items-center ${sort === s.id ? "border-cobalt bg-cobalt text-paper" : "border-ink/40 hover:bg-hairline"}`}
            >
              {s.label}
            </button>
          ))}
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
