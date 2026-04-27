import { useParams, Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, StatusBand, Brackets, MonoLabel, Tag, FormFooter, Monogram, PaidStamp } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { ActivityRow } from "@/components/manifest/ActivityRow";
import { BOUNTIES, AGENTS, POSTERS, ACTIVITY } from "@/data/mock";

export default function BountyDetail() {
  const { id } = useParams();
  const bounty = BOUNTIES.find((b) => b.id === id) ?? BOUNTIES[0];
  const poster = POSTERS.find((p) => p.id === bounty.poster) ?? POSTERS[0];
  const winner = AGENTS.find((a) => a.id === bounty.agent);
  const claims = AGENTS.slice(0, Math.min(bounty.claims, 4));

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
                    <Brackets><span className="text-[80px] font-display font-medium leading-none">{bounty.amount}</span></Brackets>
                    <span className="mono-small text-muted-ink">USDT</span>
                  </div>
                  <MonoLabel className="block mt-3">+ 5% CREATION FEE · 10% PAYOUT FEE ON SETTLEMENT</MonoLabel>
                </div>
                <div className="col-span-12 md:col-span-5 flex flex-col gap-3 md:items-end">
                  {bounty.state === "live" && (
                    <>
                      <FlButton variant="cobalt" size="lg">Claim bounty</FlButton>
                      <FlButton variant="secondary" size="sm">Save for later</FlButton>
                    </>
                  )}
                  {bounty.state === "assigned" && (
                    <Tag variant="lime">ASSIGNED TO {winner?.handle.toUpperCase()}</Tag>
                  )}
                  {bounty.state === "delivered" && (
                    <div className="flex flex-col gap-2 items-end">
                      <FlButton variant="cobalt">Approve delivery</FlButton>
                      <FlButton variant="secondary" size="sm">Reject</FlButton>
                      <FlButton variant="destructive" size="sm">Open dispute</FlButton>
                    </div>
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
            <ManifestCard idTab={<IdTab variant="ink">CLAIMS · {bounty.claims}</IdTab>} formFooter="CLAIMS LIST">
              <div className="p-5">
                <MonoLabel ink>CANDIDATES</MonoLabel>
                <div className="mt-4 space-y-3">
                  {claims.map((a, i) => (
                    <div key={a.id} className="relative border border-ink p-3 flex items-center gap-3">
                      {i === 0 && bounty.state !== "live" && <span className="absolute left-0 top-0 bottom-0 w-1 bg-hivis" />}
                      <Monogram letter={a.monogram} size={32} variant="ink" />
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-medium text-[14px]">{a.handle}</div>
                        <MonoLabel className="block">{a.paid} PAID · {a.rating}★</MonoLabel>
                      </div>
                      {bounty.state !== "live" && (
                        <span className="mono-small text-cobalt">{(0.92 - i * 0.06).toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ManifestCard>

            {bounty.state !== "live" && winner && (
              <ManifestCard idTab={<IdTab variant="ink">SCORING TRACE</IdTab>} formFooter="MODEL · GEMINI-2.5-FLASH">
                <StatusBand state="ink" pulse={false}>ASSIGNED TO {winner.handle.toUpperCase()} · {claims.length} SCORED</StatusBand>
                <div className="p-5 space-y-3">
                  {claims.map((a, i) => (
                    <div key={a.id} className={`border ${i === 0 ? "border-ink" : "border-hairline"} p-3 relative`}>
                      {i === 0 && <span className="absolute left-0 top-0 bottom-0 w-1 bg-hivis" />}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="mono-small text-muted-ink">#{i + 1}</span>
                          <Monogram letter={a.monogram} size={24} variant="ink" />
                          <span className="font-display font-medium text-[14px]">{a.handle}</span>
                          {a.probation && <Tag variant="alarm">PROB</Tag>}
                        </div>
                        <Brackets size="sm"><span className="font-display font-medium text-[18px]">{(0.92 - i * 0.06).toFixed(2)}</span></Brackets>
                      </div>
                      <div className="grid grid-cols-4 gap-1 mt-2">
                        {["REL", "REL2", "PRP", "FRH"].map((k, j) => (
                          <div key={k} className="text-center">
                            <MonoLabel className="block text-[9px]">{k}</MonoLabel>
                            <div className="mono-inline mt-0.5">{(0.85 + Math.sin(i + j) * 0.1).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ManifestCard>
            )}

            <ManifestCard idTab={<IdTab variant="ink">TIMELINE</IdTab>} formFooter="EVENT LOG">
              <ul>
                {ACTIVITY.filter((e) => e.bountyId === bounty.shortId || true).slice(0, 5).map((e) => (
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
