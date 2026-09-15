"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMe,
  fetchSession,
  login as loginRequest,
  logoutRequest,
  register as registerRequest,
} from "@/features/auth/api";
import { clearAccessToken } from "@/features/auth/storage";
import {
  clearSessionSnapshot,
  readSessionSnapshot,
  snapshotToUser,
  writeSessionSnapshot,
} from "@/features/auth/session-snapshot";
import type { User } from "@/types/api";

type AuthContextValue = {
  user: User | null;
  /** True when cookie session is active (JWT is never stored in JS). */
  token: string | null;
  loading: boolean;
  login: (input: {
    email: string;
    password: string;
  }) => Promise<
    | void
    | import("@/features/auth/two-factor-api").LoginRequires2fa
    | import("@/types/api").AuthResponse
  >;
  register: (input: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<import("@/types/api").AuthResponse>;
  logout: () => void;
  /** Establishes client session from cookie (optional user from exchange). */
  setSession: (accessToken?: string | null, user?: User | null) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionGenRef = useRef(0);

  const applyUser = useCallback((next: User | null) => {
    setUser(next);
    if (next) writeSessionSnapshot(next);
    else clearSessionSnapshot();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: me } = await fetchMe();
      applyUser(me);
    } catch {
      clearAccessToken();
      applyUser(null);
    }
  }, [applyUser]);

  const setSession = useCallback(
    async (_accessToken?: string | null, nextUser?: User | null) => {
      sessionGenRef.current += 1;
      clearAccessToken();
      if (nextUser) {
        applyUser(nextUser);
        return;
      }
      try {
        const { user: session } = await fetchSession();
        applyUser(snapshotToUser(session));
      } catch {
        /* fall through to /me */
      }
      const { user: me } = await fetchMe();
      applyUser(me);
    },
    [applyUser],
  );

  useLayoutEffect(() => {
    const cached = readSessionSnapshot();
    if (!cached) return;
    writeSessionSnapshot(cached);
    setUser(snapshotToUser(cached));
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const gen = sessionGenRef.current;
    (async () => {
      try {
        clearAccessToken();
        const { user: session } = await fetchSession();
        if (cancelled) return;
        setUser((prev) => {
          const next = snapshotToUser(session);
          if (!prev) return next;
          return {
            ...prev,
            ...next,
            pixKey: prev.pixKey,
            accounts: prev.accounts,
            createdAt:
              prev.createdAt && prev.createdAt !== new Date(0).toISOString()
                ? prev.createdAt
                : next.createdAt,
          };
        });
        writeSessionSnapshot(session);
        setLoading(false);

        try {
          const { user: me } = await fetchMe();
          if (cancelled) return;
          applyUser(me);
        } catch {
          // Navbar already has JWT claims; /me can retry later.
        }
      } catch {
        clearAccessToken();
        if (!cancelled && sessionGenRef.current === gen) {
          applyUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyUser]);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const result = await loginRequest(input);
      if ("requires2fa" in result && result.requires2fa) {
        return result;
      }
      await setSession(null, (result as import("@/types/api").AuthResponse).user!);
      return result;
    },
    [setSession],
  );

  const register = useCallback(
    async (input: { email: string; password: string; name?: string }) => {
      const result = await registerRequest(input);
      if (!result.user) {
        return result;
      }
      await setSession(null, result.user);
      return result;
    },
    [setSession],
  );

  const logout = useCallback(() => {
    void logoutRequest().catch(() => undefined);
    clearAccessToken();
    applyUser(null);
  }, [applyUser]);

  const value = useMemo(
    () => ({
      user,
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
