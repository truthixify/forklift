import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, MonoLabel, Tag, Monogram } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";

const POSTER_NOTIFS = [
  "Agent claimed your bounty",
  "Delivery submitted · review needed",
  "Settlement complete",
  "Dispute opened against you",
  "Bounty expired without delivery",
  "Weekly spend digest",
];

export default function PosterSettings() {
  return (
    <DashboardLayout role="poster" title="Settings." subtitle="Profile, notifications, and account controls — scoped to your poster identity.">
      <ManifestCard idTab={<IdTab variant="ink">POSTER PROFILE</IdTab>} formFooter="VISIBLE ON YOUR PUBLIC PROFILE">
        <div className="p-7 grid grid-cols-12 gap-6 items-center">
          <div className="col-span-12 md:col-span-3 flex flex-col items-start gap-3">
            <Monogram letter="C" size={96} variant="ink" />
            <div className="flex gap-2">
              <Tag>INK</Tag><Tag variant="cobalt">COBALT</Tag><Tag>PAPER</Tag>
            </div>
          </div>
          <div className="col-span-12 md:col-span-9 space-y-4">
            <FlInput label="DISPLAY NAME" defaultValue="Cara · indie-hacker" />
            <FlInput label="WALLET" defaultValue="0xC4F9…8E21" disabled />
            <FlInput label="EMAIL · OPTIONAL" defaultValue="cara@quietbotanic.co" />
            <FlInput label="DEFAULT BOUNTY TEMPLATE" defaultValue="LOGO-DESIGN" />
          </div>
        </div>
      </ManifestCard>

      <ManifestCard idTab={<IdTab variant="cobalt">ESCROW & PAYMENTS</IdTab>} formFooter="POSTER PAYMENT DEFAULTS">
        <div className="p-7 space-y-4">
          <FlInput label="DEFAULT ESCROW TOKEN" defaultValue="USDT · BASE" disabled />
          <FlInput label="AUTO-APPROVE WINDOW · HOURS" defaultValue="72" type="number" />
          <FlInput label="MAX BOUNTY AMOUNT · USDT" defaultValue="500" type="number" />
          <div className="flex justify-between items-center pt-2 border-t border-hairline">
            <div>
              <MonoLabel ink className="block">DISPUTE STAKE</MonoLabel>
              <p className="mono-small text-muted-ink mt-1">Charged when you open a dispute · refunded if you win</p>
            </div>
            <Tag variant="cobalt">5 USDT</Tag>
          </div>
        </div>
      </ManifestCard>

      <ManifestCard idTab={<IdTab variant="ink">NOTIFICATIONS</IdTab>} formFooter="POSTER ALERTS · YOU CONTROL">
        <div className="p-7 space-y-3">
          {POSTER_NOTIFS.map((n, i) => (
            <label key={n} className="flex items-center justify-between border border-ink px-4 h-12 cursor-pointer hover:bg-hairline/30">
              <span className="text-[15px]">{n}</span>
              <span className="w-12 h-6 border border-ink relative bg-paper">
                <span className={`absolute inset-y-0 ${i % 3 === 2 ? "right-0" : "left-0"} w-6 ${i % 3 === 2 ? "bg-hairline" : "bg-ink"}`} />
              </span>
            </label>
          ))}
        </div>
      </ManifestCard>

      <ManifestCard idTab={<IdTab variant="ink">DANGER ZONE</IdTab>} formFooter="ACCOUNT TERMINATION">
        <div className="p-7 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-display font-medium text-[20px]">Revoke session & delete poster account</h3>
            <p className="mono-small text-muted-ink mt-1">YOUR ON-CHAIN HISTORY REMAINS · YOUR PROFILE IS REMOVED</p>
          </div>
          <FlButton variant="destructive">Delete poster account</FlButton>
        </div>
      </ManifestCard>
    </DashboardLayout>
  );
}
