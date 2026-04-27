import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Coins, FileCheck2, AlertTriangle, Sparkles, Wallet, Pause } from "lucide-react";
import { MonoLabel } from "@/components/manifest/Manifest";
import { cn } from "@/lib/utils";

type Role = "poster" | "operator";
type Kind = "claim" | "delivered" | "paid" | "earned" | "cap" | "dispute";

export type ActivityItem = {
  kind: Kind;
  body: string;
  ts: string;
  href: string;
  unread?: boolean;
  group: string;
};

const META: Record<Kind, { label: string; icon: typeof Bell; tone: string; iconBox: string }> = {
  claim:     { label: "CLAIM",     icon: Sparkles,      tone: "border-l-cobalt",  iconBox: "bg-cobalt text-paper" },
  delivered: { label: "DELIVERED", icon: FileCheck2,    tone: "border-l-magenta", iconBox: "bg-magenta text-paper" },
  paid:      { label: "SETTLED",   icon: Coins,         tone: "border-l-lime",    iconBox: "bg-lime text-ink" },
  earned:    { label: "EARNED",    icon: Wallet,        tone: "border-l-hivis",   iconBox: "bg-hivis text-ink" },
  cap:       { label: "CAP HIT",   icon: Pause,         tone: "border-l-ink",     iconBox: "bg-ink text-paper" },
  dispute:   { label: "DISPUTE",   icon: AlertTriangle, tone: "border-l-alarm",   iconBox: "bg-alarm text-paper" },
};

// All activity stays inside the user's dashboard scope.
const POSTER_ACTIVITY: ActivityItem[] = [
  { group: "MY BOUNTIES", kind: "claim",     body: "Pixel claimed FL-0042 · Logo design",      ts: "14:08", href: "/dashboard/poster/bounties?id=FL-0042", unread: true },
  { group: "MY BOUNTIES", kind: "delivered", body: "Press delivered FL-0036 · review pending", ts: "13:48", href: "/dashboard/poster/bounties?id=FL-0036", unread: true },
  { group: "MY BOUNTIES", kind: "paid",      body: "FL-0039 settled · 8.00 USDT released",     ts: "14:05", href: "/dashboard/poster/history?id=FL-0039" },
  { group: "MY BOUNTIES", kind: "dispute",   body: "FL-0031 disputed · evidence needed",       ts: "11:02", href: "/dashboard/poster/bounties?id=FL-0031", unread: true },
];

const OPERATOR_ACTIVITY: ActivityItem[] = [
  { group: "MY AGENTS", kind: "claim",     body: "Pixel claimed FL-0042 · Logo design",       ts: "14:08", href: "/dashboard/operator/agents?id=pixel", unread: true },
  { group: "MY AGENTS", kind: "delivered", body: "Press delivered FL-0036 · awaiting review", ts: "13:48", href: "/dashboard/operator/agents?id=press", unread: true },
  { group: "MY AGENTS", kind: "earned",    body: "Pixel earned 25 USDT · withdraw available", ts: "14:09", href: "/dashboard/operator/earnings", unread: true },
  { group: "MY AGENTS", kind: "cap",       body: "Cargo daily cap reached · 50 USDT",         ts: "12:14", href: "/dashboard/operator/agents?id=cargo" },
  { group: "MY AGENTS", kind: "dispute",   body: "FL-0031 disputed · evidence needed",        ts: "11:02", href: "/dashboard/operator/agents?id=press", unread: true },
];

export function getActivityForRole(role: Role): ActivityItem[] {
  return role === "operator" ? OPERATOR_ACTIVITY : POSTER_ACTIVITY;
}

function groupItems(items: ActivityItem[]) {
  const map = new Map<string, ActivityItem[]>();
  items.forEach((i) => {
    const arr = map.get(i.group) ?? [];
    arr.push(i);
    map.set(i.group, arr);
  });
  return Array.from(map.entries()).map(([group, list]) => ({ group, items: list }));
}

export function ActivityRow({ n, onClick }: { n: ActivityItem; onClick?: () => void }) {
  const meta = META[n.kind];
  const Icon = meta.icon;
  return (
    <Link
      to={n.href}
      onClick={onClick}
      className={cn(
        "px-4 py-3 flex items-start gap-3 hover:bg-hairline/40 border-b border-hairline border-l-[3px] transition-none",
        meta.tone,
      )}
    >
      <span className={cn("inline-flex items-center justify-center w-7 h-7 shrink-0", meta.iconBox)}>
        <Icon size={13} strokeWidth={2} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="mono-small text-muted-ink mb-0.5">{meta.label}</div>
        <div className="text-[13px] leading-snug text-ink">{n.body}</div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="mono-small text-muted-ink tabular-nums">{n.ts}</span>
        {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-cobalt" />}
      </div>
    </Link>
  );
}

export function NotificationsBell() {
  const { pathname } = useLocation();
  const role: Role = pathname.startsWith("/dashboard/operator") ? "operator" : "poster";
  const items = useMemo(() => getActivityForRole(role), [role]);
  const groups = useMemo(() => groupItems(items), [items]);
  const unread = items.filter((i) => i.unread).length;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex items-center justify-center w-10 h-10 border border-ink bg-paper hover:bg-ink hover:text-paper"
      >
        <Bell size={16} strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-magenta text-paper mono-small px-1.5 h-4 min-w-[16px] inline-flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[400px] max-w-[calc(100vw-2rem)] bg-paper border-2 border-ink shadow-[6px_6px_0_0_hsl(var(--ink))] z-50 max-h-[70vh] overflow-y-auto">
          <div className="px-5 py-3 border-b-2 border-ink flex items-center justify-between sticky top-0 bg-paper z-10">
            <MonoLabel ink>INBOX · {unread} NEW</MonoLabel>
            <button className="mono-small hover:text-cobalt">MARK ALL READ</button>
          </div>
          <div>
            {groups.map((g) => (
              <div key={g.group}>
                <div className="px-5 pt-3 pb-1.5 mono-label-ink bg-hairline/30 border-b border-hairline">
                  {g.group}
                </div>
                {g.items.map((n, i) => (
                  <ActivityRow key={i} n={n} onClick={() => setOpen(false)} />
                ))}
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t-2 border-ink sticky bottom-0 bg-paper">
            <Link
              to={`/dashboard/${role}/activity`}
              onClick={() => setOpen(false)}
              className="mono-small hover:text-cobalt"
            >
              VIEW ALL ACTIVITY →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
