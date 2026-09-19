"use client";

import { useMemo, useState } from "react";
import { AlertTriangleIcon, CheckCircle2Icon, ChevronRightIcon, EyeIcon, LayersIcon, LightbulbIcon, ListChecksIcon, ShieldAlertIcon, ShoppingBagIcon, XCircleIcon, } from "lucide-react";
import { FaTruckFast } from "react-icons/fa6";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/features/catalog/components/listing-card";
import type { ProductTypeOption, ReachPlanOption } from "@/features/catalog/api";
import { getCategoryVisual } from "@/features/catalog/category-visuals";
import { listingVertical } from "@/features/catalog/listing-category";
import type { SellStepId } from "@/features/listings/components/sell-stepper";
import { buildPreviewListing, computeEditModerationChanges, computeReviewChecklist, hasBlockingReviewIssues, resolvePreviewStockQuantity, type ReviewCheckItem, type ReviewSeverity, type SellReviewInput, } from "@/features/listings/components/sell-review-utils";
import { renderListingDescription } from "@/features/listings/lib/listing-description-format";
import { formatBRLFromCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ListingProductType } from "@/types/api";

const PRODUCT_TYPE_LABEL: Record<ListingProductType, string> = {
  CONTA: "Conta",
  ITEM: "Item",
  SERVICO: "Serviço",
  GOLD: "Moeda / gold",
  OUTROS: "Outros",
};

type SellReviewPanelProps = SellReviewInput & {
  categoryBreadcrumb: string;
  productTypes: ProductTypeOption[];
  reachPlan: ReachPlanOption | null;
  onGoTo: (step: SellStepId) => void;
};

function SeverityIcon({ severity }: { severity: ReviewSeverity }) {
  if (severity === "ok") {
    return <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />;
  }
  if (severity === "warn") {
    return <AlertTriangleIcon className="size-4 shrink-0 text-amber-500" />;
  }
  return <XCircleIcon className="size-4 shrink-0 text-destructive" />;
};

function ReviewChecklistRow({ item, onGoTo, }: { item: ReviewCheckItem; onGoTo: (step: SellStepId) => void; }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border px-3 py-2.5",
        item.severity === "error" && "border-destructive/30 bg-destructive/5",
        item.severity === "warn" && "border-amber-500/30 bg-amber-500/5",
        item.severity === "ok" && "border-border/60 bg-muted/20",
      )}
    >
      <SeverityIcon severity={item.severity} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-medium">{item.label}</p>
        <p className="text-xs text-muted-foreground text-pretty">{item.detail}</p>
      </div>
      {item.severity !== "ok" ? (
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onGoTo(item.step)}
        >
          Corrigir
          <ChevronRightIcon className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
};

function ListingPagePreview({ input, categoryBreadcrumb, productTypes, }: { input: SellReviewInput; categoryBreadcrumb: string; productTypes: ProductTypeOption[]; }) {
  const listing = useMemo(() => buildPreviewListing(input), [input]);
  const vertical = listingVertical(listing.category);
  const visual = getCategoryVisual(vertical.slug);
  const isAuto = listing.deliveryMode === "AUTO";
  const isDynamic = listing.listingModel === "DYNAMIC";
  const stockQty = resolvePreviewStockQuantity(input);
  const effectiveType = input.productType || input.inferredProductType;
  const productLabel = effectiveType
    ? (PRODUCT_TYPE_LABEL[effectiveType] ??
      productTypes.find((t) => t.value === effectiveType)?.label ??
      "—")
    : "—";

  const orderedImages = useMemo(() => {
    return [...input.images].sort((a, b) => {
      if (a.id === input.coverId) return -1;
      if (b.id === input.coverId) return 1;
      return 0;
    });
  }, [input.coverId, input.images]);

  const coverUrl = orderedImages[0]?.previewUrl;

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card/40">
      <div className="border-b border-border/50 bg-muted/30 px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">
          Prévia da página do anúncio
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-muted/30">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="size-full object-cover select-none pointer-events-none"
            />
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={{ background: visual.gradient }}
            >
              <span className="px-4 text-center text-sm font-medium text-white/75">
                {vertical.name}
              </span>
            </div>
          )}
          {orderedImages.length > 1 ? (
            <span className="absolute select-none pointer-events-none bottom-2 right-2 rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
              +{orderedImages.length - 1} foto
              {orderedImages.length - 1 === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {isAuto ? (
              <Badge variant="secondary" className="gap-1 bg-emerald-500/15 text-emerald-400">
                <FaTruckFast className="size-3" />
                Entrega automática
              </Badge>
            ) : null}
            {isDynamic ? (
              <Badge variant="secondary" className="gap-1 bg-violet-500/15 text-violet-400">
                <LayersIcon className="size-3" />
                Anúncio dinâmico
              </Badge>
            ) : null}
            <Badge variant="outline">{productLabel}</Badge>
          </div>

          <h3 className="text-lg font-semibold tracking-tight text-balance">
            {listing.title}
          </h3>

          <p className="text-2xl font-bold text-primary tabular-nums">
            {formatBRLFromCents(listing.priceCents)}
            {isDynamic ? (
              <span className="ml-0.5 text-base font-semibold text-primary/70">+</span>
            ) : null}
          </p>

          <p className="text-xs text-muted-foreground">
            {categoryBreadcrumb || "—"} · {stockQty} em estoque
          </p>
        </div>

        <div className="rounded-md border border-border/50 bg-background/60 p-3">
          <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Descrição
          </p>
          <div className="line-clamp-6 text-sm text-pretty text-muted-foreground">
            {input.description.trim()
              ? renderListingDescription(input.description.trim())
              : "Sem descrição."}
          </div>
        </div>

        <Button type="button" disabled className="w-full" size="lg">
          <ShoppingBagIcon className="size-4" />
          Comprar agora
        </Button>
      </div>
    </div>
  );
};

export function SellReviewPanel({ categoryBreadcrumb, productTypes, reachPlan, onGoTo, ...input }: SellReviewPanelProps) {
  const [mobileTab, setMobileTab] = useState<"summary" | "preview">("summary");
  const [previewMode, setPreviewMode] = useState<"card" | "page">("page");

  const checklist = useMemo(() => computeReviewChecklist(input), [input]);
  const moderationChanges = useMemo(
    () => computeEditModerationChanges(input),
    [input],
  );
  const previewListing = useMemo(() => buildPreviewListing(input), [input]);
  const blocking = hasBlockingReviewIssues(checklist);
  const errorCount = checklist.filter((i) => i.severity === "error").length;
  const warnCount = checklist.filter((i) => i.severity === "warn").length;
  const needsModeration = moderationChanges.length > 0;

  const summaryContent = (
    <div className="space-y-4">
      {needsModeration ? (
        <div className="space-y-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Estas alterações precisam da aprovação de um moderador
              </p>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/90 text-pretty">
                O anúncio continua no ar com a versão atual. Depois da análise,
                as mudanças abaixo passam a valer na vitrine.
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {moderationChanges.map((change) => (
              <li
                key={change.id}
                className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-background/60 px-3 py-2"
              >
                <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-medium">{change.label}</p>
                  <p className="text-xs text-muted-foreground text-pretty">
                    {change.detail}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => onGoTo(change.step)}
                >
                  Ver
                  <ChevronRightIcon className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-md border px-3 py-2.5 text-sm",
          blocking
            ? "border-destructive/40 bg-destructive/5 text-destructive"
            : warnCount > 0
              ? "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400"
              : "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
        )}
      >
        {blocking ? (
          <p>
            <strong>{errorCount}</strong>{" "}
            {errorCount === 1 ? "pendência bloqueia" : "pendências bloqueiam"}{" "}
            {input.isEdit ? "o salvamento" : "a publicação"}. Corrija antes de
            continuar.
          </p>
        ) : needsModeration ? (
          <p>
            Checklist ok — ao salvar,{" "}
            <strong>{moderationChanges.length}</strong>{" "}
            {moderationChanges.length === 1
              ? "alteração vai"
              : "alterações vão"}{" "}
            para análise.
            {warnCount > 0
              ? ` Também há ${warnCount} sugestão${warnCount === 1 ? "" : "ões"}.`
              : ""}
          </p>
        ) : warnCount > 0 ? (
          <p>
            Pronto para {input.isEdit ? "salvar" : "publicar"}, com{" "}
            <strong>{warnCount}</strong>{" "}
            {warnCount === 1 ? "sugestão" : "sugestões"} de melhoria.
          </p>
        ) : (
          <p>
            Tudo certo — seu anúncio está pronto para{" "}
            {input.isEdit ? "salvar" : "publicar"}.
            {input.isEdit
              ? " Preço e estoque entram em vigor na hora."
              : ""}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {checklist.map((item) => (
          <ReviewChecklistRow key={item.id} item={item} onGoTo={onGoTo} />
        ))}
      </div>

      <div className="space-y-2 rounded-md border border-border/60 bg-muted/15 p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ListChecksIcon className="size-4 text-primary" />
          Resumo rápido
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Alcance</dt>
            <dd className="font-medium text-right">
              {reachPlan
                ? `${reachPlan.title} · ${reachPlan.feePercent}%`
                : "Taxa padrão da plataforma"}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Modelo</dt>
            <dd className="font-medium text-right">
              {input.adKind === "simple" ? "Anúncio simples" : "Anúncio dinâmico"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="space-y-2 rounded-md border border-dashed border-primary/25 bg-primary/5 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <LightbulbIcon className="size-4" />
          Dicas para vender mais
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>· Use 3 ou mais imagens nítidas em proporção 16:9.</li>
          <li>· Títulos claros e descrições completas reduzem perguntas no chat.</li>
          <li>· Entrega automática acelera a liberação para o comprador.</li>
        </ul>
      </div>
    </div>
  );

  const previewContent = (
    <div className="space-y-3">
      <div className="flex rounded-md border border-border/60 bg-muted/20 p-1">
        <button
          type="button"
          onClick={() => setPreviewMode("card")}
          className={cn(
            "flex cursor-pointer flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
            previewMode === "card"
              ? "bg-primary text-white"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <EyeIcon className="size-3.5" />
          Card na vitrine
        </button>
        <button
          type="button"
          onClick={() => setPreviewMode("page")}
          className={cn(
            "flex cursor-pointer flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
            previewMode === "page"
              ? "bg-primary text-white"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ShoppingBagIcon className="size-3.5" />
          Página do anúncio
        </button>
      </div>

      {previewMode === "card" ? (
        <div className="mx-auto w-full max-w-[18rem]">
          <ListingCard listing={previewListing} preview />
        </div>
      ) : (
        <ListingPagePreview
          input={input}
          categoryBreadcrumb={categoryBreadcrumb}
          productTypes={productTypes}
        />
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Prévia aproximada — o layout final pode variar levemente.
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex rounded-md border border-border/60 bg-muted/20 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("summary")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-2 text-sm font-medium transition-colors",
            mobileTab === "summary"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          <ListChecksIcon className="size-4" />
          Resumo
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-2 text-sm font-medium transition-colors",
            mobileTab === "preview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          <EyeIcon className="size-4" />
          Prévia
        </button>
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-2">
        <div>{summaryContent}</div>
        <div>{previewContent}</div>
      </div>

      <div className="lg:hidden">
        {mobileTab === "summary" ? summaryContent : previewContent}
      </div>
    </div>
  );
};

export { hasBlockingReviewIssues, computeReviewChecklist };