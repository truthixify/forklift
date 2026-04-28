import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, StatusBand, Brackets, MonoLabel, Monogram } from "@/components/manifest/Manifest";
import { usePoster } from "@/lib/api";
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

export default function PosterProfile() {
  const { id } = useParams();
  const { data, isLoading, isError } = usePoster(id ?? "");

  const me = data as Record<string, unknown> | undefined;
  const user = (me?.user ?? me) as Record<string, unknown> | undefined;
  const aggregates = (me?.aggregates ?? {}) as Record<string, unknown>;

  const handle = (user?.handle ?? user?.displayName ?? user?.address ?? id ?? "") as string;
  const monogram = (user?.monogram ?? handle.charAt(0).toUpperCase()) as string;
  const wallet = (user?.wallet ?? user?.address ?? id ?? "") as string;
  const joined = (user?.joined ?? user?.createdAt ?? "") as string;
  const posted = Number(aggregates.posted ?? aggregates.bountiesPosted ?? user?.posted ?? 0);
  const paid = Number(aggregates.paid ?? aggregates.bountiesPaid ?? user?.paid ?? 0);
  const disputeRate = Number(aggregates.disputeRate ?? user?.disputeRate ?? 0);
  const avgReviewTime = (aggregates.avgReviewTime ?? user?.avgReviewTime ?? "—") as string;
  const repeatAgents = Number(aggregates.repeatAgents ?? user?.repeatAgents ?? 0);

  const recent: Bounty[] = useMemo(() => {
    const raw = (me?.recentBounties ?? []) as unknown[];
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, 5).map((b) => toBounty(b as Record<string, unknown>));
  }, [me]);

  if (isLoading) {
    return (
      <AppShell>
        <section className="max-w-[1440px] mx-auto px-6 pt-14 pb-12">
          <div className="text-center py-24"><MonoLabel>LOADING POSTER...</MonoLabel></div>
        </section>
      </AppShell>
    );
  }

  if (isError || !user) {
    return (
      <AppShell>
        <section className="max-w-[1440px] mx-auto px-6 pt-14 pb-12">
          <div className="text-center py-24"><MonoLabel>POSTER NOT FOUND</MonoLabel></div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="max-w-[1440px] mx-auto px-6 pt-14 pb-12">
        <ManifestCard
          shadow="cobalt"
          idTab={<IdTab>POSTER · {wallet}</IdTab>}
          formFooter="POSTER REPUTATION DOSSIER"
          pageNumber="01 / 02"
        >
          <StatusBand state="delivered">ACTIVE POSTER · TRUSTED</StatusBand>
          <div className="p-10 grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 md:col-span-2"><Monogram letter={monogram} size={120} variant="ink" /></div>
            <div className="col-span-12 md:col-span-6">
              <h1 className="display-hero text-[64px] md:text-[80px] font-medium leading-[0.95]">{handle}</h1>
              <MonoLabel className="block mt-3">JOINED {joined} · {posted} POSTED · {paid} PAID</MonoLabel>
              <p className="mt-4 text-[16px] max-w-[52ch]">A consistent poster who reviews quickly and pays without dispute. Repeat-hires {(repeatAgents * 100).toFixed(0)}% of agents within a quarter.</p>
            </div>
            <div className="col-span-12 md:col-span-4 md:text-right">
              <MonoLabel>LIFETIME PAID</MonoLabel>
              <div className="mt-2 inline-block">
                <Brackets><span className="font-display font-medium text-[72px] leading-none">{(paid * 28).toFixed(0)}</span></Brackets>
              </div>
              <div className="mono-small text-muted-ink mt-1">USDT · ALL-TIME</div>
            </div>
          </div>
          <div className="hairline-ink" />
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              ["BOUNTIES POSTED", posted],
              ["DISPUTE RATE", `${(disputeRate * 100).toFixed(0)}%`],
              ["AVG REVIEW TIME", avgReviewTime],
              ["REPEAT AGENTS", `${(repeatAgents * 100).toFixed(0)}%`],
            ].map(([l, v]) => (
              <div key={l as string} className="p-6 border-r last:border-r-0 border-b md:border-b-0 border-ink/15">
                <MonoLabel className="block">{l}</MonoLabel>
                <div className="font-display font-medium text-[28px] mt-2">{v}</div>
              </div>
            ))}
          </div>
        </ManifestCard>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 pb-24">
        <MonoLabel ink className="block mb-4">RECENT BOUNTIES POSTED</MonoLabel>
        <div className="space-y-3">{recent.map((b) => <BountyRow key={b.id} bounty={b} />)}</div>
      </section>
    </AppShell>
  );
}
