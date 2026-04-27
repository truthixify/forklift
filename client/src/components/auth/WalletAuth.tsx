import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

type Role = "poster" | "operator";

interface WalletAuthCtx {
  connected: boolean;
  address: string | undefined;
  role: Role | null;
  /** Open wallet modal. If already authed, runs onAuthed immediately. */
  requireAuth: (intendedRole: Role, onAuthed?: (addr: string) => void) => void;
  signOut: () => void;
}

const Ctx = createContext<WalletAuthCtx | null>(null);

const ROLE_STORAGE_KEY = "fl.wallet.role";

function loadRole(): Role | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY);
    if (raw === "poster" || raw === "operator") return raw;
    return null;
  } catch {
    return null;
  }
}

function persistRole(role: Role | null) {
  try {
    if (role) {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    } else {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  } catch {}
}

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [role, setRole] = useState<Role | null>(loadRole);
  const [pendingAuth, setPendingAuth] = useState<{
    intendedRole: Role;
    onAuthed?: (addr: string) => void;
  } | null>(null);
  const nav = useNavigate();

  useEffect(() => persistRole(role), [role]);

  // When the wallet connects and there is a pending auth request, resolve it.
  useEffect(() => {
    if (isConnected && address && pendingAuth) {
      setRole(pendingAuth.intendedRole);
      const cb = pendingAuth.onAuthed;
      setPendingAuth(null);
      if (cb) {
        cb(address);
      } else {
        nav(`/dashboard/${pendingAuth.intendedRole}`);
      }
    }
  }, [isConnected, address, pendingAuth, nav]);

  const requireAuth = useCallback(
    (intendedRole: Role, onAuthed?: (addr: string) => void) => {
      if (isConnected && address) {
        setRole(intendedRole);
        onAuthed?.(address);
        return;
      }
      setPendingAuth({ intendedRole, onAuthed });
      openConnectModal?.();
    },
    [isConnected, address, openConnectModal],
  );

  const signOut = useCallback(() => {
    disconnect();
    setRole(null);
    persistRole(null);
  }, [disconnect]);

  return (
    <Ctx.Provider value={{ connected: isConnected, address, role, requireAuth, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWalletAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWalletAuth must be used within WalletAuthProvider");
  return v;
}
