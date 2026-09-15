"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth/context";
import { fetchDashboardSummary } from "@/features/dashboard/api";
import type { DashboardSummary } from "@/features/dashboard/types";

type DashboardSummaryContextValue = {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const DashboardSummaryContext = createContext<DashboardSummaryContextValue | null>(
  null,
);

export function DashboardSummaryProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboardSummary();
      setSummary(res.summary);
    } catch {
      setError("Não foi possível carregar o resumo do painel.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  const value = useMemo(
    () => ({ summary, loading, error, refresh }),
    [summary, loading, error, refresh],
  );

  return (
    <DashboardSummaryContext.Provider value={value}>
      {children}
    </DashboardSummaryContext.Provider>
  );
}

export function useDashboardSummary() {
  const ctx = useContext(DashboardSummaryContext);
  if (!ctx) {
    throw new Error("useDashboardSummary must be used within DashboardSummaryProvider");
  }
  return ctx;
}

export function useDashboardSummaryOptional() {
  return useContext(DashboardSummaryContext);
}
