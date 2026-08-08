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
import { fetchMe, login as loginRequest, register as registerRequest } from "@/features/auth/api";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/features/auth/storage";
import type { User } from "@/types/api";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<void>;
  logout: () => void;
  setSession: (accessToken: string, user?: User | null) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const current = getAccessToken();
    if (!current) {
      setUser(null);
      setToken(null);
      return;
    }
    const { user: me } = await fetchMe(current);
    setToken(current);
    setUser(me);
  }, []);

  const setSession = useCallback(
    async (accessToken: string, nextUser?: User | null) => {
      setAccessToken(accessToken);
      setToken(accessToken);
      if (nextUser) {
        setUser(nextUser);
        return;
      }
      const { user: me } = await fetchMe(accessToken);
      setUser(me);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = getAccessToken();
        if (!current) return;
        const { user: me } = await fetchMe(current);
        if (!cancelled) {
          setToken(current);
          setUser(me);
        }
      } catch {
        clearAccessToken();
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
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
      await setSession(result.accessToken, result.user);
    },
    [setSession],
  );

  const register = useCallback(
    async (input: { email: string; password: string; name?: string }) => {
      const result = await registerRequest(input);
      await setSession(result.accessToken, result.user);
    },
    [setSession],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      setSession,
      refreshUser,
    }),
    [user, token, loading, login, register, logout, setSession, refreshUser],
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
