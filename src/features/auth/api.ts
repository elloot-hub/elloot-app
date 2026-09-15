import { api } from "@/lib/api/client";
import type { AuthProviders, AuthResponse, User } from "@/types/api";
import { config } from "@/lib/config";
import type { LoginRequires2fa } from "@/features/auth/two-factor-api";

export async function fetchProviders() {
  return api.get<AuthProviders>("/api/auth/providers", { auth: false });
}

export async function register(input: {
  email: string;
  password: string;
  name?: string;
}) {
  return api.post<AuthResponse>("/api/auth/register", input, { auth: false });
}

export async function login(input: { email: string; password: string }) {
  return api.post<AuthResponse | LoginRequires2fa>("/api/auth/login", input, {
    auth: false,
  });
}

export async function logoutRequest() {
  return api.post<{ ok: boolean }>("/api/auth/logout", undefined, {
    auth: false,
  });
}

export async function exchangeOAuthCode(code: string) {
  return api.post<AuthResponse | LoginRequires2fa>(
    "/api/auth/oauth/exchange",
    { code },
    { auth: false },
  );
}

export async function fetchMe(_token?: string | null) {
  return api.get<{ user: User }>("/api/auth/me");
}

export async function fetchSession() {
  return api.get<{
    user: Pick<User, "id" | "email" | "name" | "avatarUrl" | "role" | "kycStatus">;
  }>("/api/auth/session");
}

export async function updateMe(input: {
  name?: string | null;
  bio?: string | null;
  pixKey?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
}) {
  return api.patch<{ user: User }>("/api/auth/me", input);
}

export type AuthSessionRow = {
  id: string;
  browser: string;
  os: string;
  ip: string | null;
  lastSeenAt: string;
  createdAt: string;
  current: boolean;
};

export async function fetchAuthSessions() {
  return api.get<{ sessions: AuthSessionRow[] }>("/api/auth/sessions");
}

export async function revokeAuthSession(id: string) {
  return api.delete<{ ok: true; current: boolean }>(`/api/auth/sessions/${id}`);
}

export async function requestPasswordReset(input: { email: string }) {
  return api.post<{ ok: true; resetUrl?: string }>(
    "/api/auth/forgot-password",
    input,
    { auth: false },
  );
}

export async function resetPassword(input: {
  token: string;
  password: string;
}) {
  return api.post<{ ok: true }>("/api/auth/reset-password", input, {
    auth: false,
  });
}

export function googleAuthUrl() {
  return `${config.apiUrl}/api/auth/google`;
}

export function discordAuthUrl() {
  return `${config.apiUrl}/api/auth/discord`;
}
