import { cn } from "@/lib/utils";

type LeafLogoProps = {
  className?: string;
  /** When true, the vein uses --logo-vein (set on parent) instead of a soft cutout. */
  themedVein?: boolean;
};

export function LeafLogo({ className, themedVein = true }: LeafLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        d="M12 21.25C5.75 15.5 3.75 10.25 4.75 7.25C5.75 4.25 8.75 3.75 12 6.25C15.25 3.75 18.25 4.25 19.25 7.25C20.25 10.25 18.25 15.5 12 21.25Z"
        fill="currentColor"
      />
      <path
        d="M12 19.25V7.75M12 12.75C10.5 11.5 8.75 11 7.25 12"
        stroke={themedVein ? "var(--logo-vein, currentColor)" : "currentColor"}
        strokeOpacity={themedVein ? 1 : 0.35}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type LeafBrandProps = {
  className?: string;
  markClassName?: string;
  logoClassName?: string;
  showWordmark?: boolean;
};

export function LeafBrand({
  className,
  markClassName,
  logoClassName,
  showWordmark = true,
}: LeafBrandProps) {
  return (
    <div className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground [--logo-vein:var(--primary)]",
          markClassName,
        )}
      >
        <LeafLogo className={cn("size-4", logoClassName)} />
      </div>
      {showWordmark ? <span>Leaf</span> : null}
    </div>
  );
}
