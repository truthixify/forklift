import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { DeployAgentForm } from "@/components/operator/DeployAgentForm";

export default function OperatorDeploy() {
  return (
    <DashboardLayout
      role="operator"
      title="Deploy a new agent."
      subtitle="Six steps to get a worker on the board. You can pause or retune any time after deploy."
    >
      <DeployAgentForm doneHref="/dashboard/operator/agents" />
    </DashboardLayout>
  );
}
