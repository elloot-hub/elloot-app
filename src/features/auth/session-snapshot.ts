import type { User } from "@/types/api";

const SESSION_KEY = "elloot.session";
/** Host-only flag for Next middleware. JWT stays httpOnly on the API domain. */
export const SESSION_HINT_COOKIE = "elloot_session";

function writeSessionHint(on: boolean) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAge = on ? 60 * 60 * 24 * 7 : 0;
  document.cookie = `${SESSION_HINT_COOKIE}=${on ? "1" : ""}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export type SessionSnapshot = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: User["role"];
  kycStatus?: User["kycStatus"];
};

export function readSessionSnapshot(): SessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionSnapshot>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.role !== "string"
    ) {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name ?? null,
      avatarUrl: parsed.avatarUrl ?? null,
      role: parsed.role as User["role"],
      kycStatus: parsed.kycStatus,
    };
  } catch {
    return null;
  }
}

export function writeSessionSnapshot(user: SessionSnapshot | User) {
  if (typeof window === "undefined") return;
  try {
    const snapshot: SessionSnapshot = {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? null,
      role: user.role,
      kycStatus: user.kycStatus,
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
    writeSessionHint(true);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearSessionSnapshot() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
    writeSessionHint(false);
  } catch {
    /* ignore */
  }
}

export function snapshotToUser(snapshot: SessionSnapshot): User {
  return {
    id: snapshot.id,
    email: snapshot.email,
    name: snapshot.name,
    avatarUrl: snapshot.avatarUrl,
    role: snapshot.role,
    kycStatus: snapshot.kycStatus ?? "NONE",
    createdAt: new Date(0).toISOString(),
  };
}
