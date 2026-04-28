import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { fetchNonce, fetchSignIn, useMe } from "@/lib/api";
import { OnboardingModal } from "./OnboardingModal";

type Role = "poster" | "operator";

interface WalletAuthCtx {
  connected: boolean;
  address: string | undefined;
  authenticated: boolean;
  role: Role | null;
  requireAuth: (intendedRole: Role, onAuthed?: (addr: string) => void) => void;
  signOut: () => void;
}

const Ctx = createContext<WalletAuthCtx | null>(null);

const ROLE_KEY = "fl.wallet.role";
const AUTH_KEY = "fl.wallet.authed";

function loadRole(): Role | null {
  try {
    const raw = localStorage.getItem(ROLE_KEY);
    return raw === "poster" || raw === "operator" ? raw : null;
  } catch { return null; }
}

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { openConnectModal } = useConnectModal();
  const qc = useQueryClient();
  const nav = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState<Role | null>(loadRole);
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem(AUTH_KEY) === "true");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{ intendedRole: Role; onAuthed?: (addr: string) => void } | null>(null);
  const signingRef = useRef(false);

  const { data: meData } = useMe();
  const meUser = (meData as Record<string, unknown>)?.user as Record<string, unknown> | undefined;

  useEffect(() => {
    if (role) localStorage.setItem(ROLE_KEY, role);
    else localStorage.removeItem(ROLE_KEY);
  }, [role]);

  // Auto-redirect: if on landing page and already authenticated with a saved role, go to dashboard
  useEffect(() => {
    if (isConnected && authenticated && role && location.pathname === "/") {
      nav(`/dashboard/${role}`);
    }
  }, [isConnected, authenticated, role, location.pathname, nav]);

  // After wallet connects with a pending auth, run sign-in flow
  useEffect(() => {
    if (!isConnected || !address || !pendingAuth || signingRef.current) return;

    signingRef.current = true;
    const pending = pendingAuth;

    (async () => {
      try {
        const { id: nonceId, nonce } = await fetchNonce();

        const message = [
          "forklift.xyz wants you to sign in with your Ethereum account:",
          address,
          "",
          "Sign in to Forklift",
          "",
          `URI: ${window.location.origin}`,
          `Nonce: ${nonce}`,
          `Issued At: ${new Date().toISOString()}`,
        ].join("\n");

        const signature = await signMessageAsync({ account: address as `0x${string}`, message });

        const result = await fetchSignIn({ address, message, signature, nonceId }) as Record<string, unknown>;

        setAuthenticated(true);
        localStorage.setItem(AUTH_KEY, "true");
        setRole(pending.intendedRole);
        qc.invalidateQueries({ queryKey: ["me"] });

        setPendingAuth(null);

        // Check if first-time user (no displayName yet)
        const user = result.user as Record<string, unknown> | undefined;
        if (!user?.displayName && !user?.onboarded) {
          setShowOnboarding(true);
          return;
        }

        if (pending.onAuthed) {
          pending.onAuthed(address);
        } else {
          nav(`/dashboard/${pending.intendedRole}`);
        }
      } catch (err) {
        console.error("Sign-in failed:", err);
        setPendingAuth(null);
      } finally {
        signingRef.current = false;
      }
    })();
  }, [isConnected, address, pendingAuth, signMessageAsync, nav, qc]);

  // Also check on meData load if user needs onboarding
  useEffect(() => {
    if (authenticated && meUser && !meUser.onboarded && !meUser.displayName && !showOnboarding) {
      setShowOnboarding(true);
    }
  }, [authenticated, meUser, showOnboarding]);

  const requireAuth = useCallback(
    (intendedRole: Role, onAuthed?: (addr: string) => void) => {
      if (isConnected && address && authenticated) {
        setRole(intendedRole);
        onAuthed?.(address);
        return;
      }
      setPendingAuth({ intendedRole, onAuthed });
      if (!isConnected) {
        openConnectModal?.();
      }
    },
    [isConnected, address, authenticated, openConnectModal],
  );

  const signOut = useCallback(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'https://forklift-7cb2.onrender.com/api'}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    disconnect();
    setRole(null);
    setAuthenticated(false);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(AUTH_KEY);
    qc.invalidateQueries({ queryKey: ["me"] });
    nav("/");
  }, [disconnect, qc, nav]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    qc.invalidateQueries({ queryKey: ["me"] });
    if (role) nav(`/dashboard/${role}`);
  };

  return (
    <Ctx.Provider value={{ connected: isConnected, address, authenticated, role, requireAuth, signOut }}>
      {children}
      {showOnboarding && address && (
        <OnboardingModal address={address} onComplete={handleOnboardingComplete} />
      )}
    </Ctx.Provider>
  );
}

export function useWalletAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWalletAuth must be used within WalletAuthProvider");
  return v;
}
