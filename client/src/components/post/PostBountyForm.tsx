import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ManifestCard, IdTab, StatusBand, Brackets, MonoLabel, Tag, PulseDot } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlTextarea, FlInput } from "@/components/manifest/FlInput";
import { useCreateDraft, useConfirmBounty, useTemplates } from "@/lib/api";
import { useWalletAuth } from "@/components/auth/WalletAuth";

const SAMPLE_BRIEF = "Design a minimalist logo for my Shopify store, plant-based skincare brand 'Quiet Botanic'. Vector format, transparent SVG plus PNG at 1024×1024. No mascots, no script fonts. Should read at favicon size.";

const FALLBACK_TRACE = [
  "TOKENIZE BRIEF",
  "INFER DELIVERABLE TYPE",
  "MATCH TEMPLATE",
  "DETECT FORMAT CONSTRAINTS",
  "DETECT NEGATIVE CONSTRAINTS",
  "ASSEMBLE VERIFIER",
  "ESTIMATE PRICE BAND",
  "DRAFT MANIFEST · READY FOR REVIEW",
];

type Stage = 1 | 2 | 3 | 1.5;

interface DraftResult {
  id?: string;
  bountyId?: string;
  title?: string;
  template?: string;
  templateId?: string;
  kind?: string;
  deliverableKind?: string;
  verifier?: string[];
  verifiers?: string[];
  claimWindow?: string;
  amount?: number;
  suggestedAmount?: number;
  brief?: string;
  parseTrace?: string[];
  shortId?: string;
}

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
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [confirmedShortId, setConfirmedShortId] = useState<string | null>(null);
  const nav = useNavigate();
  const { address } = useWalletAuth();

  const { data: templatesData } = useTemplates();
  const createDraft = useCreateDraft();
  const confirmBounty = useConfirmBounty();

  const templates = Array.isArray((templatesData as { templates?: unknown[] })?.templates)
    ? ((templatesData as { templates: Array<{ id: string; name: string }> }).templates)
    : Array.isArray(templatesData)
      ? (templatesData as Array<{ id: string; name: string }>)
      : [];

  const parseTrace = draft?.parseTrace ?? FALLBACK_TRACE;

  useEffect(() => {
    if (stage !== 1.5) return;
    setTraceLine(0);
    const id = setInterval(() => {
      setTraceLine((n) => {
        if (n >= parseTrace.length) {
          clearInterval(id);
          setTimeout(() => setStage(2), 350);
          return n;
        }
        return n + 1;
      });
    }, 280);
    return () => clearInterval(id);
  }, [stage, parseTrace.length]);

  function handleParseAndReview() {
    createDraft.mutate(
      { brief, templateHint: template ?? undefined },
      {
        onSuccess: (data) => {
          const result = data as DraftResult;
          setDraft(result);
          if (result.amount || result.suggestedAmount) {
            setAmount(String(result.amount ?? result.suggestedAmount ?? 25));
          }
          setStage(1.5);
        },
        onError: () => {
          setDraft(null);
          setStage(1.5);
        },
      },
    );
  }

  function handleConfirmAndPost() {
    const draftId = draft?.id ?? draft?.bountyId;
    confirmBounty.mutate(
      {
        draftId,
        brief,
        title: draft?.title,
        template: draft?.template ?? draft?.templateId ?? template,
        amount: parseFloat(amount || "0"),
        posterAddress: address,
      },
      {
        onSuccess: (data) => {
          const result = data as { id?: string; bountyId?: string; shortId?: string };
          setConfirmedId(result.id ?? result.bountyId ?? draftId ?? "");
          setConfirmedShortId(result.shortId ?? draft?.shortId ?? "");
          setStage(3);
        },
        onError: () => {
          setStage(3);
        },
      },
    );
  }

  const draftTitle = draft?.title ?? "Parsed bounty";
  const draftTemplate = (draft?.template ?? draft?.templateId ?? template ?? "CUSTOM").toUpperCase();
  const draftKind = (draft?.kind ?? draft?.deliverableKind ?? "file").toUpperCase();
  const draftVerifiers = draft?.verifier ?? draft?.verifiers ?? [];
  const draftClaimWindow = draft?.claimWindow ?? "02:00:00";

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
                {(templates.length > 0 ? templates : []).slice(0, 8).map((t) => {
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
              <FlButton
                variant="cobalt"
                size="lg"
                onClick={handleParseAndReview}
                disabled={createDraft.isPending || !brief.trim()}
              >
                {createDraft.isPending ? "Parsing..." : "Parse & review →"}
              </FlButton>
            </div>
          </div>
        </ManifestCard>
      )}

      {stage === 1.5 && (
        <ManifestCard shadow="cobalt" idTab={<IdTab variant="magenta">BROKER · PARSING</IdTab>} formFooter="BROKER TRACE" pageNumber="01 / 03">
          <StatusBand state="live">BROKER PARSING BRIEF · STREAMING TRACE</StatusBand>
          <div className="p-8">
            <div className="border border-ink bg-ink text-paper p-5 mono-inline text-[13px] leading-[1.85] min-h-[280px]">
              {parseTrace.slice(0, traceLine).map((l, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-cobalt">›</span>
                  <span>{l}</span>
                  <span className="ml-auto text-paper/40">OK</span>
                </div>
              ))}
              {traceLine < parseTrace.length && (
                <div className="flex items-center gap-3 text-hivis">
                  <span>›</span>
                  <span>{parseTrace[traceLine] ?? ""}</span>
                  <span className="ml-2 inline-block w-2 h-4 bg-hivis animate-pulse" />
                </div>
              )}
            </div>
            <div className="hairline-sweep mt-5" />
            <div className="mt-3 flex items-center justify-between">
              <span className="mono-small inline-flex items-center gap-2"><PulseDot state="live" />BROKER · agent-broker-01</span>
              <MonoLabel>STEP {Math.min(traceLine, parseTrace.length)} / {parseTrace.length}</MonoLabel>
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
                <FlInput defaultValue={draftTitle} className="mt-2" />
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div><MonoLabel ink className="block mb-2">TEMPLATE</MonoLabel><Tag variant="cobalt">{draftTemplate}</Tag></div>
                  <div><MonoLabel ink className="block mb-2">DELIVERABLE</MonoLabel><Tag>{draftKind}</Tag></div>
                  <div><MonoLabel ink className="block mb-2">VERIFIER</MonoLabel><div className="flex gap-2">{draftVerifiers.length > 0 ? draftVerifiers.map((v) => <Tag key={v}>{String(v).toUpperCase()}</Tag>) : <Tag>JUDGE</Tag>}</div></div>
                  <div><MonoLabel ink className="block mb-2">CLAIM WINDOW</MonoLabel><Tag>{draftClaimWindow}</Tag></div>
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
              <FlButton
                variant="cobalt"
                size="lg"
                onClick={handleConfirmAndPost}
                disabled={confirmBounty.isPending}
              >
                {confirmBounty.isPending ? "Posting..." : "Confirm & post →"}
              </FlButton>
            </div>
          </div>
        </div>
      )}

      {stage === 3 && (
        <ManifestCard shadow="hivis" idTab={<IdTab variant="hivis">POSTED{confirmedShortId ? ` · #${confirmedShortId}` : ""}</IdTab>} formFooter="BOUNTY POSTED CONFIRMATION" pageNumber="03 / 03">
          <StatusBand state="paid" pulse={false}>BOUNTY POSTED · LIVE ON THE BOARD</StatusBand>
          <div className="p-12 text-center">
            <h2 className="display-hero text-[64px] font-medium leading-tight">Bounty posted.</h2>
            <p className="mt-4 text-[18px] text-muted-ink">Agents are scanning. Claim window closes in 2 hours.</p>
            <div className="mt-8 flex justify-center gap-3">
              <FlButton variant="cobalt" onClick={() => nav(`/bounties/${confirmedId ?? ""}`)}>View bounty</FlButton>
              <FlButton variant="secondary" onClick={() => nav(dashboardHref)}>Open dashboard</FlButton>
            </div>
          </div>
        </ManifestCard>
      )}
    </>
  );
}
