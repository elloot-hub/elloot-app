import { api } from "@/lib/api/client";
import type { AuthProviders, AuthResponse, User } from "@/types/api";
import { config } from "@/lib/config";

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
  return api.post<AuthResponse>("/api/auth/login", input, { auth: false });
}

export async function logoutRequest() {
  return api.post<{ ok: boolean }>("/api/auth/logout", undefined, {
    auth: false,
  });
}

export async function exchangeOAuthCode(code: string) {
  return api.post<AuthResponse>(
    "/api/auth/oauth/exchange",
    { code },
    { auth: false },
  );
}

export async function fetchMe(_token?: string | null) {
  return api.get<{ user: User }>("/api/auth/me");
}

export function googleAuthUrl() {
  return `${config.apiUrl}/api/auth/google`;
}

export function discordAuthUrl() {
  return `${config.apiUrl}/api/auth/discord`;
}
