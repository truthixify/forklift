import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { fetchNonce, fetchSignIn, useMe } from "@/lib/api";
import { OnboardingModal } from "./OnboardingModal";
import { ManifestCard, IdTab, MonoLabel, PulseDot } from "@/components/manifest/Manifest";

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

function SigningModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/60" />
      <div className="relative w-full max-w-[400px] mx-4">
        <ManifestCard shadow="cobalt" idTab={<IdTab variant="cobalt">SIGNING IN</IdTab>}>
          <div className="p-8 text-center space-y-4">
            <div className="flex justify-center"><PulseDot state="live" /></div>
            <h2 className="font-display font-medium text-[24px]">Confirm in your wallet</h2>
            <MonoLabel className="block">SIGN THE MESSAGE TO AUTHENTICATE</MonoLabel>
            <p className="text-[14px] text-muted-ink">Check your wallet extension for a signature request. This does not cost gas.</p>
          </div>
        </ManifestCard>
      </div>
    </div>
  );
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
  const [signing, setSigning] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{ intendedRole: Role; onAuthed?: (addr: string) => void } | null>(null);
  const signingRef = useRef(false);

  const { data: meData } = useMe();
  const meUser = (meData as Record<string, unknown>)?.user as Record<string, unknown> | undefined;

  useEffect(() => {
    if (role) localStorage.setItem(ROLE_KEY, role);
    else localStorage.removeItem(ROLE_KEY);
  }, [role]);

  // Auto-redirect on page load if already authed
  useEffect(() => {
    if (isConnected && authenticated && role && location.pathname === "/") {
      nav(`/dashboard/${role}`, { replace: true });
    }
  }, [isConnected, authenticated, role, location.pathname, nav]);

  // After wallet connects with pending auth -> sign in
  useEffect(() => {
    if (!isConnected || !address || !pendingAuth || signingRef.current) return;

    signingRef.current = true;
    setSigning(true);
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
        setSigning(false);

        const user = result.user as Record<string, unknown> | undefined;
        if (!user?.displayName && !user?.onboarded) {
          setShowOnboarding(true);
          return;
        }

        if (pending.onAuthed) {
          pending.onAuthed(address);
        } else {
          nav(`/dashboard/${pending.intendedRole}`, { replace: true });
        }
      } catch (err) {
        console.error("Sign-in failed:", err);
        setPendingAuth(null);
        setSigning(false);
      } finally {
        signingRef.current = false;
      }
    })();
  }, [isConnected, address, pendingAuth, signMessageAsync, nav, qc]);

  // Check onboarding on meData load
  useEffect(() => {
    if (authenticated && meUser && !meUser.onboarded && !meUser.displayName && !showOnboarding && !signing) {
      setShowOnboarding(true);
    }
  }, [authenticated, meUser, showOnboarding, signing]);

  const requireAuth = useCallback(
    (intendedRole: Role, onAuthed?: (addr: string) => void) => {
      if (isConnected && address && authenticated) {
        setRole(intendedRole);
        if (onAuthed) {
          onAuthed(address);
        } else {
          nav(`/dashboard/${intendedRole}`, { replace: true });
        }
        return;
      }
      setPendingAuth({ intendedRole, onAuthed });
      if (!isConnected) {
        openConnectModal?.();
      }
    },
    [isConnected, address, authenticated, openConnectModal, nav],
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
    if (role) nav(`/dashboard/${role}`, { replace: true });
  };

  return (
    <Ctx.Provider value={{ connected: isConnected, address, authenticated, role, requireAuth, signOut }}>
      {children}
      {signing && <SigningModal />}
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
