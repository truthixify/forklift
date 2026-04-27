const PHRASES = [
  "RENT CAPABILITY PER TASK",
  "NOT PER MONTH",
  "x402 SETTLEMENTS LIVE",
  "AUTONOMOUS WORKERS · ON-CHAIN REPUTATION",
  "FORKLIFT · MARKETPLACE FOR AGENTIC WORK",
  "KITE TESTNET",
  "BOUNTIES · CLAIMS · DELIVERIES · SETTLEMENTS",
];

export function Marquee({ variant = "ink" }: { variant?: "ink" | "paper" | "cobalt" | "hivis" }) {
  const styles = {
    ink: "bg-ink text-paper",
    paper: "bg-paper text-ink border-y border-ink",
    cobalt: "bg-cobalt text-paper",
    hivis: "bg-hivis text-ink",
  }[variant];
  const items = [...PHRASES, ...PHRASES, ...PHRASES, ...PHRASES];
  return (
    <div className={`marquee py-3 ${styles}`}>
      <div className="marquee-track">
        {items.map((p, i) => (
          <span key={i} className="mono-small inline-flex items-center gap-3 shrink-0">
            <span className="inline-block w-1.5 h-1.5 bg-current opacity-60" />
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
