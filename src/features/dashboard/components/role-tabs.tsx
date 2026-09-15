"use client";

import type { DashboardRoleFilter } from "@/features/dashboard/dashboard-profile";
import { cn } from "@/lib/utils";

const LABELS: Record<DashboardRoleFilter, string> = {
  all: "Tudo",
  buyer: "Como comprador",
  seller: "Como vendedor",
};

type Props = {
  value: DashboardRoleFilter;
  onChange: (value: DashboardRoleFilter) => void;
  options: DashboardRoleFilter[];
  className?: string;
};

export function DashboardRoleTabs({ value, onChange, options, className }: Props) {
  if (options.length <= 1) return null;

  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="tablist"
      aria-label="Filtrar por papel"
    >
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
