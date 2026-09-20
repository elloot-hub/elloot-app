"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  NumberedStockTextarea,
  countAutoLines,
  parseAutoStockLines,
} from "@/features/listings/components/numbered-stock-textarea";
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, GripVerticalIcon, ImagePlusIcon, InfoIcon, LayersIcon, Loader2Icon, ArrowDownIcon, ArrowUpIcon, PackageIcon, PlusCircle, StarIcon, Trash2Icon, XIcon, } from "lucide-react";
import { SellFormSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

import { Container } from "@/components/layout/container";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel, } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { DescriptionFormatHint } from "@/features/listings/components/description-format-hint";
import { useAuth } from "@/features/auth/context";
import { fetchListingCategories, fetchProductTypes, fetchReachPlans, type ProductTypeOption, type ReachPlanOption, } from "@/features/catalog/api";
import { fetchPublicCommercial } from "@/features/platform/api";
import { createListing, fetchListing, reorderListingOffers, updateListing } from "@/features/listings/api";
import { ListingVisibilityPanel } from "@/features/visibility/components/listing-visibility-panel";
import { SellStepper, type SellStepId, } from "@/features/listings/components/sell-stepper";
import {
  SellReviewPanel,
  hasBlockingReviewIssues,
  computeReviewChecklist,
} from "@/features/listings/components/sell-review-panel";
import {
  computeEditModerationChanges,
  type EditBaseline,
} from "@/features/listings/components/sell-review-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { uploadMedia } from "@/features/media/api";
import { ApiError } from "@/lib/api/errors";
import { routes } from "@/lib/routes";
import { listingRouteRef } from "@/lib/public-codes";
import { cn } from "@/lib/utils";
import type { Category, ListingDetail, ListingProductType } from "@/types/api";

const MAX_MEDIA = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TITLE = 80;
const MAX_DESC = 5000;
const DEFAULT_MIN_PRICE_CENTS = 150;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const LEVEL_LABELS = [
  "Categoria",
  "Categoria principal",
  "Subcategoria",
];

const LEVEL_DESCRIPTIONS = [
  "Escolha o segmento do anúncio: jogos, assinaturas, redes sociais, IA e afins.",
  "Selecione o jogo, plataforma ou produto específico dentro da categoria.",
  "Classifique o anúncio até a folha da árvore. Em seguida escolha o tipo do produto.",
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

const REACH_FALLBACK: ReachPlanOption[] = [];

type DeliveryMode = "manual" | "auto";
type AdKind = "simple" | "dynamic";

type PendingImage = {
  id: string;
  previewUrl: string;
  file?: File;
  existingUrl?: string;
};

type OfferDraft = {
  id: string;
  serverId?: string;
  title: string;
  price: string;
  delivery: DeliveryMode;
  stock: string;
  autoStock: string;
  existingStockQty?: number;
  active: boolean;
};

function parsePriceToCents(raw: string, minListingCents = DEFAULT_MIN_PRICE_CENTS): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const cents = Number(digits);
  if (!Number.isInteger(cents) || cents < minListingCents || cents > 50_000_000) {
    return null;
  }
  return cents;
}

function formatPriceMaskFromCents(cents: number) {
  return formatPriceMask(String(cents));
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

function findCategoryPath(
  nodes: Category[],
  targetId: string,
  path: string[] = [],
): string[] | null {
  for (const node of nodes) {
    const next = [...path, node.id];
    if (node.id === targetId) return next;
    const nested = findCategoryPath(node.children ?? [], targetId, next);
    if (nested) return nested;
  }
  return null;
}

function applyListingToForm(listing: ListingDetail) {
  const isDynamic = listing.listingModel === "DYNAMIC";
  const deliveryMode =
    listing.deliveryMode === "AUTO" ? "auto" : ("manual" as DeliveryMode);

  return {
    title: listing.title,
    description: listing.description,
    productType: (listing.productType ?? "") as ListingProductType | "",
    adKind: isDynamic ? ("dynamic" as AdKind) : ("simple" as AdKind),
    price: isDynamic ? "" : formatPriceMaskFromCents(listing.priceCents),
    delivery: deliveryMode,
    stock: isDynamic ? "1" : String(listing.stockQuantity),
    autoStock: listing.autoStockLines?.join("\n") ?? "",
    existingStockQty: listing.stockQuantity,
    offers:
      isDynamic && listing.offers?.length
        ? listing.offers.map((offer) => ({
          id: crypto.randomUUID(),
          serverId: offer.id,
          title: offer.title,
          price: formatPriceMaskFromCents(offer.priceCents),
          delivery:
            offer.deliveryMode === "AUTO"
              ? ("auto" as DeliveryMode)
              : ("manual" as DeliveryMode),
          stock: String(offer.stockQuantity),
          autoStock: offer.autoStockLines?.join("\n") ?? "",
          existingStockQty: offer.stockQuantity,
          active: true,
        }))
        : [newOffer(), { ...newOffer(), title: "" }],
    images: listing.media.map((media) => ({
      id: media.id,
      previewUrl: media.url,
      existingUrl: media.url,
    })),
    coverId: listing.media[0]?.id ?? null,
    categoryId: listing.category.id,
  };
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
  minCents = DEFAULT_MIN_PRICE_CENTS,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  minCents?: number;
}) {
  const cents = value ? Number(value.replace(/\D/g, "")) || 0 : 0;
  const belowMin = value.length > 0 && cents < minCents;

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
          Mínimo {formatBrl(minCents)}
        </p>
      ) : null}
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

type SellPageContentProps = {
  mode?: "create" | "edit";
  listingId?: string;
};

export function SellPageContent({
  mode = "create",
  listingId,
}: SellPageContentProps = {}) {
  const router = useRouter();
  const { setSession, user } = useAuth();
  const isEdit = mode === "edit" && Boolean(listingId);

  const [step, setStep] = useState<SellStepId>("product");
  const [maxReached, setMaxReached] = useState(isEdit ? 3 : 0);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null,
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  const [productType, setProductType] = useState<ListingProductType | "">("");
  const [reachPlanId, setReachPlanId] = useState<string>("");
  const [reachPlans, setReachPlans] = useState<ReachPlanOption[]>(REACH_FALLBACK);
  const [minListingCents, setMinListingCents] = useState(DEFAULT_MIN_PRICE_CENTS);

  const [adKind, setAdKind] = useState<AdKind>("simple");
  const [price, setPrice] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMode>("manual");
  const [stock, setStock] = useState("1");
  const [autoStock, setAutoStock] = useState("");
  const [offers, setOffers] = useState<OfferDraft[]>([
    newOffer(),
    { ...newOffer(), title: "" },
  ]);
  const [expandedOffers, setExpandedOffers] = useState<Record<string, boolean>>(
    {},
  );

  const defaultOfferExpanded = !isEdit;

  function isOfferExpanded(offerId: string) {
    return expandedOffers[offerId] ?? defaultOfferExpanded;
  }

  function toggleOfferExpanded(offerId: string) {
    setExpandedOffers((prev) => ({
      ...prev,
      [offerId]: !(prev[offerId] ?? defaultOfferExpanded),
    }));
  }

  function addDynamicOffer() {
    const created = newOffer();
    setOffers((prev) => (prev.length >= 30 ? prev : [...prev, created]));
    setExpandedOffers((prev) => ({ ...prev, [created.id]: true }));
  }

  function removeDynamicOffer(offerId: string) {
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    setExpandedOffers((prev) => {
      const next = { ...prev };
      delete next[offerId];
      return next;
    });
  }

  const [dragOfferId, setDragOfferId] = useState<string | null>(null);
  const [offerReorderSaving, setOfferReorderSaving] = useState(false);

  function reorderDynamicOffers(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;

    setOffers((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      if (!item) return prev;
      next.splice(toIndex, 0, item);

      if (isEdit && listingId) {
        const serverIds = next
          .map((offer) => offer.serverId)
          .filter((id): id is string => Boolean(id));
        if (serverIds.length === next.length) {
          setOfferReorderSaving(true);
          void reorderListingOffers(listingId, serverIds)
            .catch(() => {
              setError("Não foi possível salvar a ordem das ofertas.");
            })
            .finally(() => setOfferReorderSaving(false));
        }
      }

      return next;
    });
  }

  const [tree, setTree] = useState<Category[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([]);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editBaseline, setEditBaseline] = useState<EditBaseline | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTreeLoading(true);
    void fetchListingCategories({ children: true })
      .then((cats) => {
        if (cancelled) return;
        setTree(cats.categories);
      })
      .finally(() => {
        if (!cancelled) setTreeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchReachPlans().then((res) => {
      if (cancelled) return;
      const plans = res.items;
      setReachPlans(plans);
      setReachPlanId((prev) => {
        if (prev && plans.some((p) => p.id === prev)) return prev;
        const recommended = plans.find((p) => p.recommended);
        return recommended?.id ?? plans[0]?.id ?? "";
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicCommercial().then((commercial) => {
      if (cancelled) return;
      setMinListingCents(commercial.minListingCents);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit || !listingId) return;
    let cancelled = false;
    setInitialLoading(true);
    setLoadError(null);
    void fetchListing(listingId)
      .then(({ listing }) => {
        if (cancelled) return;
        const form = applyListingToForm(listing);
        setTitle(form.title);
        setDescription(form.description);
        setProductType(form.productType);
        setAdKind(form.adKind);
        setPrice(form.price);
        setDelivery(form.delivery);
        setStock(form.stock);
        setAutoStock(form.autoStock);
        setOffers(form.offers);
        setImages(form.images);
        setCoverId(form.coverId);
        setPendingCategoryId(form.categoryId);
        if (listing.reachPlanId) {
          setReachPlanId(listing.reachPlanId);
        }
        setEditBaseline({
          status: listing.status,
          categoryId: listing.category.id,
          title: listing.title,
          description: listing.description,
          productType: listing.productType,
          delivery: listing.deliveryMode === "AUTO" ? "auto" : "manual",
          mediaUrls: [...listing.media]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((m) => m.url),
          offers: (listing.offers ?? []).map((offer) => ({
            serverId: offer.id,
            title: offer.title,
            delivery: offer.deliveryMode === "AUTO" ? "auto" : "manual",
          })),
        });
        setExpandedOffers(
          Object.fromEntries(form.offers.map((offer) => [offer.id, false])),
        );
        setMaxReached(3);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar o anúncio.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, listingId]);

  useEffect(() => {
    if (!pendingCategoryId || !tree.length) return;
    const path = findCategoryPath(tree, pendingCategoryId);
    if (path) {
      setCategoryPath(path);
      setPendingCategoryId(null);
    }
  }, [pendingCategoryId, tree]);

  useEffect(() => {
    return () => {
      for (const img of images) {
        if (img.file) URL.revokeObjectURL(img.previewUrl);
      }
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

  /** Show picker whenever the leaf has sell types from dashboard/API. */
  const needsProductTypePick = categoryIsLeaf && productTypes.length > 0;

  useEffect(() => {
    if (!categoryIsLeaf || !selectedCategoryId) {
      setProductTypes([]);
      return;
    }
    let cancelled = false;
    void fetchProductTypes({ categoryId: selectedCategoryId }).then((types) => {
      if (cancelled) return;
      const next = types.productTypes;
      setProductTypes(next);
      setProductType((prev) => {
        if (prev && next.some((t) => t.value === prev)) return prev;
        const inferred = inferProductType(selectedCategory);
        if (inferred && next.some((t) => t.value === inferred)) {
          return inferred;
        }
        if (next.length === 1) return next[0]!.value as ListingProductType;
        return prev && !next.length ? prev : "";
      });
    });
    return () => {
      cancelled = true;
    };
  }, [categoryIsLeaf, selectedCategoryId, selectedCategory]);

  const priceCents = parsePriceToCents(price, minListingCents);

  const reviewInput = useMemo(
    () => ({
      title,
      description,
      categoryPath,
      tree,
      categoryIsLeaf,
      productType,
      inferredProductType,
      needsProductTypePick,
      adKind,
      price,
      delivery,
      stock,
      autoStock,
      offers,
      images,
      coverId,
      isEdit,
      editBaseline,
      minListingCents,
      seller: {
        id: user?.id ?? "preview-seller",
        name: user?.name ?? null,
        avatarUrl: user?.avatarUrl ?? null,
      },
    }),
    [
      title,
      description,
      categoryPath,
      tree,
      categoryIsLeaf,
      productType,
      inferredProductType,
      needsProductTypePick,
      adKind,
      price,
      delivery,
      stock,
      autoStock,
      offers,
      images,
      coverId,
      isEdit,
      editBaseline,
      minListingCents,
      user,
    ],
  );

  const reviewBlocking = useMemo(
    () => hasBlockingReviewIssues(computeReviewChecklist(reviewInput)),
    [reviewInput],
  );

  const moderationChanges = useMemo(
    () => computeEditModerationChanges(reviewInput),
    [reviewInput],
  );
  const needsModerationReview = moderationChanges.length > 0;

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
    if (reachPlans.length > 0 && !reachPlanId) {
      return "Selecione o plano de alcance do anúncio.";
    }
    return null;
  }

  function offerStockQty(offer: OfferDraft) {
    if (offer.delivery === "auto") {
      const lines = countAutoLines(offer.autoStock);
      if (lines >= 1) return lines;
      if (offer.existingStockQty && offer.existingStockQty >= 1) {
        return offer.existingStockQty;
      }
      return 0;
    }
    const qty = Number(offer.stock);
    return Number.isInteger(qty) && qty >= 1 ? qty : 0;
  }

  function resolveStockQuantityForSubmit(): number | undefined {
    if (adKind !== "simple") return undefined;
    if (delivery === "auto") {
      const lines = countAutoLines(autoStock);
      if (lines >= 1) return lines;
      return undefined;
    }
    return Number(stock) || 1;
  }

  function validateOffers(): string | null {
    if (adKind === "simple") {
      if (parsePriceToCents(price, minListingCents) == null) {
        return `Informe um preço válido (mín. ${formatBrl(minListingCents)}).`;
      }
      if (delivery === "manual") {
        const qty = Number(stock);
        if (!Number.isInteger(qty) || qty < 1) return "Estoque inválido.";
      } else if (countAutoLines(autoStock) < 1) {
        const hasExistingAutoStock =
          isEdit && Number(stock) >= 1 && delivery === "auto";
        if (!hasExistingAutoStock) {
          return "Cole pelo menos um código/chave por linha para entrega automática.";
        }
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
      if (parsePriceToCents(offer.price, minListingCents) == null) {
        return `Oferta ${i + 1}: preço inválido (mín. ${formatBrl(minListingCents)}).`;
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
      if (target?.file) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((img) => img.id !== id);
      if (coverId === id) setCoverId(next[0]?.id ?? null);
      return next;
    });
  }

  async function buildMediaPayload() {
    const ordered = [...images].sort((a, b) => {
      if (a.id === coverId) return -1;
      if (b.id === coverId) return 1;
      return 0;
    });
    const mediaUrls: string[] = [];
    for (const img of ordered) {
      if (img.file) {
        const { asset } = await uploadMedia({
          file: img.file,
          purpose: "LISTING",
          visibility: "PUBLIC",
        });
        mediaUrls.push(asset.url);
      } else if (img.existingUrl) {
        mediaUrls.push(img.existingUrl);
      }
    }
    return mediaUrls;
  }

  function buildOffersPayload() {
    return offers
      .filter((o) => o.active)
      .map((o) => {
        const payload: {
          id?: string;
          title: string;
          priceCents: number;
          stockQuantity?: number;
          deliveryMode: "MANUAL" | "AUTO";
          autoStockLines?: string[];
        } = {
          title: o.title.trim(),
          priceCents: parsePriceToCents(o.price)!,
          deliveryMode: o.delivery === "auto" ? "AUTO" : "MANUAL",
        };
        if (o.serverId) payload.id = o.serverId;
        if (o.delivery === "auto") {
          payload.autoStockLines = parseAutoStockLines(o.autoStock);
          payload.stockQuantity = payload.autoStockLines.length;
        } else {
          payload.stockQuantity = offerStockQty(o);
        }
        return payload;
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
      const mediaUrls = await buildMediaPayload();
      const listingModel = adKind === "dynamic" ? "DYNAMIC" : "NORMAL";

      if (isEdit && listingId) {
        const stockQty = resolveStockQuantityForSubmit();
        await updateListing(listingId, {
          categoryId: selectedCategoryId,
          title: title.trim(),
          description: description.trim(),
          productType: productType || null,
          ...(reachPlanId ? { reachPlanId } : {}),
          ...(adKind === "simple"
            ? {
              priceCents: parsePriceToCents(price)!,
              deliveryMode: delivery === "auto" ? "AUTO" : "MANUAL",
              ...(delivery === "auto"
                ? { autoStockLines: parseAutoStockLines(autoStock) }
                : stockQty !== undefined
                  ? { stockQuantity: stockQty }
                  : {}),
            }
            : { offers: buildOffersPayload() }),
          ...(isEdit || mediaUrls.length ? { mediaUrls } : {}),
        });

        router.push(routes.dashboardListings);
        return;
      }

      const result = await createListing({
        categoryId: selectedCategoryId,
        title: title.trim(),
        description: description.trim(),
        listingModel,
        productType: productType || null,
        reachPlanId: reachPlanId || undefined,
        deliveryMode:
          adKind === "simple"
            ? delivery === "auto"
              ? "AUTO"
              : "MANUAL"
            : undefined,
        stockQuantity:
          adKind === "simple"
            ? delivery === "auto"
              ? parseAutoStockLines(autoStock).length
              : Number(stock) || 1
            : 1,
        ...(adKind === "simple" && delivery === "auto"
          ? { autoStockLines: parseAutoStockLines(autoStock) }
          : {}),
        priceCents:
          adKind === "simple" ? parsePriceToCents(price)! : undefined,
        offers:
          adKind === "dynamic" ? buildOffersPayload() : undefined,
        mediaUrls,
        publish: true,
      });

      await setSession();

      if (result.moderation?.status === "PENDING_REVIEW") {
        router.push(routes.dashboardListings);
        return;
      }

      router.push(routes.listing(listingRouteRef(result.listing)));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isEdit
            ? "Não foi possível salvar. Tente de novo."
            : "Não foi possível publicar. Tente de novo.",
      );
    } finally {
      setPending(false);
    }
  }

  if (initialLoading) {
    return <SellFormSkeleton />;
  }

  if (loadError) {
    return (
      <Container className="max-w-3xl space-y-4 py-12">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
        <Link
          href={routes.dashboardListings}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Voltar aos anúncios
        </Link>
      </Container>
    );
  }

  return (
    <Container className="max-w-3xl space-y-8 py-8 sm:py-12">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="font-medium sm:text-2xl">
            {isEdit ? "Editar anúncio" : "Criar anúncio"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? "Atualize os dados e salve quando terminar."
              : "Avance por partes e revise tudo antes de publicar."}
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
                  <div className="flex items-center gap-1.5">
                    <FieldLabel>Descrição</FieldLabel>
                    <DescriptionFormatHint />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {description.length} / {MAX_DESC}
                  </span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value.slice(0, MAX_DESC))
                  }
                  placeholder={
                    "## O que você recebe\nDetalhes da entrega, **incluso** e *observações*…"
                  }
                  className="min-h-36 max-h-36 rounded-md font-mono text-[13px] leading-relaxed"
                />
                <FieldDescription>
                  Use **negrito**, *itálico* e ## título. Passe o mouse no ícone
                  ? para ver exemplos.
                </FieldDescription>
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
                      value={(productType || inferredProductType) || undefined}
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
                      Definido pela subcategoria no painel admin. Ajuda os
                      compradores a encontrar o anúncio.
                    </FieldDescription>
                  </Field>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Visibilidade do seu anúncio</PanelTitle>
            <PanelDescription>
              Quanto maior o nível, mais o seu anúncio aparece para compradores.
              Você só paga a porcentagem quando vender — sem taxa fixa.
            </PanelDescription>
            <div className="space-y-4 pt-4">
              {reachPlans.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {reachPlans.map((plan) => (
                    <ReachPlanCard
                      key={plan.id}
                      plan={plan}
                      selected={reachPlanId === plan.id}
                      onSelect={() => setReachPlanId(plan.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-border/60 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                  Nenhum plano de alcance configurado no momento. A taxa padrão
                  da plataforma será aplicada.
                </p>
              )}

              {isEdit && listingId ? (
                <div className="border-t border-border/50 pt-4">
                  <p className="mb-3 text-sm font-medium">Impulsos (destaque)</p>
                  <ListingVisibilityPanel
                    listingId={listingId}
                    listingStatus={editBaseline?.status ?? "DRAFT"}
                    categoryId={
                      editBaseline?.categoryId ??
                      categoryPath[categoryPath.length - 1] ??
                      null
                    }
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Impulsos avulsos (destaque na home) ficam disponíveis depois que
                  o anúncio estiver ativo.
                </p>
              )}
            </div>
          </Panel>

          <StepFooter
            error={error}
            onBackHref={isEdit ? routes.dashboardListings : routes.dashboardListings}
            backLabel={isEdit ? "Cancelar" : "Cancelar"}
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
                  onClick={addDynamicOffer}
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
                  onClick={() => !isEdit && setAdKind("simple")}
                  disabled={isEdit}
                />
                <KindCard
                  selected={adKind === "dynamic"}
                  icon={<LayersIcon className="size-5" />}
                  title="Anúncio Dinâmico"
                  description="Várias opções no mesmo anúncio (pacotes, planos…)."
                  onClick={() => !isEdit && setAdKind("dynamic")}
                  disabled={isEdit}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Preço mín: {formatBrl(minListingCents)}
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
                      <PriceInput
                        value={price}
                        onChange={setPrice}
                        minCents={minListingCents}
                      />
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
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border/70 bg-muted/10 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Arraste pelo ícone{" "}
                      <GripVerticalIcon className="mb-0.5 inline size-3.5" /> ou
                      use as setas para definir a ordem das variantes.
                    </p>
                    {offerReorderSaving ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2Icon className="size-3 animate-spin" />
                        Salvando ordem…
                      </span>
                    ) : null}
                  </div>

                  {offers.map((offer, index) => {
                    const expanded = isOfferExpanded(offer.id);
                    const summaryTitle =
                      offer.title.trim() || `Oferta ${index + 1}`;
                    const priceCents = parsePriceToCents(offer.price);
                    const summaryPrice =
                      priceCents != null ? formatBrl(priceCents) : null;

                    return (
                      <div
                        key={offer.id}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const fromIndex = offers.findIndex(
                            (row) => row.id === dragOfferId,
                          );
                          if (fromIndex >= 0) {
                            reorderDynamicOffers(fromIndex, index);
                          }
                          setDragOfferId(null);
                        }}
                        className={cn(
                          "overflow-hidden rounded-md border border-border/60 transition-opacity",
                          !offer.active && "opacity-70",
                          dragOfferId === offer.id && "opacity-50",
                        )}
                      >
                        <div className="flex items-center gap-1.5 bg-muted/15 px-2 py-2.5 sm:gap-2 sm:px-3">
                          <button
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              setDragOfferId(offer.id);
                              event.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => setDragOfferId(null)}
                            className="flex shrink-0 cursor-grab touch-none items-center rounded-sm p-1 text-muted-foreground hover:bg-muted/40 active:cursor-grabbing"
                            aria-label={`Reposicionar ${summaryTitle}`}
                          >
                            <GripVerticalIcon className="size-4" />
                          </button>
                          <span className="w-5 shrink-0 text-center text-[11px] font-medium tabular-nums text-muted-foreground">
                            {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleOfferExpanded(offer.id)}
                            className="flex min-w-0 flex-1 items-center cursor-pointer gap-2 text-left"
                            aria-expanded={expanded}
                          >
                            <ChevronDownIcon
                              className={cn(
                                "size-4 shrink-0 text-muted-foreground transition-transform",
                                expanded && "rotate-180",
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {summaryTitle}
                              </p>
                              {!expanded ? (
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {[
                                    summaryPrice,
                                    offer.delivery === "auto"
                                      ? "Entrega automática"
                                      : "Entrega manual",
                                    !offer.active ? "Inativa" : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              ) : null}
                            </div>
                          </button>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={index === 0}
                              onClick={() =>
                                reorderDynamicOffers(index, index - 1)
                              }
                              aria-label="Mover oferta para cima"
                            >
                              <ArrowUpIcon className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={index === offers.length - 1}
                              onClick={() =>
                                reorderDynamicOffers(index, index + 1)
                              }
                              aria-label="Mover oferta para baixo"
                            >
                              <ArrowDownIcon className="size-3.5" />
                            </Button>
                          </div>
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
                            onClick={() => removeDynamicOffer(offer.id)}
                            aria-label="Remover oferta"
                          >
                            <Trash2Icon className="size-4 text-destructive" />
                          </Button>
                        </div>

                        {expanded ? (
                          <div className="space-y-4 border-t border-border/40 p-4">
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
                                  minCents={minListingCents}
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
                        ) : null}
                      </div>
                    );
                  })}
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
              {isEdit
                ? needsModerationReview
                  ? "Confira o que muda agora e o que vai para análise de um moderador."
                  : "Confira os dados e veja como o anúncio aparecerá antes de salvar."
                : "Confira os dados e veja como o anúncio aparecerá na vitrine antes de publicar."}
            </PanelDescription>

            <div className="pt-4">
              <SellReviewPanel
                {...reviewInput}
                categoryBreadcrumb={categoryBreadcrumb}
                productTypes={productTypes}
                reachPlan={reachPlans.find((p) => p.id === reachPlanId) ?? null}
                onGoTo={goTo}
              />
            </div>
          </Panel>

          <StepFooter
            error={error}
            onBack={() => goTo("images")}
            onNext={() => void submitListing()}
            nextLabel={
              pending
                ? isEdit
                  ? needsModerationReview
                    ? "Enviando…"
                    : "Salvando…"
                  : "Publicando…"
                : isEdit
                  ? needsModerationReview
                    ? "Salvar e enviar para análise"
                    : "Salvar alterações"
                  : "Publicar anúncio"
            }
            nextDisabled={pending || reviewBlocking}
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

function ReachPlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: ReachPlanOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const bars = Math.min(4, Math.max(1, plan.barLevel));
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col gap-3 rounded-md border p-4 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/40"
          : "border-border/60 bg-muted/10 hover:bg-muted/25",
      )}
    >
      {plan.recommended ? (
        <span className="absolute -top-2.5 left-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
          Recomendado
        </span>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-1 text-sm font-semibold">
            {plan.title}
            <Tooltip>
              <TooltipTrigger
                delay={120}
                render={<span />}
                className="inline-flex size-4 items-center justify-center rounded-sm outline-none"
                onClick={(e) => e.stopPropagation()}
                aria-label="Detalhe da taxa"
              >
                <InfoIcon className="size-3.5 text-muted-foreground" aria-hidden />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[16rem] text-pretty">
                Descontada do valor da venda quando alguém comprar.
              </TooltipContent>
            </Tooltip>
          </p>
          <p className="mt-0.5 text-sm font-medium text-primary">
            {plan.feePercent}% por venda
          </p>
        </div>
        <span className="flex h-8 items-end gap-0.5" aria-hidden>
          {[1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={cn(
                "w-1.5 rounded-sm",
                level <= bars ? "bg-primary" : "bg-muted-foreground/25",
              )}
              style={{ height: `${6 + level * 4}px` }}
            />
          ))}
        </span>
      </div>
      {plan.description ? (
        <p className="text-xs text-muted-foreground text-pretty">
          {plan.description}
        </p>
      ) : null}
      <div className="mt-auto flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full",
              level <= bars ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
    </button>
  );
}

function KindCard({
  selected,
  icon,
  title,
  description,
  onClick,
  disabled = false,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-1 flex-row items-center gap-3 rounded-md border p-4 text-left transition-colors",
        disabled
          ? "cursor-default opacity-80"
          : "cursor-pointer hover:bg-muted/30",
        selected
          ? "bg-primary/10"
          : "border-border/60 bg-muted/15",
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