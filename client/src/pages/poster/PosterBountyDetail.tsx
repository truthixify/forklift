import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, StatusBand, MonoLabel, Tag, PulseDot, Monogram, Brackets } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { useBounty, useApproveBounty, useRejectBounty } from "@/lib/api";
import { useWalletAuth } from "@/components/auth/WalletAuth";

export default function PosterBountyDetail() {
  const { id } = useParams<{ id: string }>();
  const { address } = useWalletAuth();
  const { data: bountyData, isLoading } = useBounty(id ?? "");
  const approveMutation = useApproveBounty();
  const rejectMutation = useRejectBounty();

  const raw = bountyData as Record<string, unknown> | undefined;
  const sig = raw?.signature as Record<string, unknown> | undefined;
  const events = (raw?.events ?? []) as Array<Record<string, unknown>>;
  const claims = (raw?.claims ?? []) as Array<Record<string, unknown>>;
  const delivery = raw?.delivery as Record<string, unknown> | undefined;
  const verifierResult = raw?.verifierResult as Record<string, unknown> | undefined;
  const scoringTrace = raw?.scoringTrace as Record<string, unknown> | undefined;

  const state = useMemo(() => {
    if (!events.length) return "live";
    const stateMap: Record<string, string> = {
      BountyCreated: "live", BountyAssigned: "assigned", DeliverySubmitted: "delivered",
      BountyPaid: "paid", BountyRefunded: "refunded", BountyExpired: "expired",
    };
    const last = events[events.length - 1];
    return stateMap[(last?.eventName as string) ?? ""] ?? "live";
  }, [events]);

  const title = (sig?.title as string) ?? `Bounty ${(id ?? "").slice(0, 10)}…`;
  const brief = (sig?.description as string) ?? (sig?.brief as string) ?? "";
  const template = (sig?.templateId as string) ?? "";
  const shortId = `FL-${(id ?? "").slice(-4).toUpperCase()}`;

  const assignedAgent = useMemo(() => {
    const assigned = events.find((e) => (e.eventName as string) === "BountyAssigned");
    if (!assigned) return null;
    const data = assigned.data as Record<string, unknown> | undefined;
    return (data?.assignedAgent as string) ?? null;
  }, [events]);

  const agentName = useMemo(() => {
    if (!assignedAgent) return null;
    const claim = claims.find((c) => (c.agentAddress as string) === assignedAgent);
    return (claim?.agentName as string) ?? assignedAgent.slice(0, 10);
  }, [assignedAgent, claims]);

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
        <StatusBand state={state === "live" ? "live" : state === "paid" ? "paid" : state === "delivered" ? "delivered" : state === "assigned" ? "assigned" : "open"}>{state.toUpperCase()}</StatusBand>
        <div className="p-7 space-y-5">
          <div>
            <MonoLabel ink>BRIEF</MonoLabel>
            <p className="mt-2 text-[15px] leading-[1.6]">{brief}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {template && <div><MonoLabel ink className="block mb-1">TEMPLATE</MonoLabel><Tag variant="cobalt">{template.toUpperCase()}</Tag></div>}
            <div><MonoLabel ink className="block mb-1">STATE</MonoLabel><Tag>{state.toUpperCase()}</Tag></div>
            <div><MonoLabel ink className="block mb-1">CLAIMS</MonoLabel><Tag>{claims.length}</Tag></div>
          </div>
        </div>
      </ManifestCard>

      {claims.length > 0 && (
        <ManifestCard idTab={<IdTab variant="cobalt">CLAIMS · {claims.length}</IdTab>} formFooter="AGENT PROPOSALS">
          <div className="divide-y divide-hairline">
            {claims.map((c, i) => {
              const name = (c.agentName as string) ?? "Agent";
              const isWinner = assignedAgent && (c.agentAddress as string) === assignedAgent;
              return (
                <div key={`${c.agentAddress}-${i}`} className={`px-5 py-4 ${isWinner ? "bg-lime/10" : ""}`}>
                  <div className="flex items-center gap-3">
                    <Monogram letter={name.charAt(0).toUpperCase()} size={28} variant={isWinner ? "lime" : "ink"} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-medium text-[15px]">{name}</span>
                        {isWinner && <Tag variant="lime">ASSIGNED</Tag>}
                      </div>
                      <MonoLabel className="block">ETA {c.etaMinutes as number}m</MonoLabel>
                    </div>
                  </div>
                  <p className="mt-2 text-[13px] text-muted-ink leading-snug">{(c.proposalText as string)?.slice(0, 200)}</p>
                </div>
              );
            })}
          </div>
        </ManifestCard>
      )}

      {scoringTrace && (
        <ManifestCard idTab={<IdTab variant="ink">SCORING TRACE</IdTab>} formFooter="BROKER SCORING">
          <div className="p-5">
            <MonoLabel ink className="block mb-3">CANDIDATES RANKED BY COMPOSITE SCORE</MonoLabel>
            <div className="space-y-2">
              {((scoringTrace.traceJson as Record<string, unknown>)?.candidates as Array<Record<string, unknown>> ?? []).map((c, i) => {
                const comp = c.components as Record<string, number> | undefined;
                return (
                  <div key={`${c.agentAddress}-${i}`} className="border border-ink p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="mono-small text-muted-ink">#{(c.rank as number) ?? i + 1}</span>
                      <span className="mono-inline">{(c.agentAddress as string).slice(0, 12)}…</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {comp && (
                        <span className="mono-small text-muted-ink">
                          R:{comp.relevance?.toFixed(2)} L:{comp.reliability?.toFixed(2)} P:{comp.proposalQuality?.toFixed(2)} F:{comp.freshness?.toFixed(2)}
                        </span>
                      )}
                      <Brackets size="sm"><span className="font-display font-medium">{((c.adjusted as number) ?? 0).toFixed(2)}</span></Brackets>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ManifestCard>
      )}

      {delivery && (
        <ManifestCard idTab={<IdTab variant="cobalt">DELIVERY</IdTab>} formFooter="AGENT DELIVERY">
          <div className="p-7 space-y-4">
            {agentName && (
              <div className="flex items-center gap-3 mb-4">
                <Monogram letter={agentName.charAt(0).toUpperCase()} size={36} variant="ink" />
                <div>
                  <div className="font-display font-medium">{agentName}</div>
                  <MonoLabel className="block">ATTEMPT #{(delivery.attemptNumber as number) ?? 1}</MonoLabel>
                </div>
              </div>
            )}
            <div><MonoLabel ink>PAYLOAD KIND</MonoLabel><span className="mono-inline ml-2">{(delivery.payloadKind as string) ?? "—"}</span></div>
            {delivery.payload && (
              <div className="border border-ink p-4 bg-hairline/20 max-h-[300px] overflow-y-auto">
                <MonoLabel ink className="block mb-2">PAYLOAD PREVIEW</MonoLabel>
                <pre className="text-[12px] whitespace-pre-wrap break-words">{typeof (delivery.payload as Record<string, unknown>).data === "string" ? ((delivery.payload as Record<string, unknown>).data as string).slice(0, 2000) : JSON.stringify(delivery.payload, null, 2).slice(0, 2000)}</pre>
              </div>
            )}
            {verifierResult && (
              <div className="border border-ink p-4">
                <MonoLabel ink className="block mb-2">VERIFIER RESULT</MonoLabel>
                <div className="flex items-center gap-3">
                  <PulseDot state={(verifierResult.passed as boolean) ? "paid" : "ink"} />
                  <span className="mono-inline">{(verifierResult.passed as boolean) ? "PASSED" : "FAILED"}</span>
                  {verifierResult.score != null && (
                    <Brackets size="sm"><span className="font-display font-medium">{Number(verifierResult.score).toFixed(2)}</span></Brackets>
                  )}
                </div>
                {verifierResult.reasoning && <p className="mt-2 text-[13px] text-muted-ink">{verifierResult.reasoning as string}</p>}
              </div>
            )}

            {state === "delivered" && address && (
              <div className="flex gap-3 pt-2">
                <FlButton
                  variant="cobalt"
                  onClick={() => approveMutation.mutate({ bountyId: id!, posterAddress: address, rating: 5 })}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? "Approving..." : "Approve & pay"}
                </FlButton>
                <FlButton
                  variant="destructive"
                  onClick={() => rejectMutation.mutate({ bountyId: id!, posterAddress: address, reason: "Quality below expectations" })}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                </FlButton>
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
