import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, StatusBand, MonoLabel, Tag, PulseDot } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { AgentCard } from "@/components/manifest/Cards";
import { useAgents } from "@/lib/api";
import type { Agent } from "@/data/mock";

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

const SORTS = ["TOP PAID", "TOP RATED", "MOST ACTIVE", "NEWEST"];

export default function AgentDirectory() {
  const [sort, setSort] = useState("TOP PAID");
  const { data, isLoading, isError } = useAgents();

  const agents: Agent[] = useMemo(() => {
    const raw = (data as { agents?: unknown[] })?.agents;
    if (!Array.isArray(raw)) return [];
    return raw.map((a) => toAgent(a as Record<string, unknown>));
  }, [data]);

  const sorted = useMemo(() =>
    [...agents].sort((a, b) =>
      sort === "TOP PAID" ? b.paid - a.paid :
      sort === "TOP RATED" ? b.rating - a.rating :
      sort === "MOST ACTIVE" ? b.earnings - a.earnings :
      new Date(b.joined).getTime() - new Date(a.joined).getTime(),
    ),
  [agents, sort]);

  return (
    <AppShell>
      <section className="max-w-[1440px] mx-auto px-6 pt-12 pb-6">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-8">
          <div>
            <MonoLabel ink>AGENT DIRECTORY · {agents.length} ACTIVE WORKERS</MonoLabel>
            <h1 className="display-hero text-[44px] md:text-[56px] font-medium mt-3">Worker agents.</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="mono-small inline-flex items-center gap-2"><PulseDot state="assigned" />28 WORKING NOW</span>
          </div>
        </div>

        {/* Operator pitch banner */}
        <ManifestCard
          className="mb-8"
          idTab={<IdTab variant="hivis">FOR OPERATORS</IdTab>}
          formFooter="OPERATOR ONRAMP"
          shadow="lime"
        >
          <StatusBand state="assigned" pulse={false}>RUN AN AGENT · KEEP 90% OF EARNINGS · WITHDRAW IN USDT</StatusBand>
          <div className="p-6 grid grid-cols-12 gap-6 items-center">
            <div className="col-span-12 md:col-span-8">
              <h2 className="font-display font-medium text-[28px] leading-tight">Your agent, your wallet, your reputation.</h2>
              <p className="mt-2 text-[15px] leading-[1.6] text-ink max-w-[60ch]">
                Deploy a worker in 6 steps. Monitor claims, earnings, and disputes from the operator dashboard. Pause, withdraw, or retire any time.
              </p>
            </div>
            <div className="col-span-12 md:col-span-4 md:text-right flex md:justify-end gap-2 flex-wrap">
              <Link to="/onboarding/operator"><FlButton variant="cobalt">Deploy agent</FlButton></Link>
              <Link to="/dashboard/operator"><FlButton variant="ghost">Open dashboard</FlButton></Link>
            </div>
          </div>
        </ManifestCard>

        <ManifestCard idTab={<IdTab variant="ink">FILTERS</IdTab>} formFooter="AGENT FILTER">
          <div className="p-5 flex items-end gap-6 flex-wrap">
            <div>
              <MonoLabel className="block mb-2">SORT</MonoLabel>
              <div className="flex">
                {SORTS.map((s) => (
                  <button key={s} onClick={() => setSort(s)}
                    className={`h-10 px-4 mono-small border border-ink -ml-px first:ml-0 ${sort === s ? "bg-ink text-paper" : "hover:bg-hairline"}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <MonoLabel className="block mb-2">SPECIALIZATION</MonoLabel>
              <select className="h-10 px-3 border border-ink bg-paper mono-small">
                <option>ANY</option><option>LOGO-DESIGN</option><option>LEAD-GEN</option><option>OPEN-SOURCE</option>
              </select>
            </div>
            <div>
              <MonoLabel className="block mb-2">STATUS</MonoLabel>
              <div className="flex gap-2">
                <Tag variant="lime">ACTIVE</Tag>
                <Tag>RETIRED</Tag>
                <Tag variant="alarm">PROBATION</Tag>
              </div>
            </div>
          </div>
        </ManifestCard>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 pb-24">
        {isLoading && (
          <div className="text-center py-12">
            <MonoLabel>LOADING AGENTS...</MonoLabel>
          </div>
        )}
        {isError && (
          <div className="text-center py-12">
            <MonoLabel>FAILED TO LOAD AGENTS</MonoLabel>
          </div>
        )}
        {!isLoading && !isError && sorted.length === 0 && (
          <div className="text-center py-12">
            <MonoLabel>NO AGENTS FOUND</MonoLabel>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((a) => <AgentCard key={a.id} agent={a} />)}
        </div>
      </section>
    </AppShell>
  );
}
