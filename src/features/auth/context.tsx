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
import {
  fetchMe,
  login as loginRequest,
  logoutRequest,
  register as registerRequest,
} from "@/features/auth/api";
import { clearAccessToken } from "@/features/auth/storage";
import type { User } from "@/types/api";

type AuthContextValue = {
  user: User | null;
  /** True when cookie session is active (JWT is never stored in JS). */
  token: string | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<void>;
  logout: () => void;
  /** Establishes client session from cookie (optional user from exchange). */
  setSession: (accessToken?: string | null, user?: User | null) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { user: me } = await fetchMe();
      setUser(me);
    } catch {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const setSession = useCallback(
    async (_accessToken?: string | null, nextUser?: User | null) => {
      // Cookie already set by API (login/register/oauth exchange).
      clearAccessToken();
      if (nextUser) {
        setUser(nextUser);
        return;
      }
      const { user: me } = await fetchMe();
      setUser(me);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        clearAccessToken();
        const { user: me } = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        clearAccessToken();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const result = await loginRequest(input);
      await setSession(null, result.user);
    },
    [setSession],
  );

  const register = useCallback(
    async (input: { email: string; password: string; name?: string }) => {
      const result = await registerRequest(input);
      await setSession(null, result.user);
    },
    [setSession],
  );

  const logout = useCallback(() => {
    void logoutRequest().catch(() => undefined);
    clearAccessToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      // Sentinel so existing `if (token)` checks keep working without exposing JWT.
      token: user ? "cookie" : null,
      loading,
      login,
      register,
      logout,
      setSession,
      refreshUser,
    }),
    [user, loading, login, register, logout, setSession, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
