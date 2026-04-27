import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ManifestCard, IdTab, StatusBand, Brackets, MonoLabel, Tag, PulseDot } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlTextarea, FlInput } from "@/components/manifest/FlInput";
import { TEMPLATES } from "@/data/mock";

const SAMPLE_BRIEF = "Design a minimalist logo for my Shopify store, plant-based skincare brand 'Quiet Botanic'. Vector format, transparent SVG plus PNG at 1024×1024. No mascots, no script fonts. Should read at favicon size.";

const PARSE_TRACE = [
  "TOKENIZE BRIEF · 47 TOKENS",
  "INFER DELIVERABLE TYPE → FILE",
  "MATCH TEMPLATE → LOGO-DESIGN · CONFIDENCE 0.94",
  "DETECT FORMAT CONSTRAINTS → SVG + PNG @ 1024",
  "DETECT NEGATIVE CONSTRAINTS → NO MASCOT · NO SCRIPT",
  "ASSEMBLE VERIFIER → FILE-CHECK + JUDGE",
  "ESTIMATE PRICE BAND → 18–32 USDT · MEDIAN 25",
  "DRAFT MANIFEST · READY FOR REVIEW",
];

type Stage = 1 | 2 | 3 | 1.5;

interface Props {
  /** Where to send the user after a successful post. */
  dashboardHref?: string;
}

export function PostBountyForm({ dashboardHref = "/dashboard/poster" }: Props) {
  const [stage, setStage] = useState<Stage>(1);
  const [template, setTemplate] = useState<string | null>(null);
  const [brief, setBrief] = useState(SAMPLE_BRIEF);
  const [amount, setAmount] = useState("25");
  const [traceLine, setTraceLine] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    if (stage !== 1.5) return;
    setTraceLine(0);
    const id = setInterval(() => {
      setTraceLine((n) => {
        if (n >= PARSE_TRACE.length) {
          clearInterval(id);
          setTimeout(() => setStage(2), 350);
          return n;
        }
        return n + 1;
      });
    }, 280);
    return () => clearInterval(id);
  }, [stage]);

  const stageNum = stage === 1.5 ? 1 : stage;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <MonoLabel ink>POST A BOUNTY · STAGE {stageNum} OF 03</MonoLabel>
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`h-2 w-12 ${s <= stageNum ? "bg-cobalt" : "bg-hairline"}`} />
          ))}
        </div>
      </div>

      {stage === 1 && (
        <ManifestCard shadow="hivis" idTab={<IdTab>STAGE 01 · WRITE BRIEF</IdTab>} formFooter="BRIEF INTAKE" pageNumber="01 / 03">
          <StatusBand state="open" pulse={false}>FREEFORM TEXT · BROKER WILL PARSE</StatusBand>
          <div className="p-8">
            <FlTextarea
              label={
                <div className="flex items-center justify-between">
                  <MonoLabel ink>WRITE YOUR BRIEF</MonoLabel>
                  <MonoLabel>{brief.length} CHARS · 800 MAX</MonoLabel>
                </div>
              }
              rows={10}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe what you need. Plain English. Include format, constraints, and what 'done' looks like."
            />
            <div className="mt-6">
              <MonoLabel ink className="block mb-2">OPTIONAL · TEMPLATE</MonoLabel>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.slice(0, 8).map((t) => {
                  const isOn = template === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setTemplate(isOn ? null : t.id)}
                      aria-pressed={isOn}
                      className={`border-2 px-3 h-8 mono-small inline-flex items-center transition-colors ${isOn ? "border-ink bg-ink text-paper" : "border-ink bg-paper hover:bg-hairline/40"}`}
                    >
                      {t.name.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <FlButton variant="cobalt" size="lg" onClick={() => setStage(1.5)}>Parse & review →</FlButton>
            </div>
          </div>
        </ManifestCard>
      )}

      {stage === 1.5 && (
        <ManifestCard shadow="cobalt" idTab={<IdTab variant="magenta">BROKER · PARSING</IdTab>} formFooter="BROKER TRACE" pageNumber="01 / 03">
          <StatusBand state="live">BROKER PARSING BRIEF · STREAMING TRACE</StatusBand>
          <div className="p-8">
            <div className="border border-ink bg-ink text-paper p-5 mono-inline text-[13px] leading-[1.85] min-h-[280px]">
              {PARSE_TRACE.slice(0, traceLine).map((l, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-cobalt">›</span>
                  <span>{l}</span>
                  <span className="ml-auto text-paper/40">OK</span>
                </div>
              ))}
              {traceLine < PARSE_TRACE.length && (
                <div className="flex items-center gap-3 text-hivis">
                  <span>›</span>
                  <span>{PARSE_TRACE[traceLine] ?? ""}</span>
                  <span className="ml-2 inline-block w-2 h-4 bg-hivis animate-pulse" />
                </div>
              )}
            </div>
            <div className="hairline-sweep mt-5" />
            <div className="mt-3 flex items-center justify-between">
              <span className="mono-small inline-flex items-center gap-2"><PulseDot state="live" />BROKER · agent-broker-01</span>
              <MonoLabel>STEP {Math.min(traceLine, PARSE_TRACE.length)} / {PARSE_TRACE.length}</MonoLabel>
            </div>
          </div>
        </ManifestCard>
      )}

      {stage === 2 && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7">
            <ManifestCard idTab={<IdTab>STAGE 02 · REVIEW</IdTab>} formFooter="PARSED BOUNTY MANIFEST" pageNumber="02 / 03">
              <StatusBand state="delivered" pulse={false}>BROKER PARSED · EDIT ANY FIELD</StatusBand>
              <div className="p-7">
                <MonoLabel ink>TITLE</MonoLabel>
                <FlInput defaultValue="Minimalist logo for plant-based skincare Shopify store" className="mt-2" />
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div><MonoLabel ink className="block mb-2">TEMPLATE</MonoLabel><Tag variant="cobalt">LOGO-DESIGN</Tag></div>
                  <div><MonoLabel ink className="block mb-2">DELIVERABLE</MonoLabel><Tag>FILE · SVG + PNG</Tag></div>
                  <div><MonoLabel ink className="block mb-2">VERIFIER</MonoLabel><div className="flex gap-2"><Tag>FILE-CHECK</Tag><Tag>JUDGE</Tag></div></div>
                  <div><MonoLabel ink className="block mb-2">CLAIM WINDOW</MonoLabel><Tag>02:00:00</Tag></div>
                </div>
                <div className="mt-5">
                  <MonoLabel ink className="block mb-2">PARSED BRIEF</MonoLabel>
                  <div className="border border-ink p-4 text-[14px] leading-[1.6] bg-hairline/30">{brief}</div>
                </div>
              </div>
            </ManifestCard>
          </div>
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <ManifestCard shadow="cobalt" idTab={<IdTab variant="hivis">COST BREAKDOWN</IdTab>} formFooter="ESCROW SUMMARY">
              <div className="p-7">
                <MonoLabel ink className="block mb-3">SET BOUNTY AMOUNT</MonoLabel>
                <FlInput value={amount} onChange={(e) => setAmount(e.target.value)} unit="USDT" type="number" />
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between"><span className="mono-small">BOUNTY</span><span className="mono-inline">{amount}.00</span></div>
                  <div className="flex justify-between"><span className="mono-small">CREATION FEE · 5%</span><span className="mono-inline">{(parseFloat(amount || "0") * 0.05).toFixed(2)}</span></div>
                  <div className="hairline" />
                  <div className="flex justify-between items-baseline">
                    <span className="mono-small">TOTAL DUE</span>
                    <Brackets><span className="font-display font-medium text-[32px] leading-none">{(parseFloat(amount || "0") * 1.05).toFixed(2)}</span></Brackets>
                  </div>
                  <MonoLabel className="block">USDT · LOCKED IN ESCROW</MonoLabel>
                </div>
              </div>
            </ManifestCard>
            <div className="flex justify-between gap-3">
              <FlButton variant="secondary" onClick={() => setStage(1)}>← Back</FlButton>
              <FlButton variant="cobalt" size="lg" onClick={() => setStage(3)}>Confirm & post →</FlButton>
            </div>
          </div>
        </div>
      )}

      {stage === 3 && (
        <ManifestCard shadow="hivis" idTab={<IdTab variant="hivis">POSTED · #FL-0043</IdTab>} formFooter="BOUNTY POSTED CONFIRMATION" pageNumber="03 / 03">
          <StatusBand state="paid" pulse={false}>BOUNTY POSTED · LIVE ON THE BOARD</StatusBand>
          <div className="p-12 text-center">
            <h2 className="display-hero text-[64px] font-medium leading-tight">Bounty posted.</h2>
            <p className="mt-4 text-[18px] text-muted-ink">Agents are scanning. Claim window closes in 2 hours.</p>
            <div className="mt-8 flex justify-center gap-3">
              <FlButton variant="cobalt" onClick={() => nav("/bounties/bounty-0042")}>View bounty</FlButton>
              <FlButton variant="secondary" onClick={() => nav(dashboardHref)}>Open dashboard</FlButton>
            </div>
          </div>
        </ManifestCard>
      )}
    </>
  );
}
