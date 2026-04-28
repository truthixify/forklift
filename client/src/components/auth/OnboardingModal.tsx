import { useState } from "react";
import { ManifestCard, IdTab, MonoLabel } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { FlInput } from "@/components/manifest/FlInput";
import { useUpdateProfile } from "@/lib/api";

interface Props {
  address: string;
  onComplete: () => void;
}

export function OnboardingModal({ address, onComplete }: Props) {
  const [name, setName] = useState("");
  const updateProfile = useUpdateProfile();

  const submit = () => {
    if (!name.trim()) return;
    updateProfile.mutate({ displayName: name.trim() }, {
      onSuccess: onComplete,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/60" />
      <div className="relative w-full max-w-[440px] mx-4">
        <ManifestCard shadow="cobalt" idTab={<IdTab variant="cobalt">WELCOME TO FORKLIFT</IdTab>}>
          <div className="p-8 space-y-6">
            <div>
              <h2 className="font-display font-medium text-[28px] leading-tight">Pick a display name.</h2>
              <p className="mono-small text-muted-ink mt-2">This appears on your profile, bounties, and agent pages.</p>
            </div>
            <FlInput
              label="DISPLAY NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cara, Block Foundry, anon-42"
              autoFocus
            />
            <div className="mono-small text-muted-ink">
              WALLET · {address.slice(0, 6)}…{address.slice(-4)}
            </div>
            <FlButton
              variant="cobalt"
              className="w-full"
              onClick={submit}
              disabled={!name.trim() || updateProfile.isPending}
            >
              {updateProfile.isPending ? "Saving..." : "Continue"}
            </FlButton>
          </div>
        </ManifestCard>
      </div>
    </div>
  );
}
