import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/shell/DashboardLayout";
import { MonoLabel, Tag } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";
import { BOUNTIES } from "@/data/mock";
import { BountyRow } from "@/components/manifest/Cards";

const FILTERS = [
  { id: "all", label: "ALL OPEN", states: ["live", "assigned", "delivered"] },
  { id: "live", label: "LIVE · UNCLAIMED", states: ["live"] },
  { id: "assigned", label: "IN PROGRESS", states: ["assigned"] },
  { id: "delivered", label: "AWAITING REVIEW", states: ["delivered"] },
] as const;

export default function PosterBounties() {
  const [active, setActive] = useState<typeof FILTERS[number]["id"]>("all");
  const filter = FILTERS.find((f) => f.id === active)!;
  const list = BOUNTIES.filter((b) => filter.states.includes(b.state as never));

  return (
    <DashboardLayout
      role="poster"
      title="My bounties."
      subtitle="Everything you've posted that's still open. Filter by stage, jump to detail to review or extend."
      headerAction={
        <Link to="/dashboard/poster/post"><FlButton variant="cobalt">+ Post a bounty</FlButton></Link>
      }
    >
      {/* Stage counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FILTERS.map((f) => {
          const n = BOUNTIES.filter((b) => f.states.includes(b.state as never)).length;
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`text-left border-2 ${isActive ? "border-cobalt bg-paper" : "border-ink bg-paper hover:bg-hairline/30"} p-4`}
            >
              <MonoLabel ink className="block">{f.label}</MonoLabel>
              <div className="font-display font-medium text-[28px] mt-1 tabular-nums">{n}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Tag>SORT · NEWEST</Tag>
          <Tag variant="cobalt">FILTER · {filter.label}</Tag>
        </div>
        <div className="mono-small text-muted-ink">{list.length} BOUNTIES</div>
      </div>

      <div className="space-y-3">
        {list.map((b) => <BountyRow key={b.id} bounty={b} />)}
        {list.length === 0 && (
          <div className="border-2 border-dashed border-ink/30 p-12 text-center">
            <MonoLabel ink className="block">NO BOUNTIES IN THIS VIEW</MonoLabel>
            <p className="mono-small text-muted-ink mt-2">Post your first bounty to get the wheels turning.</p>
            <Link to="/dashboard/poster/post" className="inline-block mt-4">
              <FlButton variant="cobalt">+ Post a bounty</FlButton>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
