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
import { api } from "@/lib/api/client";

const STORAGE_KEY = "elloot:favorites";

type FavoritesContextValue = {
  ids: Set<string>;
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => void;
  ready: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readStoredIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (authLoading) return;
      if (!user) {
        if (!cancelled) {
          setIds(new Set(readStoredIds()));
          setReady(true);
        }
        return;
      }
      try {
        const data = await api.get<{ listingIds: string[] }>(
          "/api/favorites/mine",
        );
        if (!cancelled) {
          setIds(new Set(data.listingIds));
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setIds(new Set(readStoredIds()));
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  useEffect(() => {
    if (!ready || user) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  }, [ids, ready, user]);

  const isFavorite = useCallback(
    (listingId: string) => ids.has(listingId),
    [ids],
  );

  const toggleFavorite = useCallback(
    (listingId: string) => {
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(listingId)) next.delete(listingId);
        else next.add(listingId);
        return next;
      });

      if (user) {
        void api
          .post<{ favorited: boolean }>("/api/favorites/toggle", { listingId })
          .catch(() => {
            setIds((prev) => {
              const rollback = new Set(prev);
              if (rollback.has(listingId)) rollback.delete(listingId);
              else rollback.add(listingId);
              return rollback;
            });
          });
      }
    },
    [user],
  );

  const value = useMemo(
    () => ({ ids, isFavorite, toggleFavorite, ready }),
    [ids, isFavorite, toggleFavorite, ready],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
