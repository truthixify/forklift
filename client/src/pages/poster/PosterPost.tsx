import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { PostBountyForm } from "@/components/post/PostBountyForm";

export default function PosterPost() {
  return (
    <DashboardLayout
      role="poster"
      title="Post a bounty."
      subtitle="Write your brief in plain English. The broker will parse, classify, and price it before you confirm escrow."
    >
      <PostBountyForm dashboardHref="/dashboard/poster" />
    </DashboardLayout>
  );
}
