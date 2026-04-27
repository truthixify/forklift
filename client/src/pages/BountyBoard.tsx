import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, MonoLabel, Tag, PulseDot } from "@/components/manifest/Manifest";
import { BountyRow } from "@/components/manifest/Cards";
import { FlButton } from "@/components/manifest/FlButton";
import { useBounties } from "@/lib/api";
import type { Bounty } from "@/data/mock";

const FILTERS = ["All", "Live", "Open", "Settled"];
const SORTS = ["NEWEST", "HIGHEST PAY", "ENDING SOON", "MOST CLAIMS"];
const PAY_BUCKETS = [
  { id: "xs", label: "< 5",     min: 0,   max: 5 },
  { id: "s",  label: "5 – 25",  min: 5,   max: 25 },
  { id: "m",  label: "25 – 100",min: 25,  max: 100 },
  { id: "l",  label: "100 – 500", min: 100, max: 500 },
  { id: "xl", label: "500+",    min: 500, max: Infinity },
];

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

export default function BountyBoard() {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("NEWEST");
  const { data, isLoading, isError } = useBounties();

  const bounties: Bounty[] = useMemo(() => {
    const raw = (data as { bounties?: unknown[] })?.bounties;
    if (!Array.isArray(raw)) return [];
    return raw.map((b) => toBounty(b as Record<string, unknown>));
  }, [data]);

  const rows = useMemo(() => {
    let r = [...bounties];
    if (filter === "Live") r = r.filter((b) => b.state === "live");
    if (filter === "Open") r = r.filter((b) => ["live", "assigned", "delivered"].includes(b.state));
    if (filter === "Settled") r = r.filter((b) => ["paid", "refunded", "expired", "disputed"].includes(b.state));
    if (sort === "HIGHEST PAY") r.sort((a, b) => b.amount - a.amount);
    return r;
  }, [bounties, filter, sort]);

  return (
    <AppShell>
      <section className="max-w-[1440px] mx-auto px-6 pt-12 pb-6">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-8">
          <div>
            <MonoLabel ink>BOUNTY BOARD · ALL OPEN WORK</MonoLabel>
            <h1 className="display-hero text-[44px] md:text-[56px] font-medium mt-3">Bounties.</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="mono-small inline-flex items-center gap-2"><PulseDot state="live" />12 LIVE</span>
            <span className="mono-small text-muted-ink">· 47 OPEN ·</span>
            <span className="mono-small inline-flex items-center gap-2"><PulseDot state="paid" />8 SETTLED TODAY</span>
          </div>
        </div>

        <ManifestCard idTab={<IdTab variant="ink">FILTERS · 03 ACTIVE</IdTab>} formFooter="BOUNTY FILTER">
          <div className="p-5 flex items-end gap-6 flex-wrap">
            <div>
              <MonoLabel className="block mb-2">STATE</MonoLabel>
              <div className="flex">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`h-10 px-4 mono-small border border-ink -ml-px first:ml-0 ${filter === f ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-hairline"}`}
                  >{f.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <div>
              <MonoLabel className="block mb-2">TEMPLATE</MonoLabel>
              <select className="h-10 px-3 border border-ink bg-paper mono-small">
                <option>ALL TEMPLATES</option>
                <option>LOGO-DESIGN</option>
                <option>LEAD-GEN</option>
                <option>OPEN-SOURCE</option>
                <option>TRANSCRIPTION</option>
              </select>
            </div>
            <div>
              <MonoLabel className="block mb-2">DELIVERABLE</MonoLabel>
              <select className="h-10 px-3 border border-ink bg-paper mono-small">
                <option>ANY KIND</option><option>FILE</option><option>JSON</option><option>URL</option><option>GITHUB-PR</option>
              </select>
            </div>
            <div className="flex-1 min-w-[260px]">
              <MonoLabel className="block mb-2">PAY RANGE · USDT</MonoLabel>
              <div className="flex flex-wrap">
                {PAY_BUCKETS.map((b) => {
                  const active = false;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`h-10 px-3 mono-small border border-ink -ml-px first:ml-0 tabular-nums ${active ? "bg-ink text-paper" : "bg-paper hover:bg-hairline"}`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <MonoLabel className="block mb-2">SORT</MonoLabel>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 px-3 border border-ink bg-paper mono-small">
                {SORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </ManifestCard>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <MonoLabel ink>{rows.length} BOUNTIES · SORTED BY {sort}</MonoLabel>
          <div className="flex gap-2">
            <Tag>INCLUDE SETTLED</Tag>
            <Tag>HIDE DISPUTED</Tag>
          </div>
        </div>
        <div className="space-y-3">
          {isLoading && (
            <div className="text-center py-12">
              <MonoLabel>LOADING BOUNTIES...</MonoLabel>
            </div>
          )}
          {isError && (
            <div className="text-center py-12">
              <MonoLabel>FAILED TO LOAD BOUNTIES</MonoLabel>
            </div>
          )}
          {!isLoading && !isError && rows.length === 0 && (
            <div className="text-center py-12">
              <MonoLabel>NO BOUNTIES FOUND</MonoLabel>
            </div>
          )}
          {rows.map((b) => <BountyRow key={b.id} bounty={b} />)}
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-ink pt-6">
          <MonoLabel>PAGE 01 OF 04</MonoLabel>
          <div className="flex gap-2">
            <FlButton variant="secondary" size="sm">← Prev</FlButton>
            <FlButton variant="secondary" size="sm">Next →</FlButton>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
