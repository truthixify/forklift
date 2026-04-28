import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { fetchNonce, fetchSignIn } from "@/lib/api";

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

  const [role, setRole] = useState<Role | null>(loadRole);
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem(AUTH_KEY) === "true");
  const [pendingAuth, setPendingAuth] = useState<{ intendedRole: Role; onAuthed?: (addr: string) => void } | null>(null);
  const signingRef = useRef(false);

  useEffect(() => {
    if (role) localStorage.setItem(ROLE_KEY, role);
    else localStorage.removeItem(ROLE_KEY);
  }, [role]);

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

        await fetchSignIn({ address, message, signature, nonceId });

        setAuthenticated(true);
        localStorage.setItem(AUTH_KEY, "true");
        setRole(pending.intendedRole);
        qc.invalidateQueries({ queryKey: ["me"] });

        setPendingAuth(null);
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
    disconnect();
    setRole(null);
    setAuthenticated(false);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(AUTH_KEY);
    qc.invalidateQueries({ queryKey: ["me"] });
  }, [disconnect, qc]);

  return (
    <Ctx.Provider value={{ connected: isConnected, address, authenticated, role, requireAuth, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWalletAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWalletAuth must be used within WalletAuthProvider");
  return v;
}
