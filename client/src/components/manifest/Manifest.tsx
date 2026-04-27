import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/**
 * Manifest card — the structural pattern used everywhere.
 * Outer 2px ink border, paper inset gap, inner 1px hairline border.
 */
export function ManifestCard({
  children,
  className,
  innerClassName,
  shadow,
  idTab,
  formFooter,
  pageNumber,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  shadow?: "hivis" | "cobalt" | "magenta" | "lime" | false;
  idTab?: ReactNode;
  formFooter?: ReactNode;
  pageNumber?: string;
}) {
  const shadowClass =
    shadow === "cobalt"
      ? "offset-shadow offset-shadow-cobalt"
      : shadow === "magenta"
      ? "offset-shadow offset-shadow-magenta"
      : shadow === "lime"
      ? "offset-shadow offset-shadow-lime"
      : shadow === "hivis"
      ? "offset-shadow"
      : "";

  return (
    <div className={cn("relative", shadowClass, className)}>
      {idTab && (
        <div className="absolute -top-[22px] left-6 z-10">
          {idTab}
        </div>
      )}
      <div className="manifest-outer">
        <div className={cn("manifest-inner", innerClassName)}>
          {children}
          {(formFooter || pageNumber) && (
            <>
              <div className="hairline-ink" />
              <div className="flex items-center justify-between px-5 py-3">
                <span className="mono-label">{formFooter}</span>
                {pageNumber && <span className="mono-label">{pageNumber}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** ID tab that sticks above a manifest card. */
export function IdTab({
  children,
  variant = "cobalt",
  className,
}: {
  children: ReactNode;
  variant?: "cobalt" | "ink" | "magenta" | "hivis";
  className?: string;
}) {
  const colors = {
    cobalt: "bg-cobalt text-paper",
    ink: "bg-ink text-paper",
    magenta: "bg-magenta text-paper",
    hivis: "bg-hivis text-ink",
  }[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 mono-small",
        colors,
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Full-bleed status band at the top of a manifest. */
export function StatusBand({
  state,
  children,
  pulse = true,
  className,
}: {
  state: "live" | "assigned" | "delivered" | "paid" | "refunded" | "expired" | "disputed" | "ink" | "open";
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}) {
  const styles: Record<string, string> = {
    live: "bg-magenta text-paper",
    assigned: "bg-lime text-ink",
    delivered: "bg-cobalt text-paper",
    paid: "bg-hivis text-ink",
    refunded: "bg-paper text-ink border-b border-ink",
    expired: "bg-[hsl(var(--muted-ink))] text-paper",
    disputed: "bg-alarm text-paper",
    ink: "bg-ink text-paper",
    open: "bg-paper text-ink border-b border-ink",
  };
  const dotColor: Record<string, string> = {
    live: "bg-paper",
    assigned: "bg-ink",
    delivered: "bg-paper",
    paid: "bg-ink",
    refunded: "bg-ink",
    expired: "bg-paper",
    disputed: "bg-paper",
    ink: "bg-paper",
    open: "bg-ink",
  };
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-2.5 mono-small",
        styles[state],
        className,
      )}
    >
      {pulse && (
        <span className={cn("pulse-dot", dotColor[state])} />
      )}
      {children}
    </div>
  );
}

/** Cobalt L-bracket frame for critical numbers. */
export function Brackets({
  children,
  className,
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pad = { sm: "p-2", md: "p-4", lg: "p-6" }[size];
  return (
    <span className={cn("brackets inline-block", pad, className)}>
      <span className="br-tr" />
      <span className="br-bl" />
      {children}
    </span>
  );
}

/** Form footer line. */
export function FormFooter({
  type = "DOCUMENT",
  page = "01 / 01",
  className,
}: {
  type?: string;
  page?: string;
  className?: string;
}) {
  return (
    <>
      <div className="hairline-ink" />
      <div className={cn("flex items-center justify-between px-5 py-3", className)}>
        <span className="mono-label">FORKLIFT FORM · {type}</span>
        <span className="mono-label">PAGE {page}</span>
      </div>
    </>
  );
}

/** Generic mono label. */
export function MonoLabel({
  children,
  className,
  ink = false,
}: {
  children: ReactNode;
  className?: string;
  ink?: boolean;
}) {
  return (
    <span className={cn(ink ? "mono-label-ink" : "mono-label", className)}>
      {children}
    </span>
  );
}

/** Pulse dot, freestanding. */
export function PulseDot({
  state = "live",
  className,
}: {
  state?: "live" | "assigned" | "delivered" | "paid" | "disputed" | "ink";
  className?: string;
}) {
  const colors = {
    live: "bg-magenta",
    assigned: "bg-lime",
    delivered: "bg-cobalt",
    paid: "bg-hivis",
    disputed: "bg-alarm",
    ink: "bg-ink",
  }[state];
  return <span className={cn("pulse-dot", colors, className)} />;
}

/** Squared monogram (used as agent/poster avatar). */
export function Monogram({
  letter,
  size = 40,
  variant = "ink",
  className,
}: {
  letter: string;
  size?: number;
  variant?: "ink" | "cobalt" | "paper";
  className?: string;
}) {
  const styles = {
    ink: "bg-ink text-paper",
    cobalt: "bg-cobalt text-paper",
    paper: "bg-paper text-ink border border-ink",
  }[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-display font-medium shrink-0",
        styles,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.42, letterSpacing: "-0.02em" }}
    >
      {letter}
    </span>
  );
}

/** Tag / pill — squared, mono caps. */
export function Tag({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "alarm" | "hivis" | "cobalt" | "ink" | "magenta" | "lime";
  className?: string;
}) {
  const styles = {
    default: "border border-ink text-ink bg-paper",
    alarm: "bg-alarm text-paper",
    hivis: "bg-hivis text-ink",
    cobalt: "bg-cobalt text-paper",
    ink: "bg-ink text-paper",
    magenta: "bg-magenta text-paper",
    lime: "bg-lime text-ink",
  }[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 h-5 mono-small whitespace-nowrap",
        styles,
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Paid stamp — full-bleed hi-vis row. */
export function PaidStamp({ amount, when }: { amount: string; when?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5 stamp-paid mono-small">
      <span className="flex items-center gap-3">
        <span className="pulse-dot bg-ink" />
        PAID · {amount} USDT SETTLED ON-CHAIN
      </span>
      {when && <span>{when}</span>}
    </div>
  );
}
