import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, StatusBand, MonoLabel, Tag, PulseDot, Monogram, Brackets } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";
import { useBounty, useDelivery, useApproveBounty, useRejectBounty } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import { useWalletAuth } from "@/components/auth/WalletAuth";

export default function PosterBountyDetail() {
  const { id } = useParams<{ id: string }>();
  const { address } = useWalletAuth();
  const { data: bountyData, isLoading } = useBounty(id ?? "");
  const { data: deliveryData } = useDelivery(id ?? "");
  const approveMutation = useApproveBounty();
  const rejectMutation = useRejectBounty();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const raw = bountyData as Record<string, unknown> | undefined;
  const sig = raw?.signature as Record<string, unknown> | undefined;
  const events = (raw?.events ?? []) as Array<Record<string, unknown>>;
  const claims = (raw?.claims ?? []) as Array<Record<string, unknown>>;
  const delivRaw = deliveryData as Record<string, unknown> | undefined;
  const delivery = (delivRaw?.delivery ?? raw?.delivery) as Record<string, unknown> | undefined;
  const signedUrl = (delivRaw?.signedUrl as string) ?? null;
  const verifierResult = (delivRaw?.verifierResult ?? raw?.verifierResult) as Record<string, unknown> | undefined;
  const scoringTrace = raw?.scoringTrace as Record<string, unknown> | undefined;

  const state = useMemo(() => {
    if (!events.length) return "live";
    const stateMap: Record<string, string> = {
      BountyCreated: "live", BountyAssigned: "assigned", DeliverySubmitted: "delivered",
      BountyPaid: "paid", BountyRefunded: "refunded", BountyExpired: "expired",
      BountyDisputed: "disputed",
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
            {(() => {
              const payload = delivery.payload as Record<string, unknown> | undefined;
              const kind = (delivery.payloadKind as string) ?? '';
              const isFile = kind === 'file' || payload?.kind === 'file';
              const mimeType = (payload?.mimeType as string) ?? '';
              const fileName = (payload?.fileName as string) ?? 'delivery';
              const isSvg = mimeType.includes('svg') || fileName.endsWith('.svg');
              const isImage = mimeType.startsWith('image/') || isSvg;

              if (isFile && (signedUrl || payload?.storageKey)) {
                const downloadUrl = `${API_BASE}/deliveries/${id}/download`;
                return (
                  <div className="border border-ink p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <MonoLabel ink className="block">{fileName}</MonoLabel>
                        <span className="mono-small text-muted-ink">{mimeType} · {payload?.sizeBytes ? `${((payload.sizeBytes as number) / 1024).toFixed(1)} KB` : ''}</span>
                      </div>
                      <a href={downloadUrl} download={fileName}>
                        <FlButton variant="cobalt" size="sm">Download</FlButton>
                      </a>
                    </div>
                    {isImage && (
                      <div className="border border-ink bg-hairline/10 p-6 flex items-center justify-center min-h-[200px]">
                        <img src={downloadUrl} alt={fileName} className="max-w-full max-h-[400px]" />
                      </div>
                    )}
                    {payload?.designNotes && (
                      <div>
                        <MonoLabel ink className="block mb-1">DESIGN NOTES</MonoLabel>
                        <p className="text-[13px] text-muted-ink">{payload.designNotes as string}</p>
                      </div>
                    )}
                    {Array.isArray(payload?.colorPalette) && (
                      <div>
                        <MonoLabel ink className="block mb-1">COLOR PALETTE</MonoLabel>
                        <div className="flex gap-2">
                          {(payload.colorPalette as string[]).map((c, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="w-5 h-5 border border-ink" style={{ background: c }} />
                              <span className="mono-small">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (kind === 'json' && payload) {
                const data = payload.data ?? payload;
                const displayObj = typeof data === 'string' ? data : data;
                const hasLeads = Array.isArray((data as Record<string, unknown>)?.leads);
                const hasRecords = Array.isArray((data as Record<string, unknown>)?.records);
                const hasSections = Array.isArray((data as Record<string, unknown>)?.sections);

                if (hasLeads) {
                  const leads = ((data as Record<string, unknown>).leads as Array<Record<string, unknown>>).slice(0, 10);
                  return (
                    <div className="border border-ink overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-ink text-paper">
                          <tr>{["NAME", "TITLE", "COMPANY", "EMAIL"].map((h) => <th key={h} className="text-left px-3 py-2 mono-small">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {leads.map((l, i) => (
                            <tr key={i} className="border-b border-hairline last:border-0 hover:bg-hairline/30">
                              <td className="px-3 py-2 text-[13px]">{l.name as string}</td>
                              <td className="px-3 py-2 text-[13px]">{l.title as string}</td>
                              <td className="px-3 py-2 text-[13px]">{l.company as string}</td>
                              <td className="px-3 py-2 text-[13px] text-cobalt">{l.email as string}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-3 py-2 mono-small text-muted-ink border-t border-hairline">{leads.length} LEADS</div>
                    </div>
                  );
                }

                if (hasRecords) {
                  const records = ((data as Record<string, unknown>).records as Array<Record<string, unknown>>).slice(0, 10);
                  const keys = records.length > 0 ? Object.keys(records[0]).slice(0, 5) : [];
                  return (
                    <div className="border border-ink overflow-hidden overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-ink text-paper">
                          <tr>{keys.map((k) => <th key={k} className="text-left px-3 py-2 mono-small">{k.toUpperCase()}</th>)}</tr>
                        </thead>
                        <tbody>
                          {records.map((r, i) => (
                            <tr key={i} className="border-b border-hairline last:border-0 hover:bg-hairline/30">
                              {keys.map((k) => <td key={k} className="px-3 py-2 text-[13px]">{String(r[k] ?? '')}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-3 py-2 mono-small text-muted-ink border-t border-hairline">{records.length} RECORDS</div>
                    </div>
                  );
                }

                if (hasSections) {
                  const d = data as Record<string, unknown>;
                  return (
                    <div className="border border-ink p-5 space-y-4 max-h-[500px] overflow-y-auto">
                      {d.title && <h3 className="font-display font-medium text-[20px]">{d.title as string}</h3>}
                      {d.summary && <p className="text-[14px] leading-[1.6] text-muted-ink">{(d.summary as string).slice(0, 500)}</p>}
                      {((d.sections as Array<Record<string, unknown>>) ?? []).map((s, i) => (
                        <div key={i}>
                          <MonoLabel ink className="block mb-1">{(s.heading as string)?.toUpperCase()}</MonoLabel>
                          <p className="text-[13px] leading-[1.6]">{(s.content as string)?.slice(0, 400)}</p>
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className="border border-ink p-4 bg-hairline/20 max-h-[300px] overflow-y-auto">
                    <MonoLabel ink className="block mb-2">PAYLOAD</MonoLabel>
                    <pre className="text-[12px] whitespace-pre-wrap break-words">{typeof displayObj === "string" ? (displayObj as string).slice(0, 2000) : JSON.stringify(displayObj, null, 2).slice(0, 2000)}</pre>
                  </div>
                );
              }

              return payload ? (
                <div className="border border-ink p-4 bg-hairline/20 max-h-[300px] overflow-y-auto">
                  <MonoLabel ink className="block mb-2">PAYLOAD</MonoLabel>
                  <pre className="text-[12px] whitespace-pre-wrap break-words">{JSON.stringify(payload, null, 2).slice(0, 2000)}</pre>
                </div>
              ) : null;
            })()}
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

            {successMsg && (
              <div className="bg-lime text-ink border border-ink px-4 py-3 mt-2">
                <MonoLabel>{successMsg}</MonoLabel>
              </div>
            )}
            {errorMsg && (
              <div className="bg-alarm/20 text-ink border border-alarm px-4 py-3 mt-2">
                <MonoLabel>{errorMsg}</MonoLabel>
              </div>
            )}
            {state === "delivered" && address && !successMsg && (
              <div className="space-y-4 pt-2">
                <FlButton
                  variant="cobalt"
                  onClick={() => {
                    setErrorMsg(null);
                    approveMutation.mutate(
                      { bountyId: id!, posterAddress: address, rating: 5 },
                      { onSuccess: () => setSuccessMsg("BOUNTY APPROVED — AGENT PAID"), onError: (e) => setErrorMsg(e.message) },
                    );
                  }}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  {approveMutation.isPending ? "Approving..." : "Approve"}
                </FlButton>
                <div className="border border-ink p-4 space-y-3">
                  <MonoLabel ink>NOT SATISFIED?</MonoLabel>
                  <FlInput
                    label="REASON"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Describe the issue..."
                  />
                  <div className="flex gap-3">
                    <FlButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (!rejectReason.trim()) { setErrorMsg("Please provide a reason"); return; }
                        setErrorMsg(null);
                        rejectMutation.mutate(
                          { bountyId: id!, posterAddress: address, reason: rejectReason },
                          { onSuccess: () => setSuccessMsg("DELIVERY REJECTED"), onError: (e) => setErrorMsg(e.message) },
                        );
                      }}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? "..." : "Reject"}
                    </FlButton>
                    <FlButton
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (!rejectReason.trim()) { setErrorMsg("Please provide a reason for dispute"); return; }
                        setErrorMsg(null);
                        rejectMutation.mutate(
                          { bountyId: id!, posterAddress: address, reason: rejectReason },
                          { onSuccess: () => setSuccessMsg("DISPUTE OPENED — PLATFORM WILL REVIEW"), onError: (e) => setErrorMsg(e.message) },
                        );
                      }}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      Open dispute
                    </FlButton>
                  </div>
                </div>
              </div>
            )}
            {state === "paid" && (
              <div className="bg-lime text-ink border border-ink px-4 py-3 mt-2">
                <MonoLabel>BOUNTY APPROVED — SETTLED</MonoLabel>
              </div>
            )}
            {state === "refunded" && (
              <div className="bg-hairline text-ink border border-ink px-4 py-3 mt-2">
                <MonoLabel>BOUNTY REFUNDED</MonoLabel>
              </div>
            )}
            {state === "disputed" && (
              <div className="bg-hivis text-ink border border-ink px-4 py-3 mt-2">
                <MonoLabel>DISPUTE OPEN — AWAITING PLATFORM REVIEW</MonoLabel>
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
