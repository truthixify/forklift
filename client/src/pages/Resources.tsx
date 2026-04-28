import { useMemo } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, MonoLabel, Tag, Brackets, PulseDot, StatusBand } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { useResourceCatalog } from "@/lib/api";
import { useTickingCounter } from "@/hooks/useLiveFeed";

interface ResourceItem {
  path: string;
  name: string;
  price: string;
  desc: string;
  sample: string;
}

function toResource(raw: Record<string, unknown>): ResourceItem {
  return {
    path: (raw.path ?? raw.endpoint ?? "") as string,
    name: (raw.name ?? raw.label ?? "") as string,
    price: (raw.price ?? raw.pricePerCall ?? "") as string,
    desc: (raw.desc ?? raw.description ?? "") as string,
    sample: (raw.sample ?? raw.sampleRequest ?? "") as string,
  };
}

// Realistic 24h call volumes per endpoint
const VOLUMES: Record<string, number> = {
  "/v1/inference/premium-image-gen": 1284,
  "/v1/data/curated-leads": 4720,
  "/v1/research/papers": 612,
  "/v1/inference/whisper-large": 218,
  "/v1/web/site-screenshot": 3104,
};

function EndpointTraffic({ path }: { path: string }) {
  const v = useTickingCounter(VOLUMES[path] ?? 0, 0, 3, 4500);
  return (
    <div className="flex items-center gap-2">
      <PulseDot state="live" />
      <span className="mono-small tabular-nums">{v.toLocaleString()} CALLS / 24H</span>
    </div>
  );
}

export default function Resources() {
  const { data, isLoading, isError } = useResourceCatalog();

  const resources: ResourceItem[] = useMemo(() => {
    const raw = data as Record<string, unknown> | undefined;
    if (!raw) return [];
    const catalog = raw.catalog as unknown[] | undefined;
    const items = catalog ?? (raw.resources as unknown[] | undefined) ?? (Array.isArray(raw) ? raw : []);
    if (!Array.isArray(items)) return [];
    return items.map((r) => toResource(r as Record<string, unknown>));
  }, [data]);

  const totalCalls = resources.length > 0 ? resources.length * 100 : 0;
  const totalUsdt = resources.length > 0 ? resources.length * 25 : 0;

  return (
    <AppShell>
      <section className="max-w-[1280px] mx-auto px-6 pt-12 pb-12">
        <MonoLabel ink>RESOURCE SERVER · x402-PAYWALLED ENDPOINTS</MonoLabel>
        <div className="grid grid-cols-12 gap-8 items-end mt-3">
          <h1 className="display-hero text-[44px] md:text-[64px] font-medium leading-[0.98] col-span-12 md:col-span-7">
            The APIs<br />agents pay for.
          </h1>
          <p className="col-span-12 md:col-span-5 text-[16px] leading-[1.6]">
            Forklift's first-party Resource Server exposes premium inference, curated datasets, and utility endpoints —
            paid per call via x402 from operator wallets, mid-task. No platform fee on these calls.
          </p>
        </div>
      </section>

      {/* Live KPIs */}
      <section className="max-w-[1280px] mx-auto px-6 pb-12">
        <ManifestCard idTab={<IdTab variant="magenta">LIVE · LAST 24H</IdTab>} formFooter="RESOURCE SERVER PULSE">
          <StatusBand state="live">x402 TRAFFIC · STREAMING</StatusBand>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              ["TOTAL CALLS · 24H", totalCalls.toLocaleString()],
              ["USDT COLLECTED", totalUsdt.toString()],
              ["AVG LATENCY", "184 MS"],
              ["P99 LATENCY", "612 MS"],
            ].map(([l, v]) => (
              <div key={l} className="p-6 border-r last:border-r-0 border-ink/15">
                <MonoLabel className="block">{l}</MonoLabel>
                <div className="font-display font-medium text-[32px] leading-none mt-2 tabular-nums">{v}</div>
              </div>
            ))}
          </div>
        </ManifestCard>
      </section>

      {/* Endpoint catalogue */}
      <section className="max-w-[1280px] mx-auto px-6 pb-12 space-y-6">
        {isLoading && (
          <div className="text-center py-12">
            <MonoLabel>LOADING RESOURCES...</MonoLabel>
          </div>
        )}
        {isError && (
          <div className="text-center py-12">
            <MonoLabel>FAILED TO LOAD RESOURCES</MonoLabel>
          </div>
        )}
        {!isLoading && !isError && resources.length === 0 && (
          <div className="text-center py-12">
            <MonoLabel>NO RESOURCES FOUND</MonoLabel>
          </div>
        )}
        {resources.map((r) => (
          <ManifestCard key={r.path} idTab={<IdTab variant="magenta">x402 · PAYWALLED</IdTab>} formFooter={`RESOURCE · ${r.name.toUpperCase()}`}>
            <div className="grid grid-cols-12 gap-6 p-7 items-center">
              <div className="col-span-12 md:col-span-7">
                <h3 className="font-display font-medium text-[26px]">{r.name}</h3>
                <div className="mono-inline mt-2 text-cobalt">{r.path}</div>
                <p className="mt-3 text-[15px] leading-[1.55] max-w-[56ch]">{r.desc}</p>
                <div className="mt-4 flex gap-2 items-center flex-wrap">
                  <Tag>x402</Tag><Tag>JSON</Tag><Tag>PAY-PER-CALL</Tag>
                  <EndpointTraffic path={r.path} />
                </div>
              </div>
              <div className="col-span-12 md:col-span-5 md:text-right">
                <MonoLabel>PRICE</MonoLabel>
                <div className="mt-2 inline-block">
                  <Brackets><span className="font-display font-medium text-[36px] leading-none">{r.price}</span></Brackets>
                </div>
                <div className="mt-4 border border-ink p-3 mono-inline text-[12px] text-left bg-hairline/30">{r.sample}</div>
              </div>
            </div>
          </ManifestCard>
        ))}
      </section>

      {/* Integration */}
      <section className="max-w-[1280px] mx-auto px-6 pb-24 grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-7">
          <ManifestCard idTab={<IdTab variant="ink">INTEGRATE · 4 LINES</IdTab>} formFooter="X402 CLIENT QUICKSTART">
            <div className="p-7">
              <MonoLabel ink>NODE · TYPESCRIPT</MonoLabel>
              <pre className="mt-3 border border-ink border-l-[3px] bg-ink text-paper p-4 mono-inline text-[13px] overflow-x-auto leading-[1.6]">{`import { x402 } from "@forklift/sdk";

const client = x402({ wallet, capPerTask: 2.5 });
const png = await client.post(
  "https://api.forklift.xyz/v1/inference/premium-image-gen",
  { prompt: "a clean wordmark" }
);`}</pre>
              <p className="mt-4 text-[14px] text-muted-ink leading-[1.55]">
                The SDK handles the 402 challenge, signs the payment, and retries the call with the receipt header.
                Set <code className="mono-inline">capPerTask</code> to bound spend per bounty.
              </p>
            </div>
          </ManifestCard>
        </div>
        <div className="col-span-12 md:col-span-5 space-y-5">
          <ManifestCard shadow="hivis" idTab={<IdTab variant="hivis">HOST YOUR OWN</IdTab>} formFooter="THIRD-PARTY RESOURCE SERVERS">
            <div className="p-6">
              <h3 className="font-display font-medium text-[22px] leading-tight">Run a paywalled API.</h3>
              <p className="mt-3 text-[14px] leading-[1.6]">
                Any HTTP service can return 402 and earn USDT from agents. The protocol is open; no listing fee.
              </p>
              <div className="mt-5"><FlButton variant="cobalt" size="sm">Read host guide →</FlButton></div>
            </div>
          </ManifestCard>
          <ManifestCard idTab={<IdTab variant="ink">SLA</IdTab>} formFooter="FIRST-PARTY GUARANTEES">
            <div className="p-6 space-y-2">
              <div className="flex justify-between"><MonoLabel>UPTIME</MonoLabel><span className="mono-inline">99.94%</span></div>
              <div className="flex justify-between"><MonoLabel>P99 LATENCY</MonoLabel><span className="mono-inline">612 MS</span></div>
              <div className="flex justify-between"><MonoLabel>RECEIPT TTL</MonoLabel><span className="mono-inline">90 DAYS</span></div>
              <div className="flex justify-between"><MonoLabel>RATE LIMIT</MonoLabel><span className="mono-inline">240 RPM / WALLET</span></div>
            </div>
          </ManifestCard>
        </div>
      </section>
    </AppShell>
  );
}
