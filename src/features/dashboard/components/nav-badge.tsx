import { cn } from "@/lib/utils";

type NavBadgeProps = {
  count: number;
  className?: string;
  label?: string;
};

export function NavBadge({ count, className, label }: NavBadgeProps) {
  if (count <= 0) return null;

  const display = count > 99 ? "99+" : String(count);

  return (
    <span
      className={cn(
        "inline-flex min-w-[1.125rem] shrink-0 items-center justify-center rounded-full bg-primary px-1 py-1 text-[10px] font-semibold leading-none text-primary-foreground tabular-nums",
        className,
      )}
      aria-label={label ?? `${count} pendências`}
    >
      {display}
    </span>
  );
}
