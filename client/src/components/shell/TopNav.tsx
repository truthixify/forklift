import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import {
  LayoutGrid, ListChecks, History, PlusSquare,
  Settings as SettingsIcon, Bot, Wallet, Rocket, Activity, LogOut, ArrowLeftRight,
} from "lucide-react";
import { ForkliftGlyph, ForkliftWordmark } from "@/components/brand/Logo";
import { FlButton } from "@/components/manifest/FlButton";
import { Monogram, MonoLabel } from "@/components/manifest/Manifest";
import { NotificationsBell } from "@/components/shell/NotificationsBell";
import { useWalletAuth } from "@/components/auth/WalletAuth";
import { useMe } from "@/lib/api";
import { cn } from "@/lib/utils";

const POSTER_MOBILE_NAV = [
  { to: "/dashboard/poster", label: "Overview", icon: LayoutGrid },
  { to: "/dashboard/poster/bounties", label: "My bounties", icon: ListChecks },
  { to: "/dashboard/poster/history", label: "History", icon: History },
  { to: "/dashboard/poster/activity", label: "Activity", icon: Activity },
  { to: "/dashboard/poster/post", label: "Post a bounty", icon: PlusSquare },
  { to: "/dashboard/poster/settings", label: "Settings", icon: SettingsIcon },
];

const OPERATOR_MOBILE_NAV = [
  { to: "/dashboard/operator", label: "Overview", icon: LayoutGrid },
  { to: "/dashboard/operator/agents", label: "My agents", icon: Bot },
  { to: "/dashboard/operator/earnings", label: "Earnings", icon: Wallet },
  { to: "/dashboard/operator/activity", label: "Activity", icon: Activity },
  { to: "/dashboard/operator/deploy", label: "Deploy agent", icon: Rocket },
  { to: "/dashboard/operator/settings", label: "Settings", icon: SettingsIcon },
];

type NavChild = { to: string; label: string; desc?: string; auth?: "poster" | "operator" };
type NavItem = { label: string; to?: string; children?: NavChild[] };

const NAV: NavItem[] = [
  {
    label: "Marketplace",
    children: [
      { to: "/bounties", label: "Bounty board", desc: "Browse open work" },
      { to: "/agents", label: "Agent directory", desc: "Worker agents on Forklift" },
      { to: "/templates", label: "Templates", desc: "Pre-built bounty types" },
      { to: "/feed", label: "Live feed", desc: "Streaming activity" },
    ],
  },
  {
    label: "Build",
    children: [
      { to: "/dashboard/poster/post", label: "Post a bounty", desc: "Hire an agent in 60s", auth: "poster" },
      { to: "/dashboard/operator/deploy", label: "Deploy an agent", desc: "Run a worker, earn USDT", auth: "operator" },
    ],
  },
  {
    label: "Dashboards",
    children: [
      { to: "/dashboard/poster", label: "Poster dashboard", desc: "Your bounties & spend", auth: "poster" },
      { to: "/dashboard/operator", label: "Operator dashboard", desc: "Manage your agents", auth: "operator" },
    ],
  },
  {
    label: "Resources",
    children: [
      { to: "/resources", label: "Resource server", desc: "x402-paywalled APIs" },
      { to: "/docs", label: "Docs", desc: "Guides, API reference, playbooks" },
    ],
  },
];

const APP_ROUTES = ["/dashboard", "/onboarding"];

function isInApp(pathname: string) {
  return APP_ROUTES.some((p) => pathname.startsWith(p));
}

function getRole(pathname: string): "poster" | "operator" {
  if (pathname.startsWith("/dashboard/operator") || pathname.startsWith("/onboarding/operator")) {
    return "operator";
  }
  return "poster";
}

export function TopNav() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const inApp = isInApp(pathname);
  const role = getRole(pathname);
  const { connected, address, requireAuth, signOut } = useWalletAuth();
  const { data: meData } = useMe();
  const meUser = (meData as Record<string, unknown>)?.user as Record<string, unknown> | undefined;
  const profileMonogram = (meUser?.displayName as string)?.charAt(0)?.toUpperCase() ?? address?.charAt(2)?.toUpperCase() ?? "?";
  const showCobaltCTA = !pathname.startsWith("/post") && !inApp;

  const handleAuthLink = (to: string, intendedRole: "poster" | "operator") => {
    requireAuth(intendedRole, () => nav(to));
    setOpenGroup(null);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-paper border-b border-ink">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-[60px] flex items-center gap-4 md:gap-6">
        <Link to="/" className="inline-flex items-center gap-2 group" aria-label="Forklift home">
          <ForkliftGlyph className="w-6 h-6 group-hover:animate-lift" />
          <ForkliftWordmark style={{ fontSize: 20 }} />
        </Link>

        {/* Desktop nav — marketing (centered) */}
        {!inApp && <div className="flex-1 hidden md:block" />}
        {!inApp && (
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) =>
              n.children ? (
                <div
                  key={n.label}
                  className="relative"
                  onMouseEnter={() => setOpenGroup(n.label)}
                  onMouseLeave={() => setOpenGroup(null)}
                >
                  <button
                    className={cn(
                      "h-[60px] px-3 mono-small inline-flex items-center gap-1.5 hover:text-cobalt",
                      openGroup === n.label && "text-cobalt",
                    )}
                  >
                    {n.label}
                    <ChevronDown size={12} strokeWidth={2} />
                  </button>
                  {openGroup === n.label && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-[320px] bg-paper border-2 border-ink offset-shadow z-50">
                      {n.children.map((c) =>
                        c.auth ? (
                          <button
                            key={c.to}
                            onClick={() => handleAuthLink(c.to, c.auth!)}
                            className="block w-full text-left p-4 border-b border-hairline last:border-b-0 hover:bg-hairline/50 group/item"
                          >
                            <div className="font-display font-medium text-[15px] group-hover/item:text-cobalt">
                              {c.label}
                            </div>
                            {c.desc && (
                              <div className="mono-small text-muted-ink mt-1">{c.desc}</div>
                            )}
                          </button>
                        ) : (
                          <Link
                            key={c.to}
                            to={c.to}
                            onClick={() => setOpenGroup(null)}
                            className="block p-4 border-b border-hairline last:border-b-0 hover:bg-hairline/50 group/item"
                          >
                            <div className="font-display font-medium text-[15px] group-hover/item:text-cobalt">
                              {c.label}
                            </div>
                            {c.desc && (
                              <div className="mono-small text-muted-ink mt-1">{c.desc}</div>
                            )}
                          </Link>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={n.to}
                  to={n.to!}
                  className={({ isActive }) =>
                    cn(
                      "h-[60px] px-3 mono-small inline-flex items-center hover:text-cobalt transition-none",
                      isActive ? "text-cobalt" : "text-ink",
                    )
                  }
                >
                  {n.label}
                </NavLink>
              ),
            )}
          </nav>
        )}

        {inApp && (
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-ink">
            <span className="mono-small text-muted-ink uppercase tracking-wider">{role} desk</span>
          </div>
        )}

        <div className="flex-1 hidden md:block" />
        <div className="md:hidden flex-1" />

        <div className="flex items-center gap-3">
          {inApp && <NotificationsBell />}

          {inApp && (
            <Link to={`/dashboard/${role}`} aria-label="Profile">
              <Monogram letter={profileMonogram} size={40} variant="paper" />
            </Link>
          )}

          {!inApp && !connected && (
            <button
              onClick={() => requireAuth("poster")}
              className="hidden md:inline-flex mono-small text-ink hover:text-cobalt"
            >
              Sign in
            </button>
          )}

          {!inApp && connected && (
            <Link to="/dashboard/poster" className="hidden md:inline-flex mono-small text-ink hover:text-cobalt">
              Dashboard
            </Link>
          )}

          {showCobaltCTA && (
            <FlButton variant="cobalt" onClick={() => requireAuth("poster", () => nav("/dashboard/poster/post"))} className="hidden md:inline-block">Post a bounty</FlButton>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center w-10 h-10 border border-ink"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[88%] max-w-[360px] bg-paper border-l-2 border-ink overflow-y-auto">
            <div className="h-[60px] px-5 flex items-center justify-between border-b border-ink">
              <span className="inline-flex items-center gap-2">
                <ForkliftGlyph className="w-5 h-5" />
                <ForkliftWordmark style={{ fontSize: 18 }} />
              </span>
              <button
                aria-label="Close menu"
                className="w-9 h-9 inline-flex items-center justify-center border border-ink"
                onClick={() => setMobileOpen(false)}
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-5 space-y-7">
              {inApp ? (
                <>
                  <div>
                    <MonoLabel ink className="block mb-3">{role.toUpperCase()} DESK</MonoLabel>
                    <nav className="space-y-1">
                      {(role === "operator" ? OPERATOR_MOBILE_NAV : POSTER_MOBILE_NAV).map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.to || (item.to !== `/dashboard/${role}` && pathname.startsWith(item.to));
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 h-11 px-4 border border-ink -mt-px first:mt-0",
                              active ? "bg-ink text-paper" : "bg-paper hover:bg-hairline/40",
                            )}
                          >
                            <Icon size={16} strokeWidth={1.75} />
                            <span className="font-display font-medium text-[15px]">{item.label}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                  <div className="pt-4 border-t border-ink space-y-3">
                    <Link
                      to={`/dashboard/${role === "operator" ? "poster" : "operator"}`}
                      onClick={() => setMobileOpen(false)}
                      className="block"
                    >
                      <FlButton variant="secondary" className="w-full" iconLeft={<ArrowLeftRight size={14} />}>
                        Switch to {role === "operator" ? "poster" : "operator"}
                      </FlButton>
                    </Link>
                    <FlButton variant="destructive" className="w-full" iconLeft={<LogOut size={14} />} onClick={() => { signOut(); setMobileOpen(false); }}>
                      Sign out
                    </FlButton>
                  </div>
                </>
              ) : (
                <>
                  {NAV.map((n) =>
                    n.children ? (
                      <div key={n.label}>
                        <div className="mono-label-ink mb-3">{n.label}</div>
                        <ul className="space-y-3 border-l border-ink pl-4">
                          {n.children.map((c) =>
                            c.auth ? (
                              <li key={c.to}>
                                <button
                                  onClick={() => handleAuthLink(c.to, c.auth!)}
                                  className="block text-left w-full"
                                >
                                  <div className="font-display font-medium text-[16px] text-ink">{c.label}</div>
                                  {c.desc && <div className="mono-small text-muted-ink mt-0.5">{c.desc}</div>}
                                </button>
                              </li>
                            ) : (
                              <li key={c.to}>
                                <Link to={c.to} onClick={() => setMobileOpen(false)} className="block">
                                  <div className="font-display font-medium text-[16px] text-ink">{c.label}</div>
                                  {c.desc && <div className="mono-small text-muted-ink mt-0.5">{c.desc}</div>}
                                </Link>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    ) : (
                      <Link key={n.to} to={n.to!} onClick={() => setMobileOpen(false)} className="block font-display font-medium text-[18px] text-ink">
                        {n.label}
                      </Link>
                    ),
                  )}
                  <div className="pt-4 border-t border-ink space-y-3">
                    {!connected ? (
                      <FlButton variant="secondary" className="w-full" onClick={() => { requireAuth("poster"); setMobileOpen(false); }}>Sign in with wallet</FlButton>
                    ) : (
                      <Link to="/dashboard/poster" onClick={() => setMobileOpen(false)} className="block">
                        <FlButton variant="secondary" className="w-full">Go to dashboard</FlButton>
                      </Link>
                    )}
                    <FlButton variant="cobalt" className="w-full" onClick={() => handleAuthLink("/dashboard/poster/post", "poster")}>Post a bounty</FlButton>
                    <FlButton variant="secondary" className="w-full" onClick={() => handleAuthLink("/dashboard/operator/deploy", "operator")}>Deploy an agent</FlButton>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
