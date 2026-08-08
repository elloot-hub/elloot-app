"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, ImagePlusIcon, LayersIcon, Loader2Icon, PackageIcon, PlusIcon, StarIcon, Trash2Icon, XIcon, } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel, } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/context";
import { fetchCategories } from "@/features/catalog/api";
import { createListing } from "@/features/listings/api";
import { SellStepper, type SellStepId, } from "@/features/listings/components/sell-stepper";
import { uploadMedia } from "@/features/media/api";
import { ApiError } from "@/lib/api/errors";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Category, ListingProductType } from "@/types/api";

const MAX_MEDIA = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TITLE = 80;
const MAX_DESC = 5000;
const MIN_PRICE_CENTS = 150;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const LEVEL_LABELS = ["Categoria", "Subcategoria", "Seção", "Tipo", "Detalhe"];

const PRODUCT_TYPES: Array<{ value: ListingProductType; label: string }> = [
  { value: "SERVICO", label: "Serviço" },
  { value: "CONTA", label: "Conta" },
  { value: "GOLD", label: "Gold" },
  { value: "ITEM", label: "Item" },
  { value: "OUTROS", label: "Outros" },
];

const REACH_PLANS = [
  {
    id: "min" as const,
    title: "Alcance mínimo",
    fee: "6% por venda",
    description: "Aparece nas listagens padrão da categoria.",
  },
  {
    id: "mid" as const,
    title: "Alcance médio",
    fee: "8% por venda",
    description: "Mais relevância em buscas e filtros.",
  },
  {
    id: "max" as const,
    title: "Alcance máximo",
    fee: "12% por venda",
    description: "Prioridade no ranking e destaque visual.",
    recommended: true,
  },
];

type ReachId = (typeof REACH_PLANS)[number]["id"];
type DeliveryMode = "manual" | "auto";
type AdKind = "simple" | "composite";

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type OfferDraft = {
  id: string;
  title: string;
  price: string;
  delivery: DeliveryMode;
  stock: string;
  autoStock: string;
  active: boolean;
};

function parsePriceToCents(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const reais = Number(cleaned);
  if (!Number.isFinite(reais) || reais <= 0) return null;
  const cents = Math.round(reais * 100);
  if (cents < MIN_PRICE_CENTS || cents > 50_000_000) return null;
  return cents;
}

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function findNode(nodes: Category[], id: string): Category | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findNode(node.children ?? [], id);
    if (nested) return nested;
  }
  return null;
}

function optionsAtLevel(tree: Category[], path: string[], level: number) {
  if (level === 0) return tree;
  const parentId = path[level - 1];
  if (!parentId) return [];
  return findNode(tree, parentId)?.children ?? [];
}

function countAutoLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean).length;
}

function newOffer(): OfferDraft {
  return {
    id: crypto.randomUUID(),
    title: "",
    price: "",
    delivery: "manual",
    stock: "1",
    autoStock: "",
    active: true,
  };
}

function stepIndex(id: SellStepId) {
  return (["product", "offers", "images", "review"] as SellStepId[]).indexOf(
    id,
  );
}

export function SellPageContent() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [step, setStep] = useState<SellStepId>("product");
  const [maxReached, setMaxReached] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  const [productType, setProductType] = useState<ListingProductType | "">("");
  const [reach, setReach] = useState<ReachId>("min");

  const [adKind, setAdKind] = useState<AdKind>("simple");
  const [price, setPrice] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMode>("manual");
  const [stock, setStock] = useState("1");
  const [autoStock, setAutoStock] = useState("");
  const [offers, setOffers] = useState<OfferDraft[]>([
    newOffer(),
    { ...newOffer(), title: "" },
  ]);

  const [tree, setTree] = useState<Category[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTreeLoading(true);
    void fetchCategories()
      .then((res) => {
        if (!cancelled) setTree(res.categories);
      })
      .finally(() => {
        if (!cancelled) setTreeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const img of images) URL.revokeObjectURL(img.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCategoryId = categoryPath[categoryPath.length - 1] ?? "";

  const categoryBreadcrumb = useMemo(
    () =>
      categoryPath
        .map((id) => findNode(tree, id)?.name)
        .filter(Boolean)
        .join(" › "),
    [categoryPath, tree],
  );

  const cascadeLevels = useMemo(() => {
    const levels: Array<{ level: number; options: Category[] }> = [
      { level: 0, options: tree },
    ];
    for (let i = 0; i < categoryPath.length; i++) {
      const children = optionsAtLevel(tree, categoryPath, i + 1);
      if (!children.length) break;
      levels.push({ level: i + 1, options: children });
    }
    return levels;
  }, [tree, categoryPath]);

  function goTo(next: SellStepId) {
    setError(null);
    setStep(next);
    setMaxReached((prev) => Math.max(prev, stepIndex(next)));
  }

  function setPathLevel(level: number, id: string) {
    setCategoryPath((prev) => [...prev.slice(0, level), id]);
  }

  function validateProduct(): string | null {
    const t = title.trim();
    if (t.length < 5) return "O título precisa ter pelo menos 5 caracteres.";
    if (t.length > MAX_TITLE) return `Título: máximo ${MAX_TITLE} caracteres.`;
    const d = description.trim();
    if (d.length < 20) return "A descrição precisa ter pelo menos 20 caracteres.";
    if (d.length > MAX_DESC) return `Descrição: máximo ${MAX_DESC} caracteres.`;
    if (!categoryPath.length) return "Selecione a categoria.";
    const leaf = findNode(tree, selectedCategoryId);
    if (leaf?.children?.length) return "Continue até a última categoria.";
    if (!productType) return "Selecione o que você está vendendo.";
    return null;
  }

  function offerStockQty(offer: OfferDraft) {
    if (offer.delivery === "auto") {
      return Math.max(1, countAutoLines(offer.autoStock));
    }
    const qty = Number(offer.stock);
    return Number.isInteger(qty) && qty >= 1 ? qty : 0;
  }

  function validateOffers(): string | null {
    if (adKind === "simple") {
      if (parsePriceToCents(price) == null) {
        return `Informe um preço válido (mín. ${formatBrl(MIN_PRICE_CENTS)}).`;
      }
      if (delivery === "manual") {
        const qty = Number(stock);
        if (!Number.isInteger(qty) || qty < 1) return "Estoque inválido.";
      } else if (countAutoLines(autoStock) < 1) {
        return "Cole pelo menos um código/chave por linha para entrega automática.";
      }
      return null;
    }

    const active = offers.filter((o) => o.active);
    if (active.length < 2) return "Anúncio composto precisa de pelo menos 2 ofertas ativas.";
    if (active.length > 30) return "Máximo de 30 ofertas.";
    for (const [i, offer] of active.entries()) {
      if (offer.title.trim().length < 3) {
        return `Oferta ${i + 1}: título com pelo menos 3 caracteres.`;
      }
      if (offer.title.trim().length > MAX_TITLE) {
        return `Oferta ${i + 1}: título muito longo.`;
      }
      if (parsePriceToCents(offer.price) == null) {
        return `Oferta ${i + 1}: preço inválido (mín. ${formatBrl(MIN_PRICE_CENTS)}).`;
      }
      if (offerStockQty(offer) < 1) {
        return `Oferta ${i + 1}: estoque inválido.`;
      }
    }
    return null;
  }

  function advanceFromProduct() {
    const err = validateProduct();
    if (err) {
      setError(err);
      return;
    }
    goTo("offers");
  }

  function advanceFromOffers() {
    const err = validateOffers();
    if (err) {
      setError(err);
      return;
    }
    goTo("images");
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next: PendingImage[] = [];
    let err: string | null = null;
    for (const file of Array.from(fileList)) {
      if (images.length + next.length >= MAX_MEDIA) {
        err = `No máximo ${MAX_MEDIA} imagens.`;
        break;
      }
      if (!ACCEPTED_TYPES.has(file.type)) {
        err = "Use JPEG, PNG ou WebP.";
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        err = "Cada imagem deve ter no máximo 10 MB.";
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (next.length) {
      setImages((prev) => {
        const merged = [...prev, ...next];
        if (!coverId) setCoverId(merged[0]!.id);
        return merged;
      });
    }
    setError(err);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((img) => img.id !== id);
      if (coverId === id) setCoverId(next[0]?.id ?? null);
      return next;
    });
  }

  async function submitListing() {
    const productErr = validateProduct();
    if (productErr) {
      setError(productErr);
      goTo("product");
      return;
    }
    const offersErr = validateOffers();
    if (offersErr) {
      setError(offersErr);
      goTo("offers");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const ordered = [...images].sort((a, b) => {
        if (a.id === coverId) return -1;
        if (b.id === coverId) return 1;
        return 0;
      });
      const mediaUrls: string[] = [];
      for (const img of ordered) {
        const { asset } = await uploadMedia({
          file: img.file,
          purpose: "LISTING",
          visibility: "PUBLIC",
        });
        mediaUrls.push(asset.url);
      }

      const listingModel = adKind === "composite" ? "DYNAMIC" : "NORMAL";
      const result = await createListing({
        categoryId: selectedCategoryId,
        title: title.trim(),
        description: description.trim(),
        listingModel,
        productType: productType || null,
        stockQuantity:
          adKind === "simple"
            ? delivery === "auto"
              ? countAutoLines(autoStock)
              : Number(stock) || 1
            : 1,
        priceCents:
          adKind === "simple" ? parsePriceToCents(price)! : undefined,
        offers:
          adKind === "composite"
            ? offers
              .filter((o) => o.active)
              .map((o) => ({
                title: o.title.trim(),
                priceCents: parsePriceToCents(o.price)!,
                stockQuantity: offerStockQty(o),
              }))
            : undefined,
        mediaUrls,
        publish: true,
      });

      if (result.accessToken) {
        await setSession(result.accessToken);
      }

      router.push(routes.listing(result.listing.id));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível publicar. Tente de novo.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Container className="max-w-3xl space-y-8 py-8 sm:py-12">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="font-medium sm:text-2xl">
            Criar anúncio
          </h1>
          <p className="text-muted-foreground">
            Avance por partes e revise tudo antes de publicar.
          </p>
        </div>

        <SellStepper
          current={step}
          maxReachedIndex={maxReached}
          onSelect={(id) => {
            if (stepIndex(id) <= maxReached) goTo(id);
          }}
        />
      </div>

      {step === "product" ? (
        <section className="space-y-6">
          <Panel>
            <PanelTitle>Dados do produto</PanelTitle>
            <PanelDescription>Preencha os campos abaixo para criar seu anúncio.</PanelDescription>
            <div className="space-y-4 pt-4">
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Título</FieldLabel>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {title.length} / {MAX_TITLE}
                  </span>
                </div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                  placeholder="Nome claro do produto ou serviço"
                  className="h-11 rounded-md"
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel>Descrição</FieldLabel>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {description.length} / {MAX_DESC}
                  </span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value.slice(0, MAX_DESC))
                  }
                  placeholder="Detalhes da entrega, o que está incluso…"
                  className="min-h-36 max-h-36 rounded-md"
                />
              </Field>

              <div className="space-y-3">
                {cascadeLevels.map(({ level, options }) => (
                  <Field key={level}>
                    <FieldLabel>
                      {LEVEL_LABELS[level] ?? `Nível ${level + 1}`}
                    </FieldLabel>
                    <Select
                      value={categoryPath[level] || undefined}
                      onValueChange={(v) => setPathLevel(level, v ?? "")}
                      disabled={treeLoading}
                    >
                      <SelectTrigger className="py-4.5 w-full cursor-pointer">
                        <SelectValue
                          placeholder={treeLoading ? "Carregando…" : "Selecione"}
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-72 top-4">
                        {options.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                ))}

                <Field>
                  <FieldLabel>O que você está vendendo?</FieldLabel>
                  <Select
                    value={productType || undefined}
                    onValueChange={(v) =>
                      setProductType((v as ListingProductType) ?? "")
                    }
                  >
                    <SelectTrigger className="py-4.5 w-full rounded-sm cursor-pointer">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Visibilidade do seu anúncio</PanelTitle>
            <p className="mb-4 text-sm text-muted-foreground">
              Escolha o alcance. As taxas entram no algoritmo de destaque —
              você pode ajustar isso depois.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {REACH_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setReach(plan.id)}
                  className={cn(
                    "relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors",
                    reach === plan.id
                      ? "border-primary/50 bg-primary/10 shadow-[0_0_0_1px_hsl(217_91%_54%/0.25)]"
                      : "border-border/60 bg-muted/15 hover:bg-muted/30",
                  )}
                >
                  {plan.recommended ? (
                    <span className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Recomendado
                    </span>
                  ) : null}
                  <span className="font-heading text-sm font-semibold">
                    {plan.title}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {plan.fee}
                  </span>
                  <span className="text-xs text-muted-foreground text-pretty">
                    {plan.description}
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <StepFooter
            error={error}
            onBackHref={routes.market}
            backLabel="Cancelar"
            onNext={advanceFromProduct}
            nextLabel="Avançar"
          />
        </section>
      ) : null}

      {step === "offers" ? (
        <section className="space-y-6">
          <Panel>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <PanelTitle>Ofertas</PanelTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Defina preço e entrega. Adicione variações só se forem
                  realmente diferentes.
                </p>
              </div>
              {adKind === "composite" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setOffers((prev) =>
                      prev.length >= 30 ? prev : [...prev, newOffer()],
                    )
                  }
                >
                  <PlusIcon className="size-4" />
                  Adicionar
                </Button>
              ) : null}
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <KindCard
                selected={adKind === "simple"}
                icon={<PackageIcon className="size-5" />}
                title="Anúncio simples"
                description="Apenas um item, ideal para produtos sem variações."
                onClick={() => setAdKind("simple")}
              />
              <KindCard
                selected={adKind === "composite"}
                icon={<LayersIcon className="size-5" />}
                title="Anúncio composto"
                description="Múltiplos itens no mesmo anúncio, com títulos distintos."
                onClick={() => setAdKind("composite")}
              />
            </div>

            <p className="mb-4 text-xs text-muted-foreground">
              Preço mín: {formatBrl(MIN_PRICE_CENTS)}
              {adKind === "composite" ? " · Máx. 30 ofertas · Título: 3–80 caracteres" : null}
            </p>

            {adKind === "simple" ? (
              <div className="space-y-4 rounded-2xl border border-border/50 bg-muted/10 p-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <Field>
                    <FieldLabel>Preço</FieldLabel>
                    <Input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="h-11 rounded-xl"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Entrega</FieldLabel>
                    <DeliveryToggle value={delivery} onChange={setDelivery} />
                  </Field>
                </div>
                {delivery === "manual" ? (
                  <Field>
                    <FieldLabel>Estoque</FieldLabel>
                    <Input
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      inputMode="numeric"
                      className="h-11 max-w-[8rem] rounded-xl"
                    />
                  </Field>
                ) : (
                  <Field>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <FieldLabel>Estoque do item</FieldLabel>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {countAutoLines(autoStock)} / 50000
                      </span>
                    </div>
                    <Textarea
                      value={autoStock}
                      onChange={(e) => setAutoStock(e.target.value)}
                      placeholder="Um código, login ou chave por linha"
                      className="min-h-32 rounded-xl font-mono text-sm"
                    />
                    <FieldDescription>
                      Entrega automática chega em breve — por enquanto usamos a
                      quantidade de linhas como estoque.
                    </FieldDescription>
                  </Field>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer, index) => (
                  <div
                    key={offer.id}
                    className="space-y-4 rounded-2xl border border-border/50 bg-muted/10 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-heading text-sm font-semibold">
                        Oferta {index + 1}
                      </p>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={offer.active}
                            onChange={(e) =>
                              setOffers((prev) =>
                                prev.map((o) =>
                                  o.id === offer.id
                                    ? { ...o, active: e.target.checked }
                                    : o,
                                ),
                              )
                            }
                            className="size-3.5 accent-[hsl(var(--primary))]"
                          />
                          Ativa
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={offers.length <= 2}
                          onClick={() =>
                            setOffers((prev) =>
                              prev.filter((o) => o.id !== offer.id),
                            )
                          }
                          aria-label="Remover oferta"
                        >
                          <Trash2Icon className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                      <Field>
                        <div className="mb-1.5 flex justify-between gap-2">
                          <FieldLabel>Título</FieldLabel>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {offer.title.length}/{MAX_TITLE}
                          </span>
                        </div>
                        <Input
                          value={offer.title}
                          onChange={(e) =>
                            setOffers((prev) =>
                              prev.map((o) =>
                                o.id === offer.id
                                  ? {
                                    ...o,
                                    title: e.target.value.slice(0, MAX_TITLE),
                                  }
                                  : o,
                              ),
                            )
                          }
                          placeholder="Ex: Plano básico"
                          className="h-11 rounded-xl"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Preço</FieldLabel>
                        <Input
                          value={offer.price}
                          onChange={(e) =>
                            setOffers((prev) =>
                              prev.map((o) =>
                                o.id === offer.id
                                  ? { ...o, price: e.target.value }
                                  : o,
                              ),
                            )
                          }
                          placeholder="0,00"
                          inputMode="decimal"
                          className="h-11 rounded-xl"
                        />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel>Entrega</FieldLabel>
                      <DeliveryToggle
                        value={offer.delivery}
                        onChange={(mode) =>
                          setOffers((prev) =>
                            prev.map((o) =>
                              o.id === offer.id ? { ...o, delivery: mode } : o,
                            ),
                          )
                        }
                      />
                    </Field>

                    {offer.delivery === "manual" ? (
                      <Field>
                        <FieldLabel>Estoque</FieldLabel>
                        <Input
                          value={offer.stock}
                          onChange={(e) =>
                            setOffers((prev) =>
                              prev.map((o) =>
                                o.id === offer.id
                                  ? { ...o, stock: e.target.value }
                                  : o,
                              ),
                            )
                          }
                          inputMode="numeric"
                          className="h-11 max-w-[8rem] rounded-xl"
                        />
                      </Field>
                    ) : (
                      <Field>
                        <div className="mb-1.5 flex justify-between gap-2">
                          <FieldLabel>Estoque do item</FieldLabel>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {countAutoLines(offer.autoStock)} / 50000
                          </span>
                        </div>
                        <Textarea
                          value={offer.autoStock}
                          onChange={(e) =>
                            setOffers((prev) =>
                              prev.map((o) =>
                                o.id === offer.id
                                  ? { ...o, autoStock: e.target.value }
                                  : o,
                              ),
                            )
                          }
                          placeholder="Um código, login ou chave por linha"
                          className="min-h-28 rounded-xl font-mono text-sm"
                        />
                      </Field>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <StepFooter
            error={error}
            onBack={() => goTo("product")}
            onNext={advanceFromOffers}
            nextLabel="Avançar"
          />
        </section>
      ) : null}

      {step === "images" ? (
        <section className="space-y-6">
          <Panel>
            <PanelTitle>Imagens</PanelTitle>
            <p className="mb-4 text-sm text-muted-foreground">
              Adicione até {MAX_MEDIA} imagens e escolha qual será a capa do
              anúncio.
            </p>

            <div className="flex flex-wrap gap-3">
              {images.map((img) => {
                const isCover = coverId === img.id;
                return (
                  <div key={img.id} className="w-[7.5rem] space-y-2">
                    <button
                      type="button"
                      onClick={() => setCoverId(img.id)}
                      className={cn(
                        "relative aspect-video w-full overflow-hidden rounded-xl border-2 bg-muted transition-colors",
                        isCover
                          ? "border-primary"
                          : "border-transparent ring-1 ring-border/60",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.previewUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    </button>
                    <div className="flex items-center justify-between gap-1 px-0.5">
                      <button
                        type="button"
                        onClick={() => setCoverId(img.id)}
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-medium",
                          isCover ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        <StarIcon
                          className="size-3"
                          fill={isCover ? "currentColor" : "none"}
                        />
                        {isCover ? "Capa" : "Usar capa"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="text-destructive"
                        aria-label="Remover"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {images.length < MAX_MEDIA ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-video w-[7.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border/80 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  <ImagePlusIcon className="size-5" />
                  <span className="text-xs font-medium">Adicionar</span>
                </button>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />

            <p className="mt-4 text-xs text-muted-foreground">
              {images.length}/{MAX_MEDIA} imagens · Máximo de 10 MB por arquivo ·
              Proporção recomendada 16:9
            </p>
          </Panel>

          <StepFooter
            error={error}
            onBack={() => goTo("offers")}
            onNext={() => goTo("review")}
            nextLabel="Avançar"
          />
        </section>
      ) : null}

      {step === "review" ? (
        <section className="space-y-6">
          <Panel>
            <PanelTitle>Revisar</PanelTitle>
            <p className="mb-5 text-sm text-muted-foreground">
              Confira os dados antes de publicar no Elloot.
            </p>

            <div className="space-y-3">
              <SummaryRow label="Título" value={title.trim()} />
              <SummaryRow label="Categoria" value={categoryBreadcrumb || "—"} />
              <SummaryRow
                label="Tipo"
                value={
                  PRODUCT_TYPES.find((t) => t.value === productType)?.label ??
                  "—"
                }
              />
              <SummaryRow
                label="Alcance"
                value={REACH_PLANS.find((p) => p.id === reach)?.title ?? "—"}
              />
              <SummaryRow
                label="Modelo"
                value={
                  adKind === "simple" ? "Anúncio simples" : "Anúncio composto"
                }
              />
              {adKind === "simple" ? (
                <>
                  <SummaryRow
                    label="Preço"
                    value={
                      parsePriceToCents(price) != null
                        ? formatBrl(parsePriceToCents(price)!)
                        : "—"
                    }
                  />
                  <SummaryRow
                    label="Entrega"
                    value={delivery === "manual" ? "Manual" : "Automática"}
                  />
                  <SummaryRow
                    label="Estoque"
                    value={
                      delivery === "auto"
                        ? String(countAutoLines(autoStock))
                        : stock
                    }
                  />
                </>
              ) : (
                <SummaryRow
                  label="Ofertas"
                  value={offers
                    .filter((o) => o.active)
                    .map(
                      (o) =>
                        `${o.title.trim()} (${formatBrl(parsePriceToCents(o.price) ?? 0)})`,
                    )
                    .join(" · ")}
                />
              )}
              <SummaryRow
                label="Imagens"
                value={`${images.length} · capa definida`}
              />
            </div>

            <div className="mt-5 space-y-1.5 border-t border-border/50 pt-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Descrição
              </p>
              <p className="text-sm whitespace-pre-wrap text-pretty">
                {description.trim()}
              </p>
            </div>
          </Panel>

          <StepFooter
            error={error}
            onBack={() => goTo("images")}
            onNext={() => void submitListing()}
            nextLabel={pending ? "Publicando…" : "Publicar anúncio"}
            nextDisabled={pending}
            nextPending={pending}
          />
        </section>
      ) : null}
    </Container>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-6">
      {children}
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-lg font-semibold tracking-tight">
      {children}
    </h2>
  );
}

function PanelDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function KindCard({ selected, icon, title, description, onClick, }: { selected: boolean; icon: React.ReactNode; title: string; description: string; onClick: () => void; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors",
        selected
          ? "border-primary/50 bg-primary/10"
          : "border-border/60 bg-muted/10 hover:bg-muted/25",
      )}
    >
      <span className={selected ? "text-primary" : "text-muted-foreground"}>
        {icon}
      </span>
      <span className="font-heading text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground text-pretty">
        {description}
      </span>
    </button>
  );
}

function DeliveryToggle({ value, onChange, }: { value: DeliveryMode; onChange: (v: DeliveryMode) => void; }) {
  return (
    <div className="inline-flex h-11 rounded-full border border-border/60 bg-muted/20 p-1">
      {(["manual", "auto"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "rounded-full px-4 text-sm font-medium transition-colors",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {mode === "manual" ? "Manual" : "Auto"}
        </button>
      ))}
    </div>
  );
}

function StepFooter({ error, onBack, onBackHref, backLabel = "Voltar", onNext, nextLabel, nextDisabled, nextPending, }: { error: string | null; onBack?: () => void; onBackHref?: string; backLabel?: string; onNext: () => void; nextLabel: string; nextDisabled?: boolean; nextPending?: boolean; }) {
  return (
    <div className="space-y-3">
      {error ? (
        <FieldError className="block" role="alert">
          {error}
        </FieldError>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        {onBackHref ? (
          <Link
            href={onBackHref}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {backLabel}
          </Link>
        ) : (
          <Button type="button" variant="ghost" onClick={onBack}>
            {backLabel}
          </Button>
        )}
        <Button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="min-w-28"
        >
          {nextPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {nextLabel}
            </>
          ) : (
            nextLabel
          )}
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="max-w-[70%] text-sm font-medium text-right text-pretty">
        {value}
      </span>
    </div>
  );
}
