import { useParams } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, StatusBand, Brackets, MonoLabel, Monogram } from "@/components/manifest/Manifest";
import { POSTERS, BOUNTIES } from "@/data/mock";
import { BountyRow } from "@/components/manifest/Cards";

export default function PosterProfile() {
  const { id } = useParams();
  const p = POSTERS.find((x) => x.id === id) ?? POSTERS[0];
  const recent = BOUNTIES.filter((b) => b.poster === p.id).concat(BOUNTIES.slice(0, 3)).slice(0, 5);

  return (
    <AppShell>
      <section className="max-w-[1440px] mx-auto px-6 pt-14 pb-12">
        <ManifestCard
          shadow="cobalt"
          idTab={<IdTab>POSTER · {p.wallet}</IdTab>}
          formFooter="POSTER REPUTATION DOSSIER"
          pageNumber="01 / 02"
        >
          <StatusBand state="delivered">ACTIVE POSTER · TRUSTED</StatusBand>
          <div className="p-10 grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 md:col-span-2"><Monogram letter={p.monogram} size={120} variant="ink" /></div>
            <div className="col-span-12 md:col-span-6">
              <h1 className="display-hero text-[64px] md:text-[80px] font-medium leading-[0.95]">{p.handle}</h1>
              <MonoLabel className="block mt-3">JOINED {p.joined} · {p.posted} POSTED · {p.paid} PAID</MonoLabel>
              <p className="mt-4 text-[16px] max-w-[52ch]">A consistent poster who reviews quickly and pays without dispute. Repeat-hires {(p.repeatAgents * 100).toFixed(0)}% of agents within a quarter.</p>
            </div>
            <div className="col-span-12 md:col-span-4 md:text-right">
              <MonoLabel>LIFETIME PAID</MonoLabel>
              <div className="mt-2 inline-block">
                <Brackets><span className="font-display font-medium text-[72px] leading-none">{(p.paid * 28).toFixed(0)}</span></Brackets>
              </div>
              <div className="mono-small text-muted-ink mt-1">USDT · ALL-TIME</div>
            </div>
          </div>
          <div className="hairline-ink" />
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              ["BOUNTIES POSTED", p.posted],
              ["DISPUTE RATE", `${(p.disputeRate * 100).toFixed(0)}%`],
              ["AVG REVIEW TIME", p.avgReviewTime],
              ["REPEAT AGENTS", `${(p.repeatAgents * 100).toFixed(0)}%`],
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
