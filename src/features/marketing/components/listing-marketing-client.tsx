"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchListingPlugins,
  removeListingPlugin,
  saveListingPlugin,
  type SellerPlugin,
} from "@/features/marketing/seller-plugins-api";
import { fetchListing } from "@/features/listings/api";
import { ApiError } from "@/lib/api/errors";
import { routes } from "@/lib/routes";
import { listingRouteRef } from "@/lib/public-codes";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
};

export function ListingMarketingClient({ listingId }: Props) {
  const [title, setTitle] = useState<string>("Anúncio");
  const [listingHref, setListingHref] = useState<string | null>(null);
  const [plugins, setPlugins] = useState<SellerPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configTarget, setConfigTarget] = useState<SellerPlugin | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ listing }, { plugins: next }] = await Promise.all([
        fetchListing(listingId),
        fetchListingPlugins(listingId),
      ]);
      setTitle(listing.title);
      setListingHref(routes.listing(listingRouteRef(listing)));
      setPlugins(
        next.map((p) => ({
          ...p,
          key: p.key,
          id: p.key,
        })),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar o marketing deste anúncio.",
      );
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openConfig(plugin: SellerPlugin) {
    setConfigTarget(plugin);
    setEnabled(plugin.installed ? plugin.enabled : true);
    setValues(
      Object.fromEntries(plugin.fields.map((f) => [f.key, f.value ?? ""])),
    );
  }

  async function handleSave() {
    if (!configTarget) return;
    setSaving(true);
    try {
      const { plugin } = await saveListingPlugin(listingId, configTarget.key, {
        enabled,
        fields: values,
      });
      setPlugins((prev) =>
        prev.map((p) =>
          p.key === plugin.key
            ? {
                ...plugin,
                key: plugin.key,
                id: plugin.key,
                installed: true,
              }
            : p,
        ),
      );
      setConfigTarget(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível salvar.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(plugin: SellerPlugin) {
    setPendingKey(plugin.key);
    try {
      await removeListingPlugin(listingId, plugin.key);
      setPlugins((prev) =>
        prev.map((p) =>
          p.key === plugin.key
            ? {
                ...p,
                installed: false,
                enabled: false,
                status: "AVAILABLE",
                fields: p.fields.map((f) => ({ ...f, value: "" })),
              }
            : p,
        ),
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível remover.",
      );
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-3">
        <Link
          href={routes.dashboardListings}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 w-fit",
          )}
        >
          <ArrowLeftIcon className="size-3.5" />
          Meus anúncios
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Marketing do anúncio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pixels só neste anúncio: {title}. Informe apenas IDs oficiais — sem
            código JavaScript.
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <ul className="space-y-3">
          {plugins.map((plugin) => (
            <li
              key={plugin.key}
              className="rounded-lg border border-border/70 bg-card p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{plugin.name}</h2>
                    {plugin.installed && plugin.enabled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckIcon className="size-3" />
                        Ativo
                      </span>
                    ) : plugin.installed ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        Instalado · off
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plugin.description}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {plugin.installed ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openConfig(plugin)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={pendingKey === plugin.key}
                        onClick={() => void handleRemove(plugin)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openConfig(plugin)}
                    >
                      <PlusIcon className="size-3.5" />
                      Instalar
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Os eventos só disparam na página pública do{" "}
        {listingHref ? (
          <Link
            href={listingHref}
            className="underline underline-offset-2"
          >
            anúncio
          </Link>
        ) : (
          "anúncio"
        )}{" "}
        e na compra, após o visitante aceitar cookies de marketing.
      </p>

      <Dialog
        open={configTarget !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setConfigTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar {configTarget?.name}</DialogTitle>
            <DialogDescription>
              Só IDs oficiais da ferramenta. Nada de script colado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-1 py-2">
            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Ativo</p>
                <p className="text-xs text-muted-foreground">
                  Desligue para pausar sem apagar o ID.
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
            {configTarget?.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`mkt-${field.key}`}>{field.label}</Label>
                <Input
                  id={`mkt-${field.key}`}
                  value={values[field.key] ?? ""}
                  placeholder={field.placeholder}
                  autoComplete="off"
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                />
                {field.hint ? (
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                ) : null}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => setConfigTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
