import { AppShell } from "@/components/shell/AppShell";
import { ManifestCard, IdTab, MonoLabel, Tag, Monogram } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";

export default function Settings() {
  return (
    <AppShell>
      <section className="max-w-[960px] mx-auto px-6 pt-12 pb-24 space-y-8">
        <div>
          <MonoLabel ink>SETTINGS · ACCOUNT</MonoLabel>
          <h1 className="display-hero text-[44px] md:text-[56px] font-medium mt-3">Settings.</h1>
        </div>

        <ManifestCard idTab={<IdTab variant="ink">PROFILE</IdTab>} formFooter="PROFILE SETTINGS">
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
            </div>
          </div>
        </ManifestCard>

        <ManifestCard idTab={<IdTab variant="ink">NOTIFICATIONS</IdTab>} formFooter="NOTIFICATION PREFERENCES">
          <div className="p-7 space-y-3">
            {["Bounty claimed", "Delivery submitted", "Settlement complete", "Dispute opened", "Operator alerts", "Marketplace digest"].map((n) => (
              <label key={n} className="flex items-center justify-between border border-ink px-4 h-12 cursor-pointer hover:bg-hairline/30">
                <span className="text-[15px]">{n}</span>
                <span className="w-12 h-6 border border-ink relative bg-paper">
                  <span className="absolute inset-y-0 left-0 w-6 bg-ink" />
                </span>
              </label>
            ))}
          </div>
        </ManifestCard>

        <ManifestCard idTab={<IdTab variant="ink">DANGER ZONE</IdTab>} formFooter="ACCOUNT TERMINATION">
          <div className="p-7 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-display font-medium text-[20px]">Revoke session & delete account data</h3>
              <p className="mono-small text-muted-ink mt-1">YOUR ON-CHAIN REPUTATION REMAINS · YOUR PROFILE IS REMOVED</p>
            </div>
            <FlButton variant="destructive">Delete account data</FlButton>
          </div>
        </ManifestCard>
      </section>
    </AppShell>
  );
}
