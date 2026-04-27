import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ManifestCard, IdTab, StatusBand, MonoLabel, Tag } from "@/components/manifest/Manifest";
import { FlButton } from "@/components/manifest/FlButton";

type Role = "poster" | "operator";

interface WalletState {
  connected: boolean;
  address: string | null;
  role: Role | null;
}

interface WalletAuthCtx extends WalletState {
  /** Open wallet modal. If already authed, runs onAuthed immediately. */
  requireAuth: (intendedRole: Role, onAuthed?: (addr: string) => void) => void;
  signOut: () => void;
}

const Ctx = createContext<WalletAuthCtx | null>(null);

const STORAGE_KEY = "fl.wallet.v1";

function loadState(): WalletState {
  if (typeof window === "undefined") return { connected: false, address: null, role: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { connected: false, address: null, role: null };
    return JSON.parse(raw);
  } catch {
    return { connected: false, address: null, role: null };
  }
}

function persist(s: WalletState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

function fakeAddress() {
  const hex = "0123456789abcdef";
  let a = "0x";
  for (let i = 0; i < 4; i++) a += hex[Math.floor(Math.random() * 16)].toUpperCase();
  a += "…";
  for (let i = 0; i < 4; i++) a += hex[Math.floor(Math.random() * 16)].toUpperCase();
  return a;
}

type ModalState =
  | { open: false }
  | { open: true; intendedRole: Role; phase: "connect" | "sign" | "done"; onAuthed?: (addr: string) => void };

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(loadState);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const nav = useNavigate();

  useEffect(() => persist(state), [state]);

  const requireAuth = useCallback<WalletAuthCtx["requireAuth"]>(
    (intendedRole, onAuthed) => {
      if (state.connected && state.address) {
        onAuthed?.(state.address);
        return;
      }
      setModal({ open: true, intendedRole, phase: "connect", onAuthed });
    },
    [state],
  );

  const signOut = useCallback(() => {
    setState({ connected: false, address: null, role: null });
    persist({ connected: false, address: null, role: null });
  }, []);

  const close = () => setModal({ open: false });

  const doConnect = () => {
    if (!modal.open) return;
    setModal({ ...modal, phase: "sign" });
  };

  const doSign = () => {
    if (!modal.open) return;
    const addr = fakeAddress();
    const next: WalletState = { connected: true, address: addr, role: modal.intendedRole };
    setState(next);
    persist(next);
    const cb = modal.onAuthed;
    setModal({ ...modal, phase: "done" });
    setTimeout(() => {
      setModal({ open: false });
      if (cb) cb(addr);
      else nav(`/dashboard/${modal.intendedRole}`);
    }, 600);
  };

  return (
    <Ctx.Provider value={{ ...state, requireAuth, signOut }}>
      {children}
      {modal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink/70" onClick={close} />
          <div className="relative w-full max-w-[480px]">
            <ManifestCard
              shadow="cobalt"
              idTab={<IdTab>SIGN-IN · {modal.intendedRole.toUpperCase()}</IdTab>}
              formFooter="WALLET HANDSHAKE · EIP-4361"
              pageNumber="01 / 01"
            >
              <StatusBand state={modal.phase === "done" ? "paid" : "live"}>
                {modal.phase === "connect" && "STEP 01 · CONNECT WALLET"}
                {modal.phase === "sign" && "STEP 02 · SIGN MESSAGE"}
                {modal.phase === "done" && "AUTHENTICATED"}
              </StatusBand>

              <div className="p-8">
                {modal.phase === "connect" && (
                  <>
                    <h3 className="display-hero text-[28px] font-medium leading-tight">
                      Sign in with your wallet.
                    </h3>
                    <p className="mono-small text-muted-ink mt-3">
                      No passwords. We'll ask your wallet to sign a one-time message to prove ownership.
                    </p>
                    <div className="mt-6 grid grid-cols-1 gap-2">
                      {["METAMASK", "RABBY", "WALLETCONNECT", "COINBASE WALLET"].map((w) => (
                        <button
                          key={w}
                          onClick={doConnect}
                          className="border border-ink h-12 px-4 flex items-center justify-between mono-small hover:bg-ink hover:text-paper"
                        >
                          <span>{w}</span>
                          <span>→</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {modal.phase === "sign" && (
                  <>
                    <h3 className="display-hero text-[28px] font-medium leading-tight">
                      Sign the message.
                    </h3>
                    <div className="mt-5 border border-ink bg-hairline/30 p-4 font-mono text-[12px] leading-relaxed">
                      <div>forklift.run wants you to sign in with your Ethereum account.</div>
                      <div className="mt-2 text-muted-ink">
                        Statement: I accept the Forklift terms.<br />
                        Nonce: {Math.random().toString(36).slice(2, 10)}<br />
                        Issued: {new Date().toISOString()}
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3 justify-end">
                      <FlButton variant="secondary" onClick={close}>Cancel</FlButton>
                      <FlButton variant="cobalt" onClick={doSign}>Sign message</FlButton>
                    </div>
                  </>
                )}

                {modal.phase === "done" && (
                  <div className="text-center py-6">
                    <MonoLabel ink>WALLET VERIFIED</MonoLabel>
                    <h3 className="display-hero text-[28px] font-medium mt-3">You're in.</h3>
                    <div className="mt-3"><Tag variant="lime">{state.address ?? "0x…"}</Tag></div>
                  </div>
                )}
              </div>
            </ManifestCard>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useWalletAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWalletAuth must be used within WalletAuthProvider");
  return v;
}
