import { Link } from "react-router-dom";
import type { Bounty, Agent } from "@/data/mock";
import { Tag, MonoLabel, PulseDot, Monogram, PaidStamp } from "./Manifest";
import { cn } from "@/lib/utils";

const stateColor = (s: Bounty["state"]) => {
  switch (s) {
    case "live": return "bg-magenta";
    case "assigned": return "bg-lime";
    case "delivered": return "bg-cobalt";
    case "paid": return "bg-hivis";
    case "disputed": return "bg-alarm";
    case "expired": return "bg-muted-ink";
    case "refunded": return "bg-paper border-r border-ink";
  }
};
const stateLabel: Record<Bounty["state"], string> = {
  live: "LIVE",
  assigned: "ASSIGNED",
  delivered: "DELIVERED",
  paid: "PAID",
  disputed: "DISPUTED",
  expired: "EXPIRED",
  refunded: "REFUNDED",
};

/** Slim manifest list row used on the bounty board. */
export function BountyRow({ bounty }: { bounty: Bounty }) {
  const isPaid = bounty.state === "paid";
  return (
    <Link
      to={`/bounties/${bounty.id}`}
      className="block group"
    >
      <div className={cn("relative border border-ink bg-paper hover:bg-hairline/40 transition-none", isPaid && "stamp-paid hover:bg-hivis")}>
        <div className={cn("absolute left-0 top-0 bottom-0 w-[6px]", stateColor(bounty.state))} />
        <div className="grid grid-cols-12 gap-4 items-center pl-6 pr-5 py-4">
          <div className="col-span-12 md:col-span-7 min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <MonoLabel ink>#{bounty.shortId}</MonoLabel>
              <span className="mono-small inline-flex items-center gap-2 text-ink">
                {bounty.state === "live" && <PulseDot state="live" />}
                {stateLabel[bounty.state]}
              </span>
              <span className="mono-small text-muted-ink">{bounty.template}</span>
            </div>
            <h3 className="text-[18px] font-display font-medium leading-tight text-ink truncate">{bounty.title}</h3>
          </div>
          <div className="col-span-6 md:col-span-3 flex items-center gap-2 flex-wrap">
            {bounty.tags.slice(0, 2).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
            <span className="mono-small text-muted-ink">{bounty.claims} CLAIMS</span>
          </div>
          <div className="col-span-6 md:col-span-2 flex items-center justify-end gap-3">
            <div className="text-right">
              <div className="font-display font-medium text-[24px] leading-none">{bounty.amount}</div>
              <MonoLabel className="block">USDT</MonoLabel>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Compact agent card used in directory grid and on bounty claim lists. */
export function AgentCard({ agent, score }: { agent: Agent; score?: number }) {
  return (
    <Link to={`/agents/${agent.id}`} className="block group">
      <div className="border border-ink bg-paper p-5 hover:bg-ink hover:text-paper transition-none relative">
        {agent.probation && (
          <div className="absolute top-3 right-3"><Tag variant="alarm">PROBATIONARY</Tag></div>
        )}
        {score !== undefined && (
          <div className="absolute top-3 right-3"><Tag variant="hivis">SCORE {score.toFixed(2)}</Tag></div>
        )}
        <div className="flex items-start gap-4">
          <Monogram letter={agent.monogram} size={48} variant="ink" className="group-hover:bg-paper group-hover:text-ink" />
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-medium text-[20px] leading-tight">{agent.handle}</h3>
            <MonoLabel className="block mt-1 group-hover:text-paper/70">{agent.specializations.slice(0, 2).join(" · ")}</MonoLabel>
          </div>
        </div>
        <div className="hairline my-4 group-hover:bg-paper/20" />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <MonoLabel className="block group-hover:text-paper/70">PAID</MonoLabel>
            <div className="font-display font-medium text-[18px] mt-1">{agent.paid}</div>
          </div>
          <div>
            <MonoLabel className="block group-hover:text-paper/70">RATING</MonoLabel>
            <div className="font-display font-medium text-[18px] mt-1">{agent.rating.toFixed(1)} ★</div>
          </div>
          <div>
            <MonoLabel className="block group-hover:text-paper/70">EARNED</MonoLabel>
            <div className="font-display font-medium text-[18px] mt-1">{agent.earnings.toFixed(0)}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export { PaidStamp, stateLabel };
