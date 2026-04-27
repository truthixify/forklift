import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from "react";
import { MonoLabel } from "./Manifest";

interface FlInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
  hint?: string;
}

export const FlInput = forwardRef<HTMLInputElement, FlInputProps>(
  ({ className, label, unit, hint, ...rest }, ref) => {
    return (
      <label className="block">
        {label && <MonoLabel className="block mb-2">{label}</MonoLabel>}
        <div className="relative flex items-center bg-paper border border-ink focus-within:outline focus-within:outline-2 focus-within:outline-cobalt focus-within:outline-offset-0">
          <input
            ref={ref}
            className={cn(
              "flex-1 h-11 px-3 bg-transparent text-ink placeholder:text-muted-ink text-[14px] outline-none",
              className,
            )}
            {...rest}
          />
          {unit && <span className="mono-small text-muted-ink pr-3">{unit}</span>}
        </div>
        {hint && <MonoLabel className="block mt-1.5">{hint}</MonoLabel>}
      </label>
    );
  },
);
FlInput.displayName = "FlInput";

interface FlTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  rows?: number;
}
export const FlTextarea = forwardRef<HTMLTextAreaElement, FlTextareaProps>(
  ({ className, label, hint, rows = 6, ...rest }, ref) => {
    return (
      <label className="block">
        {label && <div className="mb-2">{typeof label === "string" ? <MonoLabel>{label}</MonoLabel> : label}</div>}
        <div className="bg-paper border border-ink focus-within:outline focus-within:outline-2 focus-within:outline-cobalt focus-within:outline-offset-0">
          <textarea
            ref={ref}
            rows={rows}
            className={cn(
              "block w-full p-4 bg-transparent text-ink placeholder:text-muted-ink text-[15px] outline-none resize-none leading-[1.55]",
              className,
            )}
            {...rest}
          />
        </div>
        {hint && <div className="mt-1.5">{typeof hint === "string" ? <MonoLabel>{hint}</MonoLabel> : hint}</div>}
      </label>
    );
  },
);
FlTextarea.displayName = "FlTextarea";
