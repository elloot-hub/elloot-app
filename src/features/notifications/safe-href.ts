/**
 * Allows only relative in-app paths for notification links (open-redirect safe).
 */
export function safeInternalHref(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/[\\]/.test(trimmed) || /%5c/i.test(trimmed)) return null;
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  if (trimmed.length > 500) return null;
  return trimmed;
}
