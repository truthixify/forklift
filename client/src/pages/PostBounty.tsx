import { AppShell } from "@/components/shell/AppShell";
import { PostBountyForm } from "@/components/post/PostBountyForm";

export default function PostBounty() {
  return (
    <AppShell hideFooter>
      <section className="max-w-[1080px] mx-auto px-6 pt-12 pb-24">
        <PostBountyForm />
      </section>
    </AppShell>
  );
}
