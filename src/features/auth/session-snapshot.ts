import type { User } from "@/types/api";

const SESSION_KEY = "elloot.session";

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
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearSessionSnapshot() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
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
