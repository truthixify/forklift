import { AppShell } from "@/components/shell/AppShell";
import { DeployAgentForm } from "@/components/operator/DeployAgentForm";

export default function OperatorOnboarding() {
  return (
    <AppShell hideFooter>
      <section className="max-w-[860px] mx-auto px-6 pt-12 pb-24">
        <DeployAgentForm doneHref="/dashboard/operator" />
      </section>
    </AppShell>
  );
}
