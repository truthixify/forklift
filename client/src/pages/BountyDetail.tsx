import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, StatusBand, Brackets, MonoLabel, Tag, Monogram, PaidStamp } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { ActivityRow } from "@/components/manifest/ActivityRow";
import { useBounty, useAgents } from "@/lib/api";
import { useRealFeed } from "@/hooks/useRealFeed";
import type { FeedEvent } from "@/hooks/useRealFeed";
import type { Bounty, Agent, Poster, ActivityEvent } from "@/lib/types";

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

function toPoster(raw: Record<string, unknown>): Poster {
  return {
    id: (raw.id ?? raw.address ?? "") as string,
    handle: (raw.handle ?? raw.displayName ?? "") as string,
    monogram: (raw.monogram ?? ((raw.handle ?? raw.displayName ?? "?") as string).charAt(0).toUpperCase()) as string,
    wallet: (raw.wallet ?? raw.address ?? "") as string,
    posted: Number(raw.posted ?? raw.totalPosted ?? 0),
    paid: Number(raw.paid ?? raw.totalPaid ?? 0),
    abandoned: Number(raw.abandoned ?? 0),
    disputeRate: Number(raw.disputeRate ?? 0),
    frivolous: Number(raw.frivolous ?? 0),
    avgReviewTime: (raw.avgReviewTime ?? "—") as string,
    repeatAgents: Number(raw.repeatAgents ?? 0),
    joined: (raw.joined ?? "") as string,
  };
}

export default function BountyDetail() {
  const { id } = useParams();
  const { data, isLoading, isError } = useBounty(id ?? "");
  const { data: agentsData } = useAgents();
  const { events: wsEvents } = useRealFeed();

  const bounty: Bounty | null = useMemo(() => {
    const raw = data as Record<string, unknown> | undefined;
    if (!raw) return null;
    const events = raw.events as Record<string, unknown>[] | undefined;
    const sig = raw.signature as Record<string, unknown> | undefined;
    const source = sig ?? (events && events.length > 0 ? events[0] : null) ?? raw;
    return toBounty(source as Record<string, unknown>);
  }, [data]);

  const agents: Agent[] = useMemo(() => {
    const raw = (agentsData as { agents?: unknown[] })?.agents;
    if (!Array.isArray(raw)) return [];
    return raw.map((a) => toAgent(a as Record<string, unknown>));
  }, [agentsData]);

  const poster: Poster = useMemo(() => {
    if (!bounty) return toPoster({});
    const raw = data as Record<string, unknown> | undefined;
    const posterRaw = raw?.poster as Record<string, unknown> | undefined;
    if (posterRaw && typeof posterRaw === "object") return toPoster(posterRaw);
    return toPoster({ id: bounty.poster, handle: bounty.poster });
  }, [data, bounty]);

  const claimsData = useMemo(() => {
    const raw = data as Record<string, unknown> | undefined;
    const arr = raw?.claims as Array<Record<string, unknown>> | undefined;
    return arr ?? [];
  }, [data]);

  const scoringTrace = useMemo(() => {
    const raw = data as Record<string, unknown> | undefined;
    return raw?.scoringTrace as Record<string, unknown> | undefined;
  }, [data]);

  const winner = useMemo(() => {
    if (!bounty?.agent) return undefined;
    return agents.find((a) => a.id === bounty.agent);
  }, [agents, bounty]);

  const activity: ActivityEvent[] = useMemo(() => {
    return wsEvents.slice(0, 5).map((e: FeedEvent, index: number): ActivityEvent => {
      const kind = (e.type ?? "posted") as ActivityEvent["kind"];
      const name = (e.data?.agentHandle as string) ?? (e.data?.actor as string) ?? "Agent";
      const ts = new Date(e.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
      return {
        id: e.transactionHash ?? `ws-${e.timestamp}-${index}`,
        ts,
        agoMin: Math.max(0, Math.floor((Date.now() - e.timestamp) / 60_000)),
        actor: name,
        monogram: name.charAt(0).toUpperCase(),
        kind,
        body: (e.data?.body as string) ?? `${kind} ${e.bountyId ?? ""}`.trim(),
        bountyId: e.bountyId,
        amount: e.data?.amount as number | undefined,
      };
    });
  }, [wsEvents]);

  if (isLoading) {
    return (
      <AppShell>
        <section className="max-w-[1440px] mx-auto px-6 pt-12 pb-24">
          <div className="text-center py-24"><MonoLabel>LOADING BOUNTY...</MonoLabel></div>
        </section>
      </AppShell>
    );
  }

  if (isError || !bounty) {
    return (
      <AppShell>
        <section className="max-w-[1440px] mx-auto px-6 pt-12 pb-24">
          <div className="text-center py-24"><MonoLabel>BOUNTY NOT FOUND</MonoLabel></div>
        </section>
      </AppShell>
    );
  }

  const stateLabel = bounty.state.toUpperCase();

  return (
    <AppShell>
      <section className="max-w-[1440px] mx-auto px-6 pt-12 pb-24">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link to="/bounties" className="mono-small text-muted-ink hover:text-cobalt">← BOUNTIES</Link>
            <span className="mono-small">/</span>
            <MonoLabel ink>#{bounty.shortId}</MonoLabel>
          </div>
          <div className="flex gap-2">
            <Tag>{bounty.template}</Tag>
            {bounty.tags.slice(1).map((t) => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* LEFT — bounty document */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <ManifestCard
              shadow="hivis"
              idTab={<IdTab>BOUNTY · #{bounty.shortId}</IdTab>}
              formFooter="BOUNTY MANIFEST"
              pageNumber="01 / 03"
            >
              <StatusBand state={bounty.state === "paid" ? "paid" : bounty.state === "live" ? "live" : bounty.state === "assigned" ? "assigned" : bounty.state === "delivered" ? "delivered" : bounty.state === "disputed" ? "disputed" : "open"}>
                {stateLabel}{bounty.state === "live" && ` · CLAIMS WINDOW · ${bounty.deadline} LEFT`}
              </StatusBand>

              <div className="p-7">
                <h1 className="display-hero text-[36px] md:text-[44px] font-medium leading-tight">{bounty.title}</h1>
                <MonoLabel className="block mt-3">POSTED {bounty.createdAgo} · BY {poster.handle.toUpperCase()}</MonoLabel>
              </div>

              <div className="hairline-ink" />

              <div className="grid grid-cols-2 md:grid-cols-4">
                {[
                  ["DELIVERABLE", bounty.kind.toUpperCase()],
                  ["VERIFIER", bounty.verifier.join(" + ").toUpperCase()],
                  ["DEADLINE", bounty.deadline],
                  ["CLAIMS", `${bounty.claims} OF 12 MAX`],
                ].map(([l, v]) => (
                  <div key={l} className="p-5 border-r last:border-r-0 border-b md:border-b-0 border-ink/15">
                    <MonoLabel className="block">{l}</MonoLabel>
                    <div className="mt-2 font-display font-medium text-[18px]">{v}</div>
                  </div>
                ))}
              </div>

              <div className="hairline-ink" />

              <div className="p-7 grid grid-cols-12 gap-6 items-center">
                <div className="col-span-12 md:col-span-7">
                  <MonoLabel>BOUNTY AMOUNT · ESCROWED</MonoLabel>
                  <div className="mt-3 flex items-baseline gap-3">
                    <Brackets><span className="text-[80px] font-display font-medium leading-none">{bounty.amount.toFixed(2)}</span></Brackets>
                    <span className="mono-small text-muted-ink">USDT</span>
                  </div>
                  <MonoLabel className="block mt-3">+ 5% CREATION FEE · 10% PAYOUT FEE ON SETTLEMENT</MonoLabel>
                </div>
                <div className="col-span-12 md:col-span-5 flex flex-col gap-3 md:items-end">
                  {bounty.state === "live" && (
                    <div className="text-right">
                      <Tag variant="cobalt">AGENTS SCANNING</Tag>
                      <p className="mono-small text-muted-ink mt-2 max-w-[24ch]">
                        Autonomous agents will claim within the claim window.
                      </p>
                    </div>
                  )}
                  {bounty.state === "assigned" && (
                    <Tag variant="lime">ASSIGNED TO {winner?.handle.toUpperCase()}</Tag>
                  )}
                  {bounty.state === "delivered" && (
                    <Tag variant="cobalt">DELIVERY SUBMITTED</Tag>
                  )}
                  {bounty.state === "paid" && (
                    <Tag variant="hivis">SETTLED</Tag>
                  )}
                </div>
              </div>
            </ManifestCard>

            {/* Brief */}
            <ManifestCard idTab={<IdTab variant="ink">SECTION · 02 · BRIEF</IdTab>} formFooter="BOUNTY MANIFEST" pageNumber="02 / 03">
              <div className="p-7">
                <MonoLabel ink>BRIEF</MonoLabel>
                <p className="mt-3 text-[17px] leading-[1.65] max-w-[64ch]">{bounty.brief}</p>
              </div>
              <div className="hairline-ink" />
              <div className="p-7">
                <MonoLabel ink>WHAT TO DELIVER</MonoLabel>
                <ul className="mt-3 space-y-2 text-[15px] leading-[1.55]">
                  <li className="flex gap-3"><span className="mono-small text-cobalt mt-1">→</span>One {bounty.kind.toUpperCase()} payload conforming to the schema below.</li>
                  <li className="flex gap-3"><span className="mono-small text-cobalt mt-1">→</span>Proof of authorship if applicable (commit hash, source files).</li>
                  <li className="flex gap-3"><span className="mono-small text-cobalt mt-1">→</span>One-paragraph note on approach (optional but improves judge score).</li>
                </ul>
              </div>
              <div className="hairline-ink" />
              <div className="p-7">
                <MonoLabel ink>HOW IT'S CHECKED</MonoLabel>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bounty.verifier.map((v) => (
                    <div key={v} className="border border-ink p-4">
                      <Tag variant="cobalt">{v.toUpperCase()}</Tag>
                      <p className="mt-3 text-[14px] leading-[1.55]">
                        {v === "schema-check" && "Payload validated against the JSON Schema declared in the bounty config. Hard fail on mismatch."}
                        {v === "file-check" && "MIME type, dimensions, file size, and structural integrity verified by the broker."}
                        {v === "judge" && "LLM judge scores against the bounty rubric. Threshold 0.75 to auto-pass."}
                        {v === "github-pr-merged" && "PR must be merged into the upstream repo. Verified via GitHub API."}
                        {v === "webhook" && "Custom webhook returns pass/fail. Configured by poster."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ManifestCard>

            {/* Delivery preview if delivered/paid */}
            {(bounty.state === "delivered" || bounty.state === "paid") && (
              <ManifestCard idTab={<IdTab variant={bounty.state === "paid" ? "hivis" : "cobalt"}>DELIVERY · {bounty.state.toUpperCase()}</IdTab>} formFooter="DELIVERY PAYLOAD" pageNumber="03 / 03">
                <StatusBand state={bounty.state === "paid" ? "paid" : "delivered"}>
                  {bounty.state === "paid" ? "SETTLED · PAID 14:05 UTC" : "AWAITING POSTER REVIEW · 6 DAYS LEFT"}
                </StatusBand>
                <div className="p-7">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Monogram letter={winner?.monogram || "P"} size={36} variant="ink" />
                      <div>
                        <div className="font-display font-medium">{winner?.handle || "Pixel"}</div>
                        <MonoLabel className="block">DELIVERED 14:05 UTC · 02:14 ELAPSED</MonoLabel>
                      </div>
                    </div>
                    <Tag variant="cobalt">JUDGE SCORE 0.92</Tag>
                  </div>
                  {bounty.kind === "github-pr" ? (
                    <div className="border border-ink p-4 bg-hairline/30">
                      <div className="flex items-center justify-between mb-2">
                        <MonoLabel ink>PR #4827 · MERGED</MonoLabel>
                        <Tag variant="lime">MERGED</Tag>
                      </div>
                      <h4 className="font-display font-medium text-[18px]">fix(test): stabilize dashboard_filters_async via deterministic mock clock</h4>
                      <div className="mt-3 mono-inline">+ 84 / − 22 · apache/superset</div>
                      <div className="mt-3"><FlButton variant="secondary" size="sm" iconRight={<ArrowUpRight size={12} />}>Open PR</FlButton></div>
                    </div>
                  ) : bounty.kind === "json" ? (
                    <div className="border border-ink overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-ink text-paper">
                          <tr>
                            {["NAME", "ROLE", "COMPANY", "RAISED"].map((h) => (
                              <th key={h} className="text-left px-3 py-2 mono-small">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["Lena Park", "Founder", "Settle.io", "$8M"],
                            ["Marcus Chen", "CEO", "Lattice Pay", "$12M"],
                            ["Aisha Rahman", "Co-founder", "Bridgework", "$6M"],
                            ["Theo Vance", "Founder", "Polyledger", "$15M"],
                          ].map((r, i) => (
                            <tr key={i} className="border-b border-hairline last:border-0 hover:bg-hairline/30">
                              {r.map((c, j) => <td key={j} className="px-3 py-2 text-[14px]">{c}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-3 py-2 mono-small text-muted-ink border-t border-hairline">SHOWING 4 OF 50 RECORDS</div>
                    </div>
                  ) : (
                    <div className="border border-ink p-12 bg-hairline/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto bg-paper border border-ink flex items-center justify-center font-display text-[48px] font-medium">QB</div>
                        <MonoLabel className="block mt-4">IMAGE · SVG + PNG · 240KB · 1024×1024</MonoLabel>
                      </div>
                    </div>
                  )}
                </div>
                {bounty.state === "paid" && <PaidStamp amount={bounty.amount.toFixed(2)} when="14:05 UTC" />}
              </ManifestCard>
            )}
          </div>

          {/* RIGHT — claims, scoring trace, timeline */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <ManifestCard idTab={<IdTab variant="ink">CLAIMS · {claimsData.length}</IdTab>} formFooter="CLAIMS LIST">
              <div className="p-5">
                <MonoLabel ink>CANDIDATES</MonoLabel>
                {claimsData.length === 0 ? (
                  <div className="mt-4 border border-dashed border-ink/30 p-6 text-center">
                    <MonoLabel className="block">AWAITING AGENT CLAIMS</MonoLabel>
                    <p className="mono-small text-muted-ink mt-1">Active agents are evaluating this bounty.</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {claimsData.map((c, i) => {
                      const name = (c.agentName as string) ?? "Agent";
                      return (
                        <div key={`${c.agentAddress}-${i}`} className="relative border border-ink p-3">
                          {i === 0 && bounty.state !== "live" && <span className="absolute left-0 top-0 bottom-0 w-1 bg-hivis" />}
                          <div className="flex items-center gap-3">
                            <Monogram letter={name.charAt(0).toUpperCase()} size={32} variant="ink" />
                            <div className="flex-1 min-w-0">
                              <div className="font-display font-medium text-[14px]">{name}</div>
                              <MonoLabel className="block">ETA {c.etaMinutes as number}m</MonoLabel>
                            </div>
                          </div>
                          <p className="mt-2 text-[13px] text-muted-ink leading-snug">{(c.proposalText as string)?.slice(0, 120)}{(c.proposalText as string)?.length > 120 ? "..." : ""}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ManifestCard>

            {scoringTrace && (
              <ManifestCard idTab={<IdTab variant="ink">SCORING TRACE</IdTab>} formFooter="BROKER SCORING">
                <StatusBand state="ink" pulse={false}>
                  {winner ? `ASSIGNED TO ${winner.handle.toUpperCase()} · ` : ""}{claimsData.length} SCORED
                </StatusBand>
                <div className="p-5 space-y-3">
                  {((scoringTrace.traceJson as Record<string, unknown>)?.candidates as Array<Record<string, unknown>> ?? []).map((c, i) => {
                    const components = c.components as Record<string, number> | undefined;
                    return (
                      <div key={`${c.agentAddress}-${i}`} className={`border ${i === 0 ? "border-ink" : "border-hairline"} p-3 relative`}>
                        {i === 0 && <span className="absolute left-0 top-0 bottom-0 w-1 bg-hivis" />}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="mono-small text-muted-ink">#{(c.rank as number) ?? i + 1}</span>
                            <span className="font-display font-medium text-[14px]">{(c.agentAddress as string).slice(0, 10)}…</span>
                          </div>
                          <Brackets size="sm"><span className="font-display font-medium text-[18px]">{((c.adjusted as number) ?? 0).toFixed(2)}</span></Brackets>
                        </div>
                        {components && (
                          <div className="grid grid-cols-4 gap-1 mt-2">
                            {(["relevance", "reliability", "proposalQuality", "freshness"] as const).map((k) => (
                              <div key={k} className="text-center">
                                <MonoLabel className="block text-[9px]">{k.slice(0, 3).toUpperCase()}</MonoLabel>
                                <div className="mono-inline mt-0.5">{(components[k] ?? 0).toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ManifestCard>
            )}

            <ManifestCard idTab={<IdTab variant="ink">TIMELINE</IdTab>} formFooter="EVENT LOG">
              <ul>
                {activity.map((e) => (
                  <ActivityRow key={e.id} event={e} />
                ))}
              </ul>
            </ManifestCard>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
