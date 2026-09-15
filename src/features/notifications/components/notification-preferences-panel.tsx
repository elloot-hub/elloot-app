"use client";

import { useCallback, useEffect, useState } from "react";
import { BellIcon, BellOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
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
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** When false, skip initial fetch (e.g. dialog closed). Default true. */
  active?: boolean;
};

export function NotificationPreferencesPanel({
  className,
  active = true,
}: Props) {
  const [prefs, setPrefs] = useState<CategoryPreference[]>([]);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSaving, setPrefsSaving] = useState(false);

  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

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
    if (!active) return;
    void refreshPrefs();
    void refreshPushState();
  }, [active, refreshPrefs, refreshPushState]);

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
    <div className={cn("space-y-4", className)}>
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
    </div>
  );
}
