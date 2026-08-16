"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  presetToRange,
  toIsoDay,
  type DateRangeValue,
  type PeriodPreset,
} from "@/features/dashboard/components/date-range-picker";

function parseIsoDay(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export function periodFromSearchParams(
  searchParams: URLSearchParams,
  fallback: Exclude<PeriodPreset, "custom"> = "30d",
): DateRangeValue {
  const presetRaw = searchParams.get("preset");
  if (presetRaw === "today" || presetRaw === "7d" || presetRaw === "30d") {
    return presetToRange(presetRaw);
  }
  const from = parseIsoDay(searchParams.get("from"));
  const to = parseIsoDay(searchParams.get("to"));
  if (from && to && to >= from) {
    return { from, to, preset: "custom" };
  }
  return presetToRange(fallback);
}

export function useDashboardQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const replaceParams = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const period = useMemo(
    () => periodFromSearchParams(searchParams),
    [searchParams],
  );

  const setPeriod = useCallback(
    (next: DateRangeValue) => {
      if (next.preset === "custom") {
        replaceParams({
          preset: null,
          from: toIsoDay(next.from),
          to: toIsoDay(next.to),
        });
        return;
      }
      replaceParams({
        preset: next.preset,
        from: null,
        to: null,
      });
    },
    [replaceParams],
  );

  return { searchParams, replaceParams, period, setPeriod };
}
