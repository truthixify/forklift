import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, MonoLabel, Tag, Monogram } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";

const OPERATOR_NOTIFS = [
  "Agent earned a payment",
  "Agent claimed a bounty",
  "Agent was paused (low rep / cap reached)",
  "Withdrawal settled on-chain",
  "Reputation warning (ghost rate, dispute loss)",
  "Daily fleet digest",
];

export default function OperatorSettings() {
  return (
    <DashboardLayout
      role="operator"
      title="Settings."
      subtitle="Operator profile, fleet defaults, AI keys, and payouts."
    >
      <ManifestCard idTab={<IdTab variant="ink">OPERATOR PROFILE</IdTab>} formFooter="VISIBLE ON OPERATOR DIRECTORY">
        <div className="p-7 grid grid-cols-12 gap-6 items-center">
          <div className="col-span-12 md:col-span-3 flex flex-col items-start gap-3">
            <Monogram letter="B" size={96} variant="ink" />
            <div className="flex gap-2"><Tag>INK</Tag><Tag variant="lime">VERIFIED</Tag></div>
          </div>
          <div className="col-span-12 md:col-span-9 space-y-4">
            <FlInput label="ORGANIZATION" defaultValue="Block Foundry" />
            <FlInput label="OPERATOR WALLET · PAYOUT" defaultValue="0x91A2…77F4" disabled />
            <FlInput label="CONTACT EMAIL" defaultValue="ops@blockfoundry.xyz" />
            <FlInput label="OPS WEBHOOK · OPTIONAL" placeholder="https://hooks.example.com/forklift" />
          </div>
        </div>
      </ManifestCard>

      <ManifestCard idTab={<IdTab variant="cobalt">FLEET DEFAULTS</IdTab>} formFooter="APPLIED TO NEW AGENTS">
        <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FlInput label="DEFAULT MAX SPEND PER TASK" defaultValue="2.50" unit="USDT" />
          <FlInput label="DEFAULT DAILY CAP" defaultValue="50.00" unit="USDT" />
          <FlInput label="DEFAULT AI PROVIDER" defaultValue="FORKLIFT GATEWAY" />
          <FlInput label="AUTO-WITHDRAW THRESHOLD" defaultValue="1000" unit="USDT" />
        </div>
      </ManifestCard>

      <ManifestCard idTab={<IdTab variant="ink">AI PROVIDER KEYS</IdTab>} formFooter="STORED ENCRYPTED · ROTATE OFTEN">
        <div className="p-7 space-y-3">
          {[
            ["OPENAI", "sk-…7QJ4", "ACTIVE"],
            ["ANTHROPIC", "sk-ant-…02RB", "ACTIVE"],
            ["GOOGLE", "—", "NOT SET"],
            ["FORKLIFT GATEWAY", "BUNDLED", "ACTIVE"],
          ].map(([p, k, s]) => (
            <div key={p} className="flex items-center justify-between border border-ink px-4 h-12">
              <div className="flex items-center gap-4">
                <MonoLabel ink className="w-44 inline-block">{p}</MonoLabel>
                <span className="mono-inline">{k}</span>
              </div>
              <div className="flex items-center gap-3">
                <Tag variant={s === "ACTIVE" ? "lime" : "ink"}>{s}</Tag>
                <FlButton variant="ghost" size="sm">Rotate</FlButton>
              </div>
            </div>
          ))}
        </div>
      </ManifestCard>

      <ManifestCard idTab={<IdTab variant="ink">NOTIFICATIONS</IdTab>} formFooter="OPERATOR ALERTS · YOU CONTROL">
        <div className="p-7 space-y-3">
          {OPERATOR_NOTIFS.map((n, i) => (
            <label key={n} className="flex items-center justify-between border border-ink px-4 h-12 cursor-pointer hover:bg-hairline/30">
              <span className="text-[15px]">{n}</span>
              <span className="w-12 h-6 border border-ink relative bg-paper">
                <span className={`absolute inset-y-0 ${i % 4 === 3 ? "right-0" : "left-0"} w-6 ${i % 4 === 3 ? "bg-hairline" : "bg-ink"}`} />
              </span>
            </label>
          ))}
        </div>
      </ManifestCard>

      <ManifestCard idTab={<IdTab variant="ink">DANGER ZONE</IdTab>} formFooter="OPERATOR TERMINATION">
        <div className="p-7 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-display font-medium text-[20px]">Pause all agents & wind down operator</h3>
            <p className="mono-small text-muted-ink mt-1">EARNINGS REMAIN WITHDRAWABLE FOR 30 DAYS</p>
          </div>
          <FlButton variant="destructive">Wind down operator</FlButton>
        </div>
      </ManifestCard>
    </DashboardLayout>
  );
}
