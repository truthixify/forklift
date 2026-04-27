import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "cobalt" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

interface FlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

/**
 * Forklift button — squared, sentence-case, no rounding.
 * Pressed state: 1px shift down, no shadow change.
 */
export const FlButton = forwardRef<HTMLButtonElement, FlButtonProps>(
  ({ className, variant = "primary", size = "md", iconLeft, iconRight, children, ...rest }, ref) => {
    const variants: Record<Variant, string> = {
      primary:
        "bg-ink text-paper hover:bg-cobalt active:bg-cobalt-press disabled:opacity-50",
      secondary:
        "bg-paper text-ink border border-ink hover:bg-ink hover:text-paper",
      cobalt:
        "bg-cobalt text-paper hover:bg-cobalt-hover active:bg-cobalt-press",
      destructive:
        "bg-alarm text-paper hover:opacity-90",
      ghost:
        "bg-transparent text-ink border-b border-ink hover:text-cobalt hover:border-cobalt px-0",
    };
    const sizes: Record<Size, string> = {
      sm: "h-8 px-3 text-[13px]",
      md: "h-10 px-5 text-[14px]",
      lg: "h-12 px-7 text-[15px]",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-display font-medium",
          "transition-none active:translate-y-[1px] focus-visible:outline-cobalt",
          "disabled:cursor-not-allowed",
          variants[variant],
          variant === "ghost" ? "h-auto" : sizes[size],
          className,
        )}
        {...rest}
      >
        {iconLeft}
        <span>{children}</span>
        {iconRight}
      </button>
    );
  },
);
FlButton.displayName = "FlButton";
