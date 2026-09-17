"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  BellIcon,
  CameraIcon,
  ExternalLinkIcon,
  InfoIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { SiDiscord } from "react-icons/si";

import { useAuth } from "@/features/auth/context";
import {
  fetchAuthSessions,
  revokeAuthSession,
  updateMe,
  type AuthSessionRow,
} from "@/features/auth/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SettingsSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { TwoFactorSettingsCard } from "@/features/dashboard/components/two-factor-settings-card";
import { uploadMedia } from "@/features/media/api";
import { NotificationPreferencesDialogButton } from "@/features/notifications/components/notification-preferences-dialog";
import { ApiError } from "@/lib/api/errors";
import { formatDateTimePt } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const AVATAR_MAX_BYTES = 5_242_880;
const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";

type ConfirmKind =
  | "remove-avatar"
  | "logout"
  | "reset-password"
  | "revoke-session"
  | null;

function initials(name: string | null | undefined, email: string) {
  const fromName = name?.trim();
  if (fromName) {
    const parts = fromName.split(/\s+/).filter(Boolean);
    const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
    return letters.toUpperCase() || email.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function isRealDate(iso?: string | null) {
  if (!iso) return false;
  return new Date(iso).getTime() > 0;
}

function providerLabel(provider: string) {
  if (provider === "google") return "Google";
  if (provider === "discord") return "Discord";
  return provider;
}

export function SettingsClient() {
  const router = useRouter();
  const { user, logout, loading, refreshUser } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [sessions, setSessions] = useState<AuthSessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AuthSessionRow | null>(null);
  const [revoking, setRevoking] = useState(false);
  /** Local avatar pick — uploaded only on "Salvar". */
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(
    null,
  );
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setBio(user.bio ?? "");
    setPixKey(user.pixKey ?? "");
  }, [user]);

  useEffect(() => {
    return () => {
      if (pendingAvatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(pendingAvatarPreview);
      }
    };
  }, [pendingAvatarPreview]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setSessionsLoading(true);
      setSessionsError(null);
      try {
        const { sessions: rows } = await fetchAuthSessions();
        if (!cancelled) setSessions(rows);
      } catch (err) {
        if (!cancelled) {
          setSessionsError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar as sessões.",
          );
        }
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading || !user) {
    return <SettingsSkeleton />;
  }

  const currentUser = user;
  const isDark = themeMounted && resolvedTheme === "dark";
  const providers = new Set(
    (currentUser.accounts ?? []).map((account) => account.provider.toLowerCase()),
  );
  const cooldownDays = currentUser.nameChangeCooldownDays ?? 30;
  const nameLockedUntil = currentUser.nameChangeAvailableAt
    ? new Date(currentUser.nameChangeAvailableAt)
    : null;
  const nameChangeLocked = Boolean(
    currentUser.name?.trim() &&
    nameLockedUntil &&
    nameLockedUntil.getTime() > Date.now(),
  );

  function clearPendingAvatar() {
    if (pendingAvatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(pendingAvatarPreview);
    }
    setPendingAvatarFile(null);
    setPendingAvatarPreview(null);
  }

  function onAvatarFile(file: File | undefined) {
    if (!file) return;
    if (!AVATAR_ACCEPT.split(",").includes(file.type)) {
      setError("Use uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError("A foto deve ter no máximo 5 MB.");
      return;
    }
    setError(null);
    setSaved(false);
    clearPendingAvatar();
    setAvatarRemoved(false);
    setPendingAvatarFile(file);
    setPendingAvatarPreview(URL.createObjectURL(file));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const nameUnchanged =
        (name.trim() || null) === (currentUser.name?.trim() || null);

      let avatarUrl: string | null | undefined;
      if (pendingAvatarFile) {
        const { asset } = await uploadMedia({
          file: pendingAvatarFile,
          purpose: "AVATAR",
          visibility: "PUBLIC",
        });
        avatarUrl = asset.url;
      } else if (avatarRemoved) {
        avatarUrl = null;
      }

      await updateMe({
        ...(nameChangeLocked || nameUnchanged
          ? {}
          : { name: name.trim() ? name.trim() : null }),
        bio: bio.trim() ? bio.trim() : null,
        pixKey: pixKey.trim() ? pixKey.trim() : null,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      });
      clearPendingAvatar();
      setAvatarRemoved(false);
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível salvar as alterações.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmedAction() {
    if (confirmKind === "remove-avatar") {
      clearPendingAvatar();
      setAvatarRemoved(true);
      setSaved(false);
      return;
    }
    if (confirmKind === "logout") {
      logout();
      router.push(routes.home);
      return;
    }
    if (confirmKind === "reset-password") {
      router.push(routes.forgotPassword);
      return;
    }
    if (confirmKind === "revoke-session" && revokeTarget) {
      setRevoking(true);
      try {
        const result = await revokeAuthSession(revokeTarget.id);
        if (result.current) {
          logout();
          router.push(routes.home);
          return;
        }
        setSessions((prev) => prev.filter((row) => row.id !== revokeTarget.id));
        setRevokeTarget(null);
      } catch (err) {
        setSessionsError(
          err instanceof ApiError
            ? err.message
            : "Não foi possível encerrar a sessão.",
        );
        throw err;
      } finally {
        setRevoking(false);
      }
    }
  }

  const confirmCopy =
    confirmKind === "remove-avatar"
      ? {
        title: "Remover foto de perfil?",
        description:
          "A foto será removida ao salvar o perfil. Você pode enviar outra a qualquer momento.",
        confirmLabel: "Remover foto",
        variant: "destructive" as const,
      }
      : confirmKind === "logout"
        ? {
          title: "Sair da conta?",
          description:
            "Você será desconectado deste dispositivo e precisará entrar de novo para acessar o painel.",
          confirmLabel: "Sair da conta",
          variant: "destructive" as const,
        }
        : confirmKind === "reset-password"
          ? {
            title: "Redefinir senha?",
            description:
              "Vamos abrir o fluxo de recuperação. Você sairá desta página para informar o e-mail da conta.",
            confirmLabel: "Continuar",
            variant: "default" as const,
          }
          : confirmKind === "revoke-session" && revokeTarget
            ? {
              title: revokeTarget.current
                ? "Encerrar esta sessão?"
                : "Encerrar sessão neste dispositivo?",
              description: revokeTarget.current
                ? "Esta é a sessão atual. Você será desconectado e precisará entrar de novo."
                : `${revokeTarget.browser} · ${revokeTarget.os}${revokeTarget.ip ? ` · ${revokeTarget.ip}` : ""
                } deixará de ter acesso à sua conta.`,
              confirmLabel: "Encerrar sessão",
              variant: "destructive" as const,
            }
            : null;

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-tight">
              Perfil público
            </h2>
            <p className="text-xs text-muted-foreground">
              Nome, foto e biografia na página pública. O ID público é gerado
              automaticamente pelo primeiro nome.
            </p>
          </div>
          <Link
            href={routes.profile(user.username || user.id)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "shrink-0 gap-1.5",
            )}
          >
            <ExternalLinkIcon className="size-3.5" />
            Ver página pública
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            {(() => {
              const displayUrl = avatarRemoved
                ? null
                : pendingAvatarPreview || user.avatarUrl;
              return displayUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayUrl}
                  alt=""
                  className="size-20 rounded-full object-cover ring-1 ring-border/60"
                />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary ring-1 ring-border/60">
                  {initials(user.name, user.email)}
                </span>
              );
            })()}
            <button
              type="button"
              disabled={saving}
              onClick={() => fileRef.current?.click()}
              className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-muted"
              aria-label="Alterar foto"
            >
              <CameraIcon className="size-3.5" />
            </button>
          </div>
          <div className="min-w-0 space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                onAvatarFile(file);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => fileRef.current?.click()}
              >
                Trocar foto
              </Button>
              {!avatarRemoved &&
              (pendingAvatarPreview || user.avatarUrl) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={() => setConfirmKind("remove-avatar")}
                >
                  Remover
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG ou WebP · até 5 MB · aplica ao salvar o perfil
              {pendingAvatarFile || avatarRemoved ? (
                <span className="text-amber-700 dark:text-amber-400">
                  {" "}
                  · alteração pendente
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void onSave(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="settings-name">Nome de exibição</FieldLabel>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                className="h-10 rounded-sm"
                placeholder="Como você aparece na Elloot"
                maxLength={80}
                disabled={nameChangeLocked}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {nameChangeLocked && nameLockedUntil
                  ? `Nome bloqueado até ${formatDateTimePt(nameLockedUntil.toISOString())} (a cada ${cooldownDays} dias).`
                  : `Pode ser alterado a cada ${cooldownDays} dias. O ID público usa só o primeiro nome.`}
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="settings-email">
                E-mail{" "}
                <span className="text-xs text-muted-foreground">
                  (Não é possível alterar o e-mail)
                </span>
              </FieldLabel>
              <Input
                id="settings-email"
                value={user.email}
                disabled
                className="h-10 rounded-sm"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="settings-bio">Biografia</FieldLabel>
            <Textarea
              id="settings-bio"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value.slice(0, 280));
                setSaved(false);
              }}
              className="min-h-24 rounded-sm"
              placeholder="Conte um pouco sobre você, seus anúncios ou tempo de resposta…"
              maxLength={280}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {bio.length}/280
            </p>
          </Field>

          {error ? <FieldError>{error}</FieldError> : null}
          {saved ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Alterações salvas.
            </p>
          ) : null}

          <Button type="submit" disabled={saving}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </form>
      </section>

      <TwoFactorSettingsCard
        enabled={Boolean(currentUser.totpEnabled)}
        onChanged={refreshUser}
      />

      <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
              <BellIcon className="size-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold tracking-tight">
                Notificações
              </h2>
              <p className="text-xs text-muted-foreground">
                App, navegador e categorias de aviso.
              </p>
            </div>
          </div>
          <NotificationPreferencesDialogButton
            label="Gerenciar"
            variant="outline"
            size="sm"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">Aparência</h2>
          <p className="text-xs text-muted-foreground">
            O mesmo controle do menu da conta, no canto da navbar.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/50 bg-background/40 px-3 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md border border-border/50 bg-muted/40 text-muted-foreground">
              {isDark ? (
                <MoonIcon className="size-4" />
              ) : (
                <SunIcon className="size-4" />
              )}
            </span>
            <div>
              <p className="text-sm font-medium">Tema escuro</p>
              <p className="text-xs text-muted-foreground">
                {themeMounted
                  ? isDark
                    ? "Ativo neste dispositivo"
                    : "Desativado neste dispositivo"
                  : "Carregando…"}
              </p>
            </div>
          </div>
          <Switch
            checked={isDark}
            disabled={!themeMounted}
            onCheckedChange={(checked) => {
              setTheme(checked ? "dark" : "light");
            }}
            aria-label="Alternar tema escuro"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">
            Contas conectadas
          </h2>
          <p className="text-xs text-muted-foreground">
            Login social usa o mesmo e-mail da conta. Ligação automática no
            próximo acesso.
          </p>
        </div>
        <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/50">
          {(
            [
              {
                id: "google",
                label: "Google",
                icon: FcGoogle,
                connected: providers.has("google"),
              },
              {
                id: "discord",
                label: "Discord",
                icon: SiDiscord,
                connected: providers.has("discord"),
              },
            ] as const
          ).map((row) => {
            const Icon = row.icon;
            return (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md border border-border/50 bg-muted/30">
                    <Icon
                      className={cn(
                        "size-4",
                        row.id === "discord" && "text-[#5865F2]",
                      )}
                    />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.connected
                        ? "Conectado a esta conta"
                        : "Não conectado"}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    row.connected
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground",
                  )}
                >
                  {row.connected ? "Ativo" : "—"}
                </span>
              </li>
            );
          })}
        </ul>
        {(user.accounts ?? []).length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Ligado em{" "}
            {(user.accounts ?? [])
              .map(
                (account) =>
                  `${providerLabel(account.provider)}${isRealDate(account.createdAt)
                    ? ` · ${formatDateTimePt(account.createdAt)}`
                    : ""
                  }`,
              )
              .join(" · ")}
          </p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">
            Sessões ativas
          </h2>
          <p className="text-xs text-muted-foreground">
            Gerencie os dispositivos conectados à sua conta.
          </p>
        </div>

        {sessionsLoading ? (
          <div className="rounded-md border border-border/50 px-3 py-8 text-center text-sm text-muted-foreground">
            Carregando sessões…
          </div>
        ) : sessionsError ? (
          <p className="text-sm text-destructive">{sessionsError}</p>
        ) : sessions.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 px-3 py-8 text-center text-sm text-muted-foreground">
            Nenhuma sessão ativa encontrada.
          </div>
        ) : (
          <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/50">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center gap-3 px-3 py-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/30 text-muted-foreground">
                  <MonitorIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {session.browser} · {session.os}
                    {session.current ? (
                      <span className="ml-2 text-[11px] font-medium text-primary">
                        Atual
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.ip ? `${session.ip} · ` : null}
                    Ativo em {formatDateTimePt(session.lastSeenAt)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Encerrar sessão ${session.browser} em ${session.os}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    setRevokeTarget(session);
                    setConfirmKind("revoke-session");
                  }}
                >
                  <XIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-md border border-border/50 bg-muted/30">
            <UserIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-base font-semibold tracking-tight">Sessão</h2>
            <p className="text-xs text-muted-foreground">
              Redefinir senha usa o mesmo fluxo da tela de login.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmKind("reset-password")}
          >
            Redefinir senha
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmKind("logout")}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOutIcon className="size-4" />
            Sair da conta
          </Button>
        </div>
      </section>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        Telefone e envio de documentos ficam na página de verificação. A carteira
        e os saques continuam em Financeiro.
      </p>

      {confirmCopy ? (
        <ConfirmDialog
          open={confirmKind !== null}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmKind(null);
              setRevokeTarget(null);
            }
          }}
          title={confirmCopy.title}
          description={confirmCopy.description}
          confirmLabel={confirmCopy.confirmLabel}
          variant={confirmCopy.variant}
          loading={
            confirmKind === "revoke-session" ? revoking : false
          }
          onConfirm={handleConfirmedAction}
        />
      ) : null}
    </div>
  );
}
