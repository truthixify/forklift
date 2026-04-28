import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Coins, FileCheck2, AlertTriangle, Sparkles, Wallet, Pause } from "lucide-react";
import { MonoLabel } from "@/components/manifest/Manifest";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkRead } from "@/lib/api";
import { useWalletAuth } from "@/components/auth/WalletAuth";

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

interface ApiNotification {
  id: number;
  category: string;
  title: string;
  body: string;
  ctaHref: string;
  unread: boolean;
  createdAt: string;
}

const CATEGORY_TO_KIND: Record<string, Kind> = {
  claim: "claim",
  delivered: "delivered",
  paid: "paid",
  earned: "earned",
  cap: "cap",
  dispute: "dispute",
  settlement: "paid",
  delivery: "delivered",
};

const CATEGORY_TO_GROUP: Record<string, string> = {
  claim: "MY BOUNTIES",
  delivered: "MY BOUNTIES",
  paid: "MY BOUNTIES",
  earned: "MY AGENTS",
  cap: "MY AGENTS",
  dispute: "MY BOUNTIES",
  settlement: "MY BOUNTIES",
  delivery: "MY BOUNTIES",
};

function apiNotificationToItem(n: ApiNotification): ActivityItem {
  const kind = CATEGORY_TO_KIND[n.category] ?? "claim";
  const group = CATEGORY_TO_GROUP[n.category] ?? "ACTIVITY";
  const ts = new Date(n.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return {
    kind,
    body: n.body || n.title,
    ts,
    href: n.ctaHref || "#",
    unread: n.unread,
    group,
  };
}

export function getActivityForRole(_role: Role): ActivityItem[] {
  return [];
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
  const { address } = useWalletAuth();
  const { data: notifData, isLoading } = useNotifications(address ?? "", false);
  const markRead = useMarkRead();

  const items: ActivityItem[] = useMemo(() => {
    const raw = notifData as { notifications?: ApiNotification[] } | undefined;
    if (!raw?.notifications || !Array.isArray(raw.notifications)) return [];
    return raw.notifications.map(apiNotificationToItem);
  }, [notifData]);

  const groups = useMemo(() => groupItems(items), [items]);
  const unreadCount = useMemo(() => {
    const raw = notifData as { unreadCount?: number; notifications?: ApiNotification[] } | undefined;
    if (typeof raw?.unreadCount === "number") return raw.unreadCount;
    return items.filter((i) => i.unread).length;
  }, [notifData, items]);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleMarkAllRead = () => {
    const raw = notifData as { notifications?: ApiNotification[] } | undefined;
    if (!raw?.notifications) return;
    raw.notifications.filter((n) => n.unread).forEach((n) => markRead.mutate(n.id));
  };

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
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-magenta text-paper mono-small px-1.5 h-4 min-w-[16px] inline-flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[400px] max-w-[calc(100vw-2rem)] bg-paper border-2 border-ink shadow-[6px_6px_0_0_hsl(var(--ink))] z-50 max-h-[70vh] overflow-y-auto">
          <div className="px-5 py-3 border-b-2 border-ink flex items-center justify-between sticky top-0 bg-paper z-10">
            <MonoLabel ink>INBOX · {unreadCount} NEW</MonoLabel>
            <button onClick={handleMarkAllRead} className="mono-small hover:text-cobalt">MARK ALL READ</button>
          </div>
          <div>
            {isLoading ? (
              <div className="px-5 py-8 text-center mono-small text-muted-ink">LOADING...</div>
            ) : items.length === 0 ? (
              <div className="px-5 py-8 text-center mono-small text-muted-ink">NO NOTIFICATIONS</div>
            ) : (
              groups.map((g) => (
                <div key={g.group}>
                  <div className="px-5 pt-3 pb-1.5 mono-label-ink bg-hairline/30 border-b border-hairline">
                    {g.group}
                  </div>
                  {g.items.map((n, i) => (
                    <ActivityRow key={i} n={n} onClick={() => setOpen(false)} />
                  ))}
                </div>
              ))
            )}
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
