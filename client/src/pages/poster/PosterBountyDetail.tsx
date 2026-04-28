import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, StatusBand, MonoLabel, Tag, PulseDot, Monogram } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { useBounty, useBountyState, useDelivery } from "@/lib/api";

export default function PosterBountyDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: bountyData, isLoading } = useBounty(id ?? "");
  const { data: stateData } = useBountyState(id ?? "");
  const { data: deliveryData } = useDelivery(id ?? "");

  const raw = bountyData as Record<string, unknown> | undefined;
  const sig = raw?.signature as Record<string, unknown> | undefined;
  const events = (raw?.events ?? []) as Array<Record<string, unknown>>;
  const state = (stateData as Record<string, unknown>)?.state as string ?? "live";
  const delivery = (deliveryData as Record<string, unknown>)?.delivery as Record<string, unknown> | undefined;
  const verifierResult = (deliveryData as Record<string, unknown>)?.verifierResult as Record<string, unknown> | undefined;

  const title = (sig?.title as string) ?? `Bounty ${(id ?? "").slice(0, 10)}…`;
  const brief = (sig?.description as string) ?? (sig?.brief as string) ?? "";
  const template = (sig?.templateId as string) ?? "";
  const shortId = `FL-${(id ?? "").slice(-4).toUpperCase()}`;

  if (isLoading) {
    return (
      <DashboardLayout role="poster" title="Bounty." subtitle="Loading bounty details...">
        <div className="border-2 border-ink p-12 text-center"><MonoLabel ink>LOADING...</MonoLabel></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="poster" title={title} subtitle={`${shortId} · ${state.toUpperCase()}`}>
      <ManifestCard idTab={<IdTab variant={state === "live" ? "magenta" : state === "paid" ? "hivis" : "ink"}>{shortId} · {state.toUpperCase()}</IdTab>} formFooter="BOUNTY MANIFEST">
        <StatusBand state={state === "live" ? "live" : state === "paid" ? "paid" : "delivered"}>{state.toUpperCase()}</StatusBand>
        <div className="p-7 space-y-5">
          <div>
            <MonoLabel ink>BRIEF</MonoLabel>
            <p className="mt-2 text-[15px] leading-[1.6]">{brief}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {template && <div><MonoLabel ink className="block mb-1">TEMPLATE</MonoLabel><Tag variant="cobalt">{template.toUpperCase()}</Tag></div>}
            <div><MonoLabel ink className="block mb-1">STATE</MonoLabel><Tag>{state.toUpperCase()}</Tag></div>
          </div>
        </div>
      </ManifestCard>

      {delivery && (
        <ManifestCard idTab={<IdTab variant="cobalt">DELIVERY</IdTab>} formFooter="AGENT DELIVERY">
          <div className="p-7 space-y-4">
            <div><MonoLabel ink>PAYLOAD KIND</MonoLabel><span className="mono-inline ml-2">{(delivery.payloadKind as string) ?? "—"}</span></div>
            <div><MonoLabel ink>ATTEMPT</MonoLabel><span className="mono-inline ml-2">#{(delivery.attemptNumber as number) ?? 1}</span></div>
            {verifierResult && (
              <div className="border border-ink p-4">
                <MonoLabel ink className="block mb-2">VERIFIER RESULT</MonoLabel>
                <div className="flex items-center gap-3">
                  <PulseDot state={(verifierResult.passed as boolean) ? "paid" : "ink"} />
                  <span className="mono-inline">{(verifierResult.passed as boolean) ? "PASSED" : "FAILED"}</span>
                </div>
                {verifierResult.reasoning && <p className="mt-2 text-[13px] text-muted-ink">{verifierResult.reasoning as string}</p>}
              </div>
            )}
          </div>
        </ManifestCard>
      )}

      <ManifestCard idTab={<IdTab variant="ink">EVENTS · {events.length}</IdTab>} formFooter="ON-CHAIN HISTORY">
        <div className="divide-y divide-hairline">
          {events.length === 0 && <div className="p-7 text-center"><MonoLabel>NO EVENTS YET</MonoLabel></div>}
          {events.map((e, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-4">
              <Monogram letter={(e.eventName as string)?.charAt(0) ?? "E"} size={28} variant="ink" />
              <div className="flex-1 min-w-0">
                <span className="mono-small">{(e.eventName as string) ?? "EVENT"}</span>
              </div>
              <span className="mono-small text-muted-ink">{e.indexedAt ? new Date(e.indexedAt as string).toLocaleTimeString() : ""}</span>
            </div>
          ))}
        </div>
      </ManifestCard>
    </DashboardLayout>
  );
}
