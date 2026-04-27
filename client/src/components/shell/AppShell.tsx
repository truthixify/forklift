import { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { Footer } from "./Footer";

export function AppShell({ children, hideFooter = false }: { children: ReactNode; hideFooter?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <TopNav />
      <main className="flex-1 animate-paper-fade">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
