import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { ManifestCard, IdTab, StatusBand, MonoLabel, Tag } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";
import { useWalletAuth } from "@/components/auth/WalletAuth";

const PROVIDERS = [
  { id: "openai", label: "OPENAI", hint: "sk-…", url: "https://platform.openai.com/api-keys", needsKey: true },
  { id: "anthropic", label: "ANTHROPIC", hint: "sk-ant-…", url: "https://console.anthropic.com/settings/keys", needsKey: true },
  { id: "google", label: "GOOGLE", hint: "AIza…", url: "https://aistudio.google.com/app/apikey", needsKey: true },
  { id: "forklift", label: "FORKLIFT GATEWAY", hint: "Bundled · no key required", url: "", needsKey: false },
] as const;

const STEPS = [
  ["01", "PICK SPECIALIZATION", "What does your agent do?"],
  ["02", "NAME AGENT", "Public-facing handle."],
  ["03", "AI PROVIDER", "Bring your own keys or use ours."],
  ["04", "SPEND CAPS", "Per-task and daily limits."],
  ["05", "PREFUND AGENT", "Optional — top up its x402 wallet."],
  ["06", "REVIEW & DEPLOY", "Sign and ship."],
] as const;

const PREFUND_PRESETS = ["0", "5", "25", "100"] as const;

export function DeployAgentForm({ doneHref = "/dashboard/operator/agents" }: { doneHref?: string }) {
  const [step, setStep] = useState(0);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const toggleSpec = (s: string) => setSpecializations((prev) => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const [handle, setHandle] = useState("");
  const [provider, setProvider] = useState<typeof PROVIDERS[number]["id"]>("forklift");
  const [apiKey, setApiKey] = useState("");
  const [prefund, setPrefund] = useState("0");
  const nav = useNavigate();
  const { address } = useWalletAuth();
  const activeProvider = PROVIDERS.find(p => p.id === provider)!;

  const next = () => step === STEPS.length - 1 ? nav(doneHref) : setStep(step + 1);

  return (
    <>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <MonoLabel ink>DEPLOY AN AGENT · STEP {step + 1} OF {STEPS.length}</MonoLabel>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-2 w-10 ${i <= step ? "bg-cobalt" : "bg-hairline"}`} />
          ))}
        </div>
      </div>

      <ManifestCard shadow="lime" idTab={<IdTab>STEP {STEPS[step][0]} OF {STEPS.length}</IdTab>} formFooter={`OPERATOR DEPLOY · ${STEPS[step][1]}`} pageNumber={`${step + 1} / ${STEPS.length}`}>
        <StatusBand state="assigned">{STEPS[step][1]}</StatusBand>

        <div className="p-10">
          <h2 className="display-hero text-[44px] font-medium leading-tight">{STEPS[step][2]}</h2>

          <div className="mt-8 space-y-6">
            {step === 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <MonoLabel ink>PICK ONE OR MORE</MonoLabel>
                  <MonoLabel>{specializations.length} SELECTED</MonoLabel>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["LOGO-DESIGN", "LEAD-GEN", "RESEARCH-BRIEF", "TRANSCRIPTION", "OPEN-SOURCE", "COPYWRITING", "DATA-CLEANING", "TRANSLATION", "VIDEO-EDIT"].map((s) => {
                    const isOn = specializations.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleSpec(s)}
                        aria-pressed={isOn}
                        className={`border-2 h-12 mono-small inline-flex items-center justify-center gap-2 transition-colors ${isOn ? "border-ink bg-ink text-paper" : "border-ink bg-paper hover:bg-hairline/40"}`}
                      >
                        {isOn && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {step === 1 && (
              <FlInput label="AGENT HANDLE · 16 CHARS MAX" placeholder="Pixel" value={handle} onChange={(e) => setHandle(e.target.value.slice(0, 16))} />
            )}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <MonoLabel ink>SELECT PROVIDER</MonoLabel>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {PROVIDERS.map((p) => {
                      const selected = provider === p.id;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => { setProvider(p.id); setApiKey(""); }}
                          className={`text-left border-2 p-4 transition-colors ${selected ? "border-ink bg-ink text-paper" : "border-ink bg-paper hover:bg-hairline/30"}`}
                        >
                          <div className="flex items-center justify-between">
                            <MonoLabel ink={!selected} className={selected ? "text-paper" : ""}>{p.label}</MonoLabel>
                            {selected && <Check className="w-4 h-4" strokeWidth={3} />}
                          </div>
                          <div className={`mono-small mt-1 ${selected ? "text-paper/70" : "text-muted-ink"}`}>
                            {p.needsKey ? "BRING YOUR OWN KEY" : "BUNDLED · NO KEY"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeProvider.needsKey ? (
                  <div className="border-2 border-ink p-5 bg-hairline/20 space-y-3">
                    <FlInput
                      label={`${activeProvider.label} API KEY`}
                      placeholder={activeProvider.hint}
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="mono-small text-muted-ink">
                        STORED ENCRYPTED · USED ONLY BY THIS AGENT · ROTATE ANYTIME IN SETTINGS
                      </p>
                      {activeProvider.url && (
                        <a
                          href={activeProvider.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mono-small underline text-cobalt hover:text-ink"
                        >
                          GET KEY ↗
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Tag variant={apiKey ? "lime" : "ink"}>{apiKey ? "KEY PROVIDED" : "KEY REQUIRED"}</Tag>
                      <Tag>ENCRYPTED AT REST</Tag>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-ink p-5 bg-hairline/20">
                    <MonoLabel ink>NO KEY NEEDED</MonoLabel>
                    <p className="mono-small text-muted-ink mt-1">
                      FORKLIFT GATEWAY ROUTES REQUESTS THROUGH OUR POOLED PROVIDERS. USAGE BILLED PER TASK.
                    </p>
                  </div>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <FlInput label="MAX SPEND PER TASK · USDT" defaultValue="2.50" unit="USDT" />
                <FlInput label="DAILY CAP · USDT" defaultValue="50.00" unit="USDT" />
                <div className="flex gap-2"><Tag>X402 ENABLED</Tag><Tag>AUTO-TOPUP OFF</Tag></div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-5">
                <FlInput
                  label="PREFUND AMOUNT · OPTIONAL"
                  unit="USDT"
                  type="number"
                  min="0"
                  step="0.01"
                  value={prefund}
                  onChange={(e) => setPrefund(e.target.value)}
                  hint="LOADED INTO AGENT WALLET FOR X402 CALLS DURING TASKS · TOP UP ANYTIME LATER"
                />
                <div>
                  <MonoLabel ink className="block mb-2">QUICK PRESETS</MonoLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {PREFUND_PRESETS.map((v) => {
                      const isOn = prefund === v;
                      return (
                        <button
                          type="button"
                          key={v}
                          onClick={() => setPrefund(v)}
                          aria-pressed={isOn}
                          className={`border-2 h-12 mono-small inline-flex items-center justify-center gap-2 transition-colors ${isOn ? "border-ink bg-ink text-paper" : "border-ink bg-paper hover:bg-hairline/40"}`}
                        >
                          {isOn && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                          {v === "0" ? "SKIP" : `${v} USDT`}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Tag>X402 WALLET</Tag>
                  <Tag variant={parseFloat(prefund) > 0 ? "lime" : "ink"}>
                    {parseFloat(prefund) > 0 ? `PREFUND ${prefund} USDT` : "NO PREFUND · DEPLOY EMPTY"}
                  </Tag>
                </div>
              </div>
            )}
            {step === 5 && (
              <div className="border border-ink p-6 bg-hairline/20 space-y-2">
                <div className="flex justify-between"><MonoLabel>HANDLE</MonoLabel><span className="mono-inline">{handle || "—"}</span></div>
                <div className="flex justify-between gap-4"><MonoLabel>SPECIALIZATIONS</MonoLabel><span className="mono-inline text-right">{specializations.length ? specializations.join(" · ") : "—"}</span></div>
                <div className="flex justify-between"><MonoLabel>PROVIDER</MonoLabel><span className="mono-inline">{activeProvider.label}{activeProvider.needsKey && apiKey ? ` · KEY ••••${apiKey.slice(-4)}` : activeProvider.needsKey ? " · NO KEY" : ""}</span></div>
                <div className="flex justify-between"><MonoLabel>SPEND CAP</MonoLabel><span className="mono-inline">2.50 / 50.00</span></div>
                <div className="flex justify-between"><MonoLabel>PREFUND</MonoLabel><span className="mono-inline">{parseFloat(prefund) > 0 ? `${prefund} USDT` : "NONE"}</span></div>
                <div className="flex justify-between"><MonoLabel>WALLET</MonoLabel><span className="mono-inline">{address ?? "0xDEF7…ABC1"}</span></div>
              </div>
            )}
          </div>

          <div className="mt-10 flex justify-between">
            <FlButton variant="secondary" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>← Back</FlButton>
            <FlButton variant="cobalt" size="lg" onClick={next}>{step === STEPS.length - 1 ? "Sign & deploy" : "Continue →"}</FlButton>
          </div>
        </div>
      </ManifestCard>
    </>
  );
}
