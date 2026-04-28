import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, StatusBand, MonoLabel, PulseDot } from "@/components/manifest/Manifest";
import { ActivityRow } from "@/components/manifest/ActivityRow";
import { useRealFeed } from "@/hooks/useRealFeed";
import { useFeed, useBlockHeight as useBlockHeightApi } from "@/lib/api";
import type { FeedEvent } from "@/hooks/useRealFeed";
import type { ActivityEvent } from "@/lib/types";

type FilterKey = "bounty" | "agent" | "x402" | "settle";

const FILTERS: { key: FilterKey; label: string; matches: (k: ActivityEvent["kind"]) => boolean }[] = [
  { key: "bounty", label: "BOUNTIES", matches: (k) => k === "posted" || k === "claimed" || k === "delivered" || k === "approved" || k === "disputed" },
  { key: "agent", label: "AGENTS", matches: (k) => k === "deployed" },
  { key: "x402", label: "X402", matches: (k) => k === "x402" },
  { key: "settle", label: "SETTLEMENTS", matches: (k) => k === "paid" },
];

function feedEventToActivity(e: FeedEvent, index: number): ActivityEvent {
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
}

export default function LiveFeed() {
  const [active, setActive] = useState<FilterKey[]>(FILTERS.map((f) => f.key));
  const { events: wsEvents, connected: wsConnected } = useRealFeed();
  const { data: feedData } = useFeed({ limit: '100' });
  const feedEvents = (feedData as { events?: unknown[] })?.events ?? [];

  const apiFeedEvents: ActivityEvent[] = useMemo(() => {
    return feedEvents.map((raw: unknown, i: number) => {
      const e = raw as Record<string, unknown>;
      const eventName = (e.eventName ?? 'posted') as string;
      const data = (e.data ?? {}) as Record<string, unknown>;
      const ts = e.indexedAt ? new Date(e.indexedAt as string).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC' : '';
      const actor = (data.poster ?? data.agent ?? 'System') as string;
      return {
        id: `api-${i}`,
        ts,
        agoMin: 0,
        actor: actor.slice(0, 8) + '...',
        monogram: eventName.charAt(0).toUpperCase(),
        kind: eventName === 'BountyCreated' ? 'posted' : eventName === 'BountyPaid' ? 'paid' : eventName === 'DeliverySubmitted' ? 'delivered' : eventName === 'BountyAssigned' ? 'claimed' : 'posted' as ActivityEvent['kind'],
        body: `${eventName} ${(e.bountyId as string)?.slice(0, 10) ?? ''}`.trim(),
        bountyId: e.bountyId as string | undefined,
        amount: data.amountUSDT ? Number(data.amountUSDT) / 1e18 : undefined,
      };
    });
  }, [feedEvents]);

  const eventsHr = feedEvents.length;
  const paidToday = feedEvents.filter((e: unknown) => (e as { eventName?: string }).eventName === 'BountyPaid').length;
  const usdtToday = apiFeedEvents.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const { data: blockData } = useBlockHeightApi();
  const block = Number(blockData?.blockNumber ?? 0);

  const events: ActivityEvent[] = wsConnected && wsEvents.length > 0
    ? wsEvents.map(feedEventToActivity)
    : apiFeedEvents;

  const filtered = useMemo(() => {
    const enabled = FILTERS.filter((f) => active.includes(f.key));
    return events.filter((e) => enabled.some((f) => f.matches(e.kind)));
  }, [events, active]);

  return (
    <AppShell>
      <section className="max-w-[1440px] mx-auto px-6 pt-12 pb-24">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-6">
          <div>
            <MonoLabel ink>LIVE FEED · STREAMING</MonoLabel>
            <h1 className="display-hero text-[44px] md:text-[56px] font-medium mt-3">Marketplace activity.</h1>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="mono-small inline-flex items-center gap-2"><PulseDot state={wsConnected ? "live" : "ink"} />{wsConnected ? "LIVE" : "MOCK"} · {eventsHr} EVENTS / HR</span>
            <span className="mono-small text-muted-ink">{paidToday} PAID TODAY · {usdtToday.toFixed(2)} USDT</span>
            <span className="mono-small text-muted-ink">BLOCK {block.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-9">
            <ManifestCard idTab={<IdTab variant="magenta">LIVE · STREAMING</IdTab>} formFooter="LIVE EVENT FEED" pageNumber="REAL-TIME">
              <StatusBand state="live">RECENT EVENTS · UPDATES IN REAL TIME</StatusBand>
              <ul>
                {filtered.length === 0 && (
                  <li className="px-5 py-8 text-center mono-small text-muted-ink">NO EVENTS MATCH SELECTED FILTERS</li>
                )}
                {filtered.slice(0, 40).map((e, i) => (
                  <div key={e.id} className={i === 0 ? "animate-hivis-sweep" : ""}>
                    <ActivityRow event={e} />
                  </div>
                ))}
              </ul>
              <div className="px-5 py-4 mono-small text-muted-ink flex items-center gap-3 border-t border-hairline">
                <div className="hairline-sweep flex-1" />
                STREAMING NEW EVENTS
              </div>
            </ManifestCard>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-4">
            <ManifestCard idTab={<IdTab variant="ink">FILTERS</IdTab>} formFooter="EVENT FILTER">
              <div className="p-5 space-y-3">
                {FILTERS.map((f) => {
                  const on = active.includes(f.key);
                  return (
                    <button
                      key={f.key}
                      onClick={() => setActive(on ? active.filter((x) => x !== f.key) : [...active, f.key])}
                      className={`w-full flex items-center justify-between border border-ink px-3 h-10 mono-small ${on ? "bg-ink text-paper" : "bg-paper hover:bg-hairline"}`}
                    >
                      <span>{f.label}</span>
                      <span className={`w-3 h-3 ${on ? "bg-paper" : "bg-ink"}`} />
                    </button>
                  );
                })}
              </div>
            </ManifestCard>
            <ManifestCard idTab={<IdTab variant="hivis">PAID TODAY</IdTab>} formFooter="DAILY SETTLEMENT">
              <div className="p-5 text-center">
                <span className="font-display font-medium text-[44px] leading-none">{paidToday}</span>
                <MonoLabel className="block mt-2">BOUNTIES · {usdtToday.toFixed(2)} USDT</MonoLabel>
              </div>
            </ManifestCard>
            <ManifestCard idTab={<IdTab variant="cobalt">CHAIN</IdTab>} formFooter="KITE TESTNET">
              <div className="p-5">
                <MonoLabel>BLOCK HEIGHT</MonoLabel>
                <div className="font-display font-medium text-[28px] leading-none mt-2 tabular-nums">{block.toLocaleString()}</div>
                <MonoLabel className="block mt-3">KITE TESTNET</MonoLabel>
              </div>
            </ManifestCard>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
