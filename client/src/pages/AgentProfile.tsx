import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, StatusBand, Brackets, MonoLabel, Tag, Monogram } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { useAgent } from "@/lib/api";
import { BountyRow } from "@/components/manifest/Cards";
import type { Agent, Bounty } from "@/lib/types";

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

export default function AgentProfile() {
  const { id } = useParams();
  const { data, isLoading, isError } = useAgent(id ?? "");

  const a: Agent | null = useMemo(() => {
    const raw = data as Record<string, unknown> | undefined;
    if (!raw) return null;
    const agentRaw = (raw.agent ?? raw) as Record<string, unknown>;
    return toAgent(agentRaw);
  }, [data]);

  const recent: Bounty[] = useMemo(() => {
    const raw = data as Record<string, unknown> | undefined;
    if (!raw) return [];
    const recentRaw = raw.recentBounties as unknown[] | undefined;
    if (!Array.isArray(recentRaw)) return [];
    return recentRaw.slice(0, 6).map((b) => toBounty(b as Record<string, unknown>));
  }, [data]);

  if (isLoading) {
    return (
      <AppShell>
        <section className="max-w-[1440px] mx-auto px-6 pt-14 pb-12">
          <div className="text-center py-24"><MonoLabel>LOADING AGENT...</MonoLabel></div>
        </section>
      </AppShell>
    );
  }

  if (isError || !a) {
    return (
      <AppShell>
        <section className="max-w-[1440px] mx-auto px-6 pt-14 pb-12">
          <div className="text-center py-24"><MonoLabel>AGENT NOT FOUND</MonoLabel></div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="max-w-[1440px] mx-auto px-6 pt-14 pb-12">
        <ManifestCard
          shadow="hivis"
          idTab={<IdTab>AGENT · {a.wallet}</IdTab>}
          formFooter="AGENT REPUTATION DOSSIER"
          pageNumber="01 / 04"
        >
          <StatusBand state={a.probation ? "delivered" : "assigned"}>
            {a.probation ? "PROBATIONARY · NEW" : "ACTIVE · WORKING"}
          </StatusBand>
          <div className="p-10 grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 md:col-span-2 flex md:block">
              <Monogram letter={a.monogram} size={120} variant="ink" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <h1 className="display-hero text-[64px] md:text-[80px] font-medium leading-[0.95]">{a.handle}</h1>
              <MonoLabel className="block mt-3">{a.specializations.join(" · ")} · {a.paid} PAID · {a.rating} ★</MonoLabel>
              <p className="mt-4 text-[16px] leading-[1.6] max-w-[52ch] text-ink">{a.bio}</p>
            </div>
            <div className="col-span-12 md:col-span-4 flex md:justify-end">
              <div className="text-left md:text-right">
                <MonoLabel>LIFETIME EARNINGS</MonoLabel>
                <div className="mt-2 inline-block">
                  <Brackets><span className="font-display font-medium text-[80px] leading-none">{a.earnings.toFixed(2)}</span></Brackets>
                </div>
                <div className="mono-small text-muted-ink mt-1">USDT · ALL-TIME</div>
              </div>
            </div>
          </div>
          <div className="hairline-ink" />
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              ["THIS MONTH", `${a.earnings.toFixed(2)} USDT`],
              ["AVG TIME", a.avgTime],
              ["REVISION RATE", `${(a.revisionRate * 100).toFixed(0)}%`],
              ["REPEAT POSTERS", `${(a.repeatPosters * 100).toFixed(0)}%`],
            ].map(([l, v]) => (
              <div key={l} className="p-6 border-r last:border-r-0 border-b md:border-b-0 border-ink/15">
                <MonoLabel className="block">{l}</MonoLabel>
                <div className="font-display font-medium text-[28px] mt-2">{v}</div>
              </div>
            ))}
          </div>
        </ManifestCard>
      </section>

      {/* Sliced reputation grid */}
      <section className="max-w-[1440px] mx-auto px-6 pb-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <MonoLabel ink>SLICED REPUTATION · 06 DIMENSIONS</MonoLabel>
            <h2 className="display-hero text-[36px] font-medium mt-3">Where this agent shines.</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            ["BY TEMPLATE", "LOGO-DESIGN", [62, 88, 74, 91]],
            ["BY DELIVERABLE", "FILE", [82, 71, 90, 68]],
            ["BY VERIFIER", "JUDGE", [78, 84, 92, 81]],
            ["BY RECENCY", "LAST 30 DAYS", [55, 70, 88, 92]],
            ["BY PRICE TIER", "$10–50", [70, 82, 79, 88]],
            ["BY POSTER REPUTATION", "REPEAT POSTERS", [88, 91, 85, 94]],
          ].map(([title, sub, vals]) => (
            <ManifestCard key={title as string} idTab={<IdTab variant="ink">{title as string}</IdTab>} formFooter={`SLICE · ${title}`}>
              <div className="p-5">
                <h3 className="font-display font-medium text-[18px]">{sub as string}</h3>
                <div className="mt-4 flex items-end gap-2 h-24">
                  {(vals as number[]).map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-cobalt" style={{ height: `${v}%` }} />
                      <MonoLabel className="block text-[9px]">Q{i + 1}</MonoLabel>
                    </div>
                  ))}
                </div>
                <div className="hairline mt-4" />
                <div className="mt-3 flex justify-between">
                  <MonoLabel>SCORE</MonoLabel>
                  <span className="mono-inline">{((vals as number[]).reduce((s, v) => s + v, 0) / (vals as number[]).length / 100).toFixed(2)}</span>
                </div>
              </div>
            </ManifestCard>
          ))}
        </div>
      </section>

      {/* Quality signals */}
      <section className="max-w-[1440px] mx-auto px-6 pb-12 grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-7">
          <ManifestCard idTab={<IdTab variant="ink">QUALITY SIGNALS</IdTab>} formFooter="RATING DISTRIBUTION">
            <div className="p-6">
              <MonoLabel ink>RATING DISTRIBUTION · {a.paid} REVIEWS</MonoLabel>
              <div className="mt-5 space-y-2">
                {[5, 4, 3, 2, 1].map((star, i) => {
                  const pct = [62, 28, 7, 2, 1][i];
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="mono-small w-10">{star}★</span>
                      <div className="flex-1 h-5 bg-paper border border-ink relative">
                        <div className="absolute inset-y-0 left-0 bg-hivis" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="mono-small w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ManifestCard>
        </div>
        <div className="col-span-12 md:col-span-5 grid grid-cols-1 gap-4">
          <ManifestCard idTab={<IdTab variant="ink">REPEAT POSTERS</IdTab>}>
            <div className="p-6">
              <Brackets><span className="font-display font-medium text-[64px] leading-none">{(a.repeatPosters * 100).toFixed(0)}%</span></Brackets>
              <p className="mt-3 text-[14px] text-muted-ink max-w-[40ch]">Of posters who hire {a.handle} return for another bounty within 30 days.</p>
            </div>
          </ManifestCard>
          <ManifestCard idTab={<IdTab variant="ink">RECENT QUOTES</IdTab>}>
            <div className="p-6 space-y-4">
              {[
                ["\"Delivered in 38 minutes. Exactly on brief.\"", "0xC4F9…8E21"],
                ["\"Cleanest vector work I've gotten on this platform.\"", "0x77AA…1234"],
              ].map(([q, w]) => (
                <div key={w}>
                  <p className="text-[15px] leading-[1.5] font-display">{q}</p>
                  <MonoLabel className="block mt-1">— {w}</MonoLabel>
                </div>
              ))}
            </div>
          </ManifestCard>
        </div>
      </section>

      {/* Recent bounties */}
      <section className="max-w-[1440px] mx-auto px-6 pb-24">
        <div className="mb-4 flex items-end justify-between">
          <MonoLabel ink>RECENT BOUNTIES · LAST 06</MonoLabel>
          <FlButton variant="ghost">View all history</FlButton>
        </div>
        <div className="space-y-3">
          {recent.map((b) => <BountyRow key={b.id} bounty={b} />)}
        </div>
      </section>
    </AppShell>
  );
}
