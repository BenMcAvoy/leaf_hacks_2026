import Image from "next/image";
import { cn } from "@/lib/utils";

type StudyFlowLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

export function StudyFlowLogo({
  className,
  markClassName,
  showWordmark = false,
  wordmarkClassName,
}: StudyFlowLogoProps) {
  const alt = showWordmark ? "" : "Study Flow";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative inline-flex size-10 shrink-0 overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-border",
          markClassName,
        )}
      >
        <Image
          src="/brand/study-flow-logo-light.png"
          alt={alt}
          width={963}
          height={993}
          className="block size-full object-cover dark:hidden"
          draggable={false}
        />
        <Image
          src="/brand/study-flow-logo-dark.png"
          alt={alt}
          width={1254}
          height={1254}
          className="hidden size-full object-cover dark:block"
          draggable={false}
        />
      </span>
      {showWordmark && (
        <span className={cn("font-semibold leading-none", wordmarkClassName)}>Study Flow</span>
      )}
    </span>
  );
}
