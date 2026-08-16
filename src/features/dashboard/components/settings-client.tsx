"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BellIcon, BellOffIcon } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import { updateMe } from "@/features/auth/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SettingsSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import {
  CATEGORY_HINTS,
  CATEGORY_LABELS,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  type CategoryPreference,
  type NotificationCategory,
} from "@/features/notifications/preferences-api";
import {
  disableBrowserPush,
  enableBrowserPush,
  getBrowserPushState,
  isPushSupported,
} from "@/features/notifications/push-client";
import { ApiError } from "@/lib/api/errors";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function SettingsClient() {
  const router = useRouter();
  const { user, logout, loading, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [prefs, setPrefs] = useState<CategoryPreference[]>([]);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSaving, setPrefsSaving] = useState(false);

  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPixKey(user.pixKey ?? "");
  }, [user]);

  const refreshPrefs = useCallback(async () => {
    setPrefsLoading(true);
    setPrefsError(null);
    try {
      const next = await fetchNotificationPreferences();
      setPrefs(next);
    } catch (err) {
      setPrefsError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar preferências.",
      );
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  const refreshPushState = useCallback(async () => {
    const state = await getBrowserPushState();
    setPushSupported(state.supported);
    setPushSubscribed(state.subscribed);
  }, []);

  useEffect(() => {
    if (!user) return;
    void refreshPrefs();
    void refreshPushState();
  }, [user, refreshPrefs, refreshPushState]);

  if (loading || !user) {
    return <SettingsSkeleton />;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateMe({
        name: name.trim() ? name.trim() : null,
        pixKey: pixKey.trim() ? pixKey.trim() : null,
      });
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

  async function patchPref(
    category: NotificationCategory,
    patch: { inApp?: boolean; push?: boolean },
  ) {
    setPrefs((prev) =>
      prev.map((row) =>
        row.category === category
          ? {
              ...row,
              ...(patch.inApp !== undefined && !row.inAppLocked
                ? { inApp: patch.inApp }
                : {}),
              ...(patch.push !== undefined ? { push: patch.push } : {}),
            }
          : row,
      ),
    );
    setPrefsSaving(true);
    setPrefsError(null);
    try {
      const next = await updateNotificationPreferences([{ category, ...patch }]);
      setPrefs(next);
    } catch (err) {
      setPrefsError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível salvar as preferências.",
      );
      await refreshPrefs();
    } finally {
      setPrefsSaving(false);
    }
  }

  async function onEnablePush() {
    setPushBusy(true);
    setPushMessage(null);
    try {
      await enableBrowserPush();
      setPushSubscribed(true);
      setPushMessage("Notificações do navegador ativadas.");
    } catch (err) {
      setPushMessage(
        err instanceof Error ? err.message : "Falha ao ativar push.",
      );
      await refreshPushState();
    } finally {
      setPushBusy(false);
    }
  }

  async function onDisablePush() {
    setPushBusy(true);
    setPushMessage(null);
    try {
      await disableBrowserPush();
      setPushSubscribed(false);
      setPushMessage("Notificações do navegador desativadas neste dispositivo.");
    } catch (err) {
      setPushMessage(
        err instanceof Error ? err.message : "Falha ao desativar push.",
      );
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => void onSave(e)}
        className="space-y-4 rounded-md border border-border/60 bg-card/40 p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="settings-name">Nome</FieldLabel>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              maxLength={80}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-email">E-mail</FieldLabel>
            <Input id="settings-email" value={user.email} disabled />
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-role">Função</FieldLabel>
            <Input
              id="settings-role"
              value={user.role}
              disabled
              className="font-mono text-xs"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-pix">Chave PIX</FieldLabel>
            <Input
              id="settings-pix"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, e-mail, telefone ou aleatória"
              maxLength={140}
            />
          </Field>
        </div>

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

      <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-5">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Notificações</h2>
          <p className="text-xs text-muted-foreground text-pretty">
            Escolha o que recebe no app e no navegador. Pedidos e disputas
            permanecem ativos no app.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border/50 bg-background/40 px-3 py-3">
          <span className="flex size-9 items-center justify-center rounded-md border border-border/50 bg-muted/40 text-muted-foreground">
            {pushSubscribed ? (
              <BellIcon className="size-4" />
            ) : (
              <BellOffIcon className="size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Navegador neste dispositivo</p>
            <p className="text-xs text-muted-foreground">
              {!isPushSupported()
                ? "Seu navegador não suporta push."
                : pushSubscribed
                  ? "Ativo — avisos podem aparecer com o site fechado."
                  : "Desativado — ative para receber push no sistema."}
            </p>
          </div>
          {pushSupported ? (
            pushSubscribed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pushBusy}
                onClick={() => void onDisablePush()}
              >
                {pushBusy ? "…" : "Desativar"}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={pushBusy}
                onClick={() => void onEnablePush()}
              >
                {pushBusy ? "Ativando…" : "Ativar"}
              </Button>
            )
          ) : null}
        </div>
        {pushMessage ? (
          <p className="text-xs text-muted-foreground">{pushMessage}</p>
        ) : null}

        {prefsLoading ? (
          <p className="text-sm text-muted-foreground">Carregando preferências…</p>
        ) : (
          <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/50">
            {prefs.map((row) => (
              <li
                key={row.category}
                className="grid gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {CATEGORY_LABELS[row.category]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORY_HINTS[row.category]}
                  </p>
                </div>
                <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground sm:justify-end">
                  <span>No app</span>
                  <Switch
                    checked={row.inApp}
                    disabled={row.inAppLocked || prefsSaving}
                    onCheckedChange={(checked) =>
                      void patchPref(row.category, { inApp: checked })
                    }
                  />
                </label>
                <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground sm:justify-end">
                  <span>Navegador</span>
                  <Switch
                    checked={row.push}
                    disabled={prefsSaving}
                    onCheckedChange={(checked) =>
                      void patchPref(row.category, { push: checked })
                    }
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
        {prefsError ? <FieldError>{prefsError}</FieldError> : null}
        {prefsSaving ? (
          <p className="text-xs text-muted-foreground">Salvando preferências…</p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={routes.dashboardVerification}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Verificação
        </Link>
        <Link
          href={routes.dashboardWallet}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Carteira
        </Link>
        <Link
          href={routes.dashboardWithdrawals}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Saques
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push(routes.home);
          }}
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
