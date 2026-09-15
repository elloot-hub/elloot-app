import { api } from "@/lib/api/client";
import type { AuthResponse } from "@/types/api";

export type TwoFactorStatus = {
  enabled: boolean;
  enabledAt: string | null;
};

export type TwoFactorSetup = {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
};

export type LoginRequires2fa = {
  requires2fa: true;
  challengeToken: string;
  emailHint?: string;
};

export function isLoginRequires2fa(
  value: unknown,
): value is LoginRequires2fa {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.requires2fa === true && typeof v.challengeToken === "string";
}

export async function fetch2faStatus() {
  return api.get<TwoFactorStatus>("/api/auth/2fa/status");
}

export async function setup2fa() {
  return api.post<TwoFactorSetup>("/api/auth/2fa/setup");
}

export async function enable2fa(code: string) {
  return api.post<{ enabled: true; enabledAt: string }>("/api/auth/2fa/enable", {
    code,
  });
}

export async function disable2fa(code: string) {
  return api.post<{ enabled: false }>("/api/auth/2fa/disable", { code });
}

export async function cancel2faSetup() {
  return api.post<{ ok: true }>("/api/auth/2fa/cancel-setup");
}

export async function verify2faLogin(input: {
  challengeToken: string;
  code: string;
}) {
  return api.post<AuthResponse>("/api/auth/2fa/verify-login", input, {
    auth: false,
  });
}
