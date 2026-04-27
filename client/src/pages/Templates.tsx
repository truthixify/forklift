import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, MonoLabel, Tag } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { useTemplates } from "@/lib/api";

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  kind: string;
  verifier: string;
  price: string;
  deliverable: string;
}

function toTemplate(raw: Record<string, unknown>): TemplateItem {
  return {
    id: (raw.id ?? "") as string,
    name: (raw.name ?? raw.label ?? "") as string,
    category: (raw.category ?? "OPEN") as string,
    kind: (raw.kind ?? raw.deliverableKind ?? "multi") as string,
    verifier: (raw.verifier ?? raw.verifierType ?? "judge") as string,
    price: (raw.price ?? raw.priceRange ?? "any") as string,
    deliverable: (raw.deliverable ?? raw.deliverableDesc ?? "") as string,
  };
}

export default function Templates() {
  const { data, isLoading, isError } = useTemplates();

  const templates: TemplateItem[] = useMemo(() => {
    const raw = (data as { templates?: unknown[] })?.templates;
    if (!Array.isArray(raw)) return [];
    return raw.map((t) => toTemplate(t as Record<string, unknown>));
  }, [data]);

  return (
    <AppShell>
      <section className="max-w-[1440px] mx-auto px-6 pt-12 pb-12">
        <div className="grid grid-cols-12 gap-8 items-end mb-12">
          <div className="col-span-12 md:col-span-7">
            <MonoLabel ink>TEMPLATES CATALOGUE · {templates.length} SHIPPED · CUSTOM OPEN</MonoLabel>
            <h1 className="display-hero text-[44px] md:text-[64px] font-medium mt-3 leading-[0.98]">Pick a shape.<br />Or invent one.</h1>
          </div>
          <div className="col-span-12 md:col-span-5">
            <p className="text-[16px] leading-[1.6] text-ink max-w-[44ch]">Templates pre-fill the deliverable schema and verifier config so you can post in seconds. Every field is editable. Schema is open by default.</p>
          </div>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 pb-24">
        {isLoading && (
          <div className="text-center py-12">
            <MonoLabel>LOADING TEMPLATES...</MonoLabel>
          </div>
        )}
        {isError && (
          <div className="text-center py-12">
            <MonoLabel>FAILED TO LOAD TEMPLATES</MonoLabel>
          </div>
        )}
        {!isLoading && !isError && templates.length === 0 && (
          <div className="text-center py-12">
            <MonoLabel>NO TEMPLATES FOUND</MonoLabel>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t) => (
            <ManifestCard key={t.id} idTab={<IdTab variant={t.category === "OPEN" ? "magenta" : "cobalt"}>{t.category}</IdTab>} formFooter={`TEMPLATE · ${t.name.toUpperCase()}`}>
              <div className="p-6 pt-8">
                <h3 className="font-display font-medium text-[26px] leading-tight">{t.name}</h3>
                <div className="hairline my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between"><MonoLabel>DELIVERABLE</MonoLabel><span className="mono-small text-ink">{t.deliverable.toUpperCase()}</span></div>
                  <div className="flex justify-between"><MonoLabel>KIND</MonoLabel><Tag>{t.kind.toUpperCase()}</Tag></div>
                  <div className="flex justify-between"><MonoLabel>VERIFIER</MonoLabel><span className="mono-small text-ink">{t.verifier.toUpperCase()}</span></div>
                  <div className="flex justify-between"><MonoLabel>RANGE</MonoLabel><span className="mono-small text-ink">{t.price}</span></div>
                </div>
                <div className="mt-5">
                  <Link to="/post"><FlButton variant="cobalt" size="sm">Use this template</FlButton></Link>
                </div>
              </div>
            </ManifestCard>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
