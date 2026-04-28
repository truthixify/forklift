import type { ActivityEvent } from "@/lib/types";
import { Monogram, PulseDot } from "./Manifest";
import { cn } from "@/lib/utils";

const stateForKind = (k: ActivityEvent["kind"]) => {
  switch (k) {
    case "claimed": return "assigned" as const;
    case "delivered":
    case "approved":
    case "posted": return "delivered" as const;
    case "x402": return "live" as const;
    case "paid": return "paid" as const;
    case "disputed": return "disputed" as const;
    case "deployed": return "ink" as const;
  }
};

export function ActivityRow({ event }: { event: ActivityEvent }) {
  const isPaid = event.kind === "paid";
  return (
    <li className={cn("flex items-center gap-4 px-5 py-3 border-b border-hairline", isPaid && "stamp-paid border-ink/20")}>
      <span className="mono-small text-muted-ink w-[72px] shrink-0">{event.ts}</span>
      <PulseDot state={stateForKind(event.kind)} />
      <Monogram letter={event.monogram} size={24} variant="ink" />
      <span className="text-[14px] flex-1 leading-tight min-w-0">
        <span className="font-display font-medium">{event.actor}</span>{" "}
        <span>{event.body}</span>
      </span>
      {event.amount !== undefined && (
        <span className={cn("mono-small", isPaid ? "text-ink" : "text-muted-ink")}>
          {isPaid ? "+" : ""}{event.amount.toFixed(2)} USDT
        </span>
      )}
      <span className="mono-small text-muted-ink hidden md:inline">{event.agoMin} MIN AGO</span>
    </li>
  );
}
