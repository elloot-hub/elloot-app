"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { CheckIcon, ChevronRightIcon, ImagePlusIcon, LayersIcon, Loader2Icon, PackageIcon, PlusCircle, StarIcon, Trash2Icon, XIcon, } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel, } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { useAuth } from "@/features/auth/context";
import {
  fetchListingCategories,
  fetchProductTypes,
  type ProductTypeOption,
} from "@/features/catalog/api";
import { createListing } from "@/features/listings/api";
import { SellStepper, type SellStepId, } from "@/features/listings/components/sell-stepper";
import { uploadMedia } from "@/features/media/api";
import { ApiError } from "@/lib/api/errors";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Category, ListingProductType } from "@/types/api";

const MAX_MEDIA = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TITLE = 80;
const MAX_DESC = 5000;
const MIN_PRICE_CENTS = 150;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const LEVEL_LABELS = [
  "Categoria",
  "Categoria principal",
  "Subcategoria",
];

const LEVEL_DESCRIPTIONS = [
  "Escolha o segmento do anúncio: jogos, assinaturas, redes sociais, IA e afins.",
  "Selecione o jogo, plataforma ou produto específico dentro da categoria.",
  "Classifique o anúncio (contas, itens, diamantes, serviços…). Isso já define o tipo.",
];

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function inferProductType(
  category: Category | null,
): ListingProductType | null {
  if (!category) return null;
  const key = normalizeKey(`${category.slug} ${category.name}`);

  if (key.includes("conta") || key.includes("account") || key.includes("login")) {
    return "CONTA";
  }
  if (
    key.includes("gold") ||
    key.includes("diamante") ||
    key.includes("moeda") ||
    key.includes("coin") ||
    key.includes("robux") ||
    key.includes("v-buck") ||
    key.includes("vbuck") ||
    key.includes("crystal") ||
    key.includes("gems") ||
    key.includes("gemas") ||
    /(^|[^a-z])uc([^a-z]|$)/.test(key) ||
    key.includes("riot point") ||
    key.includes("cp ") ||
    key.includes("cash")
  ) {
    return "GOLD";
  }
  if (
    key.includes("servico") ||
    key.includes("boost") ||
    key.includes("coaching") ||
    key.includes("elo") ||
    key.includes("farm") ||
    key.includes("ranking")
  ) {
    return "SERVICO";
  }
  if (
    key.includes("item") ||
    key.includes("skin") ||
    key.includes("chave") ||
    key.includes("key") ||
    key.includes("gift") ||
    key.includes("passe")
  ) {
    return "ITEM";
  }
  if (key === "outros" || key.endsWith(" outros") || key.includes("/outros")) {
    return "OUTROS";
  }
  return null;
}

const REACH_PLANS = [
  {
    id: "min" as const,
    title: "Alcance mínimo",
    fee: "6% por venda",
    description: "Aparece nas listagens padrão da categoria.",
  },
  {
    id: "max" as const,
    title: "Alcance máximo",
    fee: "12% por venda",
    description: "Prioridade no ranking e destaque visual.",
    recommended: true,
  },
  {
    id: "mid" as const,
    title: "Alcance médio",
    fee: "8% por venda",
    description: "Mais relevância em buscas e filtros.",
  },
];

type ReachId = (typeof REACH_PLANS)[number]["id"];
type DeliveryMode = "manual" | "auto";
type AdKind = "simple" | "dynamic";

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
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const cents = Number(digits);
  if (!Number.isInteger(cents) || cents < MIN_PRICE_CENTS || cents > 50_000_000) {
    return null;
  }
  return cents;
}

function formatPriceMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 10);
  if (!digits) return "";
  const cents = Number(digits);
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function PriceInput({
  value,
  onChange,
  id,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}) {
  const cents = value ? Number(value.replace(/\D/g, "")) || 0 : 0;
  const belowMin = value.length > 0 && cents < MIN_PRICE_CENTS;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className={cn(
          "flex h-11 items-center overflow-hidden rounded-md border bg-transparent transition-colors",
          "border-input dark:bg-input/30",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          belowMin && "border-destructive/60",
        )}
      >
        <span className="shrink-0 pl-3 text-sm text-muted-foreground select-none">
          R$
        </span>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(formatPriceMask(e.target.value))}
          placeholder="0,00"
          inputMode="numeric"
          aria-invalid={belowMin || undefined}
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground tabular-nums"
        />
      </div>
      {belowMin ? (
        <p className="text-xs text-destructive">
          Mínimo {formatBrl(MIN_PRICE_CENTS)}
        </p>
      ) : null}
    </div>
  );
}

/** Remove linhas vazias; mantém no máx. um \\n final para digitar a próxima unidade. */
function sanitizeAutoStock(raw: string): string {
  const endsWithBreak = /\n$/.test(raw);
  const filled = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (filled.length === 0) return "";
  return endsWithBreak ? `${filled.join("\n")}\n` : filled.join("\n");
}

function NumberedStockTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const lineCount = Math.max(value.split("\n").length, 1);
  const gutterRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  function syncScroll() {
    if (gutterRef.current && areaRef.current) {
      gutterRef.current.scrollTop = areaRef.current.scrollTop;
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter") return;
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value: raw } = el;
    if (selectionStart !== selectionEnd) return;

    const lineStart = raw.lastIndexOf("\n", selectionStart - 1) + 1;
    const lineEndIdx = raw.indexOf("\n", selectionStart);
    const lineEnd = lineEndIdx === -1 ? raw.length : lineEndIdx;
    const currentLine = raw.slice(lineStart, lineEnd);

    if (!currentLine.trim()) {
      e.preventDefault();
    }
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange(sanitizeAutoStock(e.target.value));
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const el = e.currentTarget;
    const pasted = e.clipboardData.getData("text");
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = sanitizeAutoStock(
      el.value.slice(0, start) + pasted + el.value.slice(end),
    );
    onChange(next);
  }

  return (
    <div className="flex max-h-48 min-h-36 overflow-hidden rounded-md border border-input dark:bg-input/30">
      <div
        ref={gutterRef}
        aria-hidden
        className="shrink-0 overflow-hidden border-r border-border/60 bg-muted/20 py-2.5 pr-2 pl-3 text-right font-mono text-xs leading-6 text-muted-foreground select-none"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="h-6">
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={areaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="min-h-36 max-h-48 w-full flex-1 resize-none overflow-y-auto bg-transparent py-2.5 pr-3 pl-2 font-mono text-sm leading-6 outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

function findNode(nodes: Category[], id: string): Category | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findNode(node.children ?? [], id);
    if (nested) return nested;
  }
  return null;
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
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([]);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTreeLoading(true);
    void Promise.all([
      fetchListingCategories({ children: true }),
      fetchProductTypes(),
    ])
      .then(([cats, types]) => {
        if (cancelled) return;
        setTree(cats.categories);
        setProductTypes(types.productTypes);
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

  const categoryCrumbs = useMemo(
    () =>
      categoryPath
        .map((id) => {
          const node = findNode(tree, id);
          if (!node) return null;
          return {
            id: node.id,
            name: node.name,
            iconUrl: node.iconUrl || node.imageUrl,
          };
        })
        .filter(
          (c): c is { id: string; name: string; iconUrl: string | null } =>
            Boolean(c),
        ),
    [categoryPath, tree],
  );

  const cascadeLevels = useMemo(() => {
    // Unlock: só o 1º select no início; os próximos aparecem após cada escolha.
    const levels: Array<{
      level: number;
      label: string;
      options: Category[];
    }> = [];

    // 1) Categoria (Jogos, Redes Sociais, IA, Assinaturas…)
    levels.push({
      level: 0,
      label: LEVEL_LABELS[0]!,
      options: tree,
    });

    if (!categoryPath[0]) return levels;

    const l1 = findNode(tree, categoryPath[0]);
    const l2Options = l1?.children ?? [];
    if (!l2Options.length) return levels;

    // 2) Categoria principal (Free Fire, Instagram…)
    levels.push({
      level: 1,
      label: LEVEL_LABELS[1]!,
      options: l2Options,
    });

    if (!categoryPath[1]) return levels;

    const l2 = findNode(tree, categoryPath[1]);
    const l3Options = l2?.children ?? [];
    if (!l3Options.length) return levels;

    // 3) Subcategoria (Contas, Diamantes…)
    levels.push({
      level: 2,
      label: LEVEL_LABELS[2]!,
      options: l3Options,
    });

    return levels;
  }, [tree, categoryPath]);

  const selectedCategory = useMemo(
    () => (selectedCategoryId ? findNode(tree, selectedCategoryId) : null),
    [tree, selectedCategoryId],
  );

  const categoryIsLeaf = Boolean(
    selectedCategoryId &&
    selectedCategory &&
    !(selectedCategory.children?.length),
  );

  const inferredProductType = useMemo(
    () => (categoryIsLeaf ? inferProductType(selectedCategory) : null),
    [categoryIsLeaf, selectedCategory],
  );

  const needsProductTypePick = categoryIsLeaf && !inferredProductType;

  useEffect(() => {
    if (!categoryIsLeaf) {
      setProductType("");
      return;
    }
    if (inferredProductType) {
      setProductType(inferredProductType);
      return;
    }
    setProductType("");
  }, [categoryIsLeaf, inferredProductType, selectedCategoryId]);

  const priceCents = parsePriceToCents(price);

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
    if (!categoryIsLeaf) {
      return "Continue selecionando até a última subcategoria.";
    }
    if (!productType && !inferredProductType) {
      return "Selecione o que você está vendendo.";
    }
    return null;
  }

  function offerStockQty(offer: OfferDraft) {
    if (offer.delivery === "auto") {
      return Math.max(0, countAutoLines(offer.autoStock));
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
        return offer.delivery === "auto"
          ? `Oferta ${i + 1}: cole pelo menos um código/chave por linha.`
          : `Oferta ${i + 1}: estoque inválido.`;
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
        err = "Cada imagem deve ter no máximo 5 MB.";
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
      const mediaAssetIds: string[] = [];
      for (const img of ordered) {
        const { asset } = await uploadMedia({
          file: img.file,
          purpose: "LISTING",
          visibility: "PUBLIC",
        });
        mediaAssetIds.push(asset.id);
      }

      const listingModel = adKind === "dynamic" ? "DYNAMIC" : "NORMAL";
      const result = await createListing({
        categoryId: selectedCategoryId,
        title: title.trim(),
        description: description.trim(),
        listingModel,
        productType: productType || null,
        deliveryMode:
          adKind === "simple"
            ? delivery === "auto"
              ? "AUTO"
              : "MANUAL"
            : undefined,
        stockQuantity:
          adKind === "simple"
            ? delivery === "auto"
              ? countAutoLines(autoStock)
              : Number(stock) || 1
            : 1,
        priceCents:
          adKind === "simple" ? parsePriceToCents(price)! : undefined,
        offers:
          adKind === "dynamic"
            ? offers
              .filter((o) => o.active)
              .map((o) => ({
                title: o.title.trim(),
                priceCents: parsePriceToCents(o.price)!,
                stockQuantity: offerStockQty(o),
                deliveryMode: o.delivery === "auto" ? "AUTO" : "MANUAL",
              }))
            : undefined,
        mediaAssetIds,
        publish: true,
      });

      await setSession();

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
                {cascadeLevels.map(({ level, label, options }) => (
                  <Field key={level}>
                    <FieldLabel>{label}</FieldLabel>
                    <SearchableSelect
                      value={categoryPath[level] || undefined}
                      onValueChange={(v) => {
                        setPathLevel(level, v);
                        setProductType("");
                      }}
                      disabled={treeLoading}
                      placeholder={
                        treeLoading
                          ? "Carregando…"
                          : `Selecione ${label.toLowerCase()}`
                      }
                      searchPlaceholder={`Buscar ${label.toLowerCase()}…`}
                      options={options.map((c) => ({
                        value: c.id,
                        label: c.name,
                        iconUrl: c.iconUrl || c.imageUrl,
                      }))}
                    />
                    <FieldDescription>
                      {LEVEL_DESCRIPTIONS[level]}
                    </FieldDescription>
                  </Field>
                ))}

                {needsProductTypePick ? (
                  <Field>
                    <FieldLabel>O que você está vendendo?</FieldLabel>
                    <SearchableSelect
                      value={productType || undefined}
                      onValueChange={(v) =>
                        setProductType((v as ListingProductType) ?? "")
                      }
                      placeholder="Selecione"
                      searchPlaceholder="Buscar tipo…"
                      searchThreshold={6}
                      options={productTypes.map((t) => ({
                        value: t.value,
                        label: t.label,
                      }))}
                      emptyText={
                        productTypes.length
                          ? "Nenhum tipo encontrado."
                          : "Tipos indisponíveis — confira a API."
                      }
                    />
                    <FieldDescription>
                      Esta subcategoria é genérica — escolha o tipo para
                      ajudar os compradores a encontrar o anúncio.
                    </FieldDescription>
                  </Field>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Visibilidade do seu anúncio</PanelTitle>
            <PanelDescription>
              Escolha o alcance. As taxas entram no algoritmo de destaque —
              você pode ajustar isso depois.
            </PanelDescription>
            <div className="grid gap-3 pt-4 sm:grid-cols-3">
              {REACH_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setReach(plan.id)}
                  className={cn(
                    "relative flex flex-col cursor-pointer gap-2 rounded-md border p-4 text-left transition-colors",
                    reach === plan.id
                      ? "border-primary/50 bg-primary/10 shadow-[0_0_0_1px_hsl(217_91%_54%/0.25)]"
                      : "border-border/60 bg-muted/15 hover:bg-muted/30",
                  )}
                >
                  {plan.recommended ? (
                    <span className="absolute -top-2 -right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <PanelTitle>Ofertas</PanelTitle>
                <PanelDescription>
                  Defina preço e entrega. Adicione variações só se forem
                  realmente diferentes.
                </PanelDescription>
              </div>
              {adKind === "dynamic" ? (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() =>
                    setOffers((prev) =>
                      prev.length >= 30 ? prev : [...prev, newOffer()],
                    )
                  }
                >
                  <PlusCircle className="size-4" />
                  Adicionar
                </Button>
              ) : null}
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row gap-2 border border-border/60 rounded-md p-1">
                <KindCard
                  selected={adKind === "simple"}
                  icon={<PackageIcon className="size-5" />}
                  title="Anúncio simples"
                  description="Apenas um item, ideal para produtos sem variações."
                  onClick={() => setAdKind("simple")}
                />
                <KindCard
                  selected={adKind === "dynamic"}
                  icon={<LayersIcon className="size-5" />}
                  title="Anúncio Dinâmico"
                  description="Múltiplos itens no mesmo anúncio, com títulos distintos."
                  onClick={() => setAdKind("dynamic")}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Preço mín: {formatBrl(MIN_PRICE_CENTS)}
                {adKind === "dynamic"
                  ? " · Máx. 30 ofertas · Título: 3–80 caracteres"
                  : null}
              </p>

              {adKind === "simple" ? (
                <div className="space-y-4 rounded-md border border-border/60 p-4">
                  <div
                    className={cn(
                      "grid gap-4",
                      delivery === "manual"
                        ? "sm:grid-cols-[minmax(0,1fr)_7rem]"
                        : "sm:grid-cols-1",
                    )}
                  >
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <FieldLabel>Preço</FieldLabel>
                      <PriceInput value={price} onChange={setPrice} />
                    </div>
                    {delivery === "manual" ? (
                      <div className="flex flex-col gap-1.5">
                        <FieldLabel>Estoque</FieldLabel>
                        <Input
                          value={stock}
                          onChange={(e) =>
                            setStock(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                          placeholder="1"
                          inputMode="numeric"
                          className="h-11 rounded-md tabular-nums"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Entrega</FieldLabel>
                    <DeliveryToggle value={delivery} onChange={setDelivery} />
                  </div>

                  {delivery === "auto" ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <FieldLabel>Estoque do item</FieldLabel>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {countAutoLines(autoStock)} unidade
                          {countAutoLines(autoStock) === 1 ? "" : "s"}
                        </span>
                      </div>
                      <NumberedStockTextarea
                        value={autoStock}
                        onChange={setAutoStock}
                        placeholder="Digite uma chave ou login por linha"
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer, index) => (
                    <div
                      key={offer.id}
                      className="space-y-4 rounded-md border border-border/60 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="pt-2 text-sm font-semibold">
                          Oferta {index + 1}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <OfferActiveToggle
                            active={offer.active}
                            onChange={(next) =>
                              setOffers((prev) =>
                                prev.map((o) =>
                                  o.id === offer.id
                                    ? { ...o, active: next }
                                    : o,
                                ),
                              )
                            }
                          />
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

                      <div
                        className={cn(
                          "grid gap-4",
                          offer.delivery === "manual"
                            ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_7rem]"
                            : "sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]",
                        )}
                      >
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
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
                                      title: e.target.value.slice(
                                        0,
                                        MAX_TITLE,
                                      ),
                                    }
                                    : o,
                                ),
                              )
                            }
                            placeholder="Ex: Plano básico"
                            className="h-11 rounded-md"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <FieldLabel>Preço</FieldLabel>
                          <PriceInput
                            value={offer.price}
                            onChange={(next) =>
                              setOffers((prev) =>
                                prev.map((o) =>
                                  o.id === offer.id
                                    ? { ...o, price: next }
                                    : o,
                                ),
                              )
                            }
                          />
                        </div>
                        {offer.delivery === "manual" ? (
                          <div className="flex flex-col gap-1.5">
                            <FieldLabel>Estoque</FieldLabel>
                            <Input
                              value={offer.stock}
                              onChange={(e) =>
                                setOffers((prev) =>
                                  prev.map((o) =>
                                    o.id === offer.id
                                      ? {
                                        ...o,
                                        stock: e.target.value
                                          .replace(/\D/g, "")
                                          .slice(0, 6),
                                      }
                                      : o,
                                  ),
                                )
                              }
                              placeholder="1"
                              inputMode="numeric"
                              className="h-11 rounded-md tabular-nums"
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <FieldLabel>Entrega</FieldLabel>
                        <DeliveryToggle
                          value={offer.delivery}
                          onChange={(mode) =>
                            setOffers((prev) =>
                              prev.map((o) =>
                                o.id === offer.id
                                  ? { ...o, delivery: mode }
                                  : o,
                              ),
                            )
                          }
                        />
                      </div>

                      {offer.delivery === "auto" ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <FieldLabel>Estoque do item</FieldLabel>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {countAutoLines(offer.autoStock)} unidade
                              {countAutoLines(offer.autoStock) === 1
                                ? ""
                                : "s"}
                            </span>
                          </div>
                          <NumberedStockTextarea
                            value={offer.autoStock}
                            onChange={(next) =>
                              setOffers((prev) =>
                                prev.map((o) =>
                                  o.id === offer.id
                                    ? { ...o, autoStock: next }
                                    : o,
                                ),
                              )
                            }
                            placeholder="Digite uma chave ou login por linha"
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <PanelDescription>
              Adicione até {MAX_MEDIA} imagens (JPEG, PNG ou WebP, máx. 5 MB
              cada) e escolha qual será a capa do anúncio.
            </PanelDescription>

            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-3">
                {images.map((img) => {
                  const isCover = coverId === img.id;
                  return (
                    <div key={img.id} className="w-[7.5rem] space-y-2">
                      <button
                        type="button"
                        onClick={() => setCoverId(img.id)}
                        className={cn(
                          "relative aspect-video w-full overflow-hidden rounded-md border-2 bg-muted transition-colors",
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
                    className="flex aspect-video w-[7.5rem] flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/80 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
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

              <FieldDescription>
                {images.length}/{MAX_MEDIA} imagens · Máximo de 5 MB por arquivo
                · Proporção recomendada 16:9
              </FieldDescription>
            </div>
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
            <PanelDescription>
              Confira os dados antes de publicar no Elloot.
            </PanelDescription>

            <div className="space-y-4 pt-4">
              <div className="space-y-3">
                <SummaryRow label="Título" value={title.trim()} />
                <SummaryRow
                  label="Categoria"
                  value={categoryBreadcrumb || "—"}
                />
                {needsProductTypePick ? (
                  <SummaryRow
                    label="Tipo"
                    value={
                      productTypes.find((t) => t.value === productType)
                        ?.label ?? "—"
                    }
                  />
                ) : null}
                <SummaryRow
                  label="Alcance"
                  value={
                    REACH_PLANS.find((p) => p.id === reach)?.title ?? "—"
                  }
                />
                <SummaryRow
                  label="Modelo"
                  value={
                    adKind === "simple"
                      ? "Anúncio simples"
                      : "Anúncio composto"
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
                      value={
                        delivery === "manual" ? "Manual" : "Automática"
                      }
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
                          `${o.title.trim()} (${formatBrl(parsePriceToCents(o.price) ?? 0)}) · ${o.delivery === "auto" ? "Auto" : "Manual"}`,
                      )
                      .join(" · ")}
                  />
                )}
                <SummaryRow
                  label="Imagens"
                  value={
                    images.length === 0
                      ? "Nenhuma"
                      : `${images.length} · capa definida`
                  }
                />
              </div>

              <div className="space-y-1.5 border-t border-border/50 pt-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Descrição
                </p>
                <p className="text-sm whitespace-pre-wrap text-pretty">
                  {description.trim()}
                </p>
              </div>
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
    <div className="rounded-lg border border-border bg-background p-6">
      {children}
    </div>
  );
};

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold tracking-tight">
      {children}
    </h2>
  );
};

function PanelDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground">
      {children}
    </p>
  );
};

function KindCard({ selected, icon, title, description, onClick, }: { selected: boolean; icon: React.ReactNode; title: string; description: string; onClick: () => void; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 cursor-pointer flex-row items-center gap-3 rounded-md border p-4 text-left transition-colors",
        selected
          ? "bg-primary/10"
          : "border-border/60 bg-muted/15 hover:bg-muted/30",
      )}
    >
      <span className={selected ? "text-primary" : "text-muted-foreground"}>
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground text-pretty">
          {description}
        </span>
      </div>
    </button>
  );
}

function OfferActiveToggle({ active, onChange, }: { active: boolean; onChange: (next: boolean) => void; }) {
  return (
    <Toggle
      pressed={active}
      onPressedChange={onChange}
      className="rounded-sm cursor-pointer"
    >
      {/* <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-sm transition-colors",
          active
            ? "bg-primary text-white"
            : "bg-muted/80 text-muted-foreground/60",
        )}
      >
        {active ? (
          <CheckIcon className="size-4" />
        ) : (
          <XIcon className="size-4" />
        )}
      </span> */}
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm leading-snug">
          <span className="font-medium text-foreground">Oferta</span>{" "}
          <span
            className={cn(
              "font-medium",
              active ? "text-primary" : "text-primary/50",
            )}
          >
            ( {active ? "on" : "off"} )
          </span>
        </span>
      </span>
    </Toggle>
  );
}

function DeliveryToggle({
  value,
  onChange,
}: {
  value: DeliveryMode;
  onChange: (v: DeliveryMode) => void;
}) {
  const options = [
    {
      mode: "manual" as const,
      title: "Manual",
      description: "Você entrega manualmente após a compra.",
    },
    {
      mode: "auto" as const,
      title: "Automática",
      description: "Entrega automática com códigos ou chaves.",
    },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map(({ mode, title, description }) => {
        const active = value === mode;
        return (
          <Toggle
            key={mode}
            variant="card"
            size="card"
            pressed={active}
            onPressedChange={(pressed) => {
              if (pressed) onChange(mode);
            }}
            aria-label={`${title}: ${active ? "ativado" : "desativado"}`}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-sm transition-colors",
                active
                  ? "bg-primary text-white"
                  : "bg-muted/80 text-muted-foreground/60",
              )}
            >
              {active ? (
                <CheckIcon className="size-5" strokeWidth={2.5} />
              ) : (
                <XIcon className="size-5" strokeWidth={2.5} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-snug">
                <span className="font-semibold text-foreground">Entrega {title}</span>{" "}
                <span
                  className={cn(
                    "font-medium",
                    active ? "text-primary" : "text-primary/50",
                  )}
                >
                  ( {active ? "Ativado" : "Desativado"} )
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground text-pretty">
                {description}
              </span>
            </span>
          </Toggle>
        );
      })}
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
      <div className="flex flex-row items-center justify-between gap-3">
        {onBackHref ? (
          <Link
            href={onBackHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "flex-1",
            )}
          >
            {backLabel}
          </Link>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onBack}
            className="flex-1"
          >
            {backLabel}
          </Button>
        )}
        <Button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          size="lg"
          className="min-w-28 flex-1"
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
};