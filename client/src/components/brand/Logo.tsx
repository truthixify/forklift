import { cn } from "@/lib/utils";

/**
 * The Forklift glyph: a capital F whose two horizontal arms become
 * the literal fork tines of a forklift. The vertical stem is the
 * mast; a small notch suggests the carriage.
 *
 * Single-color, optimized for 16px favicon up to hero sizes.
 */
export function ForkliftGlyph({
  className,
  color = "currentColor",
  style,
}: {
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      fill={color}
      style={style}
      aria-hidden="true"
    >
      {/* Mast (vertical stem of F) */}
      <rect x="10" y="6" width="10" height="52" />
      {/* Upper tine — extends past stem, with a tine cap */}
      <rect x="20" y="14" width="38" height="8" />
      <rect x="56" y="10" width="2" height="16" />
      {/* Lower tine — slightly shorter, classic F middle bar lifted to act as tine */}
      <rect x="20" y="32" width="30" height="8" />
      <rect x="48" y="28" width="2" height="16" />
      {/* Carriage notch — bite removed at base of mast */}
      <rect x="10" y="50" width="6" height="8" fill="hsl(var(--paper))" />
    </svg>
  );
}

export function ForkliftWordmark({
  className,
  color = "currentColor",
  style,
}: {
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}) {
  // Custom-feeling wordmark: tight tracking, strong horizontals, planted feet.
  return (
    <span
      className={cn(
        "font-display font-medium tracking-[-0.04em] leading-none select-none",
        className,
      )}
      style={{ color, fontStretch: "100%", ...style }}
    >
      Forklift
    </span>
  );
}

export function ForkliftLockup({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ForkliftGlyph className="shrink-0" style={{ width: size, height: size }} />
      <ForkliftWordmark style={{ fontSize: size * 1.05 }} />
    </span>
  );
}

/** Circular brand stamp — for footers, watermarks, README art. */
export function BrandStamp({
  className,
  size = 96,
  text = "FORKLIFT · FL · MARKETPLACE · AGENTIC WORK · ",
}: {
  className?: string;
  size?: number;
  text?: string;
}) {
  const id = "stamp-circle";
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("text-ink", className)}
      aria-hidden="true"
    >
      <defs>
        <path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <text
        fontFamily="JetBrains Mono, monospace"
        fontSize="6"
        fontWeight="500"
        letterSpacing="2"
        fill="currentColor"
      >
        <textPath href={`#${id}`}>{text.repeat(2)}</textPath>
      </text>
      <g transform="translate(38, 36) scale(0.38)">
        <rect x="10" y="6" width="10" height="52" fill="currentColor" />
        <rect x="20" y="14" width="38" height="8" fill="currentColor" />
        <rect x="56" y="10" width="2" height="16" fill="currentColor" />
        <rect x="20" y="32" width="30" height="8" fill="currentColor" />
        <rect x="48" y="28" width="2" height="16" fill="currentColor" />
      </g>
    </svg>
  );
}

