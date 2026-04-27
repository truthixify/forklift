import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ListChecks,
  History,
  PlusSquare,
  Settings as SettingsIcon,
  Bot,
  Wallet,
  Rocket,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeftRight,
  Activity,
  LogOut,
} from "lucide-react";
import { AppShell } from "./AppShell";
import { Monogram, MonoLabel } from "@/components/manifest/Manifest";
import { useWalletAuth } from "@/components/auth/WalletAuth";
import { cn } from "@/lib/utils";

type Role = "poster" | "operator";

type Item = { to: string; label: string; end?: boolean; icon: typeof LayoutGrid };

const POSTER_NAV: Item[] = [
  { to: "/dashboard/poster", label: "Overview", end: true, icon: LayoutGrid },
  { to: "/dashboard/poster/bounties", label: "My bounties", icon: ListChecks },
  { to: "/dashboard/poster/history", label: "History", icon: History },
  { to: "/dashboard/poster/activity", label: "Activity", icon: Activity },
  { to: "/dashboard/poster/post", label: "Post a bounty", icon: PlusSquare },
  { to: "/dashboard/poster/settings", label: "Settings", icon: SettingsIcon },
];

const OPERATOR_NAV: Item[] = [
  { to: "/dashboard/operator", label: "Overview", end: true, icon: LayoutGrid },
  { to: "/dashboard/operator/agents", label: "My agents", icon: Bot },
  { to: "/dashboard/operator/earnings", label: "Earnings", icon: Wallet },
  { to: "/dashboard/operator/activity", label: "Activity", icon: Activity },
  { to: "/dashboard/operator/deploy", label: "Deploy agent", icon: Rocket },
  { to: "/dashboard/operator/settings", label: "Settings", icon: SettingsIcon },
];

interface Props {
  role: Role;
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerAction?: ReactNode;
}

const STORAGE_KEY = "fl.dashSidebar.collapsed";

export function DashboardLayout({ role, title, subtitle, children, headerAction }: Props) {
  const nav = role === "operator" ? OPERATOR_NAV : POSTER_NAV;
  const otherRole: Role = role === "operator" ? "poster" : "operator";
  const monogram = role === "operator" ? "B" : "C";
  const ident =
    role === "operator" ? "BLOCK FOUNDRY · 0x91A2…77F4" : "CARA · 0xC4F9…8E21";
  const navigate = useNavigate();
  const { signOut } = useWalletAuth();
  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  return (
    <AppShell hideFooter>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 pt-6 md:pt-8 pb-16 flex gap-6 md:gap-8">
        {/* Sidebar — desktop only */}
        <aside
          className={cn(
            "hidden md:block shrink-0 transition-[width] duration-150",
            collapsed ? "w-[72px]" : "w-[260px]",
          )}
        >
          <div className="border-2 border-ink bg-paper sticky top-[76px]">
            <div
              className={cn(
                "border-b-2 border-ink flex items-center gap-3",
                collapsed ? "p-3 justify-center" : "p-5 items-start",
              )}
            >
              <Monogram letter={monogram} size={collapsed ? 36 : 48} variant="ink" />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <MonoLabel ink className="block">{role.toUpperCase()} DESK</MonoLabel>
                  <div className="font-display font-medium text-[16px] truncate">
                    {role === "operator" ? "Block Foundry" : "Cara"}
                  </div>
                  <div className="mono-small text-muted-ink truncate">{ident}</div>
                </div>
              )}
            </div>

            <nav className="py-2">
              {nav.map((n) => {
                const Icon = n.icon;
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    title={collapsed ? n.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center h-11 mono-small border-l-2 transition-none",
                        collapsed ? "px-0 justify-center" : "px-5 justify-between",
                        isActive
                          ? "border-cobalt bg-hairline/50 text-ink"
                          : "border-transparent text-muted-ink hover:text-ink hover:bg-hairline/30",
                      )
                    }
                  >
                    <span className={cn("flex items-center", collapsed ? "" : "gap-3")}>
                      <Icon size={16} strokeWidth={1.75} />
                      {!collapsed && <span>{n.label}</span>}
                    </span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-3 border-t-2 border-ink space-y-2">
              <Link
                to={`/dashboard/${otherRole}`}
                title={collapsed ? `Switch to ${otherRole}` : undefined}
                className={cn(
                  "border border-ink h-10 mono-small inline-flex items-center w-full hover:bg-ink hover:text-paper",
                  collapsed ? "justify-center" : "justify-center gap-2",
                )}
              >
                <ArrowLeftRight size={14} strokeWidth={1.75} />
                {!collapsed && <span>SWITCH TO {otherRole.toUpperCase()}</span>}
              </Link>
              <button
                onClick={handleSignOut}
                title={collapsed ? "Sign out" : undefined}
                className={cn(
                  "border border-ink h-10 mono-small inline-flex items-center w-full hover:bg-alarm hover:text-paper hover:border-alarm",
                  collapsed ? "justify-center" : "justify-center gap-2",
                )}
              >
                <LogOut size={14} strokeWidth={1.75} />
                {!collapsed && <span>SIGN OUT</span>}
              </button>
              <button
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={cn(
                  "h-9 mono-small inline-flex items-center w-full text-muted-ink hover:text-ink",
                  collapsed ? "justify-center" : "justify-end gap-2",
                )}
              >
                {collapsed ? <ChevronsRight size={14} /> : <><span>COLLAPSE</span><ChevronsLeft size={14} /></>}
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile in-page nav (since sidebar is hidden on mobile) */}
          <div className="md:hidden -mx-4 px-4 mb-5 border-b-2 border-ink overflow-x-auto">
            <div className="flex gap-1 pb-3">
              {nav.map((n) => {
                const Icon = n.icon;
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    className={({ isActive }) =>
                      cn(
                        "shrink-0 inline-flex items-center gap-1.5 h-9 px-3 border mono-small",
                        isActive
                          ? "border-ink bg-ink text-paper"
                          : "border-ink/40 text-ink hover:border-ink",
                      )
                    }
                  >
                    <Icon size={13} strokeWidth={1.75} />
                    <span>{n.label}</span>
                  </NavLink>
                );
              })}
              <Link
                to={`/dashboard/${otherRole}`}
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 border border-ink/40 mono-small hover:border-ink"
              >
                <ArrowLeftRight size={13} strokeWidth={1.75} />
                <span>{otherRole.toUpperCase()}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 border border-ink/40 mono-small hover:bg-alarm hover:text-paper hover:border-alarm"
              >
                <LogOut size={13} strokeWidth={1.75} />
                <span>SIGN OUT</span>
              </button>
            </div>
          </div>

          <header className="flex items-end justify-between gap-4 flex-wrap pb-6 mb-6 border-b-2 border-ink">
            <div>
              <MonoLabel ink>{role === "operator" ? "OPERATOR" : "POSTER"} DESK</MonoLabel>
              <h1 className="display-hero text-[32px] md:text-[52px] font-medium leading-tight mt-2">{title}</h1>
              {subtitle && <p className="mono-small text-muted-ink mt-2 max-w-[60ch]">{subtitle}</p>}
            </div>
            {headerAction}
          </header>

          <div className="space-y-8">{children}</div>
        </div>
      </div>
    </AppShell>
  );
}
