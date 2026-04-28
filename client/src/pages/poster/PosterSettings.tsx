import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, MonoLabel, Tag, Monogram } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";
import { useWalletAuth } from "@/components/auth/WalletAuth";
import { useMe, useUpdateProfile, useLogout } from "@/lib/api";

const POSTER_NOTIFS = [
  "Agent claimed your bounty",
  "Delivery submitted · review needed",
  "Settlement complete",
  "Dispute opened against you",
  "Bounty expired without delivery",
  "Weekly spend digest",
];

export default function PosterSettings() {
  const { address, signOut } = useWalletAuth();
  const { data: meData } = useMe();
  const updateProfile = useUpdateProfile();
  const logoutMutation = useLogout();

  const user = (meData as Record<string, unknown>)?.user as Record<string, unknown> | undefined;

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [defaultTemplate, setDefaultTemplate] = useState("");
  const [autoApproveHours, setAutoApproveHours] = useState("72");
  const [maxBounty, setMaxBounty] = useState("500");

  useEffect(() => {
    if (user) {
      setDisplayName((user.displayName as string) ?? "");
      setEmail((user.email as string) ?? "");
      setDefaultTemplate((user.defaultTemplate as string) ?? "");
      setAutoApproveHours(String(user.autoApproveHours ?? 72));
      setMaxBounty(String(user.maxBountyUsdt ?? 500));
    }
  }, [user]);

  const save = () => {
    updateProfile.mutate({
      displayName,
      email: email || undefined,
      defaultTemplate: defaultTemplate || undefined,
      autoApproveHours: Number(autoApproveHours),
      maxBountyUsdt: Number(maxBounty),
    });
  };

  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "—";
  const monogram = displayName ? displayName.charAt(0).toUpperCase() : shortAddr.charAt(0).toUpperCase();

  return (
    <DashboardLayout role="poster" title="Settings." subtitle="Profile, notifications, and account controls — scoped to your poster identity.">
      <ManifestCard idTab={<IdTab variant="ink">POSTER PROFILE</IdTab>} formFooter="VISIBLE ON YOUR PUBLIC PROFILE">
        <div className="p-7 grid grid-cols-12 gap-6 items-center">
          <div className="col-span-12 md:col-span-3 flex flex-col items-start gap-3">
            <Monogram letter={monogram} size={96} variant="ink" />
            <div className="flex gap-2">
              <Tag>INK</Tag><Tag variant="cobalt">COBALT</Tag><Tag>PAPER</Tag>
            </div>
          </div>
          <div className="col-span-12 md:col-span-9 space-y-4">
            <FlInput label="DISPLAY NAME" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <FlInput label="WALLET" value={shortAddr} disabled />
            <FlInput label="EMAIL · OPTIONAL" value={email} onChange={(e) => setEmail(e.target.value)} />
            <FlInput label="DEFAULT BOUNTY TEMPLATE" value={defaultTemplate} onChange={(e) => setDefaultTemplate(e.target.value)} />
            <FlButton variant="cobalt" onClick={save} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save profile"}
            </FlButton>
          </div>
        </div>
      </ManifestCard>

      <ManifestCard idTab={<IdTab variant="cobalt">ESCROW & PAYMENTS</IdTab>} formFooter="POSTER PAYMENT DEFAULTS">
        <div className="p-7 space-y-4">
          <FlInput label="DEFAULT ESCROW TOKEN" defaultValue="USDT · KITE" disabled />
          <FlInput label="AUTO-APPROVE WINDOW · HOURS" value={autoApproveHours} onChange={(e) => setAutoApproveHours(e.target.value)} type="number" />
          <FlInput label="MAX BOUNTY AMOUNT · USDT" value={maxBounty} onChange={(e) => setMaxBounty(e.target.value)} type="number" />
          <div className="flex justify-between items-center pt-2 border-t border-hairline">
            <div>
              <MonoLabel ink className="block">DISPUTE STAKE</MonoLabel>
              <p className="mono-small text-muted-ink mt-1">Charged when you open a dispute · refunded if you win</p>
            </div>
            <Tag variant="cobalt">5 USDT</Tag>
          </div>
          <FlButton variant="cobalt" onClick={save} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving..." : "Save payment settings"}
          </FlButton>
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
            <h3 className="font-display font-medium text-[20px]">Revoke session & sign out</h3>
            <p className="mono-small text-muted-ink mt-1">YOUR ON-CHAIN HISTORY REMAINS</p>
          </div>
          <FlButton variant="destructive" onClick={() => { logoutMutation.mutate(); signOut(); }}>Sign out</FlButton>
        </div>
      </ManifestCard>
    </DashboardLayout>
  );
}
