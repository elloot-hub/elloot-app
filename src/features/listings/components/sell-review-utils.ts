import type { SellStepId } from "@/features/listings/components/sell-stepper";
import type {
  Category,
  ListingCategoryRef,
  ListingProductType,
  ListingStatus,
  ListingSummary,
} from "@/types/api";

const DEFAULT_MIN_PRICE_CENTS = 150;
const MAX_TITLE = 80;
const MAX_DESC = 5000;

export type ReviewSeverity = "ok" | "warn" | "error";

export type ReviewCheckItem = {
  id: string;
  step: SellStepId;
  label: string;
  detail: string;
  severity: ReviewSeverity;
};

export type SellPreviewImage = {
  id: string;
  previewUrl: string;
  /** Present when image already exists on the listing (edit mode). */
  existingUrl?: string;
};

export type SellPreviewOffer = {
  id: string;
  serverId?: string;
  title: string;
  price: string;
  delivery: "manual" | "auto";
  stock: string;
  autoStock: string;
  existingStockQty?: number;
  active: boolean;
};

/** Snapshot of the live listing used to detect moderation-gated edits. */
export type EditBaseline = {
  status: ListingStatus;
  categoryId: string;
  title: string;
  description: string;
  productType: ListingProductType | null;
  delivery: "manual" | "auto";
  /** Ordered public media URLs currently live on the listing. */
  mediaUrls: string[];
  offers: Array<{
    serverId: string;
    title: string;
    delivery: "manual" | "auto";
  }>;
};

export type ModerationChange = {
  id: string;
  label: string;
  detail: string;
  step: SellStepId;
};

export type SellReviewInput = {
  title: string;
  description: string;
  categoryPath: string[];
  tree: Category[];
  categoryIsLeaf: boolean;
  productType: ListingProductType | "";
  inferredProductType: ListingProductType | null;
  needsProductTypePick: boolean;
  adKind: "simple" | "dynamic";
  price: string;
  delivery: "manual" | "auto";
  stock: string;
  autoStock: string;
  offers: SellPreviewOffer[];
  images: SellPreviewImage[];
  coverId: string | null;
  isEdit: boolean;
  editBaseline?: EditBaseline | null;
  seller: {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
  };
  /** Min listing price from platform commercial settings. */
  minListingCents?: number;
};

export function isLiveListingForModeration(status: ListingStatus) {
  return status === "ACTIVE" || status === "PAUSED";
}

function parsePriceToCents(raw: string, minListingCents = DEFAULT_MIN_PRICE_CENTS): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const cents = Number(digits);
  if (!Number.isInteger(cents) || cents < minListingCents || cents > 50_000_000) {
    return null;
  }
  return cents;
}

function countAutoLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean).length;
}

function findNode(nodes: Category[], id: string): Category | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findNode(node.children ?? [], id);
    if (nested) return nested;
  }
  return null;
}

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function orderImages(images: SellPreviewImage[], coverId: string | null) {
  return [...images].sort((a, b) => {
    if (a.id === coverId) return -1;
    if (b.id === coverId) return 1;
    return 0;
  });
}

function buildCategoryRef(
  tree: Category[],
  categoryPath: string[],
): ListingCategoryRef {
  const nodes = categoryPath
    .map((id) => findNode(tree, id))
    .filter((n): n is Category => Boolean(n));
  const leaf = nodes[nodes.length - 1];
  if (!leaf) {
    return { id: "preview-cat", slug: "preview", name: "Sem categoria" };
  }
  const parent = nodes[nodes.length - 2];
  return {
    id: leaf.id,
    slug: leaf.slug,
    name: leaf.name,
    imageUrl: leaf.imageUrl,
    iconUrl: leaf.iconUrl,
    slugPath: leaf.slugPath,
    parent: parent
      ? {
          id: parent.id,
          slug: parent.slug,
          name: parent.name,
          imageUrl: parent.imageUrl,
          iconUrl: parent.iconUrl,
          slugPath: parent.slugPath,
        }
      : null,
  };
}

function offerStockQty(offer: SellPreviewOffer) {
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

function resolvePreviewPriceCents(input: SellReviewInput): number {
  if (input.adKind === "simple") {
    return parsePriceToCents(input.price, input.minListingCents) ?? 0;
  }
  const prices = input.offers
    .filter((o) => o.active)
    .map((o) => parsePriceToCents(o.price, input.minListingCents))
    .filter((p): p is number => p != null);
  return prices.length ? Math.min(...prices) : 0;
}

function resolveDeliveryMode(
  input: SellReviewInput,
): "MANUAL" | "AUTO" | undefined {
  if (input.adKind === "simple") {
    return input.delivery === "auto" ? "AUTO" : "MANUAL";
  }
  const active = input.offers.filter((o) => o.active);
  if (active.some((o) => o.delivery === "auto")) return "AUTO";
  if (active.length) return "MANUAL";
  return undefined;
}

export function buildPreviewListing(input: SellReviewInput): ListingSummary {
  const ordered = orderImages(input.images, input.coverId);
  const media = ordered.map((img) => ({ url: img.previewUrl }));
  const effectiveProductType =
    input.productType || input.inferredProductType || null;

  return {
    id: "preview-listing",
    code: "LST-PREVIEW",
    title: input.title.trim() || "Título do anúncio",
    priceCents: resolvePreviewPriceCents(input),
    status: "ACTIVE",
    listingModel: input.adKind === "dynamic" ? "DYNAMIC" : "NORMAL",
    deliveryMode: resolveDeliveryMode(input),
    productType: effectiveProductType,
    createdAt: new Date().toISOString(),
    category: buildCategoryRef(input.tree, input.categoryPath),
    media: media.slice(0, 4),
    mediaCount: media.length,
    seller: {
      id: input.seller.id,
      name: input.seller.name,
      avatarUrl: input.seller.avatarUrl ?? null,
    },
  };
}

export function resolvePreviewStockQuantity(input: SellReviewInput): number {
  if (input.adKind === "dynamic") {
    return input.offers
      .filter((o) => o.active)
      .reduce((sum, o) => sum + offerStockQty(o), 0);
  }
  if (input.delivery === "auto") {
    const lines = countAutoLines(input.autoStock);
    if (lines >= 1) return lines;
    const existing = Number(input.stock);
    return Number.isInteger(existing) && existing >= 1 ? existing : 0;
  }
  const qty = Number(input.stock);
  return Number.isInteger(qty) && qty >= 1 ? qty : 0;
}

function validateOffersForReview(input: SellReviewInput): string | null {
  const minPrice = input.minListingCents ?? DEFAULT_MIN_PRICE_CENTS;
  if (input.adKind === "simple") {
    if (parsePriceToCents(input.price, minPrice) == null) {
      return `Informe um preço válido (mín. ${formatBrl(minPrice)}).`;
    }
    if (input.delivery === "manual") {
      const qty = Number(input.stock);
      if (!Number.isInteger(qty) || qty < 1) return "Estoque inválido.";
    } else if (countAutoLines(input.autoStock) < 1) {
      const hasExistingAutoStock =
        input.isEdit && Number(input.stock) >= 1 && input.delivery === "auto";
      if (!hasExistingAutoStock) {
        return "Cole pelo menos um código/chave por linha para entrega automática.";
      }
    }
    return null;
  }

  const active = input.offers.filter((o) => o.active);
  if (active.length < 2) {
    return "Anúncio composto precisa de pelo menos 2 ofertas ativas.";
  }
  if (active.length > 30) return "Máximo de 30 ofertas.";
  for (const [i, offer] of active.entries()) {
    if (offer.title.trim().length < 3) {
      return `Oferta ${i + 1}: título com pelo menos 3 caracteres.`;
    }
    if (offer.title.trim().length > MAX_TITLE) {
      return `Oferta ${i + 1}: título muito longo.`;
    }
    if (parsePriceToCents(offer.price, minPrice) == null) {
      return `Oferta ${i + 1}: preço inválido (mín. ${formatBrl(minPrice)}).`;
    }
    if (offerStockQty(offer) < 1) {
      return offer.delivery === "auto"
        ? `Oferta ${i + 1}: cole pelo menos um código/chave por linha.`
        : `Oferta ${i + 1}: estoque inválido.`;
    }
  }
  return null;
}

export function computeReviewChecklist(input: SellReviewInput): ReviewCheckItem[] {
  const items: ReviewCheckItem[] = [];
  const title = input.title.trim();
  const description = input.description.trim();

  if (title.length < 5) {
    items.push({
      id: "title",
      step: "product",
      label: "Título",
      detail: "Mínimo de 5 caracteres.",
      severity: "error",
    });
  } else if (title.length > MAX_TITLE) {
    items.push({
      id: "title",
      step: "product",
      label: "Título",
      detail: `Máximo de ${MAX_TITLE} caracteres.`,
      severity: "error",
    });
  } else if (title.length < 20) {
    items.push({
      id: "title",
      step: "product",
      label: "Título",
      detail: "Títulos mais descritivos ajudam na busca.",
      severity: "warn",
    });
  } else if (title === title.toUpperCase() && /[a-zA-Z]/.test(title)) {
    items.push({
      id: "title-caps",
      step: "product",
      label: "Título",
      detail: "Evite só letras maiúsculas — o card exibe em caixa alta.",
      severity: "warn",
    });
  } else {
    items.push({
      id: "title",
      step: "product",
      label: "Título",
      detail: title,
      severity: "ok",
    });
  }

  if (description.length < 20) {
    items.push({
      id: "description",
      step: "product",
      label: "Descrição",
      detail: "Mínimo de 20 caracteres.",
      severity: "error",
    });
  } else if (description.length > MAX_DESC) {
    items.push({
      id: "description",
      step: "product",
      label: "Descrição",
      detail: `Máximo de ${MAX_DESC} caracteres.`,
      severity: "error",
    });
  } else if (description.length < 80) {
    items.push({
      id: "description",
      step: "product",
      label: "Descrição",
      detail: "Descrições mais completas reduzem dúvidas dos compradores.",
      severity: "warn",
    });
  } else {
    items.push({
      id: "description",
      step: "product",
      label: "Descrição",
      detail: `${description.length} caracteres`,
      severity: "ok",
    });
  }

  if (!input.categoryPath.length) {
    items.push({
      id: "category",
      step: "product",
      label: "Categoria",
      detail: "Selecione a categoria do anúncio.",
      severity: "error",
    });
  } else if (!input.categoryIsLeaf) {
    items.push({
      id: "category",
      step: "product",
      label: "Categoria",
      detail: "Continue até a última subcategoria.",
      severity: "error",
    });
  } else {
    items.push({
      id: "category",
      step: "product",
      label: "Categoria",
      detail: "Categoria final selecionada.",
      severity: "ok",
    });
  }

  if (input.needsProductTypePick && !input.productType && !input.inferredProductType) {
    items.push({
      id: "product-type",
      step: "product",
      label: "Tipo de produto",
      detail: "Informe o que você está vendendo.",
      severity: "error",
    });
  } else {
    items.push({
      id: "product-type",
      step: "product",
      label: "Tipo de produto",
      detail: "Definido.",
      severity: "ok",
    });
  }

  const offersErr = validateOffersForReview(input);
  if (offersErr) {
    items.push({
      id: "offers",
      step: "offers",
      label: input.adKind === "simple" ? "Preço e estoque" : "Ofertas",
      detail: offersErr,
      severity: "error",
    });
  } else if (input.adKind === "dynamic") {
    const active = input.offers.filter((o) => o.active);
    items.push({
      id: "offers",
      step: "offers",
      label: "Ofertas",
      detail: `${active.length} ofertas ativas · a partir de ${formatBrl(resolvePreviewPriceCents(input))}`,
      severity: "ok",
    });
  } else {
    const cents = parsePriceToCents(input.price, input.minListingCents);
    const stockLabel =
      input.delivery === "auto"
        ? `${countAutoLines(input.autoStock) || input.stock} un. (auto)`
        : `${input.stock} un.`;
    items.push({
      id: "offers",
      step: "offers",
      label: "Preço e estoque",
      detail: `${cents != null ? formatBrl(cents) : "—"} · ${stockLabel}`,
      severity: "ok",
    });
  }

  if (input.images.length === 0) {
    items.push({
      id: "images",
      step: "images",
      label: "Imagens",
      detail: "Anúncios sem imagem convertem menos. Adicione pelo menos uma.",
      severity: "warn",
    });
  } else if (input.images.length === 1) {
    items.push({
      id: "images",
      step: "images",
      label: "Imagens",
      detail: "1 imagem — adicione mais para destacar o produto.",
      severity: "warn",
    });
  } else {
    items.push({
      id: "images",
      step: "images",
      label: "Imagens",
      detail: `${input.images.length} imagens · capa definida`,
      severity: "ok",
    });
  }

  return items;
}

/**
 * Fields that, on ACTIVE/PAUSED listings, go to moderator review instead of
 * applying immediately (mirrors API splitListingUpdate / splitOffersUpdate).
 */
export function computeEditModerationChanges(
  input: SellReviewInput,
): ModerationChange[] {
  const baseline = input.editBaseline;
  if (!input.isEdit || !baseline || !isLiveListingForModeration(baseline.status)) {
    return [];
  }

  const changes: ModerationChange[] = [];

  if (input.title.trim() !== baseline.title.trim()) {
    changes.push({
      id: "title",
      step: "product",
      label: "Título",
      detail: "O novo título só aparece na vitrine após aprovação.",
    });
  }

  if (input.description.trim() !== baseline.description.trim()) {
    changes.push({
      id: "description",
      step: "product",
      label: "Descrição",
      detail: "A nova descrição fica em análise até um moderador aprovar.",
    });
  }

  const selectedCategoryId =
    input.categoryPath[input.categoryPath.length - 1] ?? "";
  if (selectedCategoryId && selectedCategoryId !== baseline.categoryId) {
    changes.push({
      id: "category",
      step: "product",
      label: "Categoria",
      detail: "A troca de categoria precisa de aprovação.",
    });
  }

  const nextProductType =
    input.productType || input.inferredProductType || null;
  if (nextProductType !== baseline.productType) {
    changes.push({
      id: "product-type",
      step: "product",
      label: "Tipo de produto",
      detail: "A alteração do tipo de produto vai para análise.",
    });
  }

  if (input.adKind === "simple" && input.delivery !== baseline.delivery) {
    changes.push({
      id: "delivery",
      step: "offers",
      label: "Modo de entrega",
      detail: "Mudança entre entrega manual e automática exige revisão.",
    });
  }

  const orderedImages = orderImages(input.images, input.coverId);
  const existingKept = orderedImages
    .map((img) => img.existingUrl)
    .filter((url): url is string => Boolean(url));
  const hasNewImages = orderedImages.some((img) => !img.existingUrl);
  const orderChanged =
    existingKept.length === baseline.mediaUrls.length &&
    existingKept.some((url, i) => url !== baseline.mediaUrls[i]);
  const isRemovalOnly =
    !hasNewImages &&
    existingKept.length > 0 &&
    existingKept.length < baseline.mediaUrls.length &&
    existingKept.every((url) => baseline.mediaUrls.includes(url));

  if (hasNewImages || (orderChanged && !isRemovalOnly)) {
    changes.push({
      id: "media",
      step: "images",
      label: "Imagens",
      detail: hasNewImages
        ? "Novas imagens só entram no ar depois da aprovação."
        : "A nova ordem das imagens precisa de aprovação.",
    });
  }

  if (input.adKind === "dynamic") {
    const active = input.offers.filter((o) => o.active);
    const baselineMap = new Map(
      baseline.offers.map((o) => [o.serverId, o]),
    );

    let newOffers = 0;
    let titleChanges = 0;
    let deliveryChanges = 0;

    for (const offer of active) {
      if (!offer.serverId) {
        newOffers += 1;
        continue;
      }
      const prev = baselineMap.get(offer.serverId);
      if (!prev) {
        newOffers += 1;
        continue;
      }
      if (offer.title.trim() !== prev.title.trim()) titleChanges += 1;
      if (offer.delivery !== prev.delivery) deliveryChanges += 1;
    }

    if (newOffers > 0) {
      changes.push({
        id: "offers-new",
        step: "offers",
        label: "Novas ofertas",
        detail:
          newOffers === 1
            ? "1 oferta nova será analisada antes de aparecer."
            : `${newOffers} ofertas novas serão analisadas antes de aparecer.`,
      });
    }
    if (titleChanges > 0) {
      changes.push({
        id: "offers-title",
        step: "offers",
        label: "Título de oferta",
        detail:
          titleChanges === 1
            ? "1 título de oferta alterado aguarda aprovação."
            : `${titleChanges} títulos de oferta alterados aguardam aprovação.`,
      });
    }
    if (deliveryChanges > 0) {
      changes.push({
        id: "offers-delivery",
        step: "offers",
        label: "Entrega de oferta",
        detail:
          deliveryChanges === 1
            ? "1 mudança de entrega em oferta precisa de análise."
            : `${deliveryChanges} mudanças de entrega em ofertas precisam de análise.`,
      });
    }
  }

  return changes;
}

export function hasBlockingReviewIssues(items: ReviewCheckItem[]): boolean {
  return items.some((item) => item.severity === "error");
}
