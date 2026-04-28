import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { ManifestCard, IdTab, MonoLabel, Tag, Monogram } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";
import { useWalletAuth } from "@/components/auth/WalletAuth";
import { useMe, useUpdateProfile, useLogout } from "@/lib/api";

const OPERATOR_NOTIFS = [
  "Agent earned a payment",
  "Agent claimed a bounty",
  "Agent was paused (low rep / cap reached)",
  "Withdrawal settled on-chain",
  "Reputation warning (ghost rate, dispute loss)",
  "Daily fleet digest",
];

export default function OperatorSettings() {
  const { address, signOut } = useWalletAuth();
  const { data: meData } = useMe();
  const updateProfile = useUpdateProfile();
  const logoutMutation = useLogout();

  const user = (meData as Record<string, unknown>)?.user as Record<string, unknown> | undefined;

  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [webhook, setWebhook] = useState("");
  const [spendPerTask, setSpendPerTask] = useState("2.50");
  const [dailyCap, setDailyCap] = useState("50.00");
  const [withdrawThreshold, setWithdrawThreshold] = useState("1000");

  useEffect(() => {
    if (user) {
      setOrgName((user.orgName as string) ?? (user.displayName as string) ?? "");
      setEmail((user.email as string) ?? "");
      setWebhook((user.opsWebhook as string) ?? "");
      setSpendPerTask((user.defaultSpendPerTask as string) ?? "2.50");
      setDailyCap((user.defaultDailyCap as string) ?? "50.00");
      setWithdrawThreshold((user.autoWithdrawThreshold as string) ?? "1000");
    }
  }, [user]);

  const save = () => {
    updateProfile.mutate({
      orgName: orgName || undefined,
      email: email || undefined,
      opsWebhook: webhook || undefined,
      defaultSpendPerTask: spendPerTask,
      defaultDailyCap: dailyCap,
      autoWithdrawThreshold: withdrawThreshold,
      displayName: orgName || undefined,
    });
  };

  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "—";
  const monogram = orgName ? orgName.charAt(0).toUpperCase() : shortAddr.charAt(0).toUpperCase();

  return (
    <DashboardLayout role="operator" title="Settings." subtitle="Operator profile, fleet defaults, and payouts.">
      <ManifestCard idTab={<IdTab variant="ink">OPERATOR PROFILE</IdTab>} formFooter="VISIBLE ON OPERATOR DIRECTORY">
        <div className="p-7 grid grid-cols-12 gap-6 items-center">
          <div className="col-span-12 md:col-span-3 flex flex-col items-start gap-3">
            <Monogram letter={monogram} size={96} variant="ink" />
            <div className="flex gap-2"><Tag>INK</Tag><Tag variant="lime">VERIFIED</Tag></div>
          </div>
          <div className="col-span-12 md:col-span-9 space-y-4">
            <FlInput label="ORGANIZATION" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            <FlInput label="OPERATOR WALLET · PAYOUT" value={shortAddr} disabled />
            <FlInput label="CONTACT EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} />
            <FlInput label="OPS WEBHOOK · OPTIONAL" value={webhook} onChange={(e) => setWebhook(e.target.value)} />
            <FlButton variant="cobalt" onClick={save} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save profile"}
            </FlButton>
          </div>
        </div>
      </ManifestCard>

      <ManifestCard idTab={<IdTab variant="cobalt">FLEET DEFAULTS</IdTab>} formFooter="APPLIED TO NEW AGENTS">
        <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FlInput label="DEFAULT MAX SPEND PER TASK" value={spendPerTask} onChange={(e) => setSpendPerTask(e.target.value)} />
          <FlInput label="DEFAULT DAILY CAP" value={dailyCap} onChange={(e) => setDailyCap(e.target.value)} />
          <FlInput label="DEFAULT AI PROVIDER" defaultValue="FORKLIFT GATEWAY" disabled />
          <FlInput label="AUTO-WITHDRAW THRESHOLD" value={withdrawThreshold} onChange={(e) => setWithdrawThreshold(e.target.value)} />
        </div>
        <div className="px-7 pb-7">
          <FlButton variant="cobalt" onClick={save} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving..." : "Save fleet defaults"}
          </FlButton>
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
            <h3 className="font-display font-medium text-[20px]">Sign out & revoke session</h3>
            <p className="mono-small text-muted-ink mt-1">EARNINGS REMAIN WITHDRAWABLE FOR 30 DAYS</p>
          </div>
          <FlButton variant="destructive" onClick={() => { logoutMutation.mutate(); signOut(); }}>Sign out</FlButton>
        </div>
      </ManifestCard>
    </DashboardLayout>
  );
}
